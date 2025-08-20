import { createSingleton } from '@vspl/core';
import { createServiceClient } from './http-client';
import { NOTIFICATION_SERVICE_URL } from '../config/config';

// Create singleton notification client
export const notificationClient = createSingleton(() =>
    createServiceClient(NOTIFICATION_SERVICE_URL),
);

// Function to send email notification
export const sendEmail = async (data: {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
}) => {
    const client = notificationClient();
    return client.post('/api/notifications/email', data);
};

// Function to send SMS notification
export const sendSms = async (data: {
    to: string;
    message: string;
    templateName?: string;
    templateData?: Record<string, any>;
}) => {
    const client = notificationClient();
    return client.post('/api/notifications/sms', data);
};

export default {
    sendEmail,
    sendSms,
};
