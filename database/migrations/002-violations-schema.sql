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
  reporterId UUID REFERENCES reporters(id) ON DELETE SET NULL,
  violationType violation_type NOT NULL,
  description TEXT,
  vehicleNumber VARCHAR(20),
  driverName VARCHAR(255),
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  violationTime TIMESTAMP,
  severity violation_severity DEFAULT 'medium',
  status violation_status DEFAULT 'submitted',
  aiAssessmentScore DECIMAL(3, 2), -- 0-1.0 confidence score
  recommendedFineAmount DECIMAL(10, 2),
  finalFineAmount DECIMAL(10, 2),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violation_reports_status ON violation_reports(status);
CREATE INDEX idx_violation_reports_reporter_id ON violation_reports(reporterId);
CREATE INDEX idx_violation_reports_vehicle ON violation_reports(vehicleNumber);
CREATE INDEX idx_violation_reports_created_at ON violation_reports(createdAt DESC);

CREATE TABLE IF NOT EXISTS violation_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violationId UUID NOT NULL REFERENCES violation_reports(id) ON DELETE CASCADE,
  imageUrl TEXT NOT NULL,
  storagePath VARCHAR(500),
  aiAnalysis JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violation_images_violation_id ON violation_images(violationId);

CREATE TABLE IF NOT EXISTS fines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violationId UUID NOT NULL UNIQUE REFERENCES violation_reports(id) ON DELETE CASCADE,
  fineAmount DECIMAL(10, 2) NOT NULL,
  fineStatus VARCHAR(50) DEFAULT 'pending',
  issueDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paymentDeadline TIMESTAMP,
  paidDate TIMESTAMP,
  paymentMethod VARCHAR(50),
  transactionId VARCHAR(100),
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fines_violation_id ON fines(violationId);
CREATE INDEX idx_fines_status ON fines(fineStatus);

CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violationId UUID NOT NULL REFERENCES violation_reports(id) ON DELETE CASCADE,
  escalatedBy UUID REFERENCES admin_users(id),
  escalationReason TEXT,
  escalationLevel INT DEFAULT 1,
  priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvedAt TIMESTAMP,
  resolution TEXT
);

CREATE INDEX idx_escalations_violation_id ON escalations(violationId);
CREATE INDEX idx_escalations_priority ON escalations(priority);