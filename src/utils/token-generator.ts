import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 * 
 * @param length The length of the token in bytes (will be encoded as hex)
 * @returns A secure random token string
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a cryptographically secure random code
 * 
 * @param length The length of the code
 * @returns A secure random code string
 */
export function generateRandomCode(length: number = 6): string {
    // Use more readable characters (no 0, O, 1, I, etc.)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        // Use modulo bias-free method
        result += chars[randomBytes[i] % chars.length];
    }

    return result;
} 