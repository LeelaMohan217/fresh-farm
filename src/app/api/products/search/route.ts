import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pg";

// Log a search query (upsert count)
async function logSearch(q: string) {
  try {
    await pool.query(
      `INSERT INTO search_logs (query, count, last_searched_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (query) DO UPDATE
         SET count = search_logs.count + 1,
             last_searched_at = NOW()`,
      [q.toLowerCase().trim()]
    );
  } catch {
    // non-critical — never fail the search response
  }
}

export async function GET(req: NextRequest) {
  const q   = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const log = req.nextUrl.searchParams.get("log") === "1"; // log only on actual submit

  if (!q) {
    // Return trending searches when query is empty
    const { rows } = await pool.query(
      `SELECT query FROM search_logs ORDER BY count DESC, last_searched_at DESC LIMIT 8`
    );
    return NextResponse.json({ trending: rows.map((r) => r.query as string), categories: [], products: [], suggestions: [] });
  }

  if (log) {
    await logSearch(q);
  }

  const [catRes, prodRes, sugRes] = await Promise.all([
    // Category matches
    pool.query(
      `SELECT id, name, slug FROM categories WHERE name ILIKE $1 ORDER BY name ASC LIMIT 3`,
      [`%${q}%`]
    ),

    // Product matches
    pool.query(
      `SELECT p.id, p.name, p.price, p.unit, p.stock, p.image_url,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.name ILIKE $1
       ORDER BY (p.stock > 0) DESC, p.name ASC
       LIMIT 6`,
      [`%${q}%`]
    ),

    // Popular search suggestions that match the prefix/substring
    pool.query(
      `SELECT query FROM search_logs
       WHERE query ILIKE $1
       ORDER BY count DESC, last_searched_at DESC
       LIMIT 4`,
      [`${q}%`]   // prefix match for suggestions
    ),
  ]);

  return NextResponse.json({
    trending: [],
    categories: catRes.rows.map((c) => ({ id: c.id as number, name: c.name as string, slug: c.slug as string })),
    products: prodRes.rows.map((r) => ({
      id: r.id as number,
      name: r.name as string,
      price: Number(r.price),
      unit: r.unit as string,
      stock: r.stock as number,
      imageUrl: (r.image_url ?? null) as string | null,
      categoryName: r.category_name as string,
      categorySlug: r.category_slug as string,
    })),
    suggestions: sugRes.rows
      .map((r) => r.query as string)
      .filter((s) => s.toLowerCase() !== q.toLowerCase()),
  });
}
