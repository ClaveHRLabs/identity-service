import crypto from 'crypto';
import { CODE_GENERATION } from '../constants/app.constants';

/**
 * Generates a cryptographically secure random code
 * @param length The length of the code
 * @param includeSymbols Whether to include symbols in the code
 * @returns A random alphanumeric code
 */
export function generateRandomCode(
    length: number = CODE_GENERATION.DEFAULT_CODE_LENGTH,
    includeSymbols = false,
): string {
    // Define character sets
    const uppercaseChars = CODE_GENERATION.UPPERCASE_CHARS;
    const lowercaseChars = CODE_GENERATION.LOWERCASE_CHARS;
    const numbers = CODE_GENERATION.NUMBERS;
    const symbols = includeSymbols ? CODE_GENERATION.SYMBOLS : '';

    // Combine character sets
    const allChars = uppercaseChars + lowercaseChars + numbers + symbols;

    // Generate bytes and convert to chars
    const bytes = crypto.randomBytes(length * 2); // Get more bytes than needed
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = bytes[i] % allChars.length;
        result += allChars[randomIndex];
    }

    return result;
}

/**
 * Generates a cryptographically secure random hex string
 * @param byteLength The number of bytes (actual string length will be double)
 * @returns A random hex string
 */
export function generateRandomHex(
    byteLength: number = CODE_GENERATION.DEFAULT_HEX_BYTE_LENGTH,
): string {
    return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Generates a setup code in the format CLAVE-XXX-XXXX where X is any alphabet
 * @returns A setup code in the CLAVE-XXX-XXXX format
 */
export function generateClaveSetupCode(): string {
    // Use only uppercase letters for the X parts
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Omit O and I for readability

    // Generate 3 letters for XXX part
    const firstPart = Array(3)
        .fill(0)
        .map(() => {
            const randomIndex = crypto.randomBytes(1)[0] % uppercaseChars.length;
            return uppercaseChars[randomIndex];
        })
        .join('');

    // Generate 4 letters for XXXX part
    const secondPart = Array(4)
        .fill(0)
        .map(() => {
            const randomIndex = crypto.randomBytes(1)[0] % uppercaseChars.length;
            return uppercaseChars[randomIndex];
        })
        .join('');

    return `CLAVE-${firstPart}-${secondPart}`;
}

/**
 * Generates an organization setup code with a prefix
 * @param prefix Optional prefix for the code (e.g., ORG-, SETUP-)
 * @param length Length of the random portion
 * @returns An organization setup code
 */
export function generateOrganizationCode(prefix = 'ORG-', length = 8): string {
    return `${prefix}${generateRandomCode(length)}`;
}

/**
 * Generates a secure hash for a string
 * @param value The string to hash
 * @param salt Optional salt for the hash
 * @returns A secure hash of the string
 */
export function generateHash(value: string, salt = ''): string {
    return crypto
        .createHash('sha256')
        .update(value + salt)
        .digest('hex');
}
