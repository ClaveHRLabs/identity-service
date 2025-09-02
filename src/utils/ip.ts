import { Request } from 'express';

/**
 * Extract clean client IP address from Express request
 * Handles IPv4-mapped IPv6 addresses and proxy headers
 */
export function getClientIp(req: Request): string | undefined {
    // Get IP from various sources (in order of preference)
    let clientIp =
        req.ip ||
        req.connection.remoteAddress ||
        (req.headers['x-forwarded-for'] as string) ||
        (req.headers['x-real-ip'] as string) ||
        (req.headers['x-client-ip'] as string) ||
        (req.headers['cf-connecting-ip'] as string); // Cloudflare

    if (!clientIp) {
        return undefined;
    }

    // Handle comma-separated IPs from x-forwarded-for (take the first one - original client)
    if (clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }

    // Clean up IPv4-mapped IPv6 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
    if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
    }

    // Remove port if present (127.0.0.1:8080 -> 127.0.0.1)
    if (clientIp.includes(':') && !clientIp.includes('::')) {
        const parts = clientIp.split(':');
        if (parts.length === 2 && /^\d+$/.test(parts[1])) {
            clientIp = parts[0];
        }
    }

    return clientIp;
}

/**
 * Check if an IP address is a private/local address
 */
export function isPrivateIp(ip: string): boolean {
    if (!ip) return false;

    // IPv4 private ranges
    const ipv4PrivateRanges = [
        /^127\./, // 127.0.0.0/8 (localhost)
        /^10\./, // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
        /^192\.168\./, // 192.168.0.0/16
        /^169\.254\./, // 169.254.0.0/16 (link-local)
    ];

    // IPv6 private ranges
    const ipv6PrivateRanges = [
        /^::1$/, // localhost
        /^fe80:/, // link-local
        /^fc00:/, // unique local
        /^fd00:/, // unique local
    ];

    return (
        ipv4PrivateRanges.some((range) => range.test(ip)) ||
        ipv6PrivateRanges.some((range) => range.test(ip))
    );
}

/**
 * Get real client IP, preferring public IPs over private ones
 */
export function getRealClientIp(req: Request): string | undefined {
    const ip = getClientIp(req);

    if (!ip) return undefined;

    // If we have x-forwarded-for, check all IPs for the first public one
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
        const ips = forwardedFor.split(',').map((ip) => ip.trim());
        for (const forwardedIp of ips) {
            let cleanIp = forwardedIp;

            // Clean IPv4-mapped IPv6
            if (cleanIp.startsWith('::ffff:')) {
                cleanIp = cleanIp.substring(7);
            }

            // If it's a public IP, use it
            if (!isPrivateIp(cleanIp)) {
                return cleanIp;
            }
        }
    }

    // Fall back to the extracted IP (even if private)
    return ip;
}
