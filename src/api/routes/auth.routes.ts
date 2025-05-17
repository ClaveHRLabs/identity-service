import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate } from '../middlewares/authenticate';
import {
    GoogleAuthValidator,
    MicrosoftAuthValidator,
    SendMagicLinkValidator,
    VerifyMagicLinkValidator,
    RefreshTokenValidator,
    LogoutValidator
} from '../validators/user.validator';

export const createAuthRoutes = (authController: AuthController) => {
    const router = Router();

    // Google OAuth authentication
    router.post(
        '/google',
        validateRequest(GoogleAuthValidator),
        authController.googleAuth.bind(authController)
    );

    // Microsoft OAuth authentication
    router.post(
        '/microsoft',
        validateRequest(MicrosoftAuthValidator),
        authController.microsoftAuth.bind(authController)
    );

    // Send magic link for email authentication
    router.post(
        '/magic-link',
        validateRequest(SendMagicLinkValidator),
        authController.sendMagicLink.bind(authController)
    );

    // Verify magic link token
    router.post(
        '/verify-magic-link',
        validateRequest(VerifyMagicLinkValidator),
        authController.verifyMagicLink.bind(authController)
    );

    // Refresh access token
    router.post(
        '/refresh-token',
        validateRequest(RefreshTokenValidator),
        authController.refreshToken.bind(authController)
    );

    // Logout (revoke refresh token)
    router.post(
        '/logout',
        authenticate, // Optional - if not authenticated, uses token from body
        validateRequest(LogoutValidator),
        authController.logout.bind(authController)
    );

    return router;
}; 