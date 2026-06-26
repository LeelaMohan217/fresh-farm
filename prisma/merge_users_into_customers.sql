-- Migration: merge users into customers
-- Run once against your local (and production) database.

-- 1. Add password column to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Copy hashed passwords from users → customers (matched by email)
UPDATE customers c
SET password = u.password
FROM users u
WHERE LOWER(u.email) = LOWER(c.email);

-- 3. Re-point password_reset_tokens to customers.id
--    (tokens currently store users.id; map them to the matching customers.id)
ALTER TABLE password_reset_tokens
  ADD COLUMN IF NOT EXISTS customer_id TEXT;

UPDATE password_reset_tokens prt
SET customer_id = c.id
FROM users u
JOIN customers c ON LOWER(c.email) = LOWER(u.email)
WHERE u.id = prt.user_id;

-- Drop old FK and column, promote new column
ALTER TABLE password_reset_tokens
  DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;

ALTER TABLE password_reset_tokens
  DROP COLUMN user_id;

ALTER TABLE password_reset_tokens
  RENAME COLUMN customer_id TO user_id;

ALTER TABLE password_reset_tokens
  ADD CONSTRAINT password_reset_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES customers(id) ON DELETE CASCADE;

-- 4. Drop the users table (no longer needed)
DROP TABLE IF EXISTS users;
