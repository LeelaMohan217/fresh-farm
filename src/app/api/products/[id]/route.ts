import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pg";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [productRes, similarRes, topRes] = await Promise.all([
    pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.unit, p.stock,
              p.image_url, p.image_urls, p.category_id,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [productId]
    ),
    pool.query(
      `SELECT p.id, p.name, p.price, p.unit, p.stock, p.image_url, p.image_urls,
              c.slug AS category_slug, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = (SELECT category_id FROM products WHERE id = $1)
         AND p.id != $1 AND p.stock > 0
       ORDER BY p.created_at DESC LIMIT 6`,
      [productId]
    ),
    pool.query(
      `SELECT p.id, p.name, p.price, p.unit, p.stock, p.image_url, p.image_urls,
              c.slug AS category_slug, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = (SELECT category_id FROM products WHERE id = $1)
         AND p.stock > 0
       ORDER BY p.stock DESC LIMIT 10`,
      [productId]
    ),
  ]);

  if (!productRes.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const p = productRes.rows[0];
  const imageUrls: string[] = Array.isArray(p.image_urls) && p.image_urls.length > 0
    ? p.image_urls
    : p.image_url ? [p.image_url] : [];

  return NextResponse.json({
    product: {
      id: p.id, name: p.name, description: p.description ?? "",
      price: Number(p.price), unit: p.unit, stock: p.stock,
      imageUrls, categoryId: p.category_id,
      categoryName: p.category_name, categorySlug: p.category_slug,
    },
    similar: similarRes.rows.map((s) => ({
      id: s.id, name: s.name, price: Number(s.price), unit: s.unit, stock: s.stock,
      imageUrl: s.image_url ?? null,
      imageUrls: Array.isArray(s.image_urls) && s.image_urls.length > 0 ? s.image_urls : s.image_url ? [s.image_url] : [],
      categorySlug: s.category_slug, categoryName: s.category_name,
    })),
    topInCategory: topRes.rows.map((s) => ({
      id: s.id, name: s.name, price: Number(s.price), unit: s.unit, stock: s.stock,
      imageUrl: s.image_url ?? null,
      imageUrls: Array.isArray(s.image_urls) && s.image_urls.length > 0 ? s.image_urls : s.image_url ? [s.image_url] : [],
      categorySlug: s.category_slug, categoryName: s.category_name,
    })),
  });
}
