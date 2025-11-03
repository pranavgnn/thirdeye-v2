CREATE TABLE IF NOT EXISTS motor_vehicle_act_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id VARCHAR(100) UNIQUE NOT NULL,
  rule_title VARCHAR(500) NOT NULL,
  rule_text TEXT NOT NULL,
  section VARCHAR(50) NOT NULL,
  embedding vector(768),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_motor_vehicle_act_embedding 
  ON motor_vehicle_act_rules USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_motor_vehicle_act_rule_id ON motor_vehicle_act_rules(rule_id);
CREATE INDEX idx_motor_vehicle_act_section ON motor_vehicle_act_rules(section);
