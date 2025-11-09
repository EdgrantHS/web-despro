-- Simple Confirm User Script
-- Jalankan script ini di Supabase SQL Editor

-- 1. Confirm user admin.pusat@despro.com
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admin.pusat@despro.com';

-- 2. Confirm user admin.node@despro.com
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admin.node@despro.com';

-- 3. Confirm user petugas@despro.com
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'petugas@despro.com';

-- 4. Cek hasil semua users
SELECT 
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email IN (
    'admin.pusat@despro.com',
    'admin.node@despro.com',
    'petugas@despro.com'
);
