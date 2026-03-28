import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
// Mock Monaco editor before importing component
vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange, 'data-testid': testId }: any) => (
      <textarea
        data-testid={testId || 'mock-editor'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  };
});

import { InterviewRoom } from '../../../src/pages/InterviewRoom';
import { wsClient } from '../../../src/services/websocketClient';
import { useInterviewStore } from '../../../src/store/interviewStore';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock Websocket Client
vi.mock('../../../src/services/websocketClient', () => {
  return {
    wsClient: {
      connect: vi.fn().mockResolvedValue(undefined),
      endSession: vi.fn(),
      sendCodeUpdate: vi.fn(),
      sendRawAudio: vi.fn(),
      requestFeedback: vi.fn()
    }
  };
});

// Mock hooks and services that aren't the focus of this test
vi.mock('../../../src/services/AudioPlaybackQueue', () => ({
  audioPlaybackQueue: {
    onStart: vi.fn(),
    onComplete: vi.fn(),
    resume: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn()
  }
}));
vi.mock('../../../src/services/AudioRecorderService', () => {
  return {
    AudioRecorderService: vi.fn().mockImplementation(() => ({
      onData: vi.fn(),
      stop: vi.fn(),
      isRecording: false
    }))
  };
});

describe('Editor Context Syncing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    useInterviewStore.setState({
      sessionId: 'test-session-123',
      isJoined: true,
      feedback: [],
      sessionMetrics: {
        totalTime: 0,
        stuckTime: 0,
        codeLinesWritten: 0,
        testCasesPassed: 0,
        testCasesFailed: 0,
        hintsRequested: 0,
        feedbackCount: 0,
        communicationScore: 0,
        technicalScore: 0,
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce editor changes before sending them to the WebSocketClient', async () => {
    render(
      <MemoryRouter initialEntries={['/room/test-session-123']}>
        <Routes>
          <Route path="/room/:sessionId" element={<InterviewRoom />} />
        </Routes>
      </MemoryRouter>
    );

    const editor = screen.getByTestId('mock-editor');
    
    // Type first character
    fireEvent.change(editor, { target: { value: 'const x = 1' } });
    
    // Fast forward a little bit, but less than debounce time (assuming 1000ms debounce)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // Type second character
    fireEvent.change(editor, { target: { value: 'const x = 1;' } });

    // Expect not sent yet because of debounce
    expect(wsClient.sendCodeUpdate).not.toHaveBeenCalled();

    // Fast forward past the debounce window
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // NOW it should have been sent exactly once with the latest value
    expect(wsClient.sendCodeUpdate).toHaveBeenCalledTimes(1);
    expect(wsClient.sendCodeUpdate).toHaveBeenCalledWith('const x = 1;', 'typescript');
  });
});
