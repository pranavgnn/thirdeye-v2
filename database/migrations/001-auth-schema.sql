CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'reviewer',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adminId UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  jwtToken TEXT NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(adminId);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expiresAt);

CREATE TABLE IF NOT EXISTS reporters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phoneNumber VARCHAR(20) UNIQUE,
  fullName VARCHAR(255),
  licenseNumber VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reporters_email ON reporters(email);
CREATE INDEX idx_reporters_phone ON reporters(phoneNumber);