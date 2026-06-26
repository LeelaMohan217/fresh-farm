export const dynamic = "force-dynamic";

import pool from "@/lib/pg";
import ServiceDetailClient from "@/components/user/ServiceDetail";

export default async function HydroponicPage() {
  const { rows } = await pool.query(
    `SELECT id, name, type, description, price, status
     FROM services
     WHERE type = 'Hydroponic' AND status = 'Active'
     LIMIT 1`
  );

  const service = rows[0]
    ? { ...rows[0], price: Number(rows[0].price) }
    : null;

  return <ServiceDetailClient service={service} type="Hydroponic" />;
}
