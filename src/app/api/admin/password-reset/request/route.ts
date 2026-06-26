import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import pool from "@/lib/pg";

// Generate a secure random token
function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Check if admin exists
    const { rows } = await pool.query(
      "SELECT id, name, email FROM admins WHERE email = $1",
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      // Don't reveal if email exists for security
      return NextResponse.json({ 
        message: "If an account with this email exists, a password reset link has been sent." 
      });
    }

    const admin = rows[0];

    // Delete any existing reset tokens for this admin
    await pool.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1",
      [admin.id]
    );

    // Generate new reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [admin.id, token, expiresAt]
    );

    // In production, send email with reset link
    // For now, log the reset link to console (development only)
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/password-reset/confirm?token=${token}`;
    
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("PASSWORD RESET LINK (Development Mode)");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log("═══════════════════════════════════════════════════════════════");

    return NextResponse.json({ 
      message: "If an account with this email exists, a password reset link has been sent." 
    });
  } catch (e) {
    console.error("PASSWORD RESET REQUEST ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
