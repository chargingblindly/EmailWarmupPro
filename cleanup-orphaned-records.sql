-- Cleanup orphaned records that might be causing duplicate key violations
-- Run this in your Supabase SQL editor

-- First, let's see what orphaned records exist
SELECT 
    tm.id,
    tm.tenant_id,
    tm.user_id,
    tm.role,
    t.name as tenant_name,
    t.created_at as tenant_created
FROM tenant_members tm
LEFT JOIN tenants t ON tm.tenant_id = t.id
WHERE t.id IS NULL;

-- Delete orphaned tenant_members that reference non-existent tenants
DELETE FROM tenant_members 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- Look for any duplicate memberships (shouldn't exist with unique constraint, but let's check)
SELECT 
    tenant_id,
    user_id,
    COUNT(*) as count
FROM tenant_members 
GROUP BY tenant_id, user_id
HAVING COUNT(*) > 1;

-- Check for any incomplete tenant creation attempts
-- (tenants without any members - these might be from failed creation attempts)
SELECT 
    t.id,
    t.name,
    t.created_at
FROM tenants t
LEFT JOIN tenant_members tm ON t.id = tm.tenant_id
WHERE tm.tenant_id IS NULL;

-- Clean up tenants that have no members (failed creation attempts)
DELETE FROM tenants 
WHERE id NOT IN (SELECT DISTINCT tenant_id FROM tenant_members WHERE tenant_id IS NOT NULL);

-- Show current state after cleanup
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    tm.user_id,
    tm.role,
    t.created_at
FROM tenants t
JOIN tenant_members tm ON t.id = tm.tenant_id
ORDER BY t.created_at DESC;
