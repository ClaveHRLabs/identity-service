import { Express } from 'express-serve-static-core';
import * as express from 'express';

declare global {
    namespace Express {
        interface Request {
            setupCode?: string;
            userId?: string;
            user?: {
                id: string;
                email: string;
                roles?: string[];
                [key: string]: any;
            };
            assignableRoles?: string[];
        }
    }
} 