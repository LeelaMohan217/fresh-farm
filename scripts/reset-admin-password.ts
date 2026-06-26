import "dotenv/config";
import { hash } from "bcryptjs";
import pg from "pg";

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  database: "farmfresh",
  user: "postgres",
  password: "admin",
});

async function resetAdminPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log("Usage: npx tsx scripts/reset-admin-password.ts <email> <new-password>");
    console.log("Example: npx tsx scripts/reset-admin-password.ts admin@farmfresh.com newpassword123");
    process.exit(1);
  }

  try {
    // Check if admin exists
    const { rows } = await pool.query(
      "SELECT id, name, email FROM admins WHERE email = $1",
      [email]
    );

    if (rows.length === 0) {
      console.log(`❌ No admin found with email: ${email}`);
      process.exit(1);
    }

    const admin = rows[0];

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await pool.query(
      "UPDATE admins SET password = $1 WHERE email = $2",
      [hashedPassword, email]
    );

    console.log(`✅ Password reset successfully for admin: ${admin.name} (${admin.email})`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 New password: ${newPassword}`);
    console.log("\n⚠️  Please change this password after logging in.");
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
