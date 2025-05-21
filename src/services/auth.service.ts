import { logger } from '../utils/logger';
import * as authProviderRepository from '../db/auth-provider';
import * as magicLinkRepository from '../db/magic-link';
import * as refreshTokenRepository from '../db/refresh-token';
import { User } from '../models/schemas/user';
import { AppError } from '../api/middlewares/error-handler';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
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
            logger.info(`Starting ${providerType} OAuth authentication`, {
                redirectUri: redirectUri,
                hasCode: !!code,
                hasState: !!state
            });

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
                logger.info('Setting up LinkedIn authentication parameters');
                tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
                userInfoUrl = 'https://api.linkedin.com/v2/me';
                clientId = Config.LINKEDIN_CLIENT_ID;
                clientSecret = Config.LINKEDIN_CLIENT_SECRET;

                // Check if we have the required configuration
                if (!clientId || !clientSecret) {
                    logger.error('LinkedIn OAuth configuration missing', {
                        hasClientId: !!clientId,
                        hasClientSecret: !!clientSecret
                    });
                    throw new Error('LinkedIn OAuth configuration missing');
                }

                // Create the form data for token request
                const formData = new URLSearchParams();
                formData.append('grant_type', 'authorization_code');
                formData.append('code', code);
                formData.append('client_id', clientId);
                formData.append('client_secret', clientSecret);
                formData.append('redirect_uri', redirectUri);

                tokenRequestData = formData.toString();
                tokenRequestConfig = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                };

                logger.info('LinkedIn token request data prepared', {
                    tokenUrl,
                    userInfoUrl,
                    requestDataLength: tokenRequestData.length
                });
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
            logger.info(`Making token request to ${tokenUrl}`);
            let tokenResponse;
            try {
                tokenResponse = await axios.post(tokenUrl, tokenRequestData, tokenRequestConfig);
                logger.info(`Token request successful for ${providerType}`);

                // Log the entire token response for LinkedIn to help debug
                if (providerType === 'linkedin') {
                    logger.info('LinkedIn token response:', {
                        data: JSON.stringify(tokenResponse.data),
                        status: tokenResponse.status
                    });
                }
            } catch (tokenError: any) {
                logger.error(`Token request failed for ${providerType}`, {
                    error: tokenError.message,
                    status: tokenError.response?.status,
                    data: tokenError.response?.data
                });
                throw new Error(`Failed to exchange code for tokens: ${tokenError.message}`);
            }

            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            if (!access_token) {
                logger.error(`No access token received from ${providerType}`, { responseData: tokenResponse.data });
                throw new Error(`No access token received from ${providerType}`);
            }

            // Get user info from provider
            logger.info(`Fetching user info from ${userInfoUrl}`);
            let userInfoResponse;
            try {
                userInfoResponse = await axios.get(userInfoUrl, {
                    headers: { Authorization: `Bearer ${access_token}` }
                });
                logger.info(`User info request successful for ${providerType}`);
            } catch (userInfoError: any) {
                logger.error(`User info request failed for ${providerType}`, {
                    error: userInfoError.message,
                    status: userInfoError.response?.status,
                    data: userInfoError.response?.data
                });
                throw new Error(`Failed to fetch user info: ${userInfoError.message}`);
            }

            const oauthUser = userInfoResponse.data;
            logger.info(`Received user data from ${providerType}`, {
                hasEmail: !!oauthUser.email,
                responseFields: Object.keys(oauthUser),
                userData: providerType === 'linkedin' ? JSON.stringify(oauthUser) : undefined
            });

            // For LinkedIn, we need to make an additional call to get the email address
            let linkedinEmail;
            if (providerType === 'linkedin') {
                try {
                    logger.info('Making additional request for LinkedIn email');
                    const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
                        headers: { Authorization: `Bearer ${access_token}` }
                    });

                    logger.info('LinkedIn email response received', {
                        data: JSON.stringify(emailResponse.data)
                    });

                    // Extract email from LinkedIn's email endpoint response
                    if (emailResponse.data &&
                        emailResponse.data.elements &&
                        emailResponse.data.elements.length > 0 &&
                        emailResponse.data.elements[0]['handle~'] &&
                        emailResponse.data.elements[0]['handle~'].emailAddress) {
                        linkedinEmail = emailResponse.data.elements[0]['handle~'].emailAddress;
                        logger.info(`LinkedIn email extracted: ${linkedinEmail}`);
                    }
                } catch (emailError: any) {
                    logger.error('Failed to retrieve LinkedIn email', {
                        error: emailError.message,
                        status: emailError.response?.status,
                        data: emailError.response?.data
                    });
                    // Continue without email - we'll try to extract it later or throw an error
                }
            }

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
                // LinkedIn API v2 with r_liteprofile and r_emailaddress scopes
                email = linkedinEmail; // Use email from separate request

                // Extract profile data from LinkedIn API v2 format
                firstName = oauthUser.localizedFirstName || oauthUser.firstName;
                lastName = oauthUser.localizedLastName || oauthUser.lastName;
                displayName = (firstName && lastName) ? `${firstName} ${lastName}` : undefined;
                providerUserId = oauthUser.id;
                verified = true; // LinkedIn accounts are considered verified

                // LinkedIn doesn't directly return avatar URL in the basic profile

                // If we still don't have an email, try various fields from the profile response
                if (!email && oauthUser.emailAddress) {
                    email = oauthUser.emailAddress;
                }

                // As a last resort, try other fields
                if (!email && oauthUser.email) {
                    email = oauthUser.email;
                }

                if (!email) {
                    logger.error('No email found in LinkedIn profile', {
                        profile: JSON.stringify(oauthUser),
                        hasEmailResponse: !!linkedinEmail
                    });
                    throw new Error('LinkedIn profile is missing email address');
                }

                metadata = {
                    display_name: displayName,
                    provider_id: providerUserId,
                    profile_data: JSON.stringify(oauthUser)
                };

                logger.info('Extracted LinkedIn user info', {
                    email,
                    firstName,
                    lastName,
                    displayName,
                    id: providerUserId
                });
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
            logger.info(`Looking up user by email: ${email}`);
            let user = await this.userService.getUserByEmail(email);

            // Create a new user if not exists
            if (!user) {
                logger.info(`Creating new user with email: ${email}`);
                user = await this.userService.createUser({
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    display_name: displayName,
                    avatar_url: avatarUrl,
                    email_verified: verified
                });
            } else {
                logger.info(`Found existing user with email: ${email}`);
            }

            // Save or update auth provider
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

            const authProvider = await authProviderRepository.getAuthProviderByEmailAndType(email, providerType);

            if (authProvider) {
                // Update tokens
                logger.info(`Updating existing ${providerType} auth provider for user`);
                await authProviderRepository.updateAuthProviderTokens(
                    authProvider.id,
                    access_token,
                    refresh_token,
                    expiresAt
                );
            } else {
                // Create new auth provider
                logger.info(`Creating new ${providerType} auth provider for user`);
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
            logger.info('Generating JWT tokens for user');
            const [jwt_access_token, jwt_refresh_token] = await Promise.all([
                generateAccessToken(user, stateData),
                generateRefreshToken(user)
            ]);

            // Save refresh token to database - include the actual JWT token
            logger.info('Saving refresh token to database');
            const dbRefreshToken = await refreshTokenRepository.createRefreshToken({
                user_id: user.id,
                token: jwt_refresh_token, // Store the JWT refresh token hash
                expiration_days: 7, // Default expiration
                device_info: {
                    source: `${providerType}_oauth`,
                    state: stateData
                }
            });

            logger.info(`${providerType} authentication successful for user: ${email}`);
            return {
                user,
                access_token: jwt_access_token,
                refresh_token: jwt_refresh_token
            };
        } catch (error: any) {
            logger.error(`${providerType} authentication error`, {
                error: error.message,
                stack: error.stack
            });
            throw new AppError(`Failed to authenticate with ${providerType}: ${error.message}`, 500, 'AUTH_ERROR');
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
                scope: 'r_liteprofile r_emailaddress',
            });

            if (state) params.append('state', state);

            logger.info('Generated LinkedIn OAuth URL', {
                url,
                redirectUri,
                scopes: 'r_liteprofile r_emailaddress'
            });

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
                token: refresh_token, // Store the JWT refresh token hash
                expiration_days: 7, // Default expiration
                device_info: { source: 'magic_link' }
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
            logger.info('Processing refresh token request');

            // First verify the JWT token validity and extract the payload
            let payload;
            try {
                payload = await verifyRefreshToken(refreshToken);

                // Ensure this is a refresh token
                if (payload.type !== 'refresh') {
                    logger.warn('Invalid token type for refresh', { type: payload.type });
                    return {
                        success: false,
                        message: 'Invalid token type'
                    };
                }

                // Extract user ID from the JWT payload
                const userId = payload.sub;
                logger.info('JWT refresh token verified', { userId });

                // Next, check if this token exists in our database for verification
                const dbValidation = await refreshTokenRepository.validateRefreshToken(refreshToken);

                if (!dbValidation.valid) {
                    logger.warn('Refresh token not found in database or invalid', {
                        message: dbValidation.message
                    });
                    return {
                        success: false,
                        message: dbValidation.message || 'Refresh token revoked or expired in database'
                    };
                }

                // Get the user from the ID in the JWT
                const user = await this.userService.getUserById(userId);

                if (!user) {
                    logger.warn('User not found for refresh token', { userId });
                    return {
                        success: false,
                        message: 'User not found'
                    };
                }

                // Generate only a new access token, not a new refresh token
                const accessToken = await generateAccessToken(user);

                logger.info('Access token refreshed successfully', { userId });

                return {
                    success: true,
                    access_token: accessToken
                };
            } catch (jwtError) {
                logger.error('Failed to verify JWT refresh token', { error: jwtError });
                return {
                    success: false,
                    message: 'Invalid refresh token signature or format'
                };
            }
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