/**
 * GeminiLiveClient
 *
 * A WebSocket client for connecting to Google's Vertex AI Gemini Multimodal Live API.
 * This client handles authentication, connection management, and message routing
 * for real-time bidirectional communication with Gemini 2.0 Flash Realtime models.
 *
 * Architecture:
 * - Uses Google Application Default Credentials (ADC) for authentication
 * - Establishes secure WebSocket connection to Vertex AI endpoint
 * - Sends initial setup message with system instructions and tool declarations
 * - Emits events for connection state changes and incoming messages
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { GoogleAuth } from 'google-auth-library';
import { env } from '../config/env';

interface GeminiSessionSetupConfig {
  systemInstructionText?: string;
  voiceName?: string;
  tools?: unknown[];
}

/**
 * GeminiLiveClient events:
 * - 'connected': Emitted when WebSocket connection is established
 * - 'disconnected': Emitted when WebSocket connection is closed
 * - 'message': Emitted when a message is received from the API
 * - 'error': Emitted when an error occurs
 */
export class GeminiLiveClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private auth: GoogleAuth;
  private connected: boolean = false;

  constructor() {
    super();

    // Initialize Google Auth with Application Default Credentials
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  /**
   * Establishes a WebSocket connection to Vertex AI Gemini Live API
   *
   * Flow:
   * 1. Fetch Google Cloud access token using ADC
   * 2. Construct Vertex AI WebSocket URL with authentication
   * 3. Open WebSocket connection
   * 4. Send initial setup message with system instructions
   *
   * @throws Error if authentication fails or connection cannot be established
   */
  async connect(config?: GeminiSessionSetupConfig | string): Promise<void> {
    try {
      // Step 1: Fetch access token for authentication
      const accessToken = await this.auth.getAccessToken();

      if (!accessToken) {
        throw new Error('Failed to obtain Google Cloud access token');
      }

      // Step 2: Construct Vertex AI WebSocket URL
      const wsUrl = this.constructWebSocketUrl(accessToken);

      // Step 3: Open WebSocket connection
      this.ws = new WebSocket(wsUrl);

      // Set up WebSocket event handlers
      this.setupWebSocketHandlers();

      // Wait for connection to open
      await this.waitForConnection();

      // Step 4: Send initial setup message
      await this.sendSetupMessage(config);

      this.connected = true;
      this.emit('connected');
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  /**
   * Constructs the Vertex AI WebSocket URL with authentication
   *
   * URL Format:
   * wss://{location}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent
   * ?access_token={token}
   *
   * @param accessToken - Google Cloud access token
   * @returns Fully qualified WebSocket URL
   */
  private constructWebSocketUrl(accessToken: string): string {
    const { GCP_LOCATION, GCP_PROJECT_ID, GEMINI_REALTIME_MODEL } = env;

    // Vertex AI WebSocket endpoint pattern
    const baseUrl = `wss://${GCP_LOCATION}-aiplatform.googleapis.com`;
    const path = '/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent';

    // Add query parameters
    const queryParams = new URLSearchParams({
      access_token: accessToken,
    });

    // Include model path in the URL or headers (depending on API requirements)
    // For now, we'll construct the full URL with the model reference
    const modelPath = `projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}/publishers/google/models/${GEMINI_REALTIME_MODEL}`;

    return `${baseUrl}${path}?${queryParams.toString()}`;
  }

  /**
   * Sets up WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      console.log('[GeminiLiveClient] WebSocket connection opened');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.emit('message', message);
      } catch (error) {
        console.error('[GeminiLiveClient] Failed to parse message:', error);
      }
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      console.log(`[GeminiLiveClient] WebSocket closed: ${code} - ${reason.toString()}`);
      this.connected = false;
      this.emit('disconnected');
    });

    this.ws.on('error', (error: Error) => {
      console.error('[GeminiLiveClient] WebSocket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Waits for the WebSocket connection to open
   *
   * @returns Promise that resolves when connection is established
   * @throws Error if connection times out
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket instance not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10 second timeout

      this.ws.once('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.ws.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Sends the initial setup message to configure the Gemini Live session
   *
   * The setup message includes:
   * - System instructions (interviewer persona)
   * - Generation configuration (temperature, response modalities)
   * - Tool declarations (coding task setup)
   */
  private async sendSetupMessage(config?: GeminiSessionSetupConfig | string): Promise<void> {
    const resolvedConfig: GeminiSessionSetupConfig =
      typeof config === 'string' ? { systemInstructionText: config } : config || {};

    const text = resolvedConfig.systemInstructionText || `You are Alex, a senior technical interviewer and software architect conducting a live coding interview.
Your role is to:
- Observe the candidate's code in real-time through their screen share. Comment on their implementation choices, variable naming, and algorithmic efficiency as they type.
- Listen to their verbal explanation and thought process. If they are quiet for too long while typing, encourage them to think out loud.
- Provide constructive feedback and gentle hints only when they are clearly stuck or heading towards a major pitfall.
- Look for specific events: watch for terminal output, test failures, or syntax errors, and ask the candidate how they plan to debug them.
- Ask deep follow-up questions about time/space complexity, edge cases, and architectural trade-offs.
- Maintain a supportive, professional, and slightly inquisitive "Senior Architect" persona.

Be concise in your verbal responses to avoid interrupting the candidate's flow. Your goal is to evaluate both their technical ability and their communication skills.`;

    const voiceName = resolvedConfig.voiceName || 'Kore';
    const tools = Array.isArray(resolvedConfig.tools) && resolvedConfig.tools.length > 0
      ? resolvedConfig.tools
      : [
          {
            function_declarations: [
              {
                name: 'setup_coding_task',
                description: 'Sets up a new coding challenge for the interview',
                parameters: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'The title of the coding challenge',
                    },
                    description: {
                      type: 'string',
                      description: 'Detailed description of the problem',
                    },
                    difficulty: {
                      type: 'string',
                      enum: ['easy', 'medium', 'hard'],
                      description: 'Difficulty level of the challenge',
                    },
                  },
                  required: ['title', 'description', 'difficulty'],
                },
              },
            ],
          },
        ];

    const setupMessage = {
      setup: {
        model: `projects/${env.GCP_PROJECT_ID}/locations/${env.GCP_LOCATION}/publishers/google/models/${env.GEMINI_REALTIME_MODEL}`,
        generation_config: {
          response_modalities: ['AUDIO', 'TEXT'],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: voiceName,
              },
            },
          },
        },
        realtime_input_config: {
          automatic_activity_detection: {
            start_of_speech_sensitivity: 'MEDIUM',
            end_of_speech_sensitivity: 'MEDIUM',
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          activity_handling: 'START_OF_ACTIVITY_INTERRUPTS',
        },
        system_instruction: {
          parts: [
            {
              text,
            },
          ],
        },
        tools,
      },
    };

    this.send(setupMessage);
  }

  /**
   * Sends a message to the Gemini Live API
   *
   * @param message - Message object to send
   */
  send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[GeminiLiveClient] Cannot send message: WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Disconnects from the Gemini Live API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Checks if the client is currently connected
   *
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Sends audio data to the Gemini Live API
   *
   * @param audioData - Base64-encoded PCM16 audio data
   */
  sendAudio(audioData: string): void {
    this.send({
      realtime_input: {
        media_chunks: [
          {
            mime_type: 'audio/pcm',
            data: audioData,
          },
        ],
      },
    });
  }

  /**
   * Sends video frame to the Gemini Live API
   *
   * @param imageData - Base64-encoded image data (JPEG)
   */
  sendVideoFrame(imageData: string): void {
    this.send({
      realtime_input: {
        media_chunks: [
          {
            mime_type: 'image/jpeg',
            data: imageData,
          },
        ],
      },
    });
  }

  /**
   * Sends a text message to the Gemini Live API
   *
   * @param text - Text message to send
   */
  sendText(text: string): void {
    this.send({
      client_content: {
        turns: [
          {
            role: 'user',
            parts: [
              {
                text,
              },
            ],
          },
        ],
        turn_complete: true,
      },
    });
  }

  sendToolResponse(functionResponses: unknown[]): void {
    this.send({
      tool_response: {
        function_responses: functionResponses,
      },
    });
  }
}
