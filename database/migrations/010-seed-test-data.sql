-- Insert test reporters
INSERT INTO reporters (email, phone_number, full_name, license_number, created_at)
VALUES 
  ('reporter1@example.com', '9876543210', 'John Doe', 'DL123456', NOW()),
  ('reporter2@example.com', '9876543211', 'Jane Smith', 'DL123457', NOW())
ON CONFLICT DO NOTHING;

-- Insert test violation reports
INSERT INTO violation_reports (violation_type, description, vehicle_number, severity, status, ai_assessment_score, recommended_fine_amount, created_at)
VALUES 
  ('speeding', 'Vehicle detected at 85 km/h in 60 km/h zone', 'MH01AB1234', 'high', 'pending_review', 0.95, 500, NOW()),
  ('helmet_violation', 'Rider not wearing helmet - confirmed by AI analysis', 'DL02CD5678', 'high', 'pending_review', 0.87, 500, NOW()),
  ('wrong_parking', 'Vehicle parked in no-parking zone', 'KA03EF9012', 'medium', 'pending_review', 0.76, 200, NOW()),
  ('red_light', 'Vehicle crossed red light - timestamp recorded', 'TN04GH3456', 'high', 'pending_review', 0.92, 1000, NOW()),
  ('seatbelt_violation', 'Driver not wearing seatbelt', 'UP05IJ7890', 'medium', 'pending_review', 0.78, 500, NOW())
ON CONFLICT DO NOTHING;

-- Insert test audit logs
INSERT INTO audit_logs (action, user_id, entity_type, entity_id, changes, status, created_at)
VALUES 
  ('submission_created', NULL, 'violation_report', uuid_generate_v4(), '{"source": "ai_analysis", "confidence": 0.95}', 'success', NOW()),
  ('ai_assessment_started', NULL, 'violation_report', uuid_generate_v4(), '{"image_received": true}', 'success', NOW()),
  ('ai_assessment_completed', NULL, 'violation_report', uuid_generate_v4(), '{"result": "violation_detected"}', 'success', NOW()),
  ('admin_login', uuid_generate_v4(), 'admin_session', uuid_generate_v4(), NULL, 'success', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;
