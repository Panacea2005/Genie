-- Migration: Create profiles for existing users who don't have them yet
-- Run this AFTER creating the profiles table

INSERT INTO profiles (id, email, name, bio, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name', 
    SPLIT_PART(au.email, '@', 1)
  ) as name,
  au.raw_user_meta_data->>'bio' as bio,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL  -- Only users without existing profiles
AND au.email IS NOT NULL;

-- Verify the migration worked
SELECT 
  COUNT(*) as total_users_in_auth,
  (SELECT COUNT(*) FROM profiles) as total_profiles_created,
  (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT id FROM profiles)) as missing_profiles
FROM auth.users; 