import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment Configuration with Dynamic Getters
 *
 * IMPORTANT: This uses getters to read from process.env dynamically.
 * This fixes the race condition where secrets loaded from Google Secret Manager
 * after startup weren't being reflected in the env object.
 *
 * How it works:
 * 1. At startup, env.GOOGLE_CLIENT_SECRET reads from process.env (empty string)
 * 2. loadSecrets() fetches the secret and sets process.env.GOOGLE_CLIENT_SECRET
 * 3. Next access to env.GOOGLE_CLIENT_SECRET reads the NEW value from process.env
 *
 * Without getters, the env object would cache the empty string forever.
 */

// Define the env object with dynamic getters
export const env = {
  // Server Configuration
  get PORT(): string {
    return process.env.PORT || '3001';
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },

  // Google Cloud Platform Configuration
  get GCP_PROJECT_ID(): string {
    return process.env.GCP_PROJECT_ID || '';
  },
  get GOOGLE_CLOUD_PROJECT(): string {
    return process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID || '';
  },
  get GCP_LOCATION(): string {
    return process.env.GCP_LOCATION || 'us-central1';
  },

  // Vertex AI / Gemini Configuration
  get GEMINI_MODEL_NAME(): string {
    return process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
  },
  get GEMINI_REALTIME_MODEL(): string {
    return process.env.GEMINI_REALTIME_MODEL || '';
  },
  get GEMINI_SYSTEM_PROMPT(): string {
    return process.env.GEMINI_SYSTEM_PROMPT || '';
  },
  get GEMINI_API_KEY(): string {
    return process.env.GEMINI_API_KEY || '';
  },

  // WebSocket Configuration
  get WS_PORT(): string {
    return process.env.WS_PORT || '3002';
  },

  // CORS Configuration
  get ALLOWED_ORIGINS(): string[] {
    return process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
  },

  // Rate Limiting
  get RATE_LIMIT_WINDOW_MS(): number {
    return parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
  },
  get RATE_LIMIT_MAX_REQUESTS(): number {
    return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  },

  // Google OAuth2 Configuration
  // CRITICAL: These are loaded from Secret Manager AFTER module load
  // Using getters ensures we always get the latest value from process.env
  get GOOGLE_CLIENT_ID(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  },
  get GOOGLE_CLIENT_SECRET(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  },
  get GOOGLE_REDIRECT_URI(): string {
    return process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback';
  },

  // Session & JWT Configuration
  // CRITICAL: SESSION_SECRET is loaded from Secret Manager AFTER module load
  get SESSION_SECRET(): string {
    return process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-secret-for-development-only';
  },
  get JWT_SECRET(): string {
    return process.env.JWT_SECRET || 'fallback-secret-for-development-only';
  },

  // Frontend & Application URL
  get FRONTEND_URL(): string {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  },
  get APP_URL(): string {
    return process.env.APP_URL || '';
  },

  // Validation
  validate(): boolean {
    const required = [
      'GCP_PROJECT_ID',
      'GCP_LOCATION',
      'GEMINI_REALTIME_MODEL',
    ];

    const missing = required.filter(key => {
      const value = env[key as keyof typeof env];
      return !value || value === '';
    });

    if (missing.length > 0) {
      console.warn('Warning: Missing required environment variables:', missing);
    }

    return missing.length === 0;
  },
};

export default env;
