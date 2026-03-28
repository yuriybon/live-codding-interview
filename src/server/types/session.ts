// Extend Express Request to include session with user data
declare global {
  namespace Express {
    interface Request {
      session?: CookieSessionInterfaces.CookieSessionObject & {
        user?: {
          id: string;
          email: string;
          name: string;
          picture: string;
        };
      };
    }
  }
}

export {};
