import { logger, Measure } from '@vspl/core';
import { IdentityConfig } from '../config/config';
import { notificationClient } from '../utils/notification-client';

// Note: In a real application, you would use a proper email service like
// nodemailer, SendGrid, AWS SES, etc. This is a simplified version for development.

export class EmailService {
    constructor(private readonly config: IdentityConfig) {}

    /**
     * Send a magic link email for authentication
     */

    @Measure()
    async sendMagicLinkEmail(
        email: string,
        verificationUrl: string,
        name: string = 'User',
        organizationId: string = '',
        organizationName: string = 'Clave HR',
    ): Promise<void> {
        logger.info(`Magic link for ${email}: ${verificationUrl}`);

        notificationClient().post(`/api/notifications`, {
            type: 'EMAIL',
            templateId: 'c6f79ba8-d139-4be7-bd2a-7d60d5db51ff',
            recipientType: 'USER',
            recipientDetails: {
                email,
            },
            name,
            verificationUrl,
            organizationId,
            organizationName,
            priority: 1,
            scheduledAt: new Date(),
            payload: {
                LOGIN_LINK: verificationUrl,
                LOGIN_LINK_TEXT: 'Login to your account',
                ORGANIZATION: organizationName,
                CURRENT_YEAR: new Date().getFullYear(),
            },
        });
    }

    /**
     * Send a welcome email to a new user
     */
    async sendWelcomeEmail(email: string): Promise<void> {
        // In development mode, just log the welcome email
        if (this.config.IS_DEVELOPMENT) {
            logger.info(`[DEV MODE] Welcome email for ${email}`);
            return;
        }

        // In a real application, here you would send an actual welcome email
        logger.info(`Sent welcome email to ${email}`);
    }
}
