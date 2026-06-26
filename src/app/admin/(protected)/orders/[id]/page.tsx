import { notFound, redirect } from "next/navigation";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import OrderDetailClient from "@/components/admin/orders/OrderDetailClient";
import BulkOrderDetailClient from "@/components/admin/orders/BulkOrderDetailClient";

export const dynamic = "force-dynamic";

async function getRegularOrder(id: string) {
  const { rows: orderRows } = await pool.query(
    `SELECT o.*, c.name, c.email, c.phone,
            o.receiver_name, o.receiver_phone, o.receiver_email
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.id = $1`,
    [id]
  );
  if (orderRows.length === 0) return null;
  const order = orderRows[0];

  const { rows: itemRows } = await pool.query(
    `SELECT oi.quantity, oi.unit_price, oi.total_price, p.name, p.unit
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [id]
  );

  return { order, items: itemRows };
}

async function getBulkOrder(id: string) {
  const { rows } = await pool.query(
    `SELECT b.*, c.name, c.email, c.phone, c.address
     FROM bulk_orders b
     JOIN customers c ON c.id = b.customer_id
     WHERE b.id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  const order = rows[0];

  const { rows: itemRows } = await pool.query(
    `SELECT item_name, quantity, unit, unit_price, total_price FROM bulk_order_items WHERE bulk_order_id = $1 ORDER BY id`,
    [id]
  );

  return { order, items: itemRows };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, getAdminSession()]);
  if (!session) redirect("/admin/login");

  const branchId = session.role === "admin" ? (session.branchId ?? null) : null;

  if (id.startsWith("BLK-")) {
    const data = await getBulkOrder(id);
    if (!data) notFound();

    const { order, items } = data;
    return (
      <div className="h-full">
      <BulkOrderDetailClient
        order={{
          id: String(order.id),
          eventType: order.event_type as string,
          status: order.status as string,
          bookingDate: new Date(order.booking_date).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          }),
          deliveryDate: new Date(order.delivery_date).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          }),
          customer: {
            name: order.name as string,
            email: order.email as string,
            phone: order.phone as string,
            address: order.address as string,
          },
          items: items.map((i: { item_name: string; quantity: string; unit: string; unit_price: string; total_price: string }) => ({
            name: i.item_name,
            quantity: Number(i.quantity),
            unit: i.unit,
            unitPrice: Number(i.unit_price),
            totalPrice: Number(i.total_price),
          })),
          total: Number(order.total),
        }}
      />
      </div>
    );
  }

  const data = await getRegularOrder(id);
  if (!data) notFound();

  // Branch admin cannot view orders outside their branch
  if (branchId !== null && data.order.branch_id !== branchId) notFound();

  const { order, items } = data;
  const subtotal = items.reduce(
    (sum: number, i: { total_price: string }) => sum + Number(i.total_price),
    0
  );
  const delivery = Number(order.delivery_fee ?? 0);
  const discount = Number(order.discount ?? 0);

  return (
    <div className="h-full">
    <OrderDetailClient
      role={session.role}
      order={{
        id: String(order.id),
        date:
          new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          }) +
          ", " +
          new Date(order.created_at).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit",
          }),
        status: order.status as string,
        payment: order.payment_method as string,
        customer: {
          name: order.name as string,
          email: order.email as string,
          phone: order.phone as string,
        },
        receiver: order.receiver_name
          ? {
              name: order.receiver_name as string,
              phone: (order.receiver_phone as string | null) ?? null,
              email: (order.receiver_email as string | null) ?? null,
            }
          : null,
        deliveryAddress: order.delivery_address as string | null,
        pincode: order.pincode as string | null,
        items: items.map((i: { name: string; quantity: number; unit_price: string; total_price: string; unit: string }) => ({
          name: i.name,
          qty: i.quantity,
          unit: i.unit,
          price: Number(i.unit_price),
        })),
        subtotal,
        delivery,
        discount,
        total: Number(order.total),
      }}
    />
    </div>
  );
}
