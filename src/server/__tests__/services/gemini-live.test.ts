/**
 * GeminiLiveClient Test Suite
 * TDD Phase: Red (Test First)
 *
 * This test suite verifies that the GeminiLiveClient can establish
 * a secure WebSocket connection to the Vertex AI Gemini Multimodal Live API.
 *
 * Expected behavior: These tests will FAIL until TASK-1.2.2 implements
 * the GeminiLiveClient class with proper authentication and connection logic.
 */

import { GoogleAuth } from 'google-auth-library';
import WebSocket from 'ws';

// Mock Google Auth Library
jest.mock('google-auth-library', () => {
  return {
    GoogleAuth: jest.fn().mockImplementation(() => ({
      getAccessToken: jest.fn().mockResolvedValue('mock-access-token-12345'),
    })),
  };
});

// Mock WebSocket
const EventEmitter = require('events');

class MockWebSocket extends EventEmitter {
  static OPEN = 1;
  static CLOSED = 3;

  url: string;
  readyState: number = 0; // CONNECTING initially

  constructor(url: string, protocols?: string | string[], options?: any) {
    super();
    this.url = url;

    // Simulate successful connection after a short delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.emit('open');
    }, 10);
  }

  send(data: any) {}
  close() {
    this.readyState = 3; // CLOSED
    this.emit('close', 1000, Buffer.from('Normal closure'));
  }
}

jest.mock('ws', () => {
  const mockWs: any = jest.fn().mockImplementation((url: string, protocols?: any, options?: any) => {
    return new MockWebSocket(url, protocols, options);
  });

  // Add static properties
  mockWs.OPEN = 1;
  mockWs.CLOSED = 3;

  return mockWs;
});

// Mock env configuration
jest.mock('../../config/env', () => ({
  env: {
    GCP_PROJECT_ID: 'test-project-12345',
    GCP_LOCATION: 'us-central1',
    GEMINI_REALTIME_MODEL: 'gemini-2.0-flash-realtime-exp',
  },
}));

describe('GeminiLiveClient - Connection Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * TDD Red Phase Test
   *
   * This test asserts that the GeminiLiveClient class exists and
   * can be instantiated to connect to Vertex AI.
   *
   * Current implementation WILL FAIL because:
   * - GeminiLiveClient class doesn't exist yet
   * - No connection logic implemented
   *
   * This test will pass once TASK-1.2.2 implements the client.
   */
  it('should establish a WebSocket connection to Vertex AI Gemini Live API', async () => {
    // Arrange: Import the GeminiLiveClient class
    const { GeminiLiveClient } = require('../../services/gemini-live');

    // Act: Create an instance and connect
    const client = new GeminiLiveClient();
    await client.connect();

    // Assert: Verify WebSocket was instantiated with correct URL
    expect(WebSocket).toHaveBeenCalled();

    // Get the WebSocket constructor call arguments
    const wsConstructorCall = (WebSocket as jest.MockedClass<typeof WebSocket>).mock.calls[0];
    const url = wsConstructorCall[0];

    // Verify the URL format matches Vertex AI endpoint
    expect(url).toContain('us-central1-aiplatform.googleapis.com');
    expect(url).toContain('/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent');
    expect(url).toContain('access_token=mock-access-token-12345');
  });

  /**
   * Test that verifies Google Auth token retrieval
   */
  it('should fetch Google Auth access token before connecting', async () => {
    // Arrange
    const { GeminiLiveClient } = require('../../services/gemini-live');

    // Act: Connect to Vertex AI
    const client = new GeminiLiveClient();
    await client.connect();

    // Assert: GoogleAuth should be instantiated
    expect(GoogleAuth).toHaveBeenCalled();

    // Verify the auth instance was used to get an access token
    const mockAuthInstance = (GoogleAuth as jest.MockedClass<typeof GoogleAuth>).mock.results[0].value;
    expect(mockAuthInstance.getAccessToken).toHaveBeenCalled();
  });

  /**
   * Test that verifies the WebSocket URL structure
   */
  it('should construct correct Vertex AI WebSocket URL with all required parameters', async () => {
    // Arrange
    const { GeminiLiveClient } = require('../../services/gemini-live');

    // Act
    const client = new GeminiLiveClient();
    await client.connect();

    // Assert: Verify the complete WebSocket URL structure
    const wsConstructorCall = (WebSocket as jest.MockedClass<typeof WebSocket>).mock.calls[0];
    const url = wsConstructorCall[0];

    // Expected URL format:
    // wss://{location}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent
    // ?access_token={token}

    expect(url).toMatch(/^wss:\/\//); // Secure WebSocket
    expect(url).toContain('-aiplatform.googleapis.com');
    expect(url).toContain('/ws/');
    expect(url).toContain('BidiGenerateContent');
    expect(url).toContain('access_token=');
  });

  /**
   * Test that verifies connection event handling
   */
  it('should emit connected event when WebSocket connection opens', async () => {
    // Arrange
    const { GeminiLiveClient } = require('../../services/gemini-live');

    // Act
    const client = new GeminiLiveClient();

    // Set up event listener
    const connectionHandler = jest.fn();
    client.on('connected', connectionHandler);

    await client.connect();

    // Wait for async connection to complete
    await new Promise(resolve => setTimeout(resolve, 20));

    // Assert: Connection event should be emitted
    expect(connectionHandler).toHaveBeenCalled();
  });

  /**
   * Test that verifies proper cleanup on disconnect
   */
  it('should properly close WebSocket connection on disconnect', async () => {
    // Arrange
    const { GeminiLiveClient } = require('../../services/gemini-live');
    const client = new GeminiLiveClient();
    await client.connect();

    // Get the WebSocket instance
    const wsInstance = (WebSocket as jest.MockedClass<typeof WebSocket>).mock.results[0].value;
    const closeSpy = jest.spyOn(wsInstance, 'close');

    // Act: Disconnect
    client.disconnect();

    // Assert: WebSocket close should be called
    expect(closeSpy).toHaveBeenCalled();
  });

  /**
   * Test that verifies connection state management
   */
  it('should track connection state correctly', async () => {
    // Arrange
    const { GeminiLiveClient } = require('../../services/gemini-live');
    const client = new GeminiLiveClient();

    // Assert: Initially disconnected
    expect(client.isConnected()).toBe(false);

    // Act: Connect
    await client.connect();
    await new Promise(resolve => setTimeout(resolve, 20));

    // Assert: Should be connected
    expect(client.isConnected()).toBe(true);

    // Act: Disconnect
    client.disconnect();

    // Assert: Should be disconnected again
    expect(client.isConnected()).toBe(false);
  });

  /**
   * Test that verifies error handling for missing credentials
   */
  it('should handle authentication errors gracefully', async () => {
    // Arrange: Mock auth failure
    const mockAuthError = new Error('Unable to fetch access token');
    (GoogleAuth as any).mockImplementationOnce(() => ({
      getAccessToken: jest.fn().mockRejectedValue(mockAuthError),
    }));

    const { GeminiLiveClient } = require('../../services/gemini-live');
    const client = new GeminiLiveClient();

    // Act & Assert: Should reject with auth error
    await expect(client.connect()).rejects.toThrow('Unable to fetch access token');
  });
});
