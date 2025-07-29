import axios from 'axios';
import { logger } from './logger';
import { Config } from '../config/config';

// Define notification types
export type NotificationType = 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP' | 'TELEGRAM';
export type RecipientType = 'INTERNAL' | 'EXTERNAL';

// Notification request interface
export interface NotificationRequest {
  type: NotificationType;
  templateId: string;
  recipientType: RecipientType;
  recipientDetails: {
    email?: string;
    phone?: string;
    userId?: string;
    name?: string;
  };
  payload: Record<string, any>;
  organizationId: string;
  priority?: number;
}

/**
 * Utility to send notifications through the notification service
 */
export class NotificationClient {
  private readonly notificationServiceUrl: string;

  constructor() {
    this.notificationServiceUrl = Config.NOTIFICATION_SERVICE_URL;
  }

  /**
   * Send a notification request to the notification service
   */
  async sendNotification(request: NotificationRequest): Promise<any> {
    try {
      logger.info('Sending notification request', {
        type: request.type,
        recipientType: request.recipientType,
        recipient: request.recipientDetails.email || request.recipientDetails.phone || request.recipientDetails.userId
      });

      const response = await axios.post(
        `${this.notificationServiceUrl}/api/notifications`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-service-key': Config.SERVICE_API_KEY
          }
        }
      );

      logger.info('Notification sent successfully', {
        type: request.type,
        recipientType: request.recipientType,
        status: response.status
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: request.type,
        recipientType: request.recipientType
      });
      throw error;
    }
  }

  /**
   * Send a magic link login notification
   */
  async sendLoginLinkNotification(
    email: string,
    name: string,
    loginLink: string, 
    organizationId: string,
    organizationName: string = 'Clave HR'
  ): Promise<any> {
    const currentYear = new Date().getFullYear().toString();
    
    return this.sendNotification({
      type: 'EMAIL',
      templateId: 'c6f79ba8-d139-4be7-bd2a-7d60d5db51ff', // Fixed template ID as requested
      recipientType: 'EXTERNAL',
      recipientDetails: {
        email,
        name
      },
      payload: {
        LOGIN_LINK: loginLink,
        CURRENT_YEAR: currentYear,
        ORGANIZATION: organizationName,
        LOGIN_LINK_TEXT: 'Verify to login'
      },
      organizationId,
      priority: 1
    });
  }
}