export interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    email_verified: boolean;
    status: string;
    organization_id?: string;
    metadata?: Record<string, any>;
    preferences?: Record<string, any>;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface AuthProvider {
    id: string;
    user_id: string;
    provider_type: 'google' | 'microsoft' | 'email';
    provider_user_id?: string;
    email: string;
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: Date;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export interface MagicLink {
    id: string;
    email: string;
    token: string;
    expires_at: Date;
    used: boolean;
    used_at?: Date;
    created_at: Date;
    metadata?: Record<string, any>;
}

export interface RefreshToken {
    id: string;
    user_id: string;
    token: string;
    expires_at: Date;
    revoked: boolean;
    created_at: Date;
    updated_at: Date;
    device_info?: Record<string, any>;
}

export type CreateUserDto = {
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    organization_id?: string;
    metadata?: Record<string, any>;
    preferences?: Record<string, any>;
};

export type UpdateUserDto = Partial<CreateUserDto>;

export type CreateAuthProviderDto = {
    user_id: string;
    provider_type: 'google' | 'microsoft' | 'email';
    provider_user_id?: string;
    email: string;
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: Date;
    metadata?: Record<string, any>;
};

export type CreateMagicLinkDto = {
    email: string;
    expiration_minutes?: number;
    metadata?: Record<string, any>;
};

export type CreateRefreshTokenDto = {
    user_id: string;
    expiration_days?: number;
    device_info?: Record<string, any>;
}; 