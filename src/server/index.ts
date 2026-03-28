import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { wsService } from './services/websocket';
import sessionRoutes from './routes/sessions';
import authRoutes from './routes/auth';

const app = express();

// Middleware 
app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true, }));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
const startServer = () => {
    const httpServer = app.listen(parseInt(env.PORT), () => {
        console.log(`🚀 AI Interview Simulator Backend`);
        console.log(`================================`);
        console.log(`HTTP Server: http://localhost:${env.PORT}`);
        console.log(`WebSocket: ws://localhost:${env.WS_PORT}`);
        console.log(`Environment: ${env.NODE_ENV}`);
        console.log(`================================ `);
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
