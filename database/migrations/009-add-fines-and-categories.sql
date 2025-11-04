-- Add category and fine amount to motor vehicle act rules
ALTER TABLE motor_vehicle_act_rules 
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS fine_amount_rupees INTEGER;

-- Create violation categories table for fine amounts
CREATE TABLE IF NOT EXISTS violation_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_name VARCHAR(100) UNIQUE NOT NULL,
  fine_amount_rupees INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard violation categories with fines
INSERT INTO violation_categories (category_name, fine_amount_rupees, description) VALUES
  ('speeding', 500, 'Driving at dangerous speed'),
  ('rash_driving', 1000, 'Rash or negligent driving'),
  ('wrong_parking', 200, 'Parking violations'),
  ('red_light', 1000, 'Running red light or signal violation'),
  ('helmet_violation', 500, 'Riding without helmet'),
  ('seatbelt_violation', 500, 'Not wearing seatbelt'),
  ('phone_usage', 1000, 'Using mobile phone while driving'),
  ('no_license_plate', 5000, 'Vehicle without license plate'),
  ('other', 500, 'Other traffic violations')
ON CONFLICT (category_name) DO NOTHING;

CREATE INDEX idx_violation_categories_name ON violation_categories(category_name);
