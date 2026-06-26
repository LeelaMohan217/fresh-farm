import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import pool from "@/lib/pg";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { notifyLowStock } from "@/lib/notifyLowStock";

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, description, price, unit, categoryId, stock, imageUrls, branchId } = await req.json();

    if (!name || !price || !unit || !categoryId)
      return NextResponse.json({ error: "Name, price, unit and category are required." }, { status: 400 });

    // Branch admin can only create products for their own branch
    const effectiveBranchId = session.role === "admin"
      ? (session.branchId ?? null)
      : (branchId ?? null);

    const images: string[] = Array.isArray(imageUrls) ? imageUrls : [];
    const primaryImage = images[0] ?? null;

    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, unit, category_id, stock, image_url, image_urls, branch_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, name`,
      [name, description || null, Number(price), unit, Number(categoryId), Number(stock) || 0, primaryImage, images, effectiveBranchId]
    );

    revalidateTag("products");
    revalidateTag("categories");
    return NextResponse.json({ product: rows[0] }, { status: 201 });
  } catch (e) {
    console.error("ADD PRODUCT ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, name, description, price, unit, categoryId, stock, imageUrls, branchId } = await req.json();
    if (!id || !name || !price || !unit || !categoryId)
      return NextResponse.json({ error: "ID, name, price, unit and category are required." }, { status: 400 });

    // Branch admin: enforce their branch_id, ignore what was sent
    const effectiveBranchId = session.role === "admin"
      ? (session.branchId ?? null)
      : (branchId ?? null);

    const images: string[] = Array.isArray(imageUrls) ? imageUrls : [];
    await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, unit=$4, category_id=$5, stock=$6,
       image_url=$7, image_urls=$8, branch_id=$9, updated_at=NOW() WHERE id=$10`,
      [name, description || null, Number(price), unit, Number(categoryId), stock != null ? Number(stock) : 0, images[0] || null, images, effectiveBranchId, id]
    );

    await notifyLowStock(Number(id));
    revalidateTag("products");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH PRODUCT ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });

    // Branch admin can only delete their branch's products
    if (session.role === "admin" && session.branchId !== null) {
      const { rows } = await pool.query(`SELECT branch_id FROM products WHERE id = $1`, [id]);
      if (!rows.length || rows[0].branch_id !== session.branchId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await pool.query("DELETE FROM order_items WHERE product_id = $1", [id]);
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    revalidateTag("products");
    revalidateTag("categories");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE PRODUCT ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
