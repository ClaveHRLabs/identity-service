import { createSingleton } from '@vspl/core';
import { createServiceClient } from './http-client';
import { getDependency, SERVICE_NAMES } from '../di';
import { IdentityConfig } from '../config/config';

// Create singleton notification client
export const notificationClient = createSingleton(() => {
    const config = getDependency<IdentityConfig>(SERVICE_NAMES.CONFIG);
    return createServiceClient(config.NOTIFICATION_SERVICE_URL);
});
