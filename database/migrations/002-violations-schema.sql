CREATE TYPE violation_type AS ENUM (
  'speeding',
  'rash_driving',
  'wrong_parking',
  'red_light',
  'helmet_violation',
  'seatbelt_violation',
  'phone_usage',
  'no_license_plate',
  'other'
);

CREATE TYPE violation_status AS ENUM (
  'submitted',
  'ai_assessing',
  'pending_review',
  'escalated',
  'approved',
  'rejected',
  'fine_issued'
);

CREATE TYPE violation_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TABLE IF NOT EXISTS violation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES reporters(id) ON DELETE SET NULL,
  violation_type violation_type NOT NULL,
  description TEXT,
  vehicle_number VARCHAR(20),
  driver_name VARCHAR(255),
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  violation_time TIMESTAMP,
  severity violation_severity DEFAULT 'medium',
  status violation_status DEFAULT 'submitted',
  ai_assessment_score DECIMAL(3, 2),
  recommended_fine_amount DECIMAL(10, 2),
  final_fine_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violation_reports_status ON violation_reports(status);
CREATE INDEX idx_violation_reports_reporter_id ON violation_reports(reporter_id);
CREATE INDEX idx_violation_reports_vehicle ON violation_reports(vehicle_number);
CREATE INDEX idx_violation_reports_created_at ON violation_reports(created_at DESC);

CREATE TABLE IF NOT EXISTS violation_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violation_id UUID NOT NULL REFERENCES violation_reports(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path VARCHAR(500),
  ai_analysis JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violation_images_violation_id ON violation_images(violation_id);

CREATE TABLE IF NOT EXISTS fines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violation_id UUID NOT NULL UNIQUE REFERENCES violation_reports(id) ON DELETE CASCADE,
  fine_amount DECIMAL(10, 2) NOT NULL,
  fine_status VARCHAR(50) DEFAULT 'pending',
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_deadline TIMESTAMP,
  paid_date TIMESTAMP,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fines_violation_id ON fines(violation_id);
CREATE INDEX idx_fines_status ON fines(fine_status);

CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violation_id UUID NOT NULL REFERENCES violation_reports(id) ON DELETE CASCADE,
  escalated_by UUID REFERENCES admin_users(id),
  escalation_reason TEXT,
  escalation_level INT DEFAULT 1,
  priority VARCHAR(50) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution TEXT
);

CREATE INDEX idx_escalations_violation_id ON escalations(violation_id);
CREATE INDEX idx_escalations_priority ON escalations(priority);