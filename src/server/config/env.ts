import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server Configuration
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Google Cloud Platform Configuration
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID || '',
  GCP_LOCATION: process.env.GCP_LOCATION || 'us-central1',
  
  // Vertex AI / Gemini Configuration
  GEMINI_MODEL_NAME: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash',
  GEMINI_REALTIME_MODEL: process.env.GEMINI_REALTIME_MODEL || '',
  GEMINI_SYSTEM_PROMPT: process.env.GEMINI_SYSTEM_PROMPT || '',
  
  // WebSocket Configuration
  WS_PORT: process.env.WS_PORT || '3002',
  
  // CORS Configuration
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Google OAuth2 Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback',

  // Session & JWT Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-secret-for-development-only',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-development-only',

  // Frontend & Application URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  APP_URL: process.env.APP_URL || '',
  
  // Validation
  validate() {
    const required = [
      'GCP_PROJECT_ID',
      'GCP_LOCATION',
      'GEMINI_REALTIME_MODEL',
    ];
    
    const missing = required.filter(key => !env[key as keyof typeof env]);
    
    if (missing.length > 0) {
      console.warn('Warning: Missing required environment variables:', missing);
    }
    
    return missing.length === 0;
  },
};

export default env;
