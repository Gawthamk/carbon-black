-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create oan_entries table
CREATE TABLE IF NOT EXISTS oan_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  grade VARCHAR(50) NOT NULL,
  oan DECIMAL(10,3) NOT NULL,
  lsl DECIMAL(10,3) NOT NULL,
  usl DECIMAL(10,3) NOT NULL,
  target_oan DECIMAL(10,3) NOT NULL,
  k2co3_flow DECIMAL(10,3) NOT NULL,
  oil_flow DECIMAL(10,3) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create running_sums table for efficient calculations
CREATE TABLE IF NOT EXISTS running_sums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  n INTEGER DEFAULT 0,
  s0 DECIMAL(15,6) DEFAULT 0, -- sum of OAN
  sk DECIMAL(15,6) DEFAULT 0, -- sum of K2CO3 flow
  sik DECIMAL(15,6) DEFAULT 0, -- sum of inverse K2CO3
  soil DECIMAL(15,6) DEFAULT 0, -- sum of oil flow
  so_ik DECIMAL(15,6) DEFAULT 0, -- sum of OAN * inverse K2CO3
  so_oil DECIMAL(15,6) DEFAULT 0, -- sum of OAN * oil flow
  sik_squared DECIMAL(15,6) DEFAULT 0, -- sum of (inverse K2CO3)^2
  soil_squared DECIMAL(15,6) DEFAULT 0, -- sum of oil flow^2
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update oan_entries table to include predicted_oan
ALTER TABLE oan_entries ADD COLUMN IF NOT EXISTS predicted_oan DECIMAL(10,3);

-- Insert some sample users
INSERT INTO users (username) VALUES 
  ('admin'),
  ('operator1'),
  ('engineer1')
ON CONFLICT (username) DO NOTHING;
