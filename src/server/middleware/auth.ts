import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        picture: string;
      };
    }
  }
}

/**
 * Middleware to validate session and attach user data to request
 *
 * Checks for user data in req.session.user and attaches it to req.user
 * If session is missing or user is not authenticated, responds with 401 Unauthorized
 */
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const user = req.session?.user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No active session' });
  }

  // Attach user data to request for easy access in route handlers
  req.user = user;

  next();
}

/**
 * Optional authentication middleware
 * Attempts to read session but doesn't block if user is not authenticated
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const user = req.session?.user;

  if (user) {
    req.user = user;
  }

  next();
}
