-- Restore tables dropped by prisma db push

-- branches
CREATE TABLE IF NOT EXISTS branches (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  location   VARCHAR(255),
  address    TEXT,
  phone      VARCHAR(50),
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- branch_pincodes
CREATE TABLE IF NOT EXISTS branch_pincodes (
  id         SERIAL PRIMARY KEY,
  branch_id  INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  pincode    VARCHAR(10) NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_branch_pincodes_branch_id ON branch_pincodes(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_pincodes_pincode   ON branch_pincodes(pincode);

-- admins
CREATE TABLE IF NOT EXISTS admins (
  id               VARCHAR(50) PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NOT NULL UNIQUE,
  password         VARCHAR(255) NOT NULL,
  role             VARCHAR(50)  NOT NULL DEFAULT 'admin',
  branch_id        INT REFERENCES branches(id) ON DELETE SET NULL,
  phone            VARCHAR(50),
  secondary_phone  VARCHAR(50),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add branch_id to products if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Add extra columns to orders if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pincode          VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id       INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id        INT REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiver_name    VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiver_phone   VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiver_email   VARCHAR(255);

-- Add branch_id to bulk_orders if missing
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;

-- customer_addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
  id             SERIAL PRIMARY KEY,
  customer_id    VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type           VARCHAR(50) NOT NULL DEFAULT 'Home',
  address        TEXT NOT NULL,
  pincode        VARCHAR(10) NOT NULL,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  receiver_name  VARCHAR(255),
  receiver_phone VARCHAR(50),
  receiver_email VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  branch_id  INT REFERENCES branches(id) ON DELETE CASCADE,
  order_id   VARCHAR(50),
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL DEFAULT 'order',
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- notification_reads
CREATE TABLE IF NOT EXISTS notification_reads (
  id              SERIAL PRIMARY KEY,
  notification_id INT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  admin_id        VARCHAR(50) NOT NULL,
  UNIQUE(notification_id, admin_id)
);

-- bulk_order_items
CREATE TABLE IF NOT EXISTS bulk_order_items (
  id            SERIAL PRIMARY KEY,
  bulk_order_id VARCHAR(50) NOT NULL REFERENCES bulk_orders(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  quantity      VARCHAR(255),
  unit          VARCHAR(50),
  notes         TEXT
);
