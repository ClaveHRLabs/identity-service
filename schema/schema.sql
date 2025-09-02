-- Auto-generated consolidated schema for identity-service
-- Generated at 2025-08-08T11:54:16.909Z
-- Do not edit manually; edit migration files instead.

-- Common extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- BEGIN identity-service/schema/init.sql
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
-- END identity-service/schema/init.sql
-- BEGIN identity-service/schema/migrations/001_initial_schema.sql

-- END identity-service/schema/migrations/001_initial_schema.sql

-- BEGIN identity-service/schema/migrations/004_api_keys.sql
-- Migration for API key management

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    key VARCHAR(37) NOT NULL UNIQUE, -- Format: xapi-{32 character random string}
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL means never expires
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip INET,
    usage_count INTEGER NOT NULL DEFAULT 0,
    rate_limit_per_minute INTEGER, -- Optional rate limiting
    allowed_ips INET[], -- IP whitelist
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for api_keys table
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used_at ON api_keys(last_used_at);

-- Create trigger for updating updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Add constraint to ensure active API keys have valid expiration
ALTER TABLE api_keys ADD CONSTRAINT check_active_expiration 
    CHECK (is_active = false OR expires_at IS NULL OR expires_at > NOW());

-- Add constraint to ensure usage_count is non-negative
ALTER TABLE api_keys ADD CONSTRAINT check_usage_count_positive 
    CHECK (usage_count >= 0);

-- Add constraint to ensure rate_limit_per_minute is reasonable
ALTER TABLE api_keys ADD CONSTRAINT check_rate_limit_reasonable 
    CHECK (rate_limit_per_minute IS NULL OR (rate_limit_per_minute >= 1 AND rate_limit_per_minute <= 10000));

-- END identity-service/schema/migrations/004_api_keys.sql

-- BEGIN identity-service/schema/migrations/002_organization_profiles.sql
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
-- END identity-service/schema/migrations/002_organization_profiles.sql

-- BEGIN identity-service/schema/migrations/003_users.sql
-- Migration for users, authentication, and related tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(255),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    organization_id UUID REFERENCES organization_profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create auth_providers table for different authentication methods
CREATE TABLE IF NOT EXISTS auth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'email'
    provider_user_id VARCHAR(255), -- External ID from provider (if applicable)
    email VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(provider_type, email)
);

-- Create magic_links table for email authentication
CREATE TABLE IF NOT EXISTS magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    device_info JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_auth_providers_user_id ON auth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_providers_email ON auth_providers(email);
CREATE INDEX IF NOT EXISTS idx_auth_providers_type ON auth_providers(provider_type);

CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Update triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_auth_providers_updated_at
BEFORE UPDATE ON auth_providers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_refresh_tokens_updated_at
BEFORE UPDATE ON refresh_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
-- END identity-service/schema/migrations/003_users.sql

-- BEGIN identity-service/schema/migrations/004_user_roles.sql
-- Migration for user roles and permissions

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_roles junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id, organization_id)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Update triggers for updated_at
CREATE TRIGGER trigger_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('super_admin', 'System-wide access and configuration'),
('organization_admin', 'Full control over a specific organization'),
('organization_manager', 'User management and limited admin access'),
('hr_manager', 'Access to HR-related features'),
('hiring_manager', 'Recruitment and applicant tracking'),
('team_manager', 'Manages direct reports and team operations'),
('employee', 'Basic access to personal information'),
('recruiter', 'Manages recruitment processes'),
('learning_specialist', 'Manages learning and development'),
('succession_planner', 'Manages succession planning'),
('clavehr_operator', 'ClaveHR Operator with ability to onboard/deboard organizations');

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
-- System-level permissions
('manage_system', 'Manage system-wide settings'),
('view_system_logs', 'View system logs and audit trails'),
('manage_organizations', 'Create, update, delete organizations'),

-- Organization-level permissions
('manage_organization_settings', 'Manage organization settings'),
('manage_users', 'Create, update, delete users'),
('view_all_users', 'View all users in the organization'),
('manage_roles', 'Assign and remove user roles'),

-- Feature-specific permissions
('manage_onboarding', 'Manage employee onboarding'),
('manage_offboarding', 'Manage employee offboarding'),
('manage_performance', 'Manage performance reviews'),
('view_performance_reports', 'View performance reports'),
('manage_goals', 'Create and manage goals'),
('manage_succession', 'Manage succession planning'),
('manage_learning', 'Manage learning and development'),
('manage_recruitment', 'Manage recruitment processes'),
('view_analytics', 'View analytics and reports');

-- Assign permissions to roles
-- Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'super_admin';

-- ClaveHR Operator
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'clavehr_operator' AND p.name IN (
    'manage_organizations', 
    'view_system_logs', 
    'manage_users', 
    'view_all_users'
);

-- Organization Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'organization_admin' AND p.name IN (
    'manage_organization_settings', 
    'manage_users', 
    'view_all_users', 
    'manage_roles',
    'manage_onboarding',
    'manage_offboarding',
    'manage_performance',
    'view_performance_reports',
    'manage_goals',
    'manage_succession',
    'manage_learning',
    'manage_recruitment',
    'view_analytics'
);

-- Organization Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'organization_manager' AND p.name IN (
    'manage_users', 
    'view_all_users',
    'view_performance_reports',
    'view_analytics'
);

-- HR Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'hr_manager' AND p.name IN (
    'view_all_users',
    'manage_onboarding',
    'manage_offboarding',
    'manage_performance',
    'view_performance_reports',
    'view_analytics'
);

-- Other roles' permissions can be added similarly
-- END identity-service/schema/migrations/004_user_roles.sql

-- BEGIN identity-service/schema/migrations/005_organization_metadata.sql
-- Migration for organization metadata fields

-- Add organization metadata fields
ALTER TABLE organization_profiles 
ADD COLUMN IF NOT EXISTS join_settings JSONB DEFAULT '{
    "allow_public_join": false,
    "require_approval": true,
    "allow_invite_only": true,
    "max_members": null,
    "auto_approve_domains": [],
    "blocked_domains": []
}'::jsonb,
ADD COLUMN IF NOT EXISTS login_settings JSONB DEFAULT '{
    "allow_email_login": true,
    "allow_oauth_login": true,
    "allowed_oauth_providers": ["google", "microsoft", "linkedin"],
    "require_mfa": false,
    "session_timeout_minutes": 480
}'::jsonb,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_org_join_settings ON organization_profiles USING GIN (join_settings);
CREATE INDEX IF NOT EXISTS idx_org_login_settings ON organization_profiles USING GIN (login_settings);
CREATE INDEX IF NOT EXISTS idx_org_metadata ON organization_profiles USING GIN (metadata);
-- END identity-service/schema/migrations/005_organization_metadata.sql
