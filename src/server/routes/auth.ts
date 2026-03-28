import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { authService } from '../services/auth';

const router = Router();

// Endpoint for initiating the Google OAuth flow
router.get('/google', (req, res) => {
    const oauth2Client = new OAuth2Client(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
    );

    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        prompt: 'consent',
    });

    res.redirect(authorizeUrl);
});

// Callback endpoint to handle the OAuth2 token exchange
router.get('/google/callback', async (req, res) => {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
        console.error('OAuth callback returned error:', error);
        return res.redirect(`${env.FRONTEND_URL}/?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.redirect(`${env.FRONTEND_URL}/?error=missing_authorization_code`);
    }

    try {
        const oauth2Client = new OAuth2Client(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            env.GOOGLE_REDIRECT_URI
        );

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Verify the ID token and get the user's profile information
        const idToken = tokens.id_token;
        if (!idToken) {
            throw new Error('No ID token returned from Google');
        }

        const ticket = await oauth2Client.verifyIdToken({
            idToken,
            audience: env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        // Extract profile and create our own session token
        const userProfile = authService.extractUserProfile(payload);
        const sessionToken = authService.generateSessionToken(userProfile);

        // Set the token as an HTTP-only cookie
        res.cookie('session_token', sessionToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/',
        });

        // Redirect back to frontend on success
        res.redirect(env.FRONTEND_URL);
    } catch (err) {
        console.error('Error during Google OAuth callback:', err);
        // Handle rejection securely and safely by redirecting with an error code
        const errorMessage = err instanceof Error ? err.message : 'unknown_error';
        res.redirect(`${env.FRONTEND_URL}/?error=${encodeURIComponent(errorMessage)}`);
    }
});

export default router;
