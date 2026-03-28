/**
 * EditorContextService
 *
 * Tracks Monaco Editor content changes and provides context for the Gemini Live API.
 *
 * This service:
 * - Attaches to a Monaco Editor instance
 * - Tracks code changes with configurable debouncing
 * - Provides current editor content and metadata on demand
 * - Detects meaningful code changes
 * - Cleans up listeners properly
 */

export interface EditorContextConfig {
  debounceMs?: number; // Debounce delay for change events (default: 300ms)
}

export interface EditorMetadata {
  language: string;
  filePath: string;
}

export interface EditorContext extends EditorMetadata {
  content: string;
  timestamp: number;
}

// Monaco Editor interface (minimal type definition)
export interface IMonacoEditor {
  onDidChangeModelContent(callback: () => void): { dispose(): void };
  getValue(): string;
  getModel(): {
    uri: { path: string };
    getLanguageId(): string;
  } | null;
}

export class EditorContextService {
  private editor: IMonacoEditor | null = null;
  private changeListener: { dispose(): void } | null = null;
  private changeCallback: ((context: EditorContext) => void) | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private config: Required<EditorContextConfig>;
  private lastContent: string = '';
  private changed: boolean = false;

  constructor(config: EditorContextConfig = {}) {
    this.config = {
      debounceMs: config.debounceMs ?? 300,
    };
  }

  /**
   * Attach to a Monaco Editor instance
   */
  attachEditor(editor: IMonacoEditor): void {
    // Detach from any previous editor
    if (this.editor) {
      this.detach();
    }

    this.editor = editor;
    this.lastContent = this.getContent();

    // Register change listener
    this.changeListener = editor.onDidChangeModelContent(() => {
      this.handleContentChange();
    });
  }

  /**
   * Detach from the current editor and clean up
   */
  detach(): void {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Dispose change listener
    if (this.changeListener) {
      this.changeListener.dispose();
      this.changeListener = null;
    }

    this.editor = null;
    this.changed = false;
  }

  /**
   * Get current editor content
   */
  getContent(): string {
    if (!this.editor) {
      return '';
    }

    return this.editor.getValue();
  }

  /**
   * Get editor metadata (language, file path)
   */
  getMetadata(): EditorMetadata {
    if (!this.editor) {
      return {
        language: '',
        filePath: '',
      };
    }

    const model = this.editor.getModel();
    if (!model) {
      return {
        language: '',
        filePath: '',
      };
    }

    return {
      language: model.getLanguageId(),
      filePath: model.uri.path,
    };
  }

  /**
   * Get complete context object (content + metadata + timestamp)
   */
  getContext(): EditorContext {
    const metadata = this.getMetadata();
    const content = this.getContent();

    return {
      ...metadata,
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Register a callback for content changes
   */
  onChange(callback: (context: EditorContext) => void): void {
    this.changeCallback = callback;
  }

  /**
   * Check if content has changed since last check
   */
  hasChanged(): boolean {
    return this.changed;
  }

  /**
   * Reset change tracking
   */
  resetChangeTracking(): void {
    this.changed = false;
    this.lastContent = this.getContent();
  }

  /**
   * Handle content change with debouncing
   */
  private handleContentChange(): void {
    // Clear any existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set up new debounced callback
    this.debounceTimer = setTimeout(() => {
      const currentContent = this.getContent();

      // Check if content actually changed
      if (currentContent !== this.lastContent) {
        this.changed = true;
        this.lastContent = currentContent;

        // Invoke callback if registered
        if (this.changeCallback) {
          const context = this.getContext();
          this.changeCallback(context);
        }
      }

      this.debounceTimer = null;
    }, this.config.debounceMs);
  }
}
