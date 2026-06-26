import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";
import { notifyLowStock } from "@/lib/notifyLowStock";
import orderEvents from "@/lib/orderEvents";

function generateOrderId() {
  return "ORD-" + randomBytes(5).toString("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { items, paymentMethod, addressId, receiverName, receiverPhone, receiverEmail } = await req.json();

    if (!items?.length)
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });

    if (!addressId)
      return NextResponse.json({ error: "Delivery address is required." }, { status: 400 });

    if (!paymentMethod)
      return NextResponse.json({ error: "Payment method is required." }, { status: 400 });

    // Get customer
    const custResult = await pool.query(
      "SELECT id FROM customers WHERE email = $1",
      [session.email]
    );
    if (!custResult.rowCount)
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const customerId = custResult.rows[0].id as string;

    // Verify address belongs to customer
    const addrResult = await pool.query(
      "SELECT id, address, pincode FROM customer_addresses WHERE id = $1 AND customer_id = $2",
      [addressId, customerId]
    );
    if (!addrResult.rowCount)
      return NextResponse.json({ error: "Address not found." }, { status: 404 });

    const { address, pincode } = addrResult.rows[0];

    // Look up branch by pincode
    const branchResult = await pool.query(
      `SELECT b.id FROM branch_pincodes bp
       JOIN branches b ON b.id = bp.branch_id
       WHERE bp.pincode = $1 AND b.active = TRUE
       LIMIT 1`,
      [pincode]
    );
    const branchId = branchResult.rowCount ? branchResult.rows[0].id as number : null;

    // Validate products
    const productIds = items.map((i: { productId: number }) => i.productId);
    const prodResult = await pool.query(
      "SELECT id, price, stock FROM products WHERE id = ANY($1)",
      [productIds]
    );
    const productMap = new Map(prodResult.rows.map((r) => [r.id as number, r]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 400 });
      if (product.stock < item.quantity) return NextResponse.json({ error: `Product is out of stock.` }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0);
    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const total = subtotal + deliveryFee;
    const orderId = generateOrderId();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO orders (id, customer_id, status, payment_method, subtotal, delivery_fee, discount, total, delivery_address, pincode, address_id, branch_id, receiver_name, receiver_phone, receiver_email, created_at, updated_at)
         VALUES ($1, $2, 'Pending', $3, $4, $5, 0, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [orderId, customerId, paymentMethod, subtotal, deliveryFee, total, address, pincode, addressId, branchId, receiverName || null, receiverPhone || null, receiverEmail || null]
      );

      for (const item of items) {
        const unitPrice = Number(productMap.get(item.productId)!.price);
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.productId, item.quantity, unitPrice, unitPrice * item.quantity]
        );
        await client.query(
          "UPDATE products SET stock = stock - $1 WHERE id = $2",
          [item.quantity, item.productId]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    // Notify branch admin (and superadmin) about the new order
    const customerName = (await pool.query(
      "SELECT name FROM customers WHERE id = $1",
      [customerId]
    )).rows[0]?.name ?? "A customer";
    await pool.query(
      `INSERT INTO notifications (branch_id, order_id, title, body, type) VALUES ($1, $2, $3, $4, 'order')`,
      [
        branchId,
        orderId,
        `New order placed`,
        `${customerName} placed order ${orderId} · ₹${total.toLocaleString("en-IN")}`,
      ]
    );

    // Low stock alerts — check each ordered product
    for (const item of items as { productId: number }[]) {
      await notifyLowStock(item.productId);
    }

    orderEvents.emit("order-update");
    revalidateTag("orders");
    revalidateTag("customers");
    revalidateTag("products");
    return NextResponse.json({ orderId, branchAssigned: branchId !== null });
  } catch (e) {
    console.error("ORDER ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
