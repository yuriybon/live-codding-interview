import { useInterviewStore } from '../store/interviewStore';
import { audioPlaybackQueue } from './AudioPlaybackQueue';

const WS_URL = 'ws://localhost:3002';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionCorrelationId: string | null = null;
  private correlationSequence: number = 0;

  private createCorrelationId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private nextCorrelationId(): string {
    this.correlationSequence += 1;
    const base = this.connectionCorrelationId ?? this.createCorrelationId();
    return `${base}-${this.correlationSequence}`;
  }

  private logDiagnostic(event: string, details: Record<string, unknown> = {}, level: 'info' | 'warn' | 'error' = 'info') {
    const entry = {
      ts: new Date().toISOString(),
      event,
      connectionCorrelationId: this.connectionCorrelationId,
      ...details,
    };
    const serialized = `[WS_CLIENT_DIAG] ${JSON.stringify(entry)}`;
    if (level === 'error') {
      console.error(serialized);
      return;
    }
    if (level === 'warn') {
      console.warn(serialized);
      return;
    }
    console.log(serialized);
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const correlationId =
        typeof message?.correlationId === 'string' && message.correlationId.length > 0
          ? message.correlationId
          : this.nextCorrelationId();
      const serialized = {
        ...message,
        correlationId,
      };
      this.ws.send(JSON.stringify(serialized));
      this.logDiagnostic('outbound_message', {
        messageType: serialized.type,
        sessionId: serialized.sessionId,
        correlationId,
      });
    }
  }

  connect(sessionId: string, isCandidate: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.connectionCorrelationId = this.createCorrelationId();
        this.correlationSequence = 0;
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          this.logDiagnostic('connection_open', {
            sessionId,
            wsUrl: WS_URL,
          });
          this.send({
            type: 'join_session',
            payload: { sessionId, isCandidate },
            sessionId,
            timestamp: Date.now(),
          });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.logDiagnostic('inbound_message', {
              messageType: message?.type,
              sessionId: message?.sessionId,
              correlationId: message?.correlationId,
            });
            this.handleMessage(message);
          } catch (error) {
            this.logDiagnostic(
              'inbound_parse_failed',
              {
                failureSource: 'provider_response',
                reason: error instanceof Error ? error.message : 'Unknown parse error',
              },
              'error'
            );
          }
        };

        this.ws.onerror = (error) => {
          this.logDiagnostic(
            'connection_error',
            {
              sessionId,
              failureSource: 'backend_routing',
              reason: 'WebSocket error event received on client',
            },
            'error'
          );
          reject(error);
        };

        this.ws.onclose = () => {
          this.logDiagnostic('connection_closed', {
            sessionId,
          }, 'warn');
          this.attemptReconnect();
        };
      } catch (error) {
        this.logDiagnostic(
          'connection_setup_failed',
          {
            sessionId,
            failureSource: 'backend_routing',
            reason: error instanceof Error ? error.message : 'Unknown connection setup error',
          },
          'error'
        );
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    const { addFeedback, addTranscript, endSession } = useInterviewStore.getState();

    switch (message.type) {
      case 'session_joined':
        useInterviewStore.getState().joinSession();
        this.logDiagnostic('session_joined', {
          sessionId: message.payload.sessionId,
          correlationId: message.correlationId,
        });
        break;

      case 'model_text':
        // AI interviewer text response
        console.log('[WebSocket] AI text:', message.payload.text);

        // Add to feedback panel for visibility
        addFeedback({
          id: `model-${Date.now()}`,
          type: 'interviewer',
          content: message.payload.text,
          trigger: {
            type: 'analysis',
            details: message.payload.metadata?.responseType || 'AI response',
          },
          timestamp: new Date(message.timestamp),
          acknowledged: false,
        });
        break;

      case 'model_audio':
        // AI interviewer voice response
        console.log('[WebSocket] AI audio chunk received:', message.payload.audioData.length, 'bytes',
                    'isFinal:', message.payload.isFinal);

        // Queue for Web Audio API playback
        audioPlaybackQueue.enqueue(message.payload.audioData);
        break;

      case 'model_interruption':
        // AI was interrupted by user
        this.logDiagnostic('model_interruption', {
          sessionId: message.sessionId,
          correlationId: message.correlationId,
          reason: message.payload.reason,
        });

        // Stop audio playback and clear queue
        audioPlaybackQueue.stop();
        break;

      case 'model_tool_call':
        // AI wants to execute a tool (e.g., update code editor)
        console.log('[WebSocket] AI tool call:', message.payload.tool, message.payload.args);
        this.executeToolCall(message.payload);
        break;

      case 'feedback':
        // Structured feedback from backend
        addFeedback(message.payload);
        break;

      case 'session_update':
        // Handle session status updates
        this.logDiagnostic('session_update', {
          sessionId: message.sessionId,
          correlationId: message.correlationId,
          status: message.payload.status,
        });
        break;

      case 'error':
        this.logDiagnostic(
          'server_error',
          {
            sessionId: message.sessionId,
            correlationId: message.correlationId,
            failureSource: 'backend_routing',
            reason: message.payload.message,
            code: message.payload.code,
          },
          'error'
        );

        // Show error in UI
        addFeedback({
          id: `error-${Date.now()}`,
          type: 'correction',
          content: `Error: ${message.payload.message}`,
          trigger: {
            type: 'manual',
            details: message.payload.code || 'WEBSOCKET_ERROR',
          },
          timestamp: new Date(message.timestamp),
          acknowledged: false,
        });
        break;

      default:
        this.logDiagnostic(
          'unknown_message_type',
          {
            sessionId: message.sessionId,
            correlationId: message.correlationId,
            messageType: message.type,
          },
          'warn'
        );
    }
  }

  private executeToolCall(payload: { tool: string; args: any; toolCallId: string }) {
    const { handleToolCall } = useInterviewStore.getState();

    try {
      // 1. Update the store (UI state)
      handleToolCall(payload);

      // 2. Respond to Gemini to acknowledge the tool was executed
      // This is critical to prevent the AI from waiting forever
      this.sendToolResponse(payload.toolCallId, {
        success: true,
        message: `Successfully executed ${payload.tool}`,
      });
    } catch (error: any) {
      this.logDiagnostic(
        'tool_execution_failed',
        {
          tool: payload.tool,
          toolCallId: payload.toolCallId,
          failureSource: 'client_payload',
          reason: error?.message || 'Unknown tool execution error',
        },
        'error'
      );

      this.sendToolResponse(payload.toolCallId, {
        success: false,
        error: error.message,
      });
    }
  }

  private sendToolResponse(toolCallId: string, output: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.send({
      type: 'tool_response',
      payload: {
        toolCallId,
        output,
      },
      sessionId,
      timestamp: Date.now(),
    });
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      const { sessionId } = useInterviewStore.getState();
      if (sessionId) {
        this.logDiagnostic('reconnect_attempt', { sessionId }, 'warn');
        this.connect(sessionId, true).catch(console.error);
      }
    }, 3000);
  }

  sendCodeUpdate(code: string, language: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.send({
      type: 'code_update',
      payload: { code, language },
      sessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Send raw PCM16 audio data using boxing-coach parity format
   * Uses unified realtime_input message type with audio/pcm mime type
   * @param base64Audio - Base64-encoded PCM16 audio data
   */
  sendRawAudio(base64Audio: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    // Boxing-coach parity: Use realtime_input with media.mimeType
    this.send({
      type: 'realtime_input',
      media: {
        data: base64Audio,
        mimeType: 'audio/pcm;rate=16000',
      },
      sessionId,
      timestamp: Date.now(),
    });
  }

  sendAudioSegment(transcript: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.send({
      type: 'audio_segment',
      payload: {
        timestamp: Date.now(),
        transcript,
        duration: 0,
      },
      sessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Send screen frame with base64-encoded JPEG image data using boxing-coach parity format
   * Uses unified realtime_input message type with image/jpeg mime type
   * @param imageData - Base64-encoded JPEG image (without data:image/jpeg;base64, prefix)
   * @param hasCodeChanges - Whether code has changed since last frame (tracked for analytics)
   */
  sendScreenFrame(imageData: string, hasCodeChanges: boolean = false) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    // Boxing-coach parity: Use realtime_input with media.mimeType
    // Note: hasCodeChanges is tracked separately for metrics but not in the media payload
    this.send({
      type: 'realtime_input',
      media: {
        data: imageData,
        mimeType: 'image/jpeg',
      },
      sessionId,
      timestamp: Date.now(),
    });
  }

  requestFeedback(reason: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.send({
      type: 'request_feedback',
      payload: { reason },
      sessionId,
      timestamp: Date.now(),
    });
  }

  acknowledgeFeedback(feedbackId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.send({
      type: 'acknowledge_feedback',
      payload: { feedbackId },
      sessionId,
      timestamp: Date.now(),
    });
  }

  endSession() {
    if (this.ws) {
      this.logDiagnostic('connection_manual_close', {
        sessionId: useInterviewStore.getState().sessionId,
      });
      this.ws.close();
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws = null;
    useInterviewStore.getState().endSession();
  }
}

export const wsClient = new WebSocketClient();
