import pg from "pg";

// Raw pg pool — used directly in API routes where Prisma adapter has issues
const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  database: "farmfresh",
  user: "postgres",
  password: "admin",
  max: 20,                    // max connections in the pool
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 10000, // wait up to 10s for a connection
});

export default pool;
