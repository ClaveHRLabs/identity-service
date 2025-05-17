-- Migration for organization profiles and setup codes

-- Create organization_profiles table with extended fields
CREATE TABLE IF NOT EXISTS organization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    country VARCHAR(100),
    address TEXT,
    website VARCHAR(255),
    description TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    logo_url TEXT,
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    timezone VARCHAR(100) DEFAULT 'UTC',
    locale VARCHAR(20) DEFAULT 'en-US',
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create organization_setup_codes table for one-time setup codes
CREATE TABLE IF NOT EXISTS organization_setup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    data JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_by_admin VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_profiles_status ON organization_profiles(status);
CREATE INDEX IF NOT EXISTS idx_org_profiles_subscription ON organization_profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_setup_codes_code ON organization_setup_codes(code);
CREATE INDEX IF NOT EXISTS idx_setup_codes_org_id ON organization_setup_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_setup_codes_used ON organization_setup_codes(used);

-- Update the updated_at field automatically with trigger
CREATE TRIGGER trigger_org_profiles_updated_at
BEFORE UPDATE ON organization_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_setup_codes_updated_at
BEFORE UPDATE ON organization_setup_codes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();