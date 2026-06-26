import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import pool from "@/lib/pg";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Find valid reset token
    const { rows } = await pool.query(
      `SELECT prt.user_id, prt.expires_at 
       FROM password_reset_tokens prt
       WHERE prt.token = $1 AND prt.expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
    }

    const resetToken = rows[0];

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update admin password
    await pool.query(
      "UPDATE admins SET password = $1 WHERE id = $2",
      [hashedPassword, resetToken.user_id]
    );

    // Delete the used reset token
    await pool.query(
      "DELETE FROM password_reset_tokens WHERE token = $1",
      [token]
    );

    return NextResponse.json({ message: "Password reset successfully." });
  } catch (e) {
    console.error("PASSWORD RESET CONFIRM ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
