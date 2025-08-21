import { createSingleton } from '@vspl/core';
import { createServiceClient } from './http-client';
import { NOTIFICATION_SERVICE_URL } from '../config/config';

// Create singleton notification client
export const notificationClient = createSingleton(() =>
    createServiceClient(NOTIFICATION_SERVICE_URL),
);