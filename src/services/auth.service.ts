import logger from '../utils/logger';
import * as authProviderRepository from '../db/auth-provider';
import * as magicLinkRepository from '../db/magic-link';
import * as refreshTokenRepository from '../db/refresh-token';
import { User } from '../models/schemas/user';
import { HttpError, HttpStatusCode, HttpClient, createHttpClient } from '@vspl/core';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET,
    LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET,
    FRONTEND_URL,
} from '../config/config';
import { OAUTH_URLS, AUTH, TOKEN, TIMEOUTS, HTTP_CLIENT } from '../constants/app.constants';

export class AuthService {
    private readonly userService;
    private readonly emailService;
    private readonly httpClient: HttpClient;

    constructor(userService: any, emailService: any) {
        this.userService = userService;
        this.emailService = emailService;

        // Create HTTP client for external API calls
        this.httpClient = createHttpClient({
            baseUrl: '', // Will be overridden per request
            timeout: TIMEOUTS.DEFAULT_HTTP_TIMEOUT_MS,
            retryOptions: {
                maxRetries: HTTP_CLIENT.MAX_RETRIES,
                baseDelay: HTTP_CLIENT.BASE_DELAY_MS,
                exponentialBackoff: HTTP_CLIENT.EXPONENTIAL_BACKOFF,
            },
        });
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
        state?: string,
    ): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        try {
            logger.info(`Starting ${providerType} OAuth authentication`, {
                redirectUri: redirectUri,
                hasCode: !!code,
                hasState: !!state,
            });

            let tokenUrl: string;
            let userInfoUrl: string;
            let clientId: string;
            let clientSecret: string;
            let tokenRequestData: any;

            // Configure based on provider type
            if (providerType === 'google') {
                tokenUrl = OAUTH_URLS.GOOGLE.TOKEN;
                userInfoUrl = OAUTH_URLS.GOOGLE.USER_INFO;
                clientId = GOOGLE_CLIENT_ID || '';
                clientSecret = GOOGLE_CLIENT_SECRET || '';
                tokenRequestData = {
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                };
            } else if (providerType === 'microsoft') {
                tokenUrl = OAUTH_URLS.MICROSOFT.TOKEN;
                userInfoUrl = OAUTH_URLS.MICROSOFT.USER_INFO;
                clientId = MICROSOFT_CLIENT_ID || '';
                clientSecret = MICROSOFT_CLIENT_SECRET || '';
                tokenRequestData = {
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                    scope: 'openid profile email User.Read',
                };
            } else if (providerType === 'linkedin') {
                tokenUrl = OAUTH_URLS.LINKEDIN.TOKEN;
                userInfoUrl = OAUTH_URLS.LINKEDIN.USER_INFO;
                clientId = LINKEDIN_CLIENT_ID || '';
                clientSecret = LINKEDIN_CLIENT_SECRET || '';
                tokenRequestData = {
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                };
            } else {
                throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Invalid OAuth provider');
            }

            if (!clientId || !clientSecret) {
                throw new HttpError(
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                    `${providerType} OAuth credentials not configured`,
                );
            }

            logger.debug(`Getting ${providerType} OAuth token`, { tokenUrl });

            // Exchange code for tokens
            const tokenResponse = await this.httpClient.post(
                tokenUrl,
                providerType === 'google' ? undefined : tokenRequestData,
                {
                    params: providerType === 'google' ? tokenRequestData : undefined,
                    headers: {
                        'Content-Type':
                            providerType === 'google'
                                ? 'application/x-www-form-urlencoded'
                                : 'application/json',
                        Accept: 'application/json',
                    },
                },
            );

            const accessToken = (tokenResponse as any).data.access_token;
            if (!accessToken) {
                throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Failed to get access token');
            }

            logger.debug(`Getting ${providerType} user profile`, { userInfoUrl });

            // Get user profile
            const userInfoResponse = await this.httpClient.get(userInfoUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Extract user data from response
            let email: string;
            let firstName: string | undefined;
            let lastName: string | undefined;
            let displayName: string | undefined;
            let picture: string | undefined;

            if (providerType === 'google') {
                email = (userInfoResponse as any).data.email;
                firstName = (userInfoResponse as any).data.given_name;
                lastName = (userInfoResponse as any).data.family_name;
                displayName = (userInfoResponse as any).data.name;
                picture = (userInfoResponse as any).data.picture;
            } else if (providerType === 'microsoft') {
                email = (userInfoResponse as any).data.mail || (userInfoResponse as any).data.userPrincipalName;
                firstName = (userInfoResponse as any).data.givenName;
                lastName = (userInfoResponse as any).data.surname;
                displayName = (userInfoResponse as any).data.displayName;
            } else if (providerType === 'linkedin') {
                email = (userInfoResponse as any).data.email;
                firstName = (userInfoResponse as any).data.given_name;
                lastName = (userInfoResponse as any).data.family_name;
                displayName = `${firstName} ${lastName}`.trim();
                picture = (userInfoResponse as any).data.picture;
            } else {
                throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Unsupported OAuth provider');
            }

            if (!email) {
                throw new HttpError(
                    HttpStatusCode.BAD_REQUEST,
                    'Failed to get user email from OAuth provider',
                );
            }

            // Find or create user
            let user = await this.userService.getUserByEmail(email);
            
            if (!user) {
                // Create a new user if none exists with this email
                user = await this.userService.createUser({
                    email,
                    first_name: firstName || '',
                    last_name: lastName || '',
                    display_name: displayName,
                    picture_url: picture,
                    status: 'active',
                });
            }

            // Link the OAuth provider to the user
            await authProviderRepository.createAuthProvider({
                user_id: user.id,
                email,
                provider_type: providerType,
                provider_user_id: email, // We use email as ID for simplicity
                access_token: accessToken,
                metadata: {
                    profile_data: (userInfoResponse as any).data,
                },
            });

            // Generate our own access and refresh tokens
            const access_token = await generateAccessToken(user);
            const refresh_token = await generateRefreshToken(user);

            // Save refresh token
            await refreshTokenRepository.createRefreshToken({
                user_id: user.id,
                token: refresh_token,
                expiration_days: 7,

            });

            return { user, access_token, refresh_token };
        } catch (error) {
            logger.error(`Error authenticating with ${providerType}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                redirectUri,
            });
            throw error;
        }
    }

    /**
     * Get OAuth authorization URL
     * @param provider OAuth provider type (google, microsoft)
     * @param redirectUri Redirect URI
     * @param state Optional state parameter
     */
    getOAuthAuthorizationUrl(
        provider: 'google' | 'microsoft' | 'linkedin',
        redirectUri: string,
        state?: string,
    ): string {
        let clientId = '';
        let authUrl = '';
        let scope = '';

        if (provider === 'google') {
            clientId = GOOGLE_CLIENT_ID || '';
            authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
            scope = 'openid profile email';
        } else if (provider === 'microsoft') {
            clientId = MICROSOFT_CLIENT_ID || '';
            authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
            scope = 'openid profile email User.Read';
        } else if (provider === 'linkedin') {
            clientId = LINKEDIN_CLIENT_ID || '';
            authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
            scope = 'openid profile email';
        }

        if (!clientId) {
            throw new HttpError(
                HttpStatusCode.INTERNAL_SERVER_ERROR,
                `${provider} OAuth credentials not configured`,
            );
        }

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scope,
            access_type: 'offline',
            prompt: 'consent',
        });

        if (state) {
            params.append('state', state);
        }

        return `${authUrl}?${params.toString()}`;
    }

    /**
     * Authenticate with Google OAuth
     */
    async authenticateWithGoogle(
        code: string,
        redirectUri: string,
        state?: string,
    ): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        return this.authenticateWithOAuth('google', code, redirectUri, state);
    }

    /**
     * Authenticate with Microsoft OAuth
     */
    async authenticateWithMicrosoft(
        code: string,
        redirectUri: string,
        state?: string,
    ): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        return this.authenticateWithOAuth('microsoft', code, redirectUri, state);
    }

    /**
     * Authenticate with LinkedIn OAuth
     */
    async authenticateWithLinkedIn(
        code: string,
        redirectUri: string,
        state?: string,
    ): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        return this.authenticateWithOAuth('linkedin', code, redirectUri, state);
    }

    /**
     * Send magic link to user's email
     */
    async sendMagicLink(email: string, redirectUri: string): Promise<boolean> {
        try {
            logger.info('Sending magic link to user', { email, redirectUri });

            // Check if user exists
            let user = await this.userService.getUserByEmail(email);

            // Create user if not exists (simplified onboarding)
            if (!user) {
                logger.info('Creating new user for magic link', { email });
                user = await this.userService.createUser({
                    email,
                    status: 'active',
                });
            }

            // Generate magic link token
            const token =
                Math.random().toString(36).substring(2, AUTH.RANDOM_TOKEN_LENGTH) +
                Math.random().toString(36).substring(2, AUTH.RANDOM_TOKEN_LENGTH);

            // Save token
            await magicLinkRepository.createMagicLink({
                email: user.email,
                expiration_minutes: TOKEN.MAGIC_LINK_EXPIRATION_MINUTES,
                metadata: {
                    redirect_uri: redirectUri,
                    token: token,
                }
            });

            // Generate magic link URL
            const magicLinkUrl = `${FRONTEND_URL}/auth/verify?token=${token}`;

            // Send email with magic link
            await this.emailService.sendMagicLinkEmail(email, magicLinkUrl);

            return true;
        } catch (error) {
            logger.error('Error sending magic link', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email,
            });
            throw error;
        }
    }

    /**
     * Verify magic link token
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
            logger.info('Verifying magic link token');

            // Find magic link token
            const magicLink = await magicLinkRepository.getMagicLinkByToken(token);

            // Check if token exists
            if (!magicLink) {
                logger.warn('Magic link token not found', { token });
                return {
                    success: false,
                    message: 'Invalid token',
                };
            }

            // Check if token is expired
            if (magicLink.expires_at < new Date()) {
                logger.warn('Magic link token expired', { token });
                return {
                    success: false,
                    message: 'Token expired',
                };
            }

            // Check if token is already used
            if (magicLink.used) {
                logger.warn('Magic link token already used', { token });
                return {
                    success: false,
                    message: 'Token already used',
                };
            }

            // Get user
            const user = await this.userService.getUserByEmail(magicLink.email);
            if (!user) {
                logger.warn('User not found for magic link token', {
                    token,
                    email: magicLink.email,
                });
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            // Mark token as used
            await magicLinkRepository.markMagicLinkAsUsed(token);

            // Generate access and refresh tokens
            const access_token = await generateAccessToken(user);
            const refresh_token = await generateRefreshToken(user);

            // Save refresh token
            await refreshTokenRepository.createRefreshToken({
                user_id: user.id,
                token: refresh_token,
                expiration_days: 7,

            });

            return {
                success: true,
                tokens: {
                    access_token,
                    refresh_token,
                },
            };
        } catch (error) {
            logger.error('Error verifying magic link', {
                error: error instanceof Error ? error.message : 'Unknown error',
                token,
            });
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string): Promise<{
        success: boolean;
        message?: string;
        access_token?: string;
    }> {
        try {
            logger.info('Refreshing token');

            // Verify refresh token
            let payload: any;
            try {
                payload = await verifyRefreshToken(refreshToken);
            } catch (error) {
                logger.warn('Invalid refresh token', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                return {
                    success: false,
                    message: 'Invalid refresh token',
                };
            }

            // Check if token exists in database
            const tokenRecord = await refreshTokenRepository.getRefreshTokenByToken(refreshToken);
            if (!tokenRecord) {
                logger.warn('Refresh token not found in database');
                return {
                    success: false,
                    message: 'Invalid refresh token',
                };
            }

            // Check if token is expired
            if (tokenRecord.expires_at < new Date()) {
                logger.warn('Refresh token expired');
                return {
                    success: false,
                    message: 'Token expired',
                };
            }

            // Get user
            const user = await this.userService.getUserById(payload.sub);
            if (!user) {
                logger.warn('User not found for refresh token', { userId: payload.sub });
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            // Generate new access token
            const access_token = await generateAccessToken(user);

            return {
                success: true,
                access_token,
            };
        } catch (error) {
            logger.error('Error refreshing token', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Revoke refresh token
     */
    async revokeRefreshToken(refreshToken: string): Promise<boolean> {
        try {
            logger.info('Revoking refresh token');
            const result = await refreshTokenRepository.revokeRefreshToken(refreshToken);
            return result !== null;
        } catch (error) {
            logger.error('Error revoking refresh token', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Revoke all refresh tokens for a user
     */
    async revokeAllUserTokens(userId: string): Promise<boolean> {
        try {
            logger.info('Revoking all refresh tokens for user', { userId });
            const count = await refreshTokenRepository.revokeAllUserRefreshTokens(userId);
            return count > 0;
        } catch (error) {
            logger.error('Error revoking all user refresh tokens', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
            });
            throw error;
        }
    }
}
