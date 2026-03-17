import { GoogleAuth } from 'google-auth-library';
import { GeminiRequest, GeminiResponse, TranscriptSegment, AnalysisResult } from '../types';
import { env } from '../config/env';

/**
 * Vertex AI Service - Handles communication with Google's Gemini API
 */
export class VertexAIService {
  private auth: GoogleAuth;
  private endpoint: string;

  constructor() {
    this.auth = new GoogleAuth({
      projectId: env.GCP_PROJECT_ID,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    // Vertex AI endpoint for Gemini
    this.endpoint = `https://${env.GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.GCP_PROJECT_ID}/locations/${env.GCP_LOCATION}/publishers/google/models/${env.GEMINI_MODEL_NAME}`;
  }

  /**
   * Get access token for API requests
   */
  private async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }
    return token;
  }

  /**
   * Send request to Gemini model
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    const token = await this.getAccessToken();
    
    // Apply system prompt if not already set
    const payload = {
      ...request,
      systemInstruction: request.systemInstruction || {
        parts: [{ text: env.GEMINI_SYSTEM_PROMPT }],
      },
    };

    const response = await fetch(`${this.endpoint}:generateContent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vertex AI request failed: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as GeminiResponse;
    return result;
  }

  /**
   * Stream content from Gemini model (for real-time responses)
   */
  async *streamContent(request: GeminiRequest): AsyncGenerator<string, void, unknown> {
    const token = await this.getAccessToken();
    
    const payload = {
      ...request,
      systemInstruction: request.systemInstruction || {
        parts: [{ text: env.GEMINI_SYSTEM_PROMPT }],
      },
    };

    const response = await fetch(`${this.endpoint}:streamGenerateContent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vertex AI streaming failed: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Vertex AI returns JSON lines prefixed with "data: "
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
              yield json.candidates[0].content.parts[0].text;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  /**
   * Analyze transcript for coaching opportunities
   */
  async analyzeTranscript(
    transcriptSegments: TranscriptSegment[],
    context: {
      currentQuestion?: string;
      sessionDuration: number;
      codeActivity: boolean;
    }
  ): Promise<AnalysisResult> {
    const recentTranscript = transcriptSegments.slice(-10).map(seg => seg.text).join(' ');
    
    const request: GeminiRequest = {
      systemInstruction: {
        parts: [{
          text: `
You are an AI interview coach analyzing a coding interview in real-time.

Analyze the candidate's speech and behavior to detect:
1. Whether they appear stuck (long pauses, repeated phrases, uncertainty)
2. If they're discussing time/space complexity
3. If they're considering edge cases
4. If they're communicating their approach clearly
5. If they're testing their code

Return a structured JSON response with:
- detectedState: 'coding' | 'thinking' | 'stuck' | 'explaining' | 'silent'
- confidence: 0-1
- signals: object with boolean flags
- recommendations: array of coaching suggestions (max 2)

Keep recommendations short and actionable.
          `,
        }],
      },
      messages: [
        {
          role: 'user',
          parts: [{
            text: `
Context:
- Question: ${context.currentQuestion || 'N/A'}
- Session duration: ${context.sessionDuration}s
- Active code activity: ${context.codeActivity}

Recent transcript:
"${recentTranscript || 'No speech detected'}"

Analyze and provide feedback.
            `,
          }],
        },
      ],
    };

    const response = await this.generateContent(request);
    
    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid analysis response');
    }

    try {
      // Try to parse as JSON if it's structured
      const parsed = JSON.parse(response.candidates[0].content.parts[0].text);
      return {
        sessionId: 'current',
        timestamp: new Date(),
        ...parsed,
      };
    } catch {
      // Return a default analysis if parsing fails
      return {
        sessionId: 'current',
        timestamp: new Date(),
        detectedState: 'coding',
        confidence: 0.5,
        signals: {
          isDiscussingComplexity: false,
          isCoveringEdgeCases: false,
          isCommunicatingApproach: false,
          isTestingCode: false,
          appearsStuck: false,
        },
        recommendations: [],
      };
    }
  }

  /**
   * Generate coaching feedback based on detected issues
   */
  async generateFeedback(
    trigger: {
      type: 'timeout' | 'missing_signal' | 'stuck_detection' | 'manual' | 'analysis';
      details?: string;
    },
    context: {
      transcript: string[];
      code?: string;
      metrics?: any;
    }
  ): Promise<string> {
    const prompt = `
Generate a short, helpful coaching prompt for a coding interview candidate.

Trigger: ${trigger.type}
Details: ${trigger.details || 'None'}

Recent candidate speech:
"${context.transcript.slice(-5).join(' ')}"

${context.code ? `Current code:\n\${context.code}\n` : ''}

Generate a 1-2 sentence prompt that:
- Is specific and actionable
- Guides without giving the answer
- Maintains interview pressure
- Sounds like a senior engineer
`;

    const request: GeminiRequest = {
      messages: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    };

    const response = await this.generateContent(request);
    
    return response.candidates?.[0]?.content?.parts?.[0]?.text || 'Keep going!';
  }

  /**
   * Generate final interview assessment
   */
  async generateAssessment(
    sessionId: string,
    metrics: any,
    feedback: any[],
    transcript: TranscriptSegment[]
  ): Promise<string> {
    const request: GeminiRequest = {
      messages: [
        {
          role: 'user',
          parts: [{
            text: `
Generate a comprehensive interview assessment.

Session Metrics:
${JSON.stringify(metrics, null, 2)}

Feedback Provided:
${feedback.map((f: any) => `- [${f.trigger.type}]: ${f.content}`).join('\n')}

Candidate Transcript Highlights:
${transcript.filter(t => t.speaker === 'candidate').map(t => t.text).slice(-10).join('\n')}

Provide:
1. Overall assessment (2-3 sentences)
2. Key strengths (3-4 bullet points)
3. Areas for improvement (3-4 bullet points)
4. Recommended next steps
            `,
          }],
        },
      ],
    };

    const response = await this.generateContent(request);
    
    return response.candidates?.[0]?.content?.parts?.[0]?.text || 'Assessment generation failed.';
  }
}

export const vertexAI = new VertexAIService();