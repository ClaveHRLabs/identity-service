import { logger } from '../utils/logger';
import { Config } from '../config/config';
import { notificationClient } from '../utils/notification-client';

// Note: In a real application, you would use a proper email service like
// nodemailer, SendGrid, AWS SES, etc. This is a simplified version for development.

export class EmailService {
    constructor() {
        // notificationClient is already a singleton instance
    }

    /**
     * Send a magic link email for authentication
     */
    async sendMagicLinkEmail(
        email: string,
        verificationUrl: string,
        name: string = 'User',
        organizationId: string = '',
        organizationName: string = 'Clave HR',
    ): Promise<void> {
        // In development mode, just log the magic link URL
        if (Config.IS_DEVELOPMENT) {
            logger.info(`[DEV MODE] Magic link for ${email}: ${verificationUrl}`);
            // Even in development, also try to send the actual notification
        }

        try {
            // Send the login link notification using the notification service
            await notificationClient().post('/send-login-link', {
                email,
                name,
                verificationUrl,
                organizationId,
                organizationName,
            });

            logger.info(`Sent magic link email to ${email} using notification service`);
        } catch (error) {
            logger.error('Error sending magic link email through notification service', {
                error,
                email,
            });

            // Fallback to logging for development if notification service fails
            if (Config.IS_DEVELOPMENT) {
                logger.info(`[DEV FALLBACK] Magic link for ${email}: ${verificationUrl}`);
                return;
            }

            throw new Error('Failed to send magic link email');
        }
    }

    /**
     * Send a welcome email to a new user
     */
    async sendWelcomeEmail(email: string): Promise<void> {
        // In development mode, just log the welcome email
        if (Config.IS_DEVELOPMENT) {
            logger.info(`[DEV MODE] Welcome email for ${email}`);
            return;
        }

        try {
            // In a real application, here you would send an actual welcome email
            logger.info(`Sent welcome email to ${email}`);
        } catch (error) {
            logger.error('Error sending welcome email', { error, email });
            // Don't throw an error here, as this is a non-critical operation
        }
    }
}
