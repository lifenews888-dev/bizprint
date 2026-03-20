-- BizPrint Database Migration
-- Run this in pgAdmin or psql BEFORE restarting the backend

-- 1. Fix delivery_status_enum - add missing values
ALTER TYPE delivery_status_enum ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE delivery_status_enum ADD VALUE IF NOT EXISTS 'in_transit';

-- 2. File enums will be auto-created by TypeORM synchronize
-- No manual action needed for files table

-- 3. Verify delivery enum
SELECT enum_range(NULL::delivery_status_enum);

-- Done!
