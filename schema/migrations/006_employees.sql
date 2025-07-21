-- Migration: Create Employees Table
-- Description: Adds the employees table to store employee data

-- Create employees table with JSON fields for flexible data storage
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'onboarding', 'offboarding', 'terminated', 'on_leave')),
    personal_info JSONB NOT NULL DEFAULT '{}',
    contact_info JSONB NOT NULL DEFAULT '{}',
    demographics JSONB DEFAULT '{}',
    employment_details JSONB NOT NULL DEFAULT '{}',
    education JSONB NOT NULL DEFAULT '[]',
    work_experience JSONB NOT NULL DEFAULT '[]',
    skills JSONB NOT NULL DEFAULT '[]',
    documents JSONB NOT NULL DEFAULT '[]',
    onboarding JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX idx_employees_organization_id ON employees(organization_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_employment_department ON employees USING GIN ((employment_details->'department'));

-- Add search capabilities
CREATE INDEX idx_employees_personal_name ON employees USING GIN ((personal_info->'firstName') gin_trgm_ops, (personal_info->'lastName') gin_trgm_ops);
CREATE INDEX idx_employees_position ON employees USING GIN ((employment_details->'position') gin_trgm_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_employee_updated_at_trigger
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_employee_updated_at(); 