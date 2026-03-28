/**
 * Environment Configuration Test Suite
 * TDD Phase: Red (Test First)
 *
 * These tests enforce that the environment configuration requires
 * the new Gemini Realtime model configuration. The application should
 * fail fast on startup if these critical variables are missing.
 *
 * Expected behavior: These tests will FAIL until TASK-1.1.4 adds
 * the GEMINI_REALTIME_MODEL configuration to env.ts.
 */

describe('Environment Configuration - Gemini Realtime Model', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save the original process.env
    originalEnv = { ...process.env };

    // Clear the require cache to force re-evaluation of env.ts
    jest.resetModules();
  });

  afterEach(() => {
    // Restore the original process.env
    process.env = { ...originalEnv };
  });

  /**
   * TDD Red Phase Test
   *
   * This test asserts that when GEMINI_REALTIME_MODEL is missing,
   * the env validation fails and reports it as a required variable.
   *
   * Current implementation WILL FAIL because:
   * - env.ts doesn't have GEMINI_REALTIME_MODEL yet
   * - env.validate() doesn't check for this variable
   *
   * This test will pass once TASK-1.1.4 adds the configuration.
   */
  it('should require GEMINI_REALTIME_MODEL environment variable', () => {
    // Arrange: Remove the GEMINI_REALTIME_MODEL from environment
    delete process.env.GEMINI_REALTIME_MODEL;

    // Set other required variables so only GEMINI_REALTIME_MODEL is missing
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.GCP_LOCATION = 'us-central1';

    // Act: Import the env configuration
    const { env } = require('../../config/env');

    // Assert: Validation should fail because GEMINI_REALTIME_MODEL is missing
    const isValid = env.validate();

    // Validation should fail
    expect(isValid).toBe(false);

    // The env object should have GEMINI_REALTIME_MODEL property
    expect(env).toHaveProperty('GEMINI_REALTIME_MODEL');

    // The value should be empty/falsy when not provided
    expect(env.GEMINI_REALTIME_MODEL).toBeFalsy();
  });

  /**
   * Test that validates successful configuration when all Realtime variables are present
   */
  it('should successfully validate when GEMINI_REALTIME_MODEL is provided', () => {
    // Arrange: Set all required Realtime model variables
    process.env.GEMINI_REALTIME_MODEL = 'gemini-2.0-flash-realtime-exp';
    process.env.GCP_PROJECT_ID = 'test-project-123';
    process.env.GCP_LOCATION = 'us-central1';

    // Act: Import the env configuration
    const { env } = require('../../config/env');

    // Assert: Validation should succeed
    const isValid = env.validate();

    // Validation should pass
    expect(isValid).toBe(true);

    // The GEMINI_REALTIME_MODEL should be correctly loaded
    expect(env.GEMINI_REALTIME_MODEL).toBe('gemini-2.0-flash-realtime-exp');
  });

  /**
   * Test that verifies GCP_PROJECT_ID is still required
   */
  it('should require GCP_PROJECT_ID for Vertex AI authentication', () => {
    // Arrange: Remove GCP_PROJECT_ID but provide GEMINI_REALTIME_MODEL
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    process.env.GEMINI_REALTIME_MODEL = 'gemini-2.0-flash-realtime-exp';
    process.env.GCP_LOCATION = 'us-central1';

    // Act: Import the env configuration
    const { env } = require('../../config/env');

    // Assert: Validation should fail because GCP_PROJECT_ID is missing
    const isValid = env.validate();

    expect(isValid).toBe(false);
  });

  /**
   * Test that verifies GCP_LOCATION has a sensible default
   */
  it('should use default GCP_LOCATION if not provided', () => {
    // Arrange: Remove GCP_LOCATION but provide other required vars
    delete process.env.GCP_LOCATION;
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.GEMINI_REALTIME_MODEL = 'gemini-2.0-flash-realtime-exp';

    // Act: Import the env configuration
    const { env } = require('../../config/env');

    // Assert: Should use default location
    expect(env.GCP_LOCATION).toBe('us-central1');

    // Validation should still pass with default location
    const isValid = env.validate();
    expect(isValid).toBe(true);
  });

  /**
   * Test that ensures the model name follows the expected format
   */
  it('should accept valid Realtime model names', () => {
    // Arrange: Test various valid Realtime model names
    const validModelNames = [
      'gemini-2.0-flash-realtime-exp',
      'gemini-2.0-flash-realtime',
      'gemini-2.0-flash-exp',
    ];

    validModelNames.forEach((modelName) => {
      // Reset modules for each iteration
      jest.resetModules();

      process.env.GEMINI_REALTIME_MODEL = modelName;
      process.env.GCP_PROJECT_ID = 'test-project';
      process.env.GCP_LOCATION = 'us-central1';

      // Act: Import the env configuration
      const { env } = require('../../config/env');

      // Assert: Should load the model name correctly
      expect(env.GEMINI_REALTIME_MODEL).toBe(modelName);
    });
  });

  /**
   * Fail-Fast Architecture Principle Test
   *
   * This test ensures that the application enforces fail-fast configuration,
   * meaning it should detect missing critical variables at startup rather than
   * during runtime when a user tries to start an interview session.
   */
  it('should follow fail-fast principle - validate on startup, not during session', () => {
    // Arrange: Set incomplete configuration (missing GEMINI_REALTIME_MODEL)
    delete process.env.GEMINI_REALTIME_MODEL;
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.GCP_LOCATION = 'us-central1';

    // Act: Import the env configuration
    const { env } = require('../../config/env');

    // Assert: The validate() method should be callable immediately
    expect(typeof env.validate).toBe('function');

    // Validation should fail immediately (not later during a session)
    const isValid = env.validate();
    expect(isValid).toBe(false);

    // This ensures developers know about configuration issues at startup
    // rather than discovering them when a user tries to use the feature
  });
});
