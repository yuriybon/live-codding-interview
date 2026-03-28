// AI Interview Simulator Type Definitions

export interface InterviewSession {
  sessionId: string;
  candidateId: string;
  status: 'idle' | 'active' | 'paused' | 'completed' | 'error';
  language?: string;
  exerciseId?: string;
  createdAt: Date;
  updatedAt: Date;
  currentQuestion?: CodingQuestion;
  questions: CodingQuestion[];
  feedback: Feedback[];
  metrics: SessionMetrics;
  transcriptSegments?: TranscriptSegment[];
  codeSnippets?: CodeSnippet[];
}

export interface CodingQuestion {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  hints: string[];
  edgeCases: string[];
  expectedComplexity: {
    time: string;
    space: string;
  };
  tags: string[];
}

export interface Feedback {
  id: string;
  sessionId: string;
  type: 'coach' | 'interviewer' | 'hint' | 'correction';
  content: string;
  timestamp: Date;
  trigger: {
    type: 'timeout' | 'missing_signal' | 'stuck_detection' | 'manual' | 'analysis';
    details?: string;
  };
  acknowledged: boolean;
}

export interface SessionMetrics {
  totalTime: number; // in seconds
  stuckTime: number; // time without activity
  codeLinesWritten: number;
  testCasesPassed: number;
  testCasesFailed: number;
  hintsRequested: number;
  feedbackCount: number;
  communicationScore: number; // 0-100
  technicalScore: number; // 0-100
}

export interface CodeSnippet {
  id: string;
  sessionId: string;
  language: string;
  content: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface TranscriptSegment {
  id: string;
  sessionId: string;
  speaker: 'candidate' | 'ai';
  text: string;
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'confused';
  flags?: string[]; // e.g., 'missing_complexity', 'skipping_edge_cases'
}

export interface AnalysisResult {
  sessionId: string;
  timestamp: Date;
  detectedState: 'coding' | 'thinking' | 'stuck' | 'explaining' | 'silent';
  confidence: number; // 0-1
  signals: {
    isDiscussingComplexity: boolean;
    isCoveringEdgeCases: boolean;
    isCommunicatingApproach: boolean;
    isTestingCode: boolean;
    appearsStuck: boolean;
  };
  recommendations: string[];
}

export interface GeminiRequest {
  messages: Array<{
    role: 'user' | 'model';
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string; // base64 encoded
      };
    }>;
  }>;
  systemInstruction?: {
    parts: { text: string }[];
  };
}

export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface ScreenCaptureFrame {
  timestamp: number;
  imageData: Buffer;
  hasCodeChanges: boolean;
  activeEditor: string;
  cursorPosition?: {
    line: number;
    column: number;
  };
}

export interface AudioSegment {
  timestamp: number;
  audioData: Buffer;
  duration: number;
  confidence?: number; // speech confidence
  transcript?: string;
}