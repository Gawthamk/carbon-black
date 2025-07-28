-- Complete Database Setup for Carbon Black OAN Tool
-- Run this in your Supabase SQL Editor

-- Drop existing tables to recreate with proper schema
DROP TABLE IF EXISTS running_sums CASCADE;
DROP TABLE IF EXISTS oan_entries CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with password support
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL for existing users who haven't set password yet
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create oan_entries table
CREATE TABLE oan_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade VARCHAR(50) NOT NULL,
  oan DECIMAL(10,3) NOT NULL,
  lsl DECIMAL(10,3) NOT NULL,
  usl DECIMAL(10,3) NOT NULL,
  target_oan DECIMAL(10,3) NOT NULL,
  k2co3_flow DECIMAL(10,3) NOT NULL,
  oil_flow DECIMAL(10,3) NOT NULL,
  predicted_oan DECIMAL(10,3),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create running_sums table for efficient calculations
CREATE TABLE running_sums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
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

-- Create indexes for better performance
CREATE INDEX idx_oan_entries_user_id ON oan_entries(user_id);
CREATE INDEX idx_oan_entries_grade ON oan_entries(grade);
CREATE INDEX idx_oan_entries_timestamp ON oan_entries(timestamp);
CREATE INDEX idx_oan_entries_user_grade ON oan_entries(user_id, grade);
CREATE INDEX idx_running_sums_user_id ON running_sums(user_id);
CREATE INDEX idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE oan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_sums ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on oan_entries" ON oan_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations on running_sums" ON running_sums FOR ALL USING (true);

-- Insert sample users (optional - remove if not needed)
INSERT INTO users (username, password_hash) VALUES 
  ('admin', NULL),
  ('operator1', NULL),
  ('engineer1', NULL)
ON CONFLICT (username) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for running_sums table
CREATE TRIGGER update_running_sums_updated_at BEFORE UPDATE ON running_sums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
