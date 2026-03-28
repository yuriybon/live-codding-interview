/**
 * EditorContextService Test Suite
 * TDD Phase: Red (Test First)
 *
 * This test suite verifies that the EditorContextService can track Monaco Editor
 * content changes and provide context for the Gemini Live API.
 *
 * The service should:
 * - Attach to a Monaco Editor instance
 * - Track code changes with debouncing to avoid excessive updates
 * - Provide current editor content on demand
 * - Detect when code has meaningfully changed
 * - Clean up listeners when detached
 *
 * Expected behavior: These tests will FAIL until TASK-1.3.4 implements
 * the EditorContextService class.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditorContextService } from '../../services/EditorContextService';

// Mock Monaco Editor types and instance
interface MockMonacoEditor {
  onDidChangeModelContent: (callback: Function) => { dispose: () => void };
  getValue: () => string;
  getModel: () => any;
}

const mockEditor: MockMonacoEditor = {
  onDidChangeModelContent: vi.fn((callback: Function) => ({
    dispose: vi.fn(),
  })),
  getValue: vi.fn(() => ''),
  getModel: vi.fn(() => ({
    uri: { path: '/test.ts' },
    getLanguageId: () => 'typescript',
  })),
};

describe('EditorContextService - Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * TDD Red Phase Test
   *
   * Verifies that the EditorContextService class exists and can be instantiated.
   */
  it('should be instantiable', () => {
    // Act
    const service = new EditorContextService();

    // Assert
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(EditorContextService);
  });

  /**
   * Test that verifies the service can attach to a Monaco Editor instance
   */
  it('should attach to a Monaco Editor instance', () => {
    // Arrange
    const service = new EditorContextService();

    // Act
    service.attachEditor(mockEditor);

    // Assert
    expect(mockEditor.onDidChangeModelContent).toHaveBeenCalled();
  });

  /**
   * Test that verifies the service registers a content change listener
   */
  it('should register a content change listener on attach', () => {
    // Arrange
    const service = new EditorContextService();

    // Act
    service.attachEditor(mockEditor);

    // Assert
    expect(mockEditor.onDidChangeModelContent).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  /**
   * Test that verifies the service can detach and clean up listeners
   */
  it('should clean up listeners when detached', () => {
    // Arrange
    const mockDispose = vi.fn();
    const mockEditorWithDispose = {
      ...mockEditor,
      onDidChangeModelContent: vi.fn(() => ({
        dispose: mockDispose,
      })),
    };

    const service = new EditorContextService();

    service.attachEditor(mockEditorWithDispose);

    // Act
    service.detach();

    // Assert
    expect(mockDispose).toHaveBeenCalled();
  });
});

describe('EditorContextService - Content Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Test that verifies getting current editor content
   */
  it('should return current editor content', () => {
    // Arrange
    const mockEditorWithContent = {
      ...mockEditor,
      getValue: vi.fn(() => 'function hello() { return "world"; }'),
    };

    const service = new EditorContextService();
    service.attachEditor(mockEditorWithContent);

    // Act
    const content = service.getContent();

    // Assert
    expect(content).toBe('function hello() { return "world"; }');
    expect(mockEditorWithContent.getValue).toHaveBeenCalled();
  });

  /**
   * Test that verifies getting editor metadata (language, file path)
   */
  it('should return editor metadata including language and file path', () => {
    // Arrange
    const service = new EditorContextService();
    service.attachEditor(mockEditor);

    // Act
    const metadata = service.getMetadata();

    // Assert
    expect(metadata).toEqual({
      language: 'typescript',
      filePath: '/test.ts',
    });
  });

  /**
   * Test that verifies the service returns empty content when not attached
   */
  it('should return empty string when no editor is attached', () => {
    // Arrange
    const service = new EditorContextService();

    // Act
    const content = service.getContent();

    // Assert
    expect(content).toBe('');
  });
});

describe('EditorContextService - Change Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Test that verifies change callback is invoked when content changes
   */
  it('should invoke change callback when editor content changes', () => {
    // Arrange
    let changeCallback: Function | null = null;
    const mockEditorWithCallback = {
      ...mockEditor,
      onDidChangeModelContent: vi.fn((callback: Function) => {
        changeCallback = callback;
        return { dispose: vi.fn() };
      }),
      getValue: vi.fn()
        .mockReturnValueOnce('initial content')
        .mockReturnValue('new content'),
    };

    const service = new EditorContextService();

    const onChange = vi.fn();
    service.onChange(onChange);
    service.attachEditor(mockEditorWithCallback);

    // Act: Simulate content change
    if (changeCallback) {
      changeCallback();
    }

    // Fast-forward debounce delay
    vi.advanceTimersByTime(500);

    // Assert
    expect(onChange).toHaveBeenCalled();
  });

  /**
   * Test that verifies debouncing of rapid changes
   */
  it('should debounce rapid content changes', () => {
    // Arrange
    let changeCallback: Function | null = null;
    const mockEditorWithCallback = {
      ...mockEditor,
      onDidChangeModelContent: vi.fn((callback: Function) => {
        changeCallback = callback;
        return { dispose: vi.fn() };
      }),
      getValue: vi.fn()
        .mockReturnValueOnce('initial')
        .mockReturnValue('changed content'),
    };

    const service = new EditorContextService();

    const onChange = vi.fn();
    service.onChange(onChange);
    service.attachEditor(mockEditorWithCallback);

    // Act: Simulate multiple rapid changes
    if (changeCallback) {
      changeCallback(); // Change 1
      vi.advanceTimersByTime(100);
      changeCallback(); // Change 2
      vi.advanceTimersByTime(100);
      changeCallback(); // Change 3
    }

    // Fast-forward past debounce delay
    vi.advanceTimersByTime(500);

    // Assert: Callback should only be called once despite 3 changes
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  /**
   * Test that verifies configurable debounce delay
   */
  it('should support configurable debounce delay', () => {
    // Arrange
    let changeCallback: Function | null = null;
    const mockEditorWithCallback = {
      ...mockEditor,
      onDidChangeModelContent: vi.fn((callback: Function) => {
        changeCallback = callback;
        return { dispose: vi.fn() };
      }),
      getValue: vi.fn()
        .mockReturnValueOnce('before')
        .mockReturnValue('after'),
    };

    const service = new EditorContextService({ debounceMs: 1000 });

    const onChange = vi.fn();
    service.onChange(onChange);
    service.attachEditor(mockEditorWithCallback);

    // Act: Simulate change
    if (changeCallback) {
      changeCallback();
    }

    // Fast-forward less than debounce delay
    vi.advanceTimersByTime(500);
    expect(onChange).not.toHaveBeenCalled();

    // Fast-forward to exceed debounce delay
    vi.advanceTimersByTime(500);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  /**
   * Test that verifies hasChanged() method
   */
  it('should track whether content has changed since last check', () => {
    // Arrange
    let changeCallback: Function | null = null;
    const mockEditorWithCallback = {
      ...mockEditor,
      onDidChangeModelContent: vi.fn((callback: Function) => {
        changeCallback = callback;
        return { dispose: vi.fn() };
      }),
      getValue: vi.fn()
        .mockReturnValueOnce('initial content')
        .mockReturnValue('modified content'),
    };

    const service = new EditorContextService();
    service.attachEditor(mockEditorWithCallback);

    // Assert: Initially no changes
    expect(service.hasChanged()).toBe(false);

    // Act: Simulate content change
    if (changeCallback) {
      changeCallback();
    }
    vi.advanceTimersByTime(500);

    // Assert: Now has changes
    expect(service.hasChanged()).toBe(true);

    // Act: Reset change tracking
    service.resetChangeTracking();

    // Assert: No longer has changes
    expect(service.hasChanged()).toBe(false);
  });

  /**
   * Test that verifies the service provides full context object
   */
  it('should provide complete context object with content and metadata', () => {
    // Arrange
    const mockEditorWithContent = {
      ...mockEditor,
      getValue: vi.fn(() => 'const x = 42;'),
    };

    const service = new EditorContextService();
    service.attachEditor(mockEditorWithContent);

    // Act
    const context = service.getContext();

    // Assert
    expect(context).toEqual({
      content: 'const x = 42;',
      language: 'typescript',
      filePath: '/test.ts',
      timestamp: expect.any(Number),
    });
  });
});

describe('EditorContextService - Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test that verifies clean public API
   */
  it('should provide clean public API', () => {
    // Arrange
    const service = new EditorContextService();

    // Assert: Public methods exist
    expect(service.attachEditor).toBeDefined();
    expect(service.detach).toBeDefined();
    expect(service.getContent).toBeDefined();
    expect(service.getMetadata).toBeDefined();
    expect(service.getContext).toBeDefined();
    expect(service.onChange).toBeDefined();
    expect(service.hasChanged).toBeDefined();
    expect(service.resetChangeTracking).toBeDefined();
  });

  /**
   * Test that verifies single editor instance handling
   */
  it('should handle re-attaching to a different editor instance', () => {
    // Arrange
    const mockDispose1 = vi.fn();
    const mockEditor1 = {
      ...mockEditor,
      onDidChangeModelContent: vi.fn(() => ({ dispose: mockDispose1 })),
    };

    const mockDispose2 = vi.fn();
    const mockEditor2 = {
      ...mockEditor,
      onDidChangeModelContent: vi.fn(() => ({ dispose: mockDispose2 })),
    };

    const service = new EditorContextService();

    // Act: Attach to first editor
    service.attachEditor(mockEditor1);

    // Act: Attach to second editor (should detach from first)
    service.attachEditor(mockEditor2);

    // Assert: First editor should be cleaned up
    expect(mockDispose1).toHaveBeenCalled();
    expect(mockEditor2.onDidChangeModelContent).toHaveBeenCalled();
  });
});
