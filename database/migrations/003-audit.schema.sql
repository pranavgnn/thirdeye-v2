CREATE TYPE audit_action AS ENUM (
  'submission_created',
  'ai_assessment_started',
  'ai_assessment_completed',
  'admin_login',
  'admin_logout',
  'violation_reviewed',
  'violation_approved',
  'violation_rejected',
  'violation_escalated',
  'fine_issued',
  'fine_paid',
  'fine_appealed',
  'session_created',
  'session_destroyed'
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action audit_action NOT NULL,
  userId UUID,
  violationId UUID REFERENCES violation_reports(id) ON DELETE SET NULL,
  entityType VARCHAR(50),
  entityId UUID,
  changes JSONB,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  status VARCHAR(50),
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(userId);
CREATE INDEX idx_audit_logs_violation_id ON audit_logs(violationId);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(createdAt DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entityType, entityId);