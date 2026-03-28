import WebSocket, { WebSocketServer } from 'ws';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import {
  InterviewSession,
  Feedback,
  TranscriptSegment,
  AnalysisResult,
  AudioSegment,
  ScreenCaptureFrame
} from '../types';
import { vertexAI } from './vertex-ai';
import { GeminiLiveClient } from './gemini-live';

interface ClientData {
  sessionId: string;
  isCandidate: boolean;
  lastActivity: number;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  sessionId: string;
  timestamp: number;
}

/**
 * WebSocket Service - Handles real-time communication
 */
export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientData> = new Map();
  private sessions: Map<string, InterviewSession> = new Map();
  private feedbackQueue: Map<string, Feedback[]> = new Map();
  private geminiClient: GeminiLiveClient | null = null;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupEventHandlers();

    // Only setup Gemini client in non-test environments
    if (env.NODE_ENV !== 'test') {
      this.setupGeminiClient();
    }

    console.log(`WebSocket server started on port ${port}`);
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private async setupGeminiClient() {
    // Skip setup if geminiClient already exists (e.g., injected for testing)
    if (this.geminiClient) {
      return;
    }

    try {
      this.geminiClient = new GeminiLiveClient();

      // Set up event handlers for Gemini client
      this.geminiClient.on('connected', () => {
        console.log('[WebSocketService] Connected to Gemini Live API');
      });

      this.geminiClient.on('disconnected', () => {
        console.log('[WebSocketService] Disconnected from Gemini Live API');
      });

      this.geminiClient.on('message', (message) => {
        // Handle responses from Gemini and broadcast to clients
        this.handleGeminiMessage(message);
      });

      this.geminiClient.on('error', (error) => {
        console.error('[WebSocketService] Gemini client error:', error);
      });

      // Connect to Gemini Live API
      await this.geminiClient.connect();
    } catch (error) {
      console.error('[WebSocketService] Failed to connect to Gemini:', error);
      // Continue without Gemini - service can still handle local operations
    }
  }

  private handleConnection(ws: WebSocket) {
    const clientId = uuidv4();
    
    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });

    // Send welcome message
    this.send(ws, {
      type: 'connected',
      payload: {
        clientId,
        message: 'Connected to interview simulator',
      },
      sessionId: clientId,
      timestamp: Date.now(),
    });
  }

  private async handleMessage(ws: WebSocket, data: WebSocket.Data) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const clientData = this.clients.get(ws);

      if (!clientData) {
        this.send(ws, {
          type: 'error',
          payload: { message: 'Not authenticated' },
          sessionId: 'unknown',
          timestamp: Date.now(),
        });
        return;
      }

      // Update last activity
      clientData.lastActivity = Date.now();

      // Handle different message types
      switch (message.type) {
        case 'join_session':
          await this.handleJoinSession(ws, message.payload, clientData);
          break;

        case 'audio_segment':
          await this.handleAudioSegment(ws, message.payload, clientData);
          break;

        case 'screen_frame':
          await this.handleScreenFrame(ws, message.payload, clientData);
          break;

        case 'code_update':
          await this.handleCodeUpdate(ws, message.payload, clientData);
          break;

        case 'request_feedback':
          await this.handleFeedbackRequest(ws, message.payload, clientData);
          break;

        case 'acknowledge_feedback':
          this.handleFeedbackAcknowledgement(message.payload, clientData);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.send(ws, {
        type: 'error',
        payload: { message: 'Invalid message format' },
        sessionId: 'unknown',
        timestamp: Date.now(),
      });
    }
  }

  private async handleJoinSession(
    ws: WebSocket,
    payload: { sessionId: string; isCandidate: boolean },
    clientData: ClientData
  ) {
    const { sessionId, isCandidate } = payload;

    // Create or retrieve session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }

    clientData.sessionId = sessionId;
    clientData.isCandidate = isCandidate;

    // Update session status if candidate joins
    if (isCandidate) {
      session.status = 'active';
      session.updatedAt = new Date();
    }

    this.sessions.set(sessionId, session);

    // Notify all clients in session
    this.broadcastToSession(sessionId, {
      type: 'session_update',
      payload: {
        sessionId,
        status: session.status,
      },
      sessionId,
      timestamp: Date.now(),
    });

    this.send(ws, {
      type: 'session_joined',
      payload: {
        sessionId,
        isCandidate,
        currentQuestion: session.currentQuestion,
      },
      sessionId,
      timestamp: Date.now(),
    });
  }

  private createSession(sessionId: string): InterviewSession {
    return {
      sessionId,
      candidateId: '',
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [],
      feedback: [],
      metrics: {
        totalTime: 0,
        stuckTime: 0,
        codeLinesWritten: 0,
        testCasesPassed: 0,
        testCasesFailed: 0,
        hintsRequested: 0,
        feedbackCount: 0,
        communicationScore: 0,
        technicalScore: 0,
      },
    };
  }

  private async handleAudioSegment(
    ws: WebSocket,
    payload: AudioSegment,
    clientData: ClientData
  ) {
    const session = this.sessions.get(clientData.sessionId);
    if (!session || clientData.isCandidate === false) return;

    // Store transcript segment
    if (payload.transcript) {
      const segment: TranscriptSegment = {
        id: uuidv4(),
        sessionId: clientData.sessionId,
        speaker: 'candidate',
        text: payload.transcript,
        timestamp: new Date(),
      };

      // Add to session transcript (keep last 50 segments)
      if (!session.transcriptSegments) {
        session.transcriptSegments = [];
      }
      session.transcriptSegments.push(segment);
      session.transcriptSegments = session.transcriptSegments.slice(-50);
    }

    // Route audio to Gemini Live API
    if (this.geminiClient && this.geminiClient.isConnected() && payload.audioData) {
      const base64Audio = Buffer.isBuffer(payload.audioData)
        ? payload.audioData.toString('base64')
        : payload.audioData;
      this.geminiClient.sendAudio(base64Audio);
    }
  }

  private async handleScreenFrame(
    ws: WebSocket,
    payload: ScreenCaptureFrame,
    clientData: ClientData
  ) {
    const session = this.sessions.get(clientData.sessionId);
    if (!session) return;

    // Update code activity metrics
    if (payload.hasCodeChanges) {
      session.metrics.codeLinesWritten++;
    }

    // Route screen frame to Gemini Live API
    if (this.geminiClient && this.geminiClient.isConnected() && payload.imageData) {
      const base64Image = Buffer.isBuffer(payload.imageData)
        ? payload.imageData.toString('base64')
        : payload.imageData;
      this.geminiClient.sendVideoFrame(base64Image);
    }
  }

  private async handleCodeUpdate(
    ws: WebSocket,
    payload: { code: string; language: string },
    clientData: ClientData
  ) {
    const session = this.sessions.get(clientData.sessionId);
    if (!session) return;

    // Store code snippet
    if (!session.codeSnippets) {
      session.codeSnippets = [];
    }

    session.codeSnippets.push({
      id: uuidv4(),
      sessionId: clientData.sessionId,
      language: payload.language,
      content: payload.code,
      timestamp: new Date(),
      isFinal: false,
    });

    // Keep last 20 snippets
    session.codeSnippets = session.codeSnippets.slice(-20);
  }

  private async handleFeedbackRequest(
    ws: WebSocket,
    payload: { reason: string },
    clientData: ClientData
  ) {
    const session = this.sessions.get(clientData.sessionId);
    if (!session) return;

    // Increment hints requested
    session.metrics.hintsRequested++;

    // Route text request to Gemini Live API
    if (this.geminiClient && this.geminiClient.isConnected()) {
      const requestText = `The candidate is requesting help: ${payload.reason}`;
      this.geminiClient.sendText(requestText);
    }

    // Note: The response will come through handleGeminiMessage
    // and will be broadcast to the client as feedback
  }

  private handleFeedbackAcknowledgement(
    payload: { feedbackId: string },
    clientData: ClientData
  ) {
    const session = this.sessions.get(clientData.sessionId);
    if (!session) return;

    const feedback = session.feedback.find(f => f.id === payload.feedbackId);
    if (feedback) {
      feedback.acknowledged = true;
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const clientData = this.clients.get(ws);
    if (clientData) {
      const session = this.sessions.get(clientData.sessionId);
      if (session) {
        // Check if last client left
        const remainingClients = this.clients.size - 1;
        if (remainingClients === 0) {
          session.status = 'completed';
          session.updatedAt = new Date();
        }
      }
    }
    this.clients.delete(ws);
  }



  /**
   * Handles messages received from Gemini Live API
   * and broadcasts them to connected clients
   */
  private handleGeminiMessage(message: any) {
    // Extract text or audio response from Gemini
    // The message format follows Gemini Live API structure

    // Broadcast to all connected clients
    // For now, we'll broadcast raw Gemini messages
    // In production, you might transform these into app-specific formats
    this.clients.forEach((clientData, ws) => {
      this.send(ws, {
        type: 'gemini_response',
        payload: message,
        sessionId: clientData.sessionId,
        timestamp: Date.now(),
      });
    });
  }

  private send(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastToSession(sessionId: string, message: WebSocketMessage) {
    this.clients.forEach((clientData, ws) => {
      if (clientData.sessionId === sessionId) {
        this.send(ws, message);
      }
    });
  }

  getSession(sessionId: string): InterviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  endSession(sessionId: string): InterviewSession | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.updatedAt = new Date();
      return session;
    }
    return null;
  }

  close() {
    if (this.geminiClient) {
      this.geminiClient.disconnect();
    }
    this.wss.close();
  }
}

export const wsService = new WebSocketService(parseInt(env.WS_PORT));
