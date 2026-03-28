import { useInterviewStore } from '../store/interviewStore';
import { audioPlaybackQueue } from './AudioPlaybackQueue';

const WS_URL = 'ws://localhost:3002';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  connect(sessionId: string, isCandidate: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
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
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    const { addFeedback, acknowledgeFeedback, addTranscript, updateMetrics, endSession } = useInterviewStore.getState();

    switch (message.type) {
      case 'session_joined':
        useInterviewStore.getState().joinSession();
        console.log('[WebSocket] Joined session:', message.payload.sessionId);
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
        console.log('[WebSocket] AI interrupted:', message.payload.reason);

        // Stop audio playback and clear queue
        audioPlaybackQueue.stop();
        break;

      case 'model_tool_call':
        // AI wants to execute a tool (e.g., update code editor)
        console.log('[WebSocket] AI tool call:', message.payload.tool, message.payload.args);

        // TODO: Implement tool call dispatcher (Task 1.5.2)
        // this.executeToolCall(message.payload);
        break;

      case 'feedback':
        // Structured feedback from backend
        addFeedback(message.payload);
        break;

      case 'session_update':
        // Handle session status updates
        console.log('[WebSocket] Session update:', message.payload.status);
        break;

      case 'error':
        console.error('[WebSocket] Error:', message.payload.message);

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
        console.warn('[WebSocket] Unknown message type:', message.type);
    }
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      const { sessionId } = useInterviewStore.getState();
      if (sessionId) {
        console.log('Attempting to reconnect...');
        this.connect(sessionId, true).catch(console.error);
      }
    }, 3000);
  }

  sendCodeUpdate(code: string, language: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.ws.send(
      JSON.stringify({
        type: 'code_update',
        payload: { code, language },
        sessionId,
        timestamp: Date.now(),
      })
    );
  }

  sendRawAudio(base64Audio: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.ws.send(
      JSON.stringify({
        type: 'audio_segment',
        payload: {
          audioData: base64Audio,
          timestamp: Date.now(),
        },
        sessionId,
        timestamp: Date.now(),
      })
    );
  }

  sendAudioSegment(transcript: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.ws.send(
      JSON.stringify({
        type: 'audio_segment',
        payload: {
          timestamp: Date.now(),
          transcript,
          duration: 0,
        },
        sessionId,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Send screen frame with base64-encoded JPEG image data
   * @param imageData - Base64-encoded JPEG image (without data:image/jpeg;base64, prefix)
   * @param hasCodeChanges - Whether code has changed since last frame
   */
  sendScreenFrame(imageData: string, hasCodeChanges: boolean = false) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.ws.send(
      JSON.stringify({
        type: 'screen_frame',
        payload: {
          imageData,
          hasCodeChanges,
          timestamp: Date.now(),
        },
        sessionId,
        timestamp: Date.now(),
      })
    );
  }

  requestFeedback(reason: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.ws.send(
      JSON.stringify({
        type: 'request_feedback',
        payload: { reason },
        sessionId,
        timestamp: Date.now(),
      })
    );
  }

  acknowledgeFeedback(feedbackId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const { sessionId } = useInterviewStore.getState();
    if (!sessionId) return;

    this.ws.send(
      JSON.stringify({
        type: 'acknowledge_feedback',
        payload: { feedbackId },
        sessionId,
        timestamp: Date.now(),
      })
    );
  }

  endSession() {
    if (this.ws) {
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
