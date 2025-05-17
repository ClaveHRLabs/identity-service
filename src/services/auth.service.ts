import { logger } from '../utils/logger';
import * as authProviderRepository from '../db/auth-provider';
import * as magicLinkRepository from '../db/magic-link';
import * as refreshTokenRepository from '../db/refresh-token';
import { User } from '../models/schemas/user';
import { AppError } from '../api/middlewares/error-handler';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { Config } from '../config/config';
import axios from 'axios';

export class AuthService {
    private readonly userService;
    private readonly emailService;

    constructor(userService: any, emailService: any) {
        this.userService = userService;
        this.emailService = emailService;
    }

    /**
     * Common method for OAuth authentication
     * @param providerType OAuth provider (google or microsoft)
     * @param code Authorization code
     * @param redirectUri Redirect URI
     * @param state Optional state for additional context/security
     */
    private async authenticateWithOAuth(
        providerType: 'google' | 'microsoft' | 'linkedin',
        code: string,
        redirectUri: string,
        state?: string
    ): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        try {
            let tokenUrl: string;
            let userInfoUrl: string;
            let clientId: string;
            let clientSecret: string;
            let tokenRequestConfig: any = {};
            let tokenRequestData: any;

            // Configure provider-specific settings
            if (providerType === 'google') {
                tokenUrl = 'https://oauth2.googleapis.com/token';
                userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
                clientId = Config.GOOGLE_CLIENT_ID;
                clientSecret = Config.GOOGLE_CLIENT_SECRET;
                tokenRequestData = {
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code'
                };
            } else if (providerType === 'linkedin') {
                tokenUrl = 'https://www.linkedin.com/oauth/v2/authorization';
                userInfoUrl = 'https://www.linkedin.com/oauth/v2/userinfo';
                clientId = Config.LINKEDIN_CLIENT_ID;
                clientSecret = Config.LINKEDIN_CLIENT_SECRET;
                tokenRequestData = new URLSearchParams({
                    response_type: 'code',
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    scope: 'openid profile email',
                });
                tokenRequestConfig = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                };
            } else {
                tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
                userInfoUrl = 'https://graph.microsoft.com/v1.0/me';
                clientId = Config.MICROSOFT_CLIENT_ID;
                clientSecret = Config.MICROSOFT_CLIENT_SECRET;
                tokenRequestData = new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code'
                });
                tokenRequestConfig = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                };
            }

            // Exchange code for tokens
            const tokenResponse = await axios.post(tokenUrl, tokenRequestData, tokenRequestConfig);
            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            // Get user info from provider
            const userInfoResponse = await axios.get(userInfoUrl, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const oauthUser = userInfoResponse.data;

            // Extract user info based on provider
            let email, firstName, lastName, displayName, avatarUrl, providerUserId, verified, metadata;

            if (providerType === 'google') {
                email = oauthUser.email;
                firstName = oauthUser.given_name;
                lastName = oauthUser.family_name;
                displayName = oauthUser.name;
                avatarUrl = oauthUser.picture;
                providerUserId = oauthUser.sub;
                verified = oauthUser.email_verified;
                metadata = {
                    name: oauthUser.name,
                    picture: oauthUser.picture,
                    locale: oauthUser.locale
                };
            } else if (providerType === 'linkedin') {
                email = oauthUser.email;
                firstName = oauthUser.givenName;
                lastName = oauthUser.surname;
                displayName = oauthUser.localizedFirstName + ' ' + oauthUser.localizedLastName;
                avatarUrl = oauthUser.profilePicture.displayImage;
                providerUserId = oauthUser.id;
                verified = true; // LinkedIn accounts are considered verified
                metadata = {
                    display_name: oauthUser.localizedFirstName + ' ' + oauthUser.localizedLastName,
                    job_title: oauthUser.localizedHeadline,
                    office_location: oauthUser.location.name
                };
            } else {
                email = oauthUser.mail || oauthUser.userPrincipalName;
                firstName = oauthUser.givenName;
                lastName = oauthUser.surname;
                displayName = oauthUser.displayName;
                providerUserId = oauthUser.id;
                verified = true; // Microsoft accounts are considered verified
                metadata = {
                    display_name: oauthUser.displayName,
                    job_title: oauthUser.jobTitle,
                    office_location: oauthUser.officeLocation
                };
            }

            // Check if this email is already registered
            let user = await this.userService.getUserByEmail(email);

            // Create a new user if not exists
            if (!user) {
                user = await this.userService.createUser({
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    display_name: displayName,
                    avatar_url: avatarUrl,
                    email_verified: verified
                });
            }

            // Save or update auth provider
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

            const authProvider = await authProviderRepository.getAuthProviderByEmailAndType(email, providerType);

            if (authProvider) {
                // Update tokens
                await authProviderRepository.updateAuthProviderTokens(
                    authProvider.id,
                    access_token,
                    refresh_token,
                    expiresAt
                );
            } else {
                // Create new auth provider
                await authProviderRepository.createAuthProvider({
                    user_id: user.id,
                    provider_type: providerType,
                    provider_user_id: providerUserId,
                    email,
                    access_token,
                    refresh_token,
                    token_expires_at: expiresAt,
                    metadata
                });
            }

            // Update last login time
            await this.userService.updateLastLogin(user.id);

            // Parse state if provided
            let stateData = {};
            if (state) {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    logger.warn(`Failed to parse state: ${e}`);
                }
            }

            // Generate JWT tokens (now async)
            const [jwt_access_token, jwt_refresh_token] = await Promise.all([
                generateAccessToken(user, stateData),
                generateRefreshToken(user)
            ]);

            // Save refresh token to database
            await refreshTokenRepository.createRefreshToken({
                user_id: user.id,
                expiration_days: 7, // Default expiration
                device_info: {
                    source: `${providerType}_oauth`,
                    state: stateData
                }
            });

            return {
                user,
                access_token: jwt_access_token,
                refresh_token: jwt_refresh_token
            };
        } catch (error) {
            logger.error(`${providerType} authentication error`, { error });
            throw new AppError(`Failed to authenticate with ${providerType}`, 500, 'AUTH_ERROR');
        }
    }

    /**
     * Authenticate with Google OAuth
     */
    async authenticateWithGoogle(code: string, redirectUri: string, state?: string): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        return this.authenticateWithOAuth('google', code, redirectUri, state);
    }

    /**
     * Authenticate with Microsoft OAuth
     */
    async authenticateWithMicrosoft(code: string, redirectUri: string, state?: string): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        return this.authenticateWithOAuth('microsoft', code, redirectUri, state);
    }

    /**
     * Authenticate with LinkedIn OAuth
     */
    async authenticateWithLinkedIn(code: string, redirectUri: string, state?: string): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        return this.authenticateWithOAuth('linkedin', code, redirectUri, state);
    }

    /**
     * Generate OAuth authorization URL
     * @param provider OAuth provider (google or microsoft)
     * @param redirectUri Client redirect URI
     * @param state Optional state parameter for additional context
     */
    getOAuthAuthorizationUrl(
        provider: 'google' | 'microsoft' | 'linkedin',
        redirectUri: string,
        state?: string
    ): string {
        let url: string;
        let clientId: string;

        if (provider === 'google') {
            url = 'https://accounts.google.com/o/oauth2/v2/auth';
            clientId = Config.GOOGLE_CLIENT_ID;

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'email profile openid',
                access_type: 'offline',
                prompt: 'consent'
            });

            if (state) params.append('state', state);

            return `${url}?${params.toString()}`;
        } else if (provider === 'linkedin') {
            url = 'https://www.linkedin.com/oauth/v2/authorization';
            clientId = Config.LINKEDIN_CLIENT_ID;

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'openid profile email',
            });

            if (state) params.append('state', state);

            return `${url}?${params.toString()}`;
        } else {
            url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
            clientId = Config.MICROSOFT_CLIENT_ID;

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'user.read openid profile email',
                response_mode: 'query'
            });

            if (state) params.append('state', state);

            return `${url}?${params.toString()}`;
        }
    }

    /**
     * Send a magic link for email authentication
     */
    async sendMagicLink(email: string, redirectUri?: string): Promise<void> {
        try {
            // Create or get magic link
            const magicLink = await magicLinkRepository.createMagicLink({
                email,
                expiration_minutes: 30,
                metadata: redirectUri ? { redirect_uri: redirectUri } : {}
            });

            // Get user or create one if it doesn't exist
            let user = await this.userService.getUserByEmail(email);

            if (!user) {
                // Create a new user with just email
                user = await this.userService.createUser({
                    email,
                    email_verified: false
                });

                // Create email auth provider
                await authProviderRepository.createAuthProvider({
                    user_id: user.id,
                    provider_type: 'email',
                    email
                });
            }

            // Generate magic link URL 
            const baseUrl = Config.FRONTEND_URL || 'https://app.clavehr.com';
            const verificationUrl = `${baseUrl}/verify-email?token=${magicLink.token}`;

            // Send magic link email
            await this.emailService.sendMagicLinkEmail(email, verificationUrl);

            logger.info('Magic link sent successfully', { email });
        } catch (error) {
            logger.error('Error sending magic link', { error, email });
            throw new AppError('Failed to send magic link', 500, 'EMAIL_ERROR');
        }
    }

    /**
     * Verify a magic link token and authenticate the user
     */
    async verifyMagicLink(token: string): Promise<{
        success: boolean;
        message?: string;
        tokens?: {
            access_token: string;
            refresh_token: string;
        };
    }> {
        try {
            // Validate the magic link
            const validation = await magicLinkRepository.validateMagicLink(token);

            if (!validation.valid || !validation.magicLink) {
                return {
                    success: false,
                    message: validation.message || 'Invalid magic link'
                };
            }

            // Mark the magic link as used
            await magicLinkRepository.markMagicLinkAsUsed(validation.magicLink.id);

            // Get or create the user
            const email = validation.magicLink.email;
            let user = await this.userService.getUserByEmail(email);

            if (!user) {
                // Create a new user with just email
                user = await this.userService.createUser({
                    email,
                    email_verified: true
                });

                // Create email auth provider
                await authProviderRepository.createAuthProvider({
                    user_id: user.id,
                    provider_type: 'email',
                    email
                });
            }

            // Set email as verified if it wasn't already
            if (!user.email_verified) {
                user = await this.userService.setEmailVerified(user.id, true);
            }

            // Update last login time
            await this.userService.updateLastLogin(user.id);

            // Generate JWT tokens
            const [access_token, refresh_token] = await Promise.all([
                generateAccessToken(user),
                generateRefreshToken(user)
            ]);

            // Save refresh token to database
            await refreshTokenRepository.createRefreshToken({
                user_id: user.id,
                expiration_days: 7, // Default expiration
                device_info: { source: 'microsoft_oauth' }
            });

            return {
                success: true,
                tokens: {
                    access_token,
                    refresh_token
                }
            };
        } catch (error) {
            logger.error('Error verifying magic link', { error, token });
            throw new AppError('Failed to verify magic link', 500, 'AUTH_ERROR');
        }
    }

    /**
     * Refresh an access token using a refresh token
     */
    async refreshToken(refreshToken: string): Promise<{
        success: boolean;
        message?: string;
        access_token?: string;
    }> {
        try {
            // Validate the refresh token in the database
            const validation = await refreshTokenRepository.validateRefreshToken(refreshToken);

            if (!validation.valid || !validation.refreshToken) {
                return {
                    success: false,
                    message: validation.message || 'Invalid refresh token'
                };
            }

            // Get the user
            const userId = validation.refreshToken.user_id;
            const user = await this.userService.getUserById(userId);

            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            // Generate a new access token
            const access_token = await generateAccessToken(user);

            return {
                success: true,
                access_token
            };
        } catch (error) {
            logger.error('Error refreshing token', { error });
            throw new AppError('Failed to refresh token', 500, 'AUTH_ERROR');
        }
    }

    /**
     * Revoke a refresh token
     */
    async revokeRefreshToken(refreshToken: string): Promise<boolean> {
        try {
            // Get the token from the database
            const token = await refreshTokenRepository.getRefreshTokenByToken(refreshToken);

            if (!token) {
                return false;
            }

            // Revoke the token
            await refreshTokenRepository.revokeRefreshToken(token.id);
            return true;
        } catch (error) {
            logger.error('Error revoking refresh token', { error });
            throw new AppError('Failed to revoke token', 500, 'AUTH_ERROR');
        }
    }

    /**
     * Revoke all refresh tokens for a user
     */
    async revokeAllUserTokens(userId: string): Promise<number> {
        try {
            return await refreshTokenRepository.revokeAllUserRefreshTokens(userId);
        } catch (error) {
            logger.error('Error revoking all user tokens', { error, userId });
            throw new AppError('Failed to revoke tokens', 500, 'AUTH_ERROR');
        }
    }
} 