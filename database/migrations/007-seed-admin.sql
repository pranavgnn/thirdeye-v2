-- Insert test admin account
-- Email: admin@mail.com
-- Password: admin123
-- Full Name: Admin

INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@mail.com',
  '9c9285d1a4f0589ee24d539b43758d05:17908baa3ea280c1a5d624545bae149e3a01ba8ff63946af11bc19ff5e6c19a1',
  'Admin',
  'reviewer',
  true
)
ON CONFLICT (email) DO NOTHING;
