import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useInterviewStore } from '../../store/interviewStore';

describe('useInterviewStore - Tool Calling', () => {
  beforeEach(() => {
    // Reset store before each test
    const { endSession } = useInterviewStore.getState();
    endSession();
  });

  /**
   * TDD Red Phase Test: Task 1.5.1
   *
   * This test verifies that the store can handle a tool call from Gemini
   * to set up a new coding task.
   */
  it('should update code and language when handleToolCall is called with setup_coding_task', () => {
    const store = useInterviewStore.getState();

    // Verify initial state
    expect((store as any).code).toContain('function solution');
    expect((store as any).language).toBe('typescript');

    const toolCallPayload = {
      tool: 'setup_coding_task',
      args: {
        title: 'Two Sum',
        description: 'Given an array of integers...',
        difficulty: 'easy',
        language: 'typescript',
        starterCode: 'function twoSum(nums: number[], target: number): number[] {\n  \n}'
      }
    };

    // Act: Handle the tool call
    // This method won't exist yet, so it will throw or be undefined
    if (typeof (store as any).handleToolCall === 'function') {
      (store as any).handleToolCall(toolCallPayload);
    } else {
      // If it doesn't exist, this is what we expect in Red Phase
      throw new Error('handleToolCall is not a function');
    }

    // Assert: State should be updated
    const updatedStore = useInterviewStore.getState();
    expect((updatedStore as any).code).toBe(toolCallPayload.args.starterCode);
    expect((updatedStore as any).language).toBe(toolCallPayload.args.language);
  });
});
