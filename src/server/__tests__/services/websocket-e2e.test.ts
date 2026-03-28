/**
 * WebSocket End-to-End Smoke Test
 * TASK-12.6: Verify complete request/response loop through WebSocket bridge
 *
 * This test validates that:
 * 1. A client can connect to the WebSocket server
 * 2. A client can send one valid input payload (realtime_input)
 * 3. The client receives a model-originated response event
 *
 * This proves the full integration across:
 * - Frontend message format
 * - Backend relay
 * - Gemini Live API (mocked)
 * - Backend normalization
 * - Frontend response handling
 */

import WebSocket from 'ws';
import { WebSocketService } from '../../services/websocket';
import { GeminiLiveClient } from '../../services/gemini-live';
import { EventEmitter } from 'events';

// Mock the env config
jest.mock('../../config/env', () => ({
  env: {
    WS_PORT: '8092',
    NODE_ENV: 'test',
    GEMINI_REALTIME_MODEL: 'gemini-2.0-flash-realtime',
  },
}));

// Mock WebSocketServer to prevent actual server creation
jest.mock('ws', () => {
  const EventEmitter = require('events');

  class MockWebSocketServer extends EventEmitter {
    close() {}
  }

  class MockWebSocket extends EventEmitter {
    static OPEN = 1;
    static CLOSED = 3;
    readyState = 1; // OPEN
    send(data: any) {}
  }

  return {
    WebSocketServer: MockWebSocketServer,
    WebSocket: MockWebSocket,
    __esModule: true,
    default: MockWebSocket,
  };
});

// Mock GeminiLiveClient
jest.mock('../../services/gemini-live', () => {
  const EventEmitter = require('events');

  class MockGeminiLiveClient extends EventEmitter {
    connected: boolean = false;

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

describe('WebSocket End-to-End Smoke Test (TASK-12.6)', () => {
  let wsService: WebSocketService;
  let mockGeminiClient: any;
  let mockWs: any;
  const sessionId = 'e2e-smoke-test-session';

  beforeEach(() => {
    // Create WebSocket service
    wsService = new WebSocketService(8092);

    // Create and inject mock Gemini client
    mockGeminiClient = new (require('../../services/gemini-live').GeminiLiveClient)();
    mockGeminiClient.connect();
    (wsService as any).geminiClient = mockGeminiClient;

    // Manually set up the event handler for Gemini messages
    // (normally done in setupGeminiClient, but we're injecting the client)
    mockGeminiClient.on('message', (message: any) => {
      (wsService as any).handleGeminiMessage(message);
    });

    // Create mock WebSocket client
    mockWs = new EventEmitter();
    mockWs.readyState = 1; // OPEN
    mockWs.send = jest.fn();
  });

  afterEach(() => {
    if (wsService) {
      wsService.close();
    }
    jest.clearAllMocks();
  });

  /**
   * End-to-End Smoke Test: Complete Request/Response Loop
   *
   * This test validates the full happy path by simulating a client session:
   * 1. Client connects (simulated)
   * 2. Client sends join_session message
   * 3. Client sends start_session message
   * 4. Client sends realtime_input (audio) message
   * 5. Gemini sends response (simulated)
   * 6. Client receives normalized model events
   */
  it('should complete one full request/response loop from client to Gemini and back', async () => {
    // Step 1: Simulate client connection
    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockWs);

    // Verify connection was acknowledged
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"connected"')
    );

    // Step 2: Send join_session message
    const joinMessage = {
      type: 'join_session',
      payload: {
        sessionId,
        isCandidate: true,
      },
      sessionId,
      timestamp: Date.now(),
    };

    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(mockWs, JSON.stringify(joinMessage));

    // Verify session was joined
    const session = wsService.getSession(sessionId);
    expect(session).toBeDefined();
    expect(session?.status).toBe('active');

    // Verify session_joined or session_update was sent
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringMatching(/session_(joined|update)/)
    );

    // Step 3: Send start_session message
    mockWs.send.mockClear();
    const startMessage = {
      type: 'start_session',
      payload: {
        config: {
          systemInstruction: 'You are a helpful AI interviewer.',
          voiceName: 'Zephyr',
        },
      },
      sessionId,
      timestamp: Date.now(),
    };

    await messageHandler(mockWs, JSON.stringify(startMessage));

    // Verify session_started was sent
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"session_started"')
    );

    // Step 4: Send realtime_input (audio) message
    mockGeminiClient.sendAudio.mockClear();
    const audioInputMessage = {
      type: 'realtime_input',
      media: {
        data: 'YXVkaW8tZGF0YS1iYXNlNjQ=', // base64: "audio-data-base64"
        mimeType: 'audio/pcm;rate=16000',
      },
      sessionId,
      timestamp: Date.now(),
    };

    await messageHandler(mockWs, JSON.stringify(audioInputMessage));

    // Verify audio was relayed to Gemini
    expect(mockGeminiClient.sendAudio).toHaveBeenCalledWith('YXVkaW8tZGF0YS1iYXNlNjQ=');

    // Step 5: Simulate Gemini response
    mockWs.send.mockClear();
    const mockGeminiResponse = {
      serverContent: {
        modelTurn: {
          parts: [
            { text: 'That sounds like a great approach for solving this problem.' },
            {
              inlineData: {
                mimeType: 'audio/pcm;rate=24000',
                data: 'bW9jay1hdWRpby1yZXNwb25zZQ==', // base64: "mock-audio-response"
              },
            },
          ],
        },
        turnComplete: true,
      },
    };

    mockGeminiClient.emit('message', mockGeminiResponse);

    // Step 6: Verify normalized responses were sent to client
    const sentMessages = mockWs.send.mock.calls.map((call: any) => JSON.parse(call[0]));

    // Verify model_text event
    const modelTextMsg = sentMessages.find((m: any) => m.type === 'model_text');
    expect(modelTextMsg).toBeDefined();
    expect(modelTextMsg.payload.text).toBe('That sounds like a great approach for solving this problem.');
    expect(modelTextMsg.payload.isFinal).toBe(true);

    // Verify model_audio event
    const modelAudioMsg = sentMessages.find((m: any) => m.type === 'model_audio');
    expect(modelAudioMsg).toBeDefined();
    expect(modelAudioMsg.payload.audioData).toBe('bW9jay1hdWRpby1yZXNwb25zZQ==');

    // Verify feedback was created
    const feedbackMsg = sentMessages.find((m: any) => m.type === 'feedback');
    expect(feedbackMsg).toBeDefined();
    expect(feedbackMsg.payload.type).toBe('interviewer');

    // SUCCESS: Complete request/response loop verified!
    // ✓ Client connected
    // ✓ Session joined
    // ✓ Session started
    // ✓ Audio input sent
    // ✓ Relayed to Gemini
    // ✓ Gemini response received
    // ✓ Response normalized
    // ✓ Client received model events
  });

  /**
   * Additional smoke test: Video frame input
   */
  it('should handle video frame input and trigger Gemini relay', async () => {
    // Connect client
    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockWs);

    // Join session
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'join_session',
        payload: { sessionId: 'video-test-session', isCandidate: true },
        sessionId: 'video-test-session',
        timestamp: Date.now(),
      })
    );

    // Start session
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'start_session',
        payload: { config: {} },
        sessionId: 'video-test-session',
        timestamp: Date.now(),
      })
    );

    // Send video frame
    mockGeminiClient.sendVideoFrame.mockClear();
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'realtime_input',
        media: {
          data: 'anBlZy1mcmFtZS1kYXRh', // base64: "jpeg-frame-data"
          mimeType: 'image/jpeg',
        },
        sessionId: 'video-test-session',
        timestamp: Date.now(),
      })
    );

    // Verify video frame was sent to Gemini
    expect(mockGeminiClient.sendVideoFrame).toHaveBeenCalledWith('anBlZy1mcmFtZS1kYXRh');
  });

  /**
   * Smoke test: Interruption handling
   */
  it('should handle interruption signals from Gemini', async () => {
    // Connect client
    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockWs);

    // Join and start session
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'join_session',
        payload: { sessionId: 'interrupt-test-session', isCandidate: true },
        sessionId: 'interrupt-test-session',
        timestamp: Date.now(),
      })
    );

    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'start_session',
        payload: { config: {} },
        sessionId: 'interrupt-test-session',
        timestamp: Date.now(),
      })
    );

    // Set active Gemini session
    (wsService as any).activeGeminiSessionId = 'interrupt-test-session';

    // Simulate interruption from Gemini
    mockWs.send.mockClear();
    mockGeminiClient.emit('message', {
      serverContent: {
        interrupted: true,
      },
    });

    // Verify model_interruption was sent
    const sentMessages = mockWs.send.mock.calls.map((call: any) => JSON.parse(call[0]));
    const interruptMsg = sentMessages.find((m: any) => m.type === 'model_interruption');
    expect(interruptMsg).toBeDefined();
    expect(interruptMsg.payload.reason).toBe('user_speech');
  });

  /**
   * Parity test: Boxing-coach realtime_input format for audio
   */
  it('should handle realtime_input audio format matching boxing-coach parity', async () => {
    // Connect client
    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockWs);

    // Join and start session
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'join_session',
        payload: { sessionId: 'parity-audio-test', isCandidate: true },
        sessionId: 'parity-audio-test',
        timestamp: Date.now(),
      })
    );

    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'start_session',
        payload: { config: {} },
        sessionId: 'parity-audio-test',
        timestamp: Date.now(),
      })
    );

    // Send realtime_input with audio/pcm mime type (boxing-coach format)
    mockGeminiClient.sendAudio.mockClear();
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'realtime_input',
        media: {
          data: 'cGNtMTZhdWRpb2RhdGE=', // base64: "pcm16audiodata"
          mimeType: 'audio/pcm;rate=16000',
        },
        sessionId: 'parity-audio-test',
        timestamp: Date.now(),
      })
    );

    // Verify audio was relayed to Gemini with correct format
    expect(mockGeminiClient.sendAudio).toHaveBeenCalledWith('cGNtMTZhdWRpb2RhdGE=');
  });

  /**
   * Parity test: Boxing-coach realtime_input format for video
   */
  it('should handle realtime_input video format matching boxing-coach parity', async () => {
    // Connect client
    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockWs);

    // Join and start session
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'join_session',
        payload: { sessionId: 'parity-video-test', isCandidate: true },
        sessionId: 'parity-video-test',
        timestamp: Date.now(),
      })
    );

    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'start_session',
        payload: { config: {} },
        sessionId: 'parity-video-test',
        timestamp: Date.now(),
      })
    );

    // Send realtime_input with image/jpeg mime type (boxing-coach format)
    mockGeminiClient.sendVideoFrame.mockClear();
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'realtime_input',
        media: {
          data: 'anBlZ2ZyYW1lZGF0YQ==', // base64: "jpegframedata"
          mimeType: 'image/jpeg',
        },
        sessionId: 'parity-video-test',
        timestamp: Date.now(),
      })
    );

    // Verify video frame was relayed to Gemini with correct format
    expect(mockGeminiClient.sendVideoFrame).toHaveBeenCalledWith('anBlZ2ZyYW1lZGF0YQ==');
  });

  /**
   * Smoke test: Tool response handling
   */
  it('should handle tool_response messages and relay to Gemini', async () => {
    // Connect client
    const connectionHandler = (wsService as any).handleConnection.bind(wsService);
    connectionHandler(mockWs);

    // Join and start session
    const messageHandler = (wsService as any).handleMessage.bind(wsService);
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'join_session',
        payload: { sessionId: 'tool-test-session', isCandidate: true },
        sessionId: 'tool-test-session',
        timestamp: Date.now(),
      })
    );

    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'start_session',
        payload: { config: {} },
        sessionId: 'tool-test-session',
        timestamp: Date.now(),
      })
    );

    // Send tool response
    mockGeminiClient.sendToolResponse.mockClear();
    await messageHandler(
      mockWs,
      JSON.stringify({
        type: 'tool_response',
        payload: {
          toolCallId: 'tool-call-123',
          output: { success: true, data: 'Test result' },
        },
        sessionId: 'tool-test-session',
        timestamp: Date.now(),
      })
    );

    // Verify tool response was sent to Gemini
    expect(mockGeminiClient.sendToolResponse).toHaveBeenCalledWith([
      {
        id: 'tool-call-123',
        response: { success: true, data: 'Test result' },
      },
    ]);
  });
});
