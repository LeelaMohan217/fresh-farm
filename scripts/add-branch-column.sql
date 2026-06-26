-- Add branch, phone, and secondary phone columns to admins table
-- This script adds branch and phone columns to distinguish between super admins (app owners) and branch admins

ALTER TABLE admins ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(50);

-- Add comments to explain the purpose
COMMENT ON COLUMN admins.branch IS 'Branch location for admin. NULL for super admins (app owners), specified for branch admins.';
COMMENT ON COLUMN admins.phone IS 'Primary phone number for admin contact information.';
COMMENT ON COLUMN admins.secondary_phone IS 'Secondary phone number for admin contact information (optional).';
