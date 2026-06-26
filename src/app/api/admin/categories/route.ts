import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import pool from "@/lib/pg";

export async function POST(req: NextRequest) {
  try {
    const { name, imageUrl, active = true, parentId = null } = await req.json();

    if (!name?.trim())
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await pool.query("SELECT id FROM categories WHERE slug = $1", [slug]);
    if (existing.rowCount && existing.rowCount > 0)
      return NextResponse.json({ error: "Category already exists." }, { status: 409 });

    // Validate parent exists and is itself a top-level category
    if (parentId) {
      const parent = await pool.query("SELECT id, parent_id FROM categories WHERE id = $1", [parentId]);
      if (!parent.rowCount)
        return NextResponse.json({ error: "Parent category not found." }, { status: 404 });
      if (parent.rows[0].parent_id !== null)
        return NextResponse.json({ error: "Cannot nest more than one level deep." }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, image_url, active, display_order, parent_id, created_at)
       VALUES ($1, $2, $3, $4, 0, $5, NOW())
       RETURNING id, name, slug, image_url, active, parent_id`,
      [name.trim(), slug, imageUrl ?? null, active, parentId ?? null]
    );

    revalidateTag("categories");
    return NextResponse.json({ category: rows[0] }, { status: 201 });
  } catch (e) {
    console.error("ADD CATEGORY ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, imageUrl, active, parentId } = await req.json();
    if (!id || !name?.trim())
      return NextResponse.json({ error: "ID and name are required." }, { status: 400 });

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const conflict = await pool.query(
      "SELECT id FROM categories WHERE slug = $1 AND id != $2",
      [slug, id]
    );
    if (conflict.rowCount && conflict.rowCount > 0)
      return NextResponse.json({ error: "A category with that name already exists." }, { status: 409 });

    // Can't make a category its own parent or nest more than one level
    if (parentId && parentId === id)
      return NextResponse.json({ error: "A category cannot be its own parent." }, { status: 400 });

    const { rows } = await pool.query(
      `UPDATE categories
       SET name=$1, slug=$2, image_url=$3, active=$4, parent_id=$5
       WHERE id=$6
       RETURNING id, name, slug, image_url, active, parent_id`,
      [name.trim(), slug, imageUrl ?? null, active ?? true, parentId ?? null, id]
    );

    revalidateTag("categories");
    revalidateTag("products");
    return NextResponse.json({ category: rows[0] });
  } catch (e) {
    console.error("PATCH CATEGORY ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Category ID is required." }, { status: 400 });

    const products = await pool.query(
      "SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1",
      [id]
    );
    if (products.rows[0].count > 0)
      return NextResponse.json(
        { error: `Cannot delete — ${products.rows[0].count} product(s) are in this category.` },
        { status: 409 }
      );

    const children = await pool.query(
      "SELECT COUNT(*)::int AS count FROM categories WHERE parent_id = $1",
      [id]
    );
    if (children.rows[0].count > 0)
      return NextResponse.json(
        { error: `Cannot delete — this category has ${children.rows[0].count} sub-categories. Delete them first.` },
        { status: 409 }
      );

    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    revalidateTag("categories");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE CATEGORY ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
