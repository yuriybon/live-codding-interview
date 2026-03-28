import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { authService } from '../services/auth';
import { optionalAuth } from '../middleware/auth';
import { getRedirectUri } from '../utils/redirect-uri';

const router = Router();

// Endpoint for initiating the Google OAuth flow
router.get('/google', (req, res) => {
    const redirectUri = getRedirectUri(req);
    console.log(`[Auth] Initiating OAuth flow with redirect_uri: ${redirectUri}`);

    const oauth2Client = new OAuth2Client(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        redirectUri
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
    const redirectUri = getRedirectUri(req);

    console.log(`[Auth] Handling callback with redirect_uri: ${redirectUri}`);

    if (error) {
        console.error('OAuth callback returned error:', error);
        return res.redirect(`${env.FRONTEND_URL}/?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.redirect(`${env.FRONTEND_URL}/?error=missing_authorization_code`);
    }

    try {
        console.log(`[Auth] Attempting token exchange for code: ${code.toString().substring(0, 10)}...`);
        console.log(`[Auth] Using Client ID: ${env.GOOGLE_CLIENT_ID?.substring(0, 10)}...`);

        const oauth2Client = new OAuth2Client(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            redirectUri
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

        // Extract profile and store in session
        const userProfile = authService.extractUserProfile(payload);

        // Store user data in encrypted session cookie
        if (req.session) {
            req.session.user = {
                id: userProfile.id,
                email: userProfile.email,
                name: userProfile.name,
                picture: userProfile.picture,
            };
        }

        // Redirect back to frontend on success
        res.redirect(env.FRONTEND_URL);
    } catch (err) {
        console.error('Error during Google OAuth callback:', err);
        // Handle rejection securely and safely by redirecting with an error code
        const errorMessage = err instanceof Error ? err.message : 'unknown_error';
        res.redirect(`${env.FRONTEND_URL}/?error=${encodeURIComponent(errorMessage)}`);
    }
});

// Get current authenticated user
router.get('/me', optionalAuth, (req, res) => {
    const user = req.user || null;
    console.log(`[Auth] /auth/me called. User in session: ${user ? user.email : 'NONE'}`);
    res.json({ user });
});

// Logout endpoint - clears session
router.post('/logout', (req, res) => {
    if (req.session) {
        req.session.user = undefined;
    }
    res.json({ success: true });
});

// Get Google OAuth URL for frontend-initiated auth flow
router.get('/google/url', (req, res) => {
    const redirectUri = getRedirectUri(req);
    console.log(`[Auth] Generating Auth URL with redirect_uri: ${redirectUri}`);

    const oauth2Client = new OAuth2Client(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        prompt: 'consent',
    });

    res.json({ url });
});

export default router;
