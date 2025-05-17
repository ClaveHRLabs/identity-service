import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service';
import { logger } from '../../utils/logger';

export class AuthController {
    private readonly authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * Authenticate with Google OAuth
     */
    async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { code, redirect_uri } = req.body;
            const result = await this.authService.authenticateWithGoogle(code, redirect_uri);

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
            const { code, redirect_uri } = req.body;
            const result = await this.authService.authenticateWithMicrosoft(code, redirect_uri);

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
} 