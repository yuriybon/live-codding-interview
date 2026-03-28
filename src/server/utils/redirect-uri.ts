import { Request } from 'express';
import { env } from '../config/env';

/**
 * Centralized redirect URI logic for OAuth callbacks
 *
 * Determines the correct OAuth redirect URI based on:
 * 1. APP_URL environment variable (if set) - explicit override
 * 2. Request headers (X-Forwarded-Proto, Host) - for Cloud Run and proxies
 * 3. Fallback to localhost - for local development
 *
 * @param req - Express request object (optional, used for header detection)
 * @returns The full OAuth callback URL
 */
export function getRedirectUri(req?: Request): string {
  // Priority 1: Use explicit APP_URL if configured
  if (env.APP_URL) {
    const baseUrl = env.APP_URL.replace(/\/$/, ''); // Remove trailing slash
    return `${baseUrl}/auth/google/callback`;
  }

  // Priority 2: Detect from request headers (for Cloud Run, load balancers, etc.)
  if (req) {
    // Cloud Run and other proxies set these headers
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];

    if (host) {
      return `${protocol}://${host}/auth/google/callback`;
    }
  }

  // Priority 3: Fallback to localhost for local development
  return `http://localhost:${env.PORT}/auth/google/callback`;
}
