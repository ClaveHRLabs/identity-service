import { logger } from '../utils/logger';
import { Config } from '../config/config';
// Note: In a real application, you would use a proper email service like
// nodemailer, SendGrid, AWS SES, etc. This is a simplified version for development.

export class EmailService {
    /**
     * Send a magic link email for authentication
     */
    async sendMagicLinkEmail(email: string, verificationUrl: string): Promise<void> {
        // In development mode, just log the magic link URL
        if (Config.IS_DEVELOPMENT) {
            logger.info(`[DEV MODE] Magic link for ${email}: ${verificationUrl}`);
            return;
        }

        try {
            // In a real application, here you would use an email service
            // to send the actual email with the magic link
            logger.info(`Sent magic link email to ${email}`);

            // This is where you would implement actual email sending logic
            // Example with nodemailer (commented out):
            /*
            const transporter = nodemailer.createTransport({
                host: Config.EMAIL_HOST,
                port: Config.EMAIL_PORT,
                secure: Config.EMAIL_SECURE,
                auth: {
                    user: Config.EMAIL_USER,
                    pass: Config.EMAIL_PASSWORD
                }
            });

            await transporter.sendMail({
                from: Config.EMAIL_FROM,
                to: email,
                subject: "Your ClaveHR Login Link",
                text: `Click the link to sign in: ${verificationUrl}`,
                html: `<p>Click the link to sign in:</p>
                       <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                       <p>This link will expire in 30 minutes.</p>`
            });
            */
        } catch (error) {
            logger.error('Error sending magic link email', { error, email });
            throw new Error('Failed to send magic link email');
        }
    }

    /**
     * Send a welcome email to a new user
     */
    async sendWelcomeEmail(email: string, name?: string): Promise<void> {
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