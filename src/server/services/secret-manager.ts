import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { env } from '../config/env';

// Lazy initialization - client created on first use
let secretClient: SecretManagerServiceClient | null = null;

/**
 * Retrieves a secret from Google Cloud Secret Manager
 *
 * @param secretName - The name of the secret to retrieve (e.g., 'GEMINI_API_KEY')
 * @returns The secret value as a string, or null if not found/unavailable
 *
 * Features:
 * - Lazy client initialization for better startup performance
 * - Skips Secret Manager if GOOGLE_CLOUD_PROJECT is not properly configured
 * - Comprehensive error handling with actionable error messages
 * - Returns null gracefully for missing secrets (fail-safe)
 */
export async function getSecret(secretName: string): Promise<string | null> {
  const project = env.GOOGLE_CLOUD_PROJECT;

  // Skip Secret Manager if project is not configured or is a placeholder
  if (!project || project === 'your-project-id' || project === '') {
    console.log(`[SecretManager] Skipping ${secretName}: GOOGLE_CLOUD_PROJECT is not set or is default.`);
    return null;
  }

  try {
    // Lazy initialization: create client only on first secret request
    if (!secretClient) {
      console.log(`[SecretManager] Initializing client for project: ${project}`);
      // In Cloud Run, this uses the service account attached to the revision
      // In local dev, this uses Application Default Credentials (ADC)
      secretClient = new SecretManagerServiceClient();
    }

    // Construct the secret path (projects/{project}/secrets/{name}/versions/latest)
    const secretPath = `projects/${project}/secrets/${secretName}/versions/latest`;

    // Access the secret version
    const [version] = await secretClient.accessSecretVersion({
      name: secretPath,
    });

    // Extract and decode the secret payload
    const payload = version.payload?.data?.toString();
    if (payload) {
      console.log(`[SecretManager] Successfully fetched: ${secretName}`);
      return payload.trim();
    }

    return null;
  } catch (error: any) {
    // Error code 16: UNAUTHENTICATED - Missing or invalid credentials
    if (error.message?.includes('Could not load the default credentials') || error.code === 16) {
      console.error(`[SecretManager] AUTH ERROR: Could not find Application Default Credentials.`);
      console.error(`[SecretManager] ACTION REQUIRED: Run 'gcloud auth application-default login' in your terminal.`);
    }
    // Error code 7: PERMISSION_DENIED - User/SA lacks access to the secret
    else if (error.code === 7) {
      console.error(`[SecretManager] PERMISSION DENIED: Your account doesn't have access to secret '${secretName}'.`);
      console.error(`[SecretManager] ACTION REQUIRED: Grant 'Secret Manager Secret Accessor' role to your identity in Google Cloud Console.`);
    }
    // Error code 5: NOT_FOUND - Secret doesn't exist
    else if (error.code === 5) {
      console.warn(`[SecretManager] NOT FOUND: Secret '${secretName}' does not exist in project '${project}'.`);
    }
    // Other errors
    else {
      console.warn(`[SecretManager] Error fetching ${secretName}:`, error.message);
    }

    return null;
  }
}

/**
 * Loads secrets from environment variables or Secret Manager
 * Implements hierarchical loading: process.env → Secret Manager → null
 *
 * @param secretNames - Array of secret names to load
 * @returns Object mapping secret names to their values
 */
export async function loadSecrets(secretNames: string[]): Promise<Record<string, string>> {
  console.log('--- Loading Configuration ---');
  console.log(`[Config] Project ID: ${env.GOOGLE_CLOUD_PROJECT || 'NOT SET'}`);

  const secrets: Record<string, string> = {};

  for (const secretName of secretNames) {
    // Check environment variable first (hierarchical loading)
    if (process.env[secretName]) {
      secrets[secretName] = process.env[secretName]!;
      console.log(`[Config] ${secretName}: Loaded from Environment/.env`);
    } else {
      // Try to fetch from Secret Manager
      const value = await getSecret(secretName);
      if (value) {
        secrets[secretName] = value;
        // Store in process.env for other parts of the app to access
        process.env[secretName] = value;
        console.log(`[Config] ${secretName}: Loaded from Google Secret Manager`);
      } else {
        console.warn(`[Config] ${secretName}: NOT FOUND (Environment or Secret Manager)`);
      }
    }
  }

  console.log('-----------------------------\n');

  return secrets;
}
