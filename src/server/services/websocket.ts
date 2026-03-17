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
  private analysisInterval: NodeJS.Timeout | null = null;
  private feedbackQueue: Map<string, Feedback[]> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupEventHandlers();
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

    // Start analysis interval for this session
    this.startSessionAnalysis(sessionId);

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

    // Get recent transcript
    const recentTranscript = session.transcriptSegments
      ?.slice(-5)
      .map(t => t.text) || [];

    // Get recent code
    const recentCode = session.codeSnippets?.slice(-1)[0]?.content || '';

    // Generate feedback using Vertex AI
    const feedbackContent = await vertexAI.generateFeedback(
      {
        type: 'manual',
        details: payload.reason,
      },
      {
        transcript: recentTranscript,
        code: recentCode,
        metrics: session.metrics,
      }
    );

    // Create feedback object
    const feedback: Feedback = {
      id: uuidv4(),
      sessionId: clientData.sessionId,
      type: 'hint',
      content: feedbackContent,
      timestamp: new Date(),
      trigger: { type: 'manual', details: payload.reason },
      acknowledged: false,
    };

    session.feedback.push(feedback);
    session.metrics.feedbackCount++;

    // Send feedback to candidate
    this.send(ws, {
      type: 'feedback',
      payload: feedback,
      sessionId: clientData.sessionId,
      timestamp: Date.now(),
    });
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
          
          // Stop analysis
          this.stopSessionAnalysis(clientData.sessionId);
        }
      }
    }
    this.clients.delete(ws);
  }

  private startSessionAnalysis(sessionId: string) {
    // Stop existing interval if any
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    // Run analysis every 5 seconds
    this.analysisInterval = setInterval(async () => {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'active') return;

      try {
        await this.runSessionAnalysis(session);
      } catch (error) {
        console.error('Error in session analysis:', error);
      }
    }, 5000);
  }

  private stopSessionAnalysis(sessionId: string) {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  private async runSessionAnalysis(session: InterviewSession) {
    const recentTranscript = session.transcriptSegments || [];
    
    // Calculate time since last activity
    const lastActivity = Array.from(this.clients.values())
      .filter(c => c.sessionId === session.sessionId)
      .reduce((max, c) => Math.max(max, c.lastActivity), 0);
    
    const idleTime = (Date.now() - lastActivity) / 1000;

    // Update stuck time
    if (idleTime > 5) {
      session.metrics.stuckTime += 5;
    }

    // Update total time
    session.metrics.totalTime = Math.floor(
      (Date.now() - session.createdAt.getTime()) / 1000
    );

    // Analyze transcript if there's recent speech
    if (recentTranscript.length > 0) {
      const analysis = await vertexAI.analyzeTranscript(
        recentTranscript,
        {
          currentQuestion: session.currentQuestion?.title,
          sessionDuration: session.metrics.totalTime,
          codeActivity: session.metrics.codeLinesWritten > 0,
        }
      );

      // Check for stuck detection
      if (analysis.detectedState === 'stuck' && analysis.confidence > 0.7) {
        this.generateStuckFeedback(session, analysis);
      }

      // Check for missing signals
      this.checkForMissingSignals(session, analysis);
    }
  }

  private async generateStuckFeedback(session: InterviewSession, analysis: AnalysisResult) {
    // Avoid spamming feedback
    const recentFeedback = session.feedback
      .filter(f => f.trigger.type === 'stuck_detection')
      .slice(-2);

    if (recentFeedback.length >= 2) {
      return; // Already provided recent stuck feedback
    }

    const recentTranscript = session.transcriptSegments
      ?.slice(-5)
      .map(t => t.text) || [];

    const feedbackContent = await vertexAI.generateFeedback(
      {
        type: 'stuck_detection',
        details: 'Candidate appears to be stuck',
      },
      {
        transcript: recentTranscript,
        code: session.codeSnippets?.slice(-1)[0]?.content,
        metrics: session.metrics,
      }
    );

    const feedback: Feedback = {
      id: uuidv4(),
      sessionId: session.sessionId,
      type: 'coach',
      content: feedbackContent,
      timestamp: new Date(),
      trigger: { type: 'stuck_detection', details: analysis.recommendations.join(', ') },
      acknowledged: false,
    };

    session.feedback.push(feedback);
    session.metrics.feedbackCount++;

    this.broadcastToSession(session.sessionId, {
      type: 'feedback',
      payload: feedback,
      sessionId: session.sessionId,
      timestamp: Date.now(),
    });
  }

  private async checkForMissingSignals(session: InterviewSession, analysis: AnalysisResult) {
    // Check if complexity discussion is missing after significant coding
    if (
      !analysis.signals.isDiscussingComplexity &&
      session.metrics.codeLinesWritten > 10 &&
      session.metrics.totalTime > 60
    ) {
      const recentFeedback = session.feedback.filter(
        f => f.trigger.details?.includes('complexity')
      );

      if (recentFeedback.length < 2) {
        const feedbackContent = await vertexAI.generateFeedback(
          {
            type: 'missing_signal',
            details: 'missing complexity discussion',
          },
          {
            transcript: session.transcriptSegments?.slice(-5).map(t => t.text) || [],
            metrics: session.metrics,
          }
        );

        const feedback: Feedback = {
          id: uuidv4(),
          sessionId: session.sessionId,
          type: 'coach',
          content: feedbackContent,
          timestamp: new Date(),
          trigger: { type: 'missing_signal', details: 'complexity' },
          acknowledged: false,
        };

        session.feedback.push(feedback);
        session.metrics.feedbackCount++;

        this.broadcastToSession(session.sessionId, {
          type: 'feedback',
          payload: feedback,
          sessionId: session.sessionId,
          timestamp: Date.now(),
        });
      }
    }
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
      this.stopSessionAnalysis(sessionId);
      return session;
    }
    return null;
  }

  close() {
    this.wss.close();
  }
}

export const wsService = new WebSocketService(parseInt(env.WS_PORT));
