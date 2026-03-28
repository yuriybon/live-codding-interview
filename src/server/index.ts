import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import path from 'path';
import { env } from './config/env';
import { wsService } from './services/websocket';
import { loadSecrets } from './services/secret-manager';
import sessionRoutes from './routes/sessions';
import authRoutes from './routes/auth';

const app = express();

// REQUIRED for cookies to work on Cloud Run / behind a proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true, }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration with dynamic SameSite based on context
const isProduction = env.NODE_ENV === 'production';
const baseUrl = env.APP_URL || env.FRONTEND_URL;
const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

app.use((req, res, next) => {
    // Dynamically determine SameSite based on context
    // If we're in an iframe, we need 'none'
    // If we're on mobile or direct access, 'lax' is more compatible
    const isIframe = req.headers['sec-fetch-dest'] === 'iframe' ||
                     req.headers['referer']?.includes('aistudio.google.com');

    const sameSite = isProduction && !isLocalhost
        ? (isIframe ? 'none' : 'lax')
        : 'lax';

    cookieSession({
        name: 'session',
        keys: [process.env.SESSION_SECRET || env.SESSION_SECRET],
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: isProduction && !isLocalhost,
        sameSite: sameSite as any,
        httpOnly: true,
        signed: true,
        // @ts-ignore - partitioned is supported in modern browsers for cross-site cookies
        partitioned: isProduction && !isLocalhost && sameSite === 'none',
    })(req, res, next);
});

// Request logging 
app.use((req, res, next) => {
    // Avoid logging static assets in production
    if (!req.path.includes('.')) {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// API Routes 
app.use('/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check endpoint 
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(), 
        environment: env.NODE_ENV, 
    });
});

// WebSocket info endpoint 
app.get('/api/ws-info', (req, res) => {
    const host = req.get('host') || 'localhost';
    const hostWithoutPort = host.split(':')[0];
    res.json({ 
        wsPort: env.WS_PORT, 
        wsUrl: `ws://${hostWithoutPort}:${env.WS_PORT}`, 
    });
});

// Serve frontend static files in production
if (env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));
    
    // Catch-all route to serve React's index.html for unknown routes (Client-Side Routing)
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
            return next();
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// Error handling middleware 
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong', 
    });
});

// 404 handler for APIs
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found', 
        path: req.path, 
    });
});

// Start servers
const startServer = async () => {
    // Load secrets from Secret Manager or environment variables
    await loadSecrets([
        'GEMINI_API_KEY',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'SESSION_SECRET',
    ]);

    // Environment detection logging
    const isProduction = env.NODE_ENV === 'production';
    const baseUrl = env.APP_URL || env.FRONTEND_URL;
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    console.log(`\n[Config] Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    console.log(`[Config] APP_URL: ${env.APP_URL || 'NOT SET (using dynamic detection)'}`);
    console.log(`[Config] Frontend URL: ${env.FRONTEND_URL}`);
    console.log(`[Config] Localhost detected: ${isLocalhost}`);
    console.log(`[Config] Cookies: ${isProduction && !isLocalhost ? 'SECURE' : 'INSECURE'} | SameSite: ${isProduction && !isLocalhost ? 'dynamic (lax/none)' : 'lax'}`);
    console.log(`[Config] SESSION_SECRET present: ${!!process.env.SESSION_SECRET}\n`);

    const httpServer = app.listen(parseInt(env.PORT), () => {
        console.log(`🚀 AI Interview Simulator Backend`);
        console.log(`================================`);
        console.log(`HTTP Server: http://localhost:${env.PORT}`);
        console.log(`WebSocket: ws://localhost:${env.WS_PORT}`);
        console.log(`Environment: ${env.NODE_ENV}`);
        console.log(`================================\n`);
    });

    // Graceful shutdown   
    const shutdown = (signal: string) => {
        console.log(`\${signal} received. Shutting down gracefully...`);
        wsService.close();
        httpServer.close(() => { 
            console.log('HTTP server closed'); 
            process.exit(0); 
        });
        
        // Force shutdown after 10 seconds     
        setTimeout(() => { 
            console.error('Forced shutdown'); 
            process.exit(1); 
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

if (env.validate()) {
    startServer();
} else {
    console.warn('Warning: Some environment variables are missing. Server will run with defaults.');
    startServer();
}

export default app;
