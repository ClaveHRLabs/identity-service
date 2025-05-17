import jwt from 'jsonwebtoken';
import { Config } from '../config/config';
import { User } from '../models/schemas/user';

// Types
export interface JwtPayload {
    sub: string;
    email: string;
    organizationId?: string;
    type: 'access' | 'refresh';
    iat: number;
    exp: number;
}

/**
 * Generate an access token for a user
 */
export function generateAccessToken(user: User): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        organizationId: user.organization_id,
        type: 'access'
    };

    return jwt.sign(payload, Config.JWT_SECRET, {
        expiresIn: Config.JWT_EXPIRATION
    });
}

/**
 * Generate a refresh token JWT (not to be confused with the refresh token in the database)
 */
export function generateRefreshToken(user: User): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        organizationId: user.organization_id,
        type: 'refresh'
    };

    return jwt.sign(payload, Config.JWT_REFRESH_SECRET, {
        expiresIn: Config.JWT_REFRESH_EXPIRATION
    });
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, Config.JWT_SECRET, (err, decoded) => {
            if (err) {
                return reject(err);
            }

            const payload = decoded as JwtPayload;
            if (payload.type !== 'access') {
                return reject(new Error('Invalid token type'));
            }

            resolve(payload);
        });
    });
}

/**
 * Verify a refresh token JWT
 */
export function verifyRefreshToken(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, Config.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return reject(err);
            }

            const payload = decoded as JwtPayload;
            if (payload.type !== 'refresh') {
                return reject(new Error('Invalid token type'));
            }

            resolve(payload);
        });
    });
} 