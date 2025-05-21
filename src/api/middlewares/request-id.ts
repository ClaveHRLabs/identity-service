import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
    requestId: string;
}

/**
 * Middleware to add a unique request ID to each request
 * This helps with tracing requests through the system
 */
export const requestIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Check if a request ID was forwarded from the gateway
    const forwardedRequestId = req.headers['x-request-id'] as string;
    const requestId = forwardedRequestId ?? uuidv4();
    // Add the request ID to the request object
    (req as RequestWithId).requestId = requestId;

    // Add the request ID to the response headers
    res.setHeader('x-request-id', requestId);

    next();
};