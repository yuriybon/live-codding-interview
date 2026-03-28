import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserProfile, AuthTokenPayload } from '../types/auth';

export class AuthService {
    private readonly jwtSecret: string;

    constructor() {
        this.jwtSecret = env.JWT_SECRET;
    }

    /**
     * Extracts user profile data from Google's ID token payload
     */
    public extractUserProfile(payload: any): UserProfile {
        if (!payload || !payload.sub || !payload.email) {
            throw new Error('Invalid token payload: Missing required user information');
        }

        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || '',
        };
    }

    /**
     * Generates a signed JWT representing the authenticated user's session
     */
    public generateSessionToken(userProfile: UserProfile): string {
        const payload: AuthTokenPayload = {
            sub: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            picture: userProfile.picture,
        };

        // Token expires in 24 hours
        return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
    }

    /**
     * Verifies a session JWT and returns the decoded payload
     */
    public verifySessionToken(token: string): AuthTokenPayload {
        return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
    }
}

export const authService = new AuthService();
