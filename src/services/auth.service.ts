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
     * Authenticate with Google OAuth
     */
    async authenticateWithGoogle(code: string, redirectUri: string): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        try {
            // Exchange code for tokens
            const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: Config.GOOGLE_CLIENT_ID,
                client_secret: Config.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            });

            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            // Get user info from Google
            const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const googleUser = userInfoResponse.data;
            const email = googleUser.email;

            // Check if this email is already registered
            let user = await this.userService.getUserByEmail(email);

            // Create a new user
            user ??= await this.userService.createUser({
                    email,
                    first_name: googleUser.given_name,
                    last_name: googleUser.family_name,
                    display_name: googleUser.name,
                    avatar_url: googleUser.picture,
                    email_verified: googleUser.email_verified
                });

            // Save or update auth provider
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

            const authProvider = await authProviderRepository.getAuthProviderByEmailAndType(email, 'google');

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
                    provider_type: 'google',
                    provider_user_id: googleUser.sub,
                    email,
                    access_token,
                    refresh_token,
                    token_expires_at: expiresAt,
                    metadata: {
                        name: googleUser.name,
                        picture: googleUser.picture,
                        locale: googleUser.locale
                    }
                });
            }

            // Update last login time
            await this.userService.updateLastLogin(user.id);

            // Generate JWT tokens
            const jwt_access_token = generateAccessToken(user);
            const jwt_refresh_token = generateRefreshToken(user);

            // Save refresh token to database
            await refreshTokenRepository.createRefreshToken({
                user_id: user.id,
                device_info: { source: 'google_oauth' }
            });

            return {
                user,
                access_token: jwt_access_token,
                refresh_token: jwt_refresh_token
            };
        } catch (error) {
            logger.error('Google authentication error', { error });
            throw new AppError('Failed to authenticate with Google', 500, 'AUTH_ERROR');
        }
    }

    /**
     * Authenticate with Microsoft OAuth
     */
    async authenticateWithMicrosoft(code: string, redirectUri: string): Promise<{
        user: User;
        access_token: string;
        refresh_token: string;
    }> {
        try {
            // Exchange code for tokens
            const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token',
                new URLSearchParams({
                    code,
                    client_id: Config.MICROSOFT_CLIENT_ID,
                    client_secret: Config.MICROSOFT_CLIENT_SECRET,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code'
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            // Get user info from Microsoft Graph API
            const userInfoResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const microsoftUser = userInfoResponse.data;
            const email = microsoftUser.mail || microsoftUser.userPrincipalName;

            // Check if this email is already registered
            let user = await this.userService.getUserByEmail(email);

            if (!user) {
                // Create a new user
                user = await this.userService.createUser({
                    email,
                    first_name: microsoftUser.givenName,
                    last_name: microsoftUser.surname,
                    display_name: microsoftUser.displayName,
                    email_verified: true // Microsoft accounts are considered verified
                });
            }

            // Save or update auth provider
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

            const authProvider = await authProviderRepository.getAuthProviderByEmailAndType(email, 'microsoft');

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
                    provider_type: 'microsoft',
                    provider_user_id: microsoftUser.id,
                    email,
                    access_token,
                    refresh_token,
                    token_expires_at: expiresAt,
                    metadata: {
                        display_name: microsoftUser.displayName,
                        job_title: microsoftUser.jobTitle,
                        office_location: microsoftUser.officeLocation
                    }
                });
            }

            // Update last login time
            await this.userService.updateLastLogin(user.id);

            // Generate JWT tokens
            const jwt_access_token = generateAccessToken(user);
            const jwt_refresh_token = generateRefreshToken(user);

            // Save refresh token to database
            await refreshTokenRepository.createRefreshToken({
                user_id: user.id,
                device_info: { source: 'microsoft_oauth' }
            });

            return {
                user,
                access_token: jwt_access_token,
                refresh_token: jwt_refresh_token
            };
        } catch (error) {
            logger.error('Microsoft authentication error', { error });
            throw new AppError('Failed to authenticate with Microsoft', 500, 'AUTH_ERROR');
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
            const access_token = generateAccessToken(user);
            const refresh_token = generateRefreshToken(user);

            // Save refresh token to database
            await refreshTokenRepository.createRefreshToken({
                user_id: user.id,
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
            const access_token = generateAccessToken(user);

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