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
  user_id UUID,
  violation_id UUID REFERENCES violation_reports(id) ON DELETE SET NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_violation_id ON audit_logs(violation_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);