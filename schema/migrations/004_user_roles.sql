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