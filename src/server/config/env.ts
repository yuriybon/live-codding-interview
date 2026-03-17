import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server Configuration
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Google Cloud Platform Configuration
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
  GCP_LOCATION: process.env.GCP_LOCATION || 'us-central1',
  
  // Vertex AI / Gemini Configuration
  GEMINI_MODEL_NAME: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash',
  GEMINI_SYSTEM_PROMPT: process.env.GEMINI_SYSTEM_PROMPT || '',
  
  // WebSocket Configuration
  WS_PORT: process.env.WS_PORT || '3002',
  
  // CORS Configuration
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // Validation
  validate() {
    const required = [
      'GCP_PROJECT_ID',
      'GCP_LOCATION',
      'GEMINI_MODEL_NAME',
    ];
    
    const missing = required.filter(key => !env[key as keyof typeof env]);
    
    if (missing.length > 0) {
      console.warn('Warning: Missing required environment variables:', missing);
    }
    
    return missing.length === 0;
  },
};

export default env;