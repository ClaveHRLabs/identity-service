import { randomBytes } from 'crypto';

/**
 * Generate a secure API key with the format: xapi-{32 random characters}
 */
export function generateApiKey(): string {
    // Generate 32 random characters
    const randomString = randomBytes(16).toString('hex'); // 16 bytes = 32 hex chars

    return `xapi-${randomString}`;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
    return /^xapi-[a-f0-9]{32}$/.test(apiKey);
}
