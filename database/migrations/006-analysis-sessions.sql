CREATE TABLE IF NOT EXISTS violation_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(50) DEFAULT 'processing',
  progress_data JSONB DEFAULT '[]',
  result JSONB,
  error TEXT,
  image_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_status ON violation_analysis_sessions(status);
CREATE INDEX idx_sessions_created_at ON violation_analysis_sessions(created_at DESC);
