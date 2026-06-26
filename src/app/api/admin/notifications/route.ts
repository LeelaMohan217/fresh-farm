import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pg";
import { getAdminSessionFromRequest } from "@/lib/auth";

// GET /api/admin/notifications
// Returns latest 20 notifications visible to this admin + per-admin unread count.
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isBranchAdmin = session.role === "admin" && session.branchId !== null;

  // "read" = a row exists in notification_reads for this admin_id
  const { rows } = await pool.query(
    isBranchAdmin
      ? `SELECT n.id, n.branch_id, n.order_id, n.product_id, n.type, n.title, n.body, n.created_at,
               (nr.admin_id IS NOT NULL) AS read
         FROM notifications n
         LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.admin_id = $2
         WHERE n.branch_id = $1 OR n.branch_id IS NULL
         ORDER BY n.created_at DESC LIMIT 20`
      : `SELECT n.id, n.branch_id, n.order_id, n.product_id, n.type, n.title, n.body, n.created_at,
               (nr.admin_id IS NOT NULL) AS read
         FROM notifications n
         LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.admin_id = $1
         ORDER BY n.created_at DESC LIMIT 20`,
    isBranchAdmin ? [session.branchId, session.id] : [session.id]
  );

  const unreadCount = rows.filter((r) => !r.read).length;
  return NextResponse.json({ notifications: rows, unreadCount });
}

// PATCH /api/admin/notifications
// Body { id: number } → mark one as read for this admin.
// Body {}             → mark all visible as read for this admin.
export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isBranchAdmin = session.role === "admin" && session.branchId !== null;
  const body = await req.json().catch(() => ({}));

  if (body?.id) {
    // Mark single notification read
    await pool.query(
      `INSERT INTO notification_reads (notification_id, admin_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [body.id, session.id]
    );
    return NextResponse.json({ ok: true });
  }

  // Mark all visible notifications read for this admin
  const { rows } = await pool.query(
    isBranchAdmin
      ? `SELECT id FROM notifications WHERE branch_id = $1 OR branch_id IS NULL`
      : `SELECT id FROM notifications`,
    isBranchAdmin ? [session.branchId] : []
  );

  if (rows.length === 0) return NextResponse.json({ ok: true });

  const ids = rows.map((r) => r.id as number);
  const values = ids.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ");
  const params = ids.flatMap((id) => [id, session.id]);

  await pool.query(
    `INSERT INTO notification_reads (notification_id, admin_id) VALUES ${values} ON CONFLICT DO NOTHING`,
    params
  );

  return NextResponse.json({ ok: true });
}
