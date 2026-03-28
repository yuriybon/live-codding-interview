/**
 * WebSocketService Test Suite
 * TDD Phase: Red (Test First)
 *
 * This test enforces that WebSocketService does NOT use polling loops
 * for session analysis. The current implementation violates this by
 * starting a 5-second setInterval when a candidate joins a session.
 *
 * Expected behavior: This test will FAIL until the polling loop is removed.
 */

import WebSocket, { WebSocketServer } from 'ws';
import { WebSocketService } from '../../services/websocket';
import { vertexAI } from '../../services/vertex-ai';

// Mock the vertex-ai module to prevent actual API calls
jest.mock('../../services/vertex-ai', () => ({
  vertexAI: {
    analyzeTranscript: jest.fn(),
    generateFeedback: jest.fn().mockResolvedValue('Mock feedback'),
  },
}));

// Mock the env config
jest.mock('../../config/env', () => ({
  env: {
    WS_PORT: '8080',
    NODE_ENV: 'test',
  },
}));

// Mock WebSocketServer to prevent actual server creation
jest.mock('ws', () => {
  const EventEmitter = require('events');

  class MockWebSocketServer extends EventEmitter {
    close() {}
  }

  class MockWebSocket extends EventEmitter {
    readyState = 1; // OPEN
    send(data: any) {}
  }

  return {
    WebSocketServer: MockWebSocketServer,
    __esModule: true,
    default: MockWebSocket,
  };
});

describe('WebSocketService - Polling Loop Removal', () => {
  let wsService: WebSocketService;
  let mockClient: WebSocket;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Use fake timers to control time-based operations
    jest.useFakeTimers();

    // Spy on setInterval to detect polling loops
    jest.spyOn(global, 'setInterval');
  });

  afterEach(() => {
    // Clean up
    if (wsService) {
      wsService.close();
    }

    // Restore real timers
    jest.useRealTimers();

    // Restore spies
    jest.restoreAllMocks();
  });

  /**
   * TDD Red Phase Test
   *
   * This test asserts that when a candidate joins a session,
   * the WebSocketService does NOT initiate a polling loop via setInterval.
   *
   * Current implementation FAILS this test because:
   * - handleJoinSession() calls startSessionAnalysis()
   * - startSessionAnalysis() creates a setInterval with 5000ms interval
   *
   * This test will pass once TASK-1.1.2 removes the polling logic.
   */
  it('should NOT start a polling interval when a candidate joins a session', async () => {
    // Arrange: Create a WebSocket service instance
    wsService = new WebSocketService(8080);

    // Create a mock WebSocket client (using the mocked class)
    const EventEmitter = require('events');
    mockClient = new EventEmitter();
    (mockClient as any).readyState = 1; // OPEN state
    (mockClient as any).send = jest.fn();

    // Simulate the client connecting and joining a session
    const joinSessionMessage = {
      type: 'join_session',
      payload: {
        sessionId: 'test-session-123',
        isCandidate: true,
      },
      sessionId: 'test-session-123',
      timestamp: Date.now(),
    };

    // Trigger the connection handler manually
    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    // Set up client data so message handler doesn't reject
    const clientData = {
      sessionId: 'test-session-123',
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    // Trigger the message handler
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(mockClient, JSON.stringify(joinSessionMessage));

    // Act: Fast-forward time by 10 seconds (should be enough to trigger polling)
    jest.advanceTimersByTime(10000);

    // Assert: Verify that setInterval was called (this will FAIL in Red phase)
    // Current implementation WILL FAIL here because it uses setInterval
    expect(setInterval).not.toHaveBeenCalled();

    // Alternative assertion: Verify that analyzeTranscript was NOT called
    // This ensures no polling-based analysis occurred
    expect(vertexAI.analyzeTranscript).not.toHaveBeenCalled();
  });

  /**
   * Additional test to verify no background analysis happens over time
   *
   * This test ensures that even after extended periods, the service
   * doesn't perform any periodic analysis operations.
   */
  it('should NOT perform periodic analysis after candidate joins', async () => {
    // Arrange
    wsService = new WebSocketService(8080);

    const EventEmitter = require('events');
    mockClient = new EventEmitter();
    (mockClient as any).readyState = 1;
    (mockClient as any).send = jest.fn();

    const joinSessionMessage = {
      type: 'join_session',
      payload: {
        sessionId: 'test-session-456',
        isCandidate: true,
      },
      sessionId: 'test-session-456',
      timestamp: Date.now(),
    };

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    // Set up client data
    const clientData = {
      sessionId: 'test-session-456',
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(mockClient, JSON.stringify(joinSessionMessage));

    // Act: Fast-forward through multiple 5-second intervals (30 seconds total)
    jest.advanceTimersByTime(30000);

    // Assert: No analysis should have occurred during this time
    expect(vertexAI.analyzeTranscript).not.toHaveBeenCalled();

    // Verify the service is still responsive (not in a polling loop)
    const session = wsService.getSession('test-session-456');
    expect(session).toBeDefined();
    expect(session?.status).toBe('active');
  });

  /**
   * Test to ensure clean architecture principles
   *
   * The WebSocket service should only handle transport-layer concerns,
   * not orchestrate business logic timing (like when to analyze transcripts).
   */
  it('should follow Single Responsibility Principle - transport only, no business logic timing', () => {
    // Arrange
    wsService = new WebSocketService(8080);

    // Assert: Check that the service doesn't have analysis interval properties
    const serviceInstance = wsService as any;

    // After construction, there should be no analysis interval property
    // Since we removed the property entirely, it should be undefined
    expect(serviceInstance.analysisInterval).toBeUndefined();

    // The service should not be responsible for timing analysis operations
    // Analysis should be triggered by external events, not internal timers
  });
});

/**
 * WebSocketService - Upstream Message Routing Test Suite
 * TDD Phase: Red (Test First)
 *
 * These tests verify that messages from the React frontend are correctly
 * routed through the WebSocketService to the GeminiLiveClient without
 * modification or data loss.
 *
 * Expected behavior: These tests will FAIL until TASK-1.2.4 implements
 * the message routing logic.
 */

// Mock GeminiLiveClient
jest.mock('../../services/gemini-live', () => {
  const EventEmitter = require('events');

  class MockGeminiLiveClient extends EventEmitter {
    connected: boolean = true; // Start connected for tests

    async connect() {
      this.connected = true;
      this.emit('connected');
    }

    disconnect() {
      this.connected = false;
      this.emit('disconnected');
    }

    isConnected() {
      return this.connected;
    }

    send = jest.fn();
    sendAudio = jest.fn();
    sendVideoFrame = jest.fn();
    sendText = jest.fn();
    sendToolResponse = jest.fn();
  }

  return {
    GeminiLiveClient: MockGeminiLiveClient,
  };
});

describe('WebSocketService - Upstream Message Routing', () => {
  let wsService: WebSocketService;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock client first
    const EventEmitter = require('events');
    mockClient = new EventEmitter();
    mockClient.readyState = 1; // OPEN
    mockClient.send = jest.fn();

    // Create service and immediately inject mock gemini client
    // This prevents the async setupGeminiClient from creating its own instance
    wsService = new WebSocketService(8080);
    const { GeminiLiveClient } = require('../../services/gemini-live');
    const geminiClient = new GeminiLiveClient();
    (wsService as any).geminiClient = geminiClient;
  });

  afterEach(() => {
    if (wsService) {
      wsService.close();
    }
  });

  /**
   * TDD Red Phase Test
   *
   * This test verifies that when a client sends an audio message,
   * it gets routed to the GeminiLiveClient correctly.
   *
   * Current implementation WILL FAIL because:
   * - WebSocketService doesn't have GeminiLiveClient integration yet
   * - No routing logic implemented
   *
   * This test will pass once TASK-1.2.4 implements the routing.
   */
  it('should route audio data from client to GeminiLiveClient', async () => {
    // Arrange: Get the mock gemini client from the service
    const geminiClient = (wsService as any).geminiClient;

    // Verify geminiClient is set up
    expect(geminiClient).toBeDefined();
    expect(geminiClient.isConnected()).toBe(true);

    // Simulate client connection
    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    // Set up client data
    const clientData = {
      sessionId: 'test-session-123',
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    // Create session for the client
    const session = (wsService as any).createSession('test-session-123');
    (wsService as any).sessions.set('test-session-123', session);

    // Create audio segment message
    const audioMessage = {
      type: 'audio_segment',
      payload: {
        audioData: 'base64-encoded-pcm16-audio-data',
        transcript: 'Hello, I am thinking about this problem...',
      },
      sessionId: 'test-session-123',
      timestamp: Date.now(),
    };

    // Act: Send the audio message
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(mockClient, JSON.stringify(audioMessage));

    // Assert: Verify the audio was sent to Gemini
    expect(geminiClient.sendAudio).toHaveBeenCalledWith('base64-encoded-pcm16-audio-data');
  });

  /**
   * Test that verifies screen frame routing
   */
  it('should route screen frames from client to GeminiLiveClient', async () => {
    // Arrange: Get the mock gemini client from the service
    const geminiClient = (wsService as any).geminiClient;

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    const clientData = {
      sessionId: 'test-session-456',
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    // Create session for the client
    const session = (wsService as any).createSession('test-session-456');
    (wsService as any).sessions.set('test-session-456', session);

    // Create screen frame message
    const screenFrameMessage = {
      type: 'screen_frame',
      payload: {
        imageData: 'base64-encoded-jpeg-image',
        hasCodeChanges: true,
      },
      sessionId: 'test-session-456',
      timestamp: Date.now(),
    };

    // Act: Send the screen frame message
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(mockClient, JSON.stringify(screenFrameMessage));

    // Assert: Verify the frame was sent to Gemini
    expect(geminiClient.sendVideoFrame).toHaveBeenCalledWith('base64-encoded-jpeg-image');
  });

  /**
   * Test that verifies text message routing
   */
  it('should route text messages from client to GeminiLiveClient', async () => {
    // Arrange: Get the mock gemini client from the service
    const geminiClient = (wsService as any).geminiClient;

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    const clientData = {
      sessionId: 'test-session-789',
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    // Create session for the client
    const session = (wsService as any).createSession('test-session-789');
    (wsService as any).sessions.set('test-session-789', session);

    // Create request feedback message (which should send text to Gemini)
    const feedbackRequestMessage = {
      type: 'request_feedback',
      payload: {
        reason: 'Need help understanding time complexity',
      },
      sessionId: 'test-session-789',
      timestamp: Date.now(),
    };

    // Act: Send the feedback request
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(mockClient, JSON.stringify(feedbackRequestMessage));

    // Assert: Verify a message was sent to Gemini
    // The exact format depends on implementation, but should include the reason
    expect(geminiClient.sendText).toHaveBeenCalled();
  });

  /**
   * Test that verifies data integrity during routing
   */
  it('should not modify or mangle data during routing', async () => {
    // Arrange: Get the mock gemini client from the service
    const geminiClient = (wsService as any).geminiClient;

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    const clientData = {
      sessionId: 'test-session-999',
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    // Create session for the client
    const session = (wsService as any).createSession('test-session-999');
    (wsService as any).sessions.set('test-session-999', session);

    // Create audio message with specific binary data
    const originalAudioData = 'AQIDBAU='; // Base64 for [1,2,3,4,5]
    const audioMessage = {
      type: 'audio_segment',
      payload: {
        audioData: originalAudioData,
        transcript: '',
      },
      sessionId: 'test-session-999',
      timestamp: Date.now(),
    };

    // Act: Send the message
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(mockClient, JSON.stringify(audioMessage));

    // Assert: Verify the exact data was passed through
    expect(geminiClient.sendAudio).toHaveBeenCalledWith(originalAudioData);
  });

  /**
   * Adapter Pattern Architecture Test
   *
   * Verifies that WebSocketService acts as a clean adapter between
   * client connections and the Gemini API, following the Adapter Pattern.
   */
  it('should act as an adapter between client WebSocket and GeminiLiveClient', async () => {
    // Assert: The service should maintain references to both transports
    expect((wsService as any).geminiClient).toBeDefined();
    expect((wsService as any).clients).toBeDefined();

    // The service bridges messages between these two transports
    // without adding business logic (that was removed in Phase 1)
  });
});

describe('WebSocketService - Session Lifecycle and Relay Parity', () => {
  let wsService: WebSocketService;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const EventEmitter = require('events');
    mockClient = new EventEmitter();
    mockClient.readyState = 1;
    mockClient.send = jest.fn();

    wsService = new WebSocketService(8080);
    const { GeminiLiveClient } = require('../../services/gemini-live');
    (wsService as any).geminiClient = new GeminiLiveClient();
  });

  afterEach(() => {
    if (wsService) {
      wsService.close();
    }
  });

  it('should handle explicit start_session and emit session_started', async () => {
    const broadcastSpy = jest.spyOn(wsService as any, 'broadcastToSession');

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    const clientData = {
      clientId: 'client-lifecycle-1',
      sessionId: 'session-lifecycle-1',
      hasJoinedSession: true,
      hasStartedSession: false,
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    const session = (wsService as any).createSession('session-lifecycle-1');
    (wsService as any).sessions.set('session-lifecycle-1', session);

    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockClient,
      JSON.stringify({
        type: 'start_session',
        payload: {
          config: {
            systemInstruction: 'Custom test prompt',
            voiceName: 'Zephyr',
          },
        },
        sessionId: 'session-lifecycle-1',
        timestamp: Date.now(),
      })
    );

    expect(clientData.hasStartedSession).toBe(true);
    expect(broadcastSpy).toHaveBeenCalledWith(
      'session-lifecycle-1',
      expect.objectContaining({
        type: 'session_started',
        payload: expect.objectContaining({
          sessionId: 'session-lifecycle-1',
          voice: 'Zephyr',
        }),
      })
    );

    broadcastSpy.mockRestore();
  });

  it('should relay realtime_input audio/video to Gemini using boxing-coach style envelope', async () => {
    const geminiClient = (wsService as any).geminiClient;

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    const clientData = {
      clientId: 'client-lifecycle-2',
      sessionId: 'session-lifecycle-2',
      hasJoinedSession: true,
      hasStartedSession: true,
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    const session = (wsService as any).createSession('session-lifecycle-2');
    (wsService as any).sessions.set('session-lifecycle-2', session);

    const messageHandler = (wsService as any).handleMessage.bind(wsService);

    await messageHandler(
      mockClient,
      JSON.stringify({
        type: 'realtime_input',
        media: { data: 'audio-chunk-base64', mimeType: 'audio/pcm;rate=16000' },
        sessionId: 'session-lifecycle-2',
        timestamp: Date.now(),
      })
    );

    await messageHandler(
      mockClient,
      JSON.stringify({
        type: 'realtime_input',
        media: { data: 'jpeg-frame-base64', mimeType: 'image/jpeg' },
        sessionId: 'session-lifecycle-2',
        timestamp: Date.now(),
      })
    );

    expect(geminiClient.sendAudio).toHaveBeenCalledWith('audio-chunk-base64');
    expect(geminiClient.sendVideoFrame).toHaveBeenCalledWith('jpeg-frame-base64');
  });

  it('should normalize tool_response payloads and relay function responses to Gemini', async () => {
    const geminiClient = (wsService as any).geminiClient;

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    const clientData = {
      clientId: 'client-lifecycle-3',
      sessionId: 'session-lifecycle-3',
      hasJoinedSession: true,
      hasStartedSession: true,
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    const session = (wsService as any).createSession('session-lifecycle-3');
    (wsService as any).sessions.set('session-lifecycle-3', session);

    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockClient,
      JSON.stringify({
        type: 'tool_response',
        payload: {
          toolCallId: 'tool-call-abc',
          output: { success: true },
        },
        sessionId: 'session-lifecycle-3',
        timestamp: Date.now(),
      })
    );

    expect(geminiClient.sendToolResponse).toHaveBeenCalledWith([
      {
        id: 'tool-call-abc',
        response: { success: true },
      },
    ]);
  });

  it('should accept stop_output and broadcast model_interruption to the session', async () => {
    const broadcastSpy = jest.spyOn(wsService as any, 'broadcastToSession');

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    const clientData = {
      clientId: 'client-lifecycle-4-stop',
      sessionId: 'session-lifecycle-4-stop',
      hasJoinedSession: true,
      hasStartedSession: true,
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    const session = (wsService as any).createSession('session-lifecycle-4-stop');
    (wsService as any).sessions.set('session-lifecycle-4-stop', session);

    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockClient,
      JSON.stringify({
        type: 'stop_output',
        payload: { reason: 'user_speech' },
        sessionId: 'session-lifecycle-4-stop',
        timestamp: Date.now(),
      })
    );

    expect(broadcastSpy).toHaveBeenCalledWith(
      'session-lifecycle-4-stop',
      expect.objectContaining({
        type: 'model_interruption',
        payload: { reason: 'user_speech' },
      })
    );

    broadcastSpy.mockRestore();
  });

  it('should attach correlation identifiers to server error responses for invalid payloads', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    const clientData = {
      clientId: 'client-lifecycle-4',
      sessionId: 'session-lifecycle-4',
      hasJoinedSession: false,
      hasStartedSession: false,
      isCandidate: true,
      lastActivity: Date.now(),
    };
    (wsService as any).clients.set(mockClient, clientData);

    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockClient,
      JSON.stringify({
        type: 'code_update',
        payload: { code: 'const x = 1;', language: 'typescript' },
        sessionId: 'session-lifecycle-4',
        timestamp: Date.now(),
        correlationId: 'corr-invalid-input-1',
      })
    );

    expect((clientData as any).lastCorrelationId).toBe('corr-invalid-input-1');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('corr-invalid-input-1'));

    warnSpy.mockRestore();
  });
});

describe('WebSocketService - Gemini Output Normalization', () => {
  let wsService: WebSocketService;
  let mockClient: any;
  const sessionId = 'normalized-session-123';
  let broadcastSpy: jest.SpyInstance;

  const getBroadcastedMessages = () =>
    broadcastSpy.mock.calls.map(([, message]) => message);

  beforeEach(() => {
    jest.clearAllMocks();

    const EventEmitter = require('events');
    mockClient = new EventEmitter();
    mockClient.readyState = 1;
    mockClient.send = jest.fn();

    wsService = new WebSocketService(8080);
    const { GeminiLiveClient } = require('../../services/gemini-live');
    (wsService as any).geminiClient = new GeminiLiveClient();

    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockClient);

    (wsService as any).clients.set(mockClient, {
      clientId: 'client-normalized-1',
      sessionId,
      hasJoinedSession: true,
      isCandidate: true,
      lastActivity: Date.now(),
    });

    const session = (wsService as any).createSession(sessionId);
    (wsService as any).sessions.set(sessionId, session);
    (wsService as any).activeGeminiSessionId = sessionId;

    broadcastSpy = jest.spyOn(wsService as any, 'broadcastToSession');

    // Ignore initial "connected" event from handleConnection.
    mockClient.send.mockClear();
  });

  afterEach(() => {
    broadcastSpy.mockRestore();
    if (wsService) {
      wsService.close();
    }
  });

  it('should normalize Gemini text/audio/tool parts into stable app-level events', () => {
    const rawGeminiMessage = {
      serverContent: {
        modelTurn: {
          parts: [
            { text: 'Try using a hash map for faster lookup.' },
            { inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'pcm-audio-base64' } },
            {
              functionCall: {
                id: 'tool-call-42',
                name: 'setup_coding_task',
                args: '{"title":"Two Sum","difficulty":"easy"}',
              },
            },
          ],
        },
        turnComplete: true,
      },
    };

    (wsService as any).handleGeminiMessage(rawGeminiMessage);
    const outboundMessages = getBroadcastedMessages();

    const textEvent = outboundMessages.find((m: any) => m.type === 'model_text');
    const audioEvent = outboundMessages.find((m: any) => m.type === 'model_audio');
    const toolEvent = outboundMessages.find((m: any) => m.type === 'model_tool_call');
    const feedbackEvent = outboundMessages.find((m: any) => m.type === 'feedback');

    expect(textEvent).toBeDefined();
    expect(textEvent.payload.text).toBe('Try using a hash map for faster lookup.');
    expect(textEvent.payload.isFinal).toBe(true);

    expect(audioEvent).toBeDefined();
    expect(audioEvent.payload.audioData).toBe('pcm-audio-base64');
    expect(audioEvent.payload).not.toHaveProperty('inlineData');

    expect(toolEvent).toBeDefined();
    expect(toolEvent.payload.tool).toBe('setup_coding_task');
    expect(toolEvent.payload.toolCallId).toBe('tool-call-42');
    expect(toolEvent.payload.args).toEqual({ title: 'Two Sum', difficulty: 'easy' });
    expect(toolEvent).not.toHaveProperty('serverContent');

    expect(feedbackEvent).toBeDefined();
    expect(feedbackEvent.payload.type).toBe('interviewer');
  });

  it('should normalize Gemini interruption signals to model_interruption', () => {
    const rawGeminiMessage = {
      serverContent: {
        interrupted: true,
      },
    };

    (wsService as any).handleGeminiMessage(rawGeminiMessage);
    const outboundMessages = getBroadcastedMessages();

    expect(outboundMessages).toHaveLength(1);
    expect(outboundMessages[0].type).toBe('model_interruption');
    expect(outboundMessages[0].payload).toEqual({ reason: 'user_speech' });
  });

  it('should sanitize unsupported audio and malformed function args during normalization', () => {
    const rawGeminiMessage = {
      serverContent: {
        modelTurn: {
          parts: [
            { inlineData: { mimeType: 'audio/mp3', data: 'should-not-pass' } },
            {
              functionCall: {
                name: 'setup_coding_task',
                args: 'not-json',
              },
            },
          ],
        },
        turnComplete: false,
      },
    };

    (wsService as any).handleGeminiMessage(rawGeminiMessage);
    const outboundMessages = getBroadcastedMessages();

    const audioEvent = outboundMessages.find((m: any) => m.type === 'model_audio');
    const toolEvent = outboundMessages.find((m: any) => m.type === 'model_tool_call');

    expect(audioEvent).toBeUndefined();
    expect(toolEvent).toBeDefined();
    expect(toolEvent.payload.args).toEqual({});
  });
});
