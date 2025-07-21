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