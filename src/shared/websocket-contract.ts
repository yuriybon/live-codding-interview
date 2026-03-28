/**
 * WebSocket Message Contract v1.0
 *
 * This file defines the canonical schema for all WebSocket messages
 * exchanged between frontend and backend in the AI Interview Simulator.
 *
 * Version: 1.0.0
 * Last Updated: 2026-03-28
 */

// ============================================================================
// Base Message Structure
// ============================================================================

/**
 * Base structure for all WebSocket messages
 */
export interface BaseMessage {
  /** Message type identifier */
  type: string;
  /** Message payload (type-specific) */
  payload: unknown;
  /** Session identifier */
  sessionId: string;
  /** Unix timestamp (milliseconds) */
  timestamp: number;
}

// ============================================================================
// Client → Server Messages (Outbound)
// ============================================================================

/**
 * Client joins a session
 */
export interface JoinSessionMessage extends BaseMessage {
  type: 'join_session';
  payload: {
    /** Session ID to join */
    sessionId: string;
    /** Whether this client is the candidate (vs observer) */
    isCandidate: boolean;
  };
}

/**
 * Client sends audio segment
 */
export interface AudioSegmentMessage extends BaseMessage {
  type: 'audio_segment';
  payload: {
    /** Base64-encoded PCM16 audio data (16kHz, mono, 16-bit) */
    audioData: string;
    /** Transcript of the audio (optional, from Web Speech API) */
    transcript?: string;
    /** Duration in milliseconds */
    duration?: number;
  };
}

/**
 * Client sends screen capture frame
 */
export interface ScreenFrameMessage extends BaseMessage {
  type: 'screen_frame';
  payload: {
    /** Base64-encoded JPEG image data (without data:image/jpeg;base64, prefix) */
    imageData: string;
    /** Whether code has changed since last frame */
    hasCodeChanges: boolean;
  };
}

/**
 * Client sends code update
 */
export interface CodeUpdateMessage extends BaseMessage {
  type: 'code_update';
  payload: {
    /** Source code content */
    code: string;
    /** Programming language (e.g., 'javascript', 'python', 'typescript') */
    language: string;
  };
}

/**
 * Client requests feedback/hint
 */
export interface RequestFeedbackMessage extends BaseMessage {
  type: 'request_feedback';
  payload: {
    /** Reason for requesting feedback */
    reason: string;
  };
}

/**
 * Client acknowledges received feedback
 */
export interface AcknowledgeFeedbackMessage extends BaseMessage {
  type: 'acknowledge_feedback';
  payload: {
    /** ID of the feedback being acknowledged */
    feedbackId: string;
  };
}

/**
 * Union type for all client → server messages
 */
export type ClientMessage =
  | JoinSessionMessage
  | AudioSegmentMessage
  | ScreenFrameMessage
  | CodeUpdateMessage
  | RequestFeedbackMessage
  | AcknowledgeFeedbackMessage;

// ============================================================================
// Server → Client Messages (Inbound)
// ============================================================================

/**
 * Server confirms connection
 */
export interface ConnectedMessage extends BaseMessage {
  type: 'connected';
  payload: {
    /** Temporary client ID assigned by server */
    clientId: string;
    /** Welcome message */
    message: string;
  };
}

/**
 * Server confirms session joined
 */
export interface SessionJoinedMessage extends BaseMessage {
  type: 'session_joined';
  payload: {
    /** Session ID */
    sessionId: string;
    /** Whether this client is the candidate */
    isCandidate: boolean;
    /** Current question details (if any) */
    currentQuestion?: {
      id: string;
      title: string;
      difficulty: 'easy' | 'medium' | 'hard';
      description: string;
    };
  };
}

/**
 * Server sends session status update
 */
export interface SessionUpdateMessage extends BaseMessage {
  type: 'session_update';
  payload: {
    /** Session ID */
    sessionId: string;
    /** Current session status */
    status: 'idle' | 'active' | 'paused' | 'completed';
  };
}

/**
 * Server sends normalized model text response
 * This is text output from the AI interviewer
 */
export interface ModelTextMessage extends BaseMessage {
  type: 'model_text';
  payload: {
    /** Text content from the model */
    text: string;
    /** Whether this is final text or partial/streaming */
    isFinal: boolean;
    /** Optional metadata */
    metadata?: {
      /** Type of response */
      responseType?: 'hint' | 'question' | 'observation' | 'encouragement';
      /** Confidence score (0-1) */
      confidence?: number;
    };
  };
}

/**
 * Server sends normalized model audio response
 * This is PCM16 audio that should be played back
 */
export interface ModelAudioMessage extends BaseMessage {
  type: 'model_audio';
  payload: {
    /** Base64-encoded PCM16 audio data (24kHz, mono, 16-bit linear PCM) */
    audioData: string;
    /** Duration in milliseconds (if known) */
    duration?: number;
    /** Whether this is the final audio chunk */
    isFinal: boolean;
  };
}

/**
 * Server sends model interruption signal
 * Indicates the model was interrupted by user input
 */
export interface ModelInterruptionMessage extends BaseMessage {
  type: 'model_interruption';
  payload: {
    /** Reason for interruption */
    reason: 'user_speech' | 'user_input' | 'timeout';
  };
}

/**
 * Server sends model tool call
 * Instructs frontend to execute a specific action
 */
export interface ModelToolCallMessage extends BaseMessage {
  type: 'model_tool_call';
  payload: {
    /** Tool name */
    tool: string;
    /** Tool arguments */
    args: Record<string, unknown>;
    /** Tool call ID for tracking */
    toolCallId: string;
  };
}

/**
 * Server sends feedback to client
 */
export interface FeedbackMessage extends BaseMessage {
  type: 'feedback';
  payload: {
    /** Unique feedback ID */
    id: string;
    /** Feedback type */
    type: 'hint' | 'coach' | 'interviewer' | 'correction';
    /** Feedback content */
    content: string;
    /** What triggered this feedback */
    trigger: 'request' | 'proactive' | 'stuck' | 'error';
    /** Whether acknowledged by user */
    acknowledged: boolean;
  };
}

/**
 * Server sends error message
 */
export interface ErrorMessage extends BaseMessage {
  type: 'error';
  payload: {
    /** Error message */
    message: string;
    /** Error code (optional) */
    code?: string;
    /** Additional error details */
    details?: Record<string, unknown>;
  };
}

/**
 * Union type for all server → client messages
 */
export type ServerMessage =
  | ConnectedMessage
  | SessionJoinedMessage
  | SessionUpdateMessage
  | ModelTextMessage
  | ModelAudioMessage
  | ModelInterruptionMessage
  | ModelToolCallMessage
  | FeedbackMessage
  | ErrorMessage;

// ============================================================================
// Gemini Live API Response Structures
// ============================================================================

/**
 * Raw Gemini Live API message structure
 * These are transformed into normalized ServerMessage types
 */
export interface GeminiLiveMessage {
  /** Server-generated content */
  serverContent?: {
    /** Model turn with parts */
    modelTurn?: {
      /** Content parts */
      parts: Array<{
        /** Text content */
        text?: string;
        /** Inline audio data */
        inlineData?: {
          mimeType: string;
          data: string; // Base64-encoded
        };
        /** Function call */
        functionCall?: {
          name: string;
          args: Record<string, unknown>;
        };
      }>;
    };
    /** Turn completion indicator */
    turnComplete?: boolean;
    /** Interruption signal */
    interrupted?: boolean;
  };
  /** Setup completion */
  setupComplete?: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for client messages
 */
export function isClientMessage(message: BaseMessage): message is ClientMessage {
  return [
    'join_session',
    'audio_segment',
    'screen_frame',
    'code_update',
    'request_feedback',
    'acknowledge_feedback',
  ].includes(message.type);
}

/**
 * Type guard for server messages
 */
export function isServerMessage(message: BaseMessage): message is ServerMessage {
  return [
    'connected',
    'session_joined',
    'session_update',
    'model_text',
    'model_audio',
    'model_interruption',
    'model_tool_call',
    'feedback',
    'error',
  ].includes(message.type);
}

/**
 * Type guard for model response messages
 */
export function isModelResponseMessage(
  message: ServerMessage
): message is ModelTextMessage | ModelAudioMessage | ModelInterruptionMessage | ModelToolCallMessage {
  return ['model_text', 'model_audio', 'model_interruption', 'model_tool_call'].includes(message.type);
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates base message structure
 */
export function validateBaseMessage(data: unknown): data is BaseMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Partial<BaseMessage>;
  return (
    typeof msg.type === 'string' &&
    msg.payload !== undefined &&
    typeof msg.sessionId === 'string' &&
    typeof msg.timestamp === 'number'
  );
}

/**
 * Validates audio data format
 */
export function validateAudioData(audioData: string): boolean {
  // Check if valid base64
  try {
    atob(audioData);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates image data format
 */
export function validateImageData(imageData: string): boolean {
  // Check if valid base64 and reasonable size
  try {
    atob(imageData);
    // JPEG frames should be 50-500KB typically
    return imageData.length > 1000 && imageData.length < 1000000;
  } catch {
    return false;
  }
}
