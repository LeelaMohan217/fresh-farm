export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import pool from "@/lib/pg";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) notFound();

  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.unit, p.stock,
            p.image_url, p.image_urls,
            sub.name AS category_name, sub.slug AS category_slug,
            COALESCE(top.name, sub.name) AS top_name,
            COALESCE(top.slug, sub.slug) AS top_slug
     FROM products p
     JOIN categories sub ON sub.id = p.category_id
     LEFT JOIN categories top ON top.id = sub.parent_id
     WHERE p.id = $1`,
    [productId]
  );

  if (!rows.length) notFound();
  const r = rows[0];

  const product = {
    id: r.id as number,
    name: r.name as string,
    description: (r.description ?? "") as string,
    price: Number(r.price),
    unit: r.unit as string,
    stock: r.stock as number,
    imageUrl: (r.image_url ?? null) as string | null,
    imageUrls: (Array.isArray(r.image_urls) && r.image_urls.length > 0
      ? r.image_urls
      : r.image_url ? [r.image_url] : []) as string[],
    categoryName: r.category_name as string,
    categorySlug: r.category_slug as string,
    topName: r.top_name as string,
    topSlug: r.top_slug as string,
  };

  return <ProductDetailClient product={product} />;
}
