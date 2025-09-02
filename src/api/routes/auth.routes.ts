import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate } from '../middlewares/auth';
import {
    GoogleAuthValidator,
    MicrosoftAuthValidator,
    LinkedInAuthValidator,
    SendMagicLinkValidator,
    VerifyMagicLinkValidator,
    RefreshTokenValidator,
    LogoutValidator,
    InitiateOAuthValidator,
} from '../validators/user.validator';

export const createAuthRoutes = (authController: AuthController) => {
    const router = Router();

    // Initialize OAuth flow routes
    router.get(
        '/google/authorize',
        validateRequest(InitiateOAuthValidator),
        authController.initiateGoogleAuth.bind(authController),
    );

    router.get(
        '/microsoft/authorize',
        validateRequest(InitiateOAuthValidator),
        authController.initiateMicrosoftAuth.bind(authController),
    );

    router.get(
        '/linkedin/authorize',
        validateRequest(InitiateOAuthValidator),
        authController.initiateLinkedInAuth.bind(authController),
    );

    // Google OAuth authentication
    router.post(
        '/google',
        validateRequest(GoogleAuthValidator),
        authController.googleAuth.bind(authController),
    );

    // Microsoft OAuth authentication
    router.post(
        '/microsoft',
        validateRequest(MicrosoftAuthValidator),
        authController.microsoftAuth.bind(authController),
    );

    // LinkedIn OAuth authentication
    router.post(
        '/linkedin',
        validateRequest(LinkedInAuthValidator),
        authController.linkedInAuth.bind(authController),
    );

    // LinkedIn debug config endpoint (development only)
    router.get('/linkedin/debug-config', authController.debugLinkedInConfig.bind(authController));

    // Send magic link for email authentication
    router.post(
        '/magic-link',
        validateRequest(SendMagicLinkValidator),
        authController.sendMagicLink.bind(authController),
    );

    // Verify magic link token
    router.post(
        '/verify-magic-link',
        validateRequest(VerifyMagicLinkValidator),
        authController.verifyMagicLink.bind(authController),
    );

    // Refresh access token
    router.post(
        '/refresh-token',
        validateRequest(RefreshTokenValidator),
        authController.refreshToken.bind(authController),
    );

    // Logout (revoke refresh token)
    router.post(
        '/logout',
        authenticate, // Optional - if not authenticated, uses token from body
        validateRequest(LogoutValidator),
        authController.logout.bind(authController),
    );

    return router;
};
