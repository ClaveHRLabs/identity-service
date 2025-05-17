-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 