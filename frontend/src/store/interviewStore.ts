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
  endSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  sessionId: null,
  isJoined: false,
  isRecording: false,
  isAudioEnabled: false,
  feedback: [],
  transcript: [],
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

  endSession: () => {
    // Clean up state
    set({
      isJoined: false,
      isRecording: false,
      sessionId: null,
    });
  },
}));