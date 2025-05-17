export interface OrganizationProfile {
    id: string;
    name: string;
    industry?: string;
    size?: string;
    country?: string;
    address?: string;
    website?: string;
    description?: string;
    config?: Record<string, any>;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    status: string;
    timezone?: string;
    locale?: string;
    subscription_tier: string;
    subscription_status: string;
    trial_ends_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface OrganizationSetupCode {
    id: string;
    organization_id: string;
    code: string;
    data?: Record<string, any>;
    expires_at: Date;
    used: boolean;
    used_at?: Date;
    created_by_admin?: string;
    created_at: Date;
    updated_at: Date;
}

export type CreateOrganizationProfileDto = Omit<
    OrganizationProfile,
    'id' | 'created_at' | 'updated_at'
>;

export type UpdateOrganizationProfileDto = Partial<
    Omit<OrganizationProfile, 'id' | 'created_at' | 'updated_at'>
>;

export type CreateSetupCodeDto = {
    organization_id: string;
    expiration_hours?: number;
    data?: Record<string, any>;
    created_by_admin?: string;
};

export type ValidateSetupCodeDto = {
    code: string;
}; 