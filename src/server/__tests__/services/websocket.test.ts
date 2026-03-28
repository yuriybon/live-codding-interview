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
