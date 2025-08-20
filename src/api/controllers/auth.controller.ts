import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import { CatchErrors, Measure, HttpStatusCode } from '@vspl/core';
import logger from '../../utils/logger';
import { Config } from '../../config/config';
import { AUTH } from '../../constants/app.constants';

export class AuthController {
    private readonly authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * Initiate Google OAuth flow by generating the authorization URL
     */
    @CatchErrors()
    async initiateGoogleAuth(req: Request, res: Response): Promise<void> {
        const { redirect_uri, state_data } = req.query;

        // Create state parameter (base64 encoded JSON or random string)
        let stateParam: string;

        if (state_data) {
            // If state data is provided, encode it as base64
            stateParam = Buffer.from(JSON.stringify(state_data)).toString('base64');
        } else {
            // Otherwise generate a random state parameter
            stateParam = Buffer.from(Math.random().toString(36).substring(AUTH.STATE_PARAM_LENGTH)).toString('base64');
        }

        const authUrl = this.authService.getOAuthAuthorizationUrl(
            'google',
            redirect_uri as string,
            stateParam,
        );

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: {
                authorization_url: authUrl,
                state: stateParam,
            },
        });
    }

    /**
     * Initiate Microsoft OAuth flow by generating the authorization URL
     */
    @CatchErrors()
    async initiateMicrosoftAuth(req: Request, res: Response): Promise<void> {
        const { redirect_uri, state_data } = req.query;

        // Create state parameter (base64 encoded JSON or random string)
        let stateParam: string;

        if (state_data) {
            // If state data is provided, encode it as base64
            stateParam = Buffer.from(JSON.stringify(state_data)).toString('base64');
        } else {
            // Otherwise generate a random state parameter
            stateParam = Buffer.from(Math.random().toString(36).substring(AUTH.STATE_PARAM_LENGTH)).toString('base64');
        }

        const authUrl = this.authService.getOAuthAuthorizationUrl(
            'microsoft',
            redirect_uri as string,
            stateParam,
        );

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: {
                authorization_url: authUrl,
                state: stateParam,
            },
        });
    }

    /**
     * Authenticate with Google OAuth
     */
    @CatchErrors()
    @Measure()
    async googleAuth(req: Request, res: Response): Promise<void> {
        const { code, redirect_uri, state } = req.body;
        const result = await this.authService.authenticateWithGoogle(code, redirect_uri, state);

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: result,
        });
    }

    /**
     * Authenticate with Microsoft OAuth
     */
    @CatchErrors()
    @Measure()
    async microsoftAuth(req: Request, res: Response): Promise<void> {
        const { code, redirect_uri, state } = req.body;
        const result = await this.authService.authenticateWithMicrosoft(code, redirect_uri, state);

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: result,
        });
    }

    /**
     * Send a magic link to the user's email
     */
    @CatchErrors()
    @Measure()
    async sendMagicLink(req: Request, res: Response): Promise<void> {
        const { email, redirect_uri } = req.body;
        await this.authService.sendMagicLink(email, redirect_uri);

        res.status(HttpStatusCode.OK).json({
            success: true,
            message: 'Magic link sent to email',
        });
    }

    /**
     * Verify a magic link token and authenticate the user
     */
    @CatchErrors()
    @Measure()
    async verifyMagicLink(req: Request, res: Response): Promise<void> {
        const { token } = req.body;
        const result = await this.authService.verifyMagicLink(token);

        if (!result.success) {
            res.status(HttpStatusCode.BAD_REQUEST).json({
                success: false,
                message: result.message || 'Invalid magic link',
                error: {
                    code: 'INVALID_MAGIC_LINK',
                    message: result.message || 'Invalid magic link',
                },
                data: null,
            });
            return;
        }

        res.status(HttpStatusCode.OK).json({
            success: true,
            message: 'Magic link verified successfully',
            error: null,
            data: {
                tokens: result.tokens,
            },
        });
    }

    /**
     * Refresh the access token using a refresh token
     */
    @CatchErrors()
    @Measure()
    async refreshToken(req: Request, res: Response): Promise<void> {
        const { refresh_token } = req.body;
        const result = await this.authService.refreshToken(refresh_token);

        if (!result.success) {
            res.status(HttpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: result.message || 'Invalid refresh token',
            });
            return;
        }

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: {
                access_token: result.access_token,
            },
        });
    }

    /**
     * Logout the user by revoking their refresh token
     */
    @CatchErrors()
    @Measure()
    async logout(req: Request, res: Response): Promise<void> {
        const { refresh_token } = req.body;

        if (refresh_token) {
            // If a specific token is provided, revoke just that one
            await this.authService.revokeRefreshToken(refresh_token);
        } else if (req.userId) {
            // If no token is provided but the user is authenticated, revoke all their tokens
            await this.authService.revokeAllUserTokens(req.userId);
        }

        res.status(HttpStatusCode.OK).json({
            success: true,
            message: 'Logged out successfully',
        });
    }

    /**
     * Initiate LinkedIn OAuth flow by generating the authorization URL
     */
    @CatchErrors()
    async initiateLinkedInAuth(req: Request, res: Response): Promise<void> {
        const { redirect_uri, state_data } = req.query;

        // Create state parameter (base64 encoded JSON or random string)
        let stateParam: string;

        if (state_data) {
            // If state data is provided, encode it as base64
            stateParam = Buffer.from(JSON.stringify(state_data)).toString('base64');
        } else {
            // Otherwise generate a random state parameter
            stateParam = Buffer.from(Math.random().toString(36).substring(AUTH.STATE_PARAM_LENGTH)).toString('base64');
        }

        const authUrl = this.authService.getOAuthAuthorizationUrl(
            'linkedin',
            redirect_uri as string,
            stateParam,
        );

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: {
                authorization_url: authUrl,
                state: stateParam,
            },
        });
    }

    /**
     * Authenticate with LinkedIn OAuth
     */
    @CatchErrors()
    @Measure()
    async linkedInAuth(req: Request, res: Response): Promise<void> {
        const { code, redirect_uri, state } = req.body;

        // Validate required parameters
        if (!code) {
            logger.error('LinkedIn authentication failed: missing code parameter');
            res.status(HttpStatusCode.BAD_REQUEST).json({
                success: false,
                message: 'Authorization code is required',
            });
            return;
        }

        if (!redirect_uri) {
            logger.error('LinkedIn authentication failed: missing redirect_uri parameter');
            res.status(HttpStatusCode.BAD_REQUEST).json({
                success: false,
                message: 'Redirect URI is required',
            });
            return;
        }

        logger.info('Processing LinkedIn authentication', {
            hasCode: !!code,
            redirect_uri,
            hasState: !!state,
        });

        const result = await this.authService.authenticateWithLinkedIn(code, redirect_uri, state);

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: result,
        });
    }

    /**
     * Debug endpoint for LinkedIn configuration (only available in development)
     */
    @CatchErrors()
    async debugLinkedInConfig(req: Request, res: Response): Promise<void> {
        // Only allow this in development environment
        if (!Config.IS_DEVELOPMENT) {
            res.status(HttpStatusCode.NOT_FOUND).json({
                success: false,
                message: 'Not found',
            });
            return;
        }

        // Check if LinkedIn is properly configured
        const configInfo = {
            clientIdConfigured: !!Config.LINKEDIN_CLIENT_ID,
            clientSecretConfigured: !!Config.LINKEDIN_CLIENT_SECRET,
            nodeEnv: Config.NODE_ENV,
            frontendUrl: Config.FRONTEND_URL,
        };

        res.status(HttpStatusCode.OK).json({
            success: true,
            message: 'LinkedIn configuration debug information',
            data: configInfo,
        });
    }
}
