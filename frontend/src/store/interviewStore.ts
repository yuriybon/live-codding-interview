import { create } from 'zustand';

interface Feedback {
  id: string;
  sessionId?: string;
  type: 'coach' | 'interviewer' | 'hint' | 'correction';
  content: string;
  timestamp: string | Date;
  trigger: {
    type: string;
    details?: string;
  };
  acknowledged: boolean;
}

interface InterviewState {
  sessionId: string | null;
  isJoined: boolean;
  isRecording: boolean;
  isAudioEnabled: boolean;
  feedback: Feedback[];
  transcript: string[];
  code: string;
  language: string;
  currentChallenge: {
    title: string;
    description: string;
    difficulty: string;
  } | null;
  sessionMetrics: {
    totalTime: number;
    stuckTime: number;
    codeLinesWritten: number;
    hintsRequested: number;
    feedbackCount: number;
  };

  // Actions
  setSessionId: (sessionId: string) => void;
  joinSession: () => void;
  leaveSession: () => void;
  toggleRecording: () => void;
  toggleAudio: () => void;
  addFeedback: (feedback: Feedback) => void;
  acknowledgeFeedback: (feedbackId: string) => void;
  addTranscript: (text: string) => void;
  updateMetrics: (metrics: Partial<InterviewState['sessionMetrics']>) => void;
  requestFeedback: (reason: string) => void;
  handleToolCall: (payload: { tool: string; args: any }) => void;
  endSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  sessionId: null,
  isJoined: false,
  isRecording: false,
  isAudioEnabled: false,
  feedback: [],
  transcript: [],
  code: '// Write your solution here\n\nfunction solution() {\n  // TODO: Implement your solution\n}\n',
  language: 'typescript',
  currentChallenge: null,
  sessionMetrics: {
    totalTime: 0,
    stuckTime: 0,
    codeLinesWritten: 0,
    hintsRequested: 0,
    feedbackCount: 0,
  },

  setSessionId: (sessionId) => set({ sessionId }),

  joinSession: () => set({ isJoined: true }),

  leaveSession: () => set({ isJoined: false }),

  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),

  toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),

  addFeedback: (feedback) => set((state) => ({
    feedback: [...state.feedback, feedback],
  })),

  acknowledgeFeedback: (feedbackId) => set((state) => ({
    feedback: state.feedback.map((f) =>
      f.id === feedbackId ? { ...f, acknowledged: true } : f
    ),
  })),

  addTranscript: (text) => set((state) => ({
    transcript: [...state.transcript.slice(-20), text], // Keep last 20
  })),

  updateMetrics: (metrics) => set((state) => ({
    sessionMetrics: { ...state.sessionMetrics, ...metrics },
  })),

  requestFeedback: (reason) => {
    // This would trigger a WebSocket message
    console.log('Requesting feedback:', reason);
  },

  handleToolCall: (payload) => {
    const { tool, args } = payload;

    switch (tool) {
      case 'setup_coding_task':
        set({
          code: args.starterCode || get().code,
          language: args.language || 'typescript',
          currentChallenge: {
            title: args.title,
            description: args.description,
            difficulty: args.difficulty,
          },
        });

        // Add a system feedback message to inform the user
        get().addFeedback({
          id: `system-${Date.now()}`,
          type: 'interviewer',
          content: `New Challenge: ${args.title}. ${args.description}`,
          trigger: {
            type: 'tool_call',
            details: 'setup_coding_task',
          },
          timestamp: new Date(),
          acknowledged: false,
        });
        break;

      default:
        console.warn('[InterviewStore] Unknown tool call:', tool);
    }
  },

  endSession: () => {
    // Clean up state
    set({
      isJoined: false,
      isRecording: false,
      sessionId: null,
      code: '// Write your solution here\n\nfunction solution() {\n  // TODO: Implement your solution\n}\n',
      language: 'typescript',
      currentChallenge: null,
    });
  },
}));