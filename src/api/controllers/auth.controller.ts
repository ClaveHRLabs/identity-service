import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service';
import { logger } from '../../utils/logger';
import { Config } from '../../config/config';

export class AuthController {
    private readonly authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * Initiate Google OAuth flow by generating the authorization URL
     */
    async initiateGoogleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { redirect_uri, state_data } = req.query;

            // Create state parameter (base64 encoded JSON or random string)
            let stateParam: string;

            if (state_data) {
                // If state data is provided, encode it as base64
                stateParam = Buffer.from(JSON.stringify(state_data)).toString('base64');
            } else {
                // Otherwise generate a random state parameter
                stateParam = Buffer.from(Math.random().toString(36).substring(2)).toString('base64');
            }

            const authUrl = this.authService.getOAuthAuthorizationUrl(
                'google',
                redirect_uri as string,
                stateParam
            );

            res.status(200).json({
                success: true,
                data: {
                    authorization_url: authUrl,
                    state: stateParam
                }
            });
        } catch (error) {
            logger.error('Error initiating Google authentication', { error });
            next(error);
        }
    }

    /**
     * Initiate Microsoft OAuth flow by generating the authorization URL
     */
    async initiateMicrosoftAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { redirect_uri, state_data } = req.query;

            // Create state parameter (base64 encoded JSON or random string)
            let stateParam: string;

            if (state_data) {
                // If state data is provided, encode it as base64
                stateParam = Buffer.from(JSON.stringify(state_data)).toString('base64');
            } else {
                // Otherwise generate a random state parameter
                stateParam = Buffer.from(Math.random().toString(36).substring(2)).toString('base64');
            }

            const authUrl = this.authService.getOAuthAuthorizationUrl(
                'microsoft',
                redirect_uri as string,
                stateParam
            );

            res.status(200).json({
                success: true,
                data: {
                    authorization_url: authUrl,
                    state: stateParam
                }
            });
        } catch (error) {
            logger.error('Error initiating Microsoft authentication', { error });
            next(error);
        }
    }

    /**
     * Authenticate with Google OAuth
     */
    async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { code, redirect_uri, state } = req.body;
            const result = await this.authService.authenticateWithGoogle(code, redirect_uri, state);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Google authentication error', { error });
            next(error);
        }
    }

    /**
     * Authenticate with Microsoft OAuth
     */
    async microsoftAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { code, redirect_uri, state } = req.body;
            const result = await this.authService.authenticateWithMicrosoft(code, redirect_uri, state);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Microsoft authentication error', { error });
            next(error);
        }
    }

    /**
     * Send a magic link to the user's email
     */
    async sendMagicLink(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, redirect_uri } = req.body;
            await this.authService.sendMagicLink(email, redirect_uri);

            res.status(200).json({
                success: true,
                message: 'Magic link sent to email'
            });
        } catch (error) {
            logger.error('Error sending magic link', { error });
            next(error);
        }
    }

    /**
     * Verify a magic link token and authenticate the user
     */
    async verifyMagicLink(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token } = req.body;
            const result = await this.authService.verifyMagicLink(token);

            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: result.message || 'Invalid magic link'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result.tokens
            });
        } catch (error) {
            logger.error('Error verifying magic link', { error });
            next(error);
        }
    }

    /**
     * Refresh the access token using a refresh token
     */
    async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refresh_token } = req.body;
            const result = await this.authService.refreshToken(refresh_token);

            if (!result.success) {
                res.status(401).json({
                    success: false,
                    message: result.message || 'Invalid refresh token'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    access_token: result.access_token
                }
            });
        } catch (error) {
            logger.error('Error refreshing token', { error });
            next(error);
        }
    }

    /**
     * Logout the user by revoking their refresh token
     */
    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refresh_token } = req.body;

            if (refresh_token) {
                // If a specific token is provided, revoke just that one
                await this.authService.revokeRefreshToken(refresh_token);
            } else if (req.userId) {
                // If no token is provided but the user is authenticated, revoke all their tokens
                await this.authService.revokeAllUserTokens(req.userId);
            }

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            logger.error('Error logging out', { error });
            next(error);
        }
    }

    /**
     * Initiate LinkedIn OAuth flow by generating the authorization URL
     */
    async initiateLinkedInAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { redirect_uri, state_data } = req.query;

            // Create state parameter (base64 encoded JSON or random string)
            let stateParam: string;

            if (state_data) {
                // If state data is provided, encode it as base64
                stateParam = Buffer.from(JSON.stringify(state_data)).toString('base64');
            } else {
                // Otherwise generate a random state parameter
                stateParam = Buffer.from(Math.random().toString(36).substring(2)).toString('base64');
            }

            const authUrl = this.authService.getOAuthAuthorizationUrl(
                'linkedin',
                redirect_uri as string,
                stateParam
            );

            res.status(200).json({
                success: true,
                data: {
                    authorization_url: authUrl,
                    state: stateParam
                }
            });
        } catch (error) {
            logger.error('Error initiating LinkedIn authentication', { error });
            next(error);
        }
    }

    /**
     * Authenticate with LinkedIn OAuth
     */
    async linkedInAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { code, redirect_uri, state } = req.body;

            // Validate required parameters
            if (!code) {
                logger.error('LinkedIn authentication failed: missing code parameter');
                res.status(400).json({
                    success: false,
                    message: 'Authorization code is required'
                });
                return;
            }

            if (!redirect_uri) {
                logger.error('LinkedIn authentication failed: missing redirect_uri parameter');
                res.status(400).json({
                    success: false,
                    message: 'Redirect URI is required'
                });
                return;
            }

            logger.info('Processing LinkedIn authentication', {
                hasCode: !!code,
                redirect_uri,
                hasState: !!state
            });

            const result = await this.authService.authenticateWithLinkedIn(code, redirect_uri, state);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('LinkedIn authentication error', { error });
            next(error);
        }
    }

    /**
     * Debug endpoint for LinkedIn configuration (only available in development)
     */
    async debugLinkedInConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Only allow this in development environment
            if (Config.NODE_ENV !== 'development') {
                res.status(404).json({
                    success: false,
                    message: 'Not found'
                });
                return;
            }

            // Check if LinkedIn is properly configured
            const config = {
                clientIdConfigured: !!Config.LINKEDIN_CLIENT_ID,
                clientSecretConfigured: !!Config.LINKEDIN_CLIENT_SECRET,
                nodeEnv: Config.NODE_ENV,
                frontendUrl: Config.FRONTEND_URL
            };

            res.status(200).json({
                success: true,
                message: 'LinkedIn configuration debug information',
                data: config
            });
        } catch (error) {
            logger.error('Error in LinkedIn configuration debug endpoint', { error });
            next(error);
        }
    }
} 