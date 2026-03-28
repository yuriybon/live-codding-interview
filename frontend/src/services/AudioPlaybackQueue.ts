/**
 * AudioPlaybackQueue - Manages real-time playback of PCM16 audio chunks from Gemini Live API
 *
 * Handles:
 * - Converting base64 PCM16 audio to Web Audio API AudioBuffer
 * - Queuing audio chunks for sequential playback
 * - Smooth playback without gaps
 * - Interruption handling (stop/clear on user speech)
 *
 * Audio Format from Gemini:
 * - Sample Rate: 24kHz
 * - Channels: Mono (1)
 * - Bit Depth: 16-bit linear PCM
 * - Encoding: Base64
 */

interface AudioChunk {
  id: string;
  data: string; // base64 PCM16
  timestamp: number;
}

export class AudioPlaybackQueue {
  private audioContext: AudioContext | null = null;
  private queue: AudioChunk[] = [];
  private isPlaying: boolean = false;
  private nextStartTime: number = 0;
  private currentSource: AudioBufferSourceNode | null = null;
  private onPlaybackComplete: (() => void) | null = null;
  private onPlaybackStart: (() => void) | null = null;

  // Audio format constants (Gemini output format)
  private readonly SAMPLE_RATE = 24000; // 24kHz
  private readonly CHANNELS = 1; // Mono
  private readonly BYTES_PER_SAMPLE = 2; // 16-bit = 2 bytes

  constructor() {
    this.initAudioContext();
  }

  /**
   * Initialize Web Audio API context
   */
  private initAudioContext(): void {
    try {
      // Create audio context with Gemini's sample rate
      this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });

      // Resume context on user interaction (browsers require this)
      if (this.audioContext.state === 'suspended') {
        document.addEventListener(
          'click',
          () => {
            this.audioContext?.resume();
          },
          { once: true }
        );
      }

      console.log('[AudioPlaybackQueue] Initialized with sample rate:', this.SAMPLE_RATE);
    } catch (error) {
      console.error('[AudioPlaybackQueue] Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Enqueue an audio chunk for playback
   * @param base64PCM16 - Base64-encoded PCM16 audio data
   */
  enqueue(base64PCM16: string): void {
    if (!base64PCM16 || base64PCM16.length === 0) {
      console.warn('[AudioPlaybackQueue] Received empty audio chunk');
      return;
    }

    const chunk: AudioChunk = {
      id: `chunk-${Date.now()}-${Math.random()}`,
      data: base64PCM16,
      timestamp: Date.now(),
    };

    this.queue.push(chunk);
    console.log(`[AudioPlaybackQueue] Enqueued chunk ${chunk.id}, queue size: ${this.queue.length}`);

    // Start playback if not already playing
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Play the next chunk in the queue
   */
  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      if (this.audioContext) {
        this.nextStartTime = this.audioContext.currentTime;
      }
      console.log('[AudioPlaybackQueue] Queue empty, playback complete');
      this.onPlaybackComplete?.();
      return;
    }

    if (!this.audioContext) {
      console.error('[AudioPlaybackQueue] AudioContext not initialized');
      return;
    }

    this.isPlaying = true;
    const chunk = this.queue.shift()!;

    try {
      // Convert base64 PCM16 to AudioBuffer
      const audioBuffer = await this.base64ToAudioBuffer(chunk.data);

      if (!audioBuffer) {
        console.error('[AudioPlaybackQueue] Failed to convert chunk to AudioBuffer');
        this.playNext(); // Try next chunk
        return;
      }

      // Create audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      // Track current source for interruption
      this.currentSource = source;

      // Play next chunk when this one ends
      source.onended = () => {
        this.currentSource = null;
        this.playNext();
      };

      // Notify playback start
      if (this.onPlaybackStart) {
        this.onPlaybackStart();
      }

      // Compute deterministic start time to keep chunks gap-free.
      const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
      console.log(`[AudioPlaybackQueue] Playing chunk ${chunk.id}, duration: ${audioBuffer.duration}s`);
    } catch (error) {
      console.error('[AudioPlaybackQueue] Error playing chunk:', error);
      this.playNext(); // Try next chunk
    }
  }

  /**
   * Convert base64 PCM16 to Web Audio API AudioBuffer
   * @param base64PCM16 - Base64-encoded PCM16 audio
   * @returns AudioBuffer ready for playback
   */
  private async base64ToAudioBuffer(base64PCM16: string): Promise<AudioBuffer | null> {
    try {
      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }

      // Decode base64 to binary
      const binaryString = atob(base64PCM16);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert bytes to 16-bit PCM samples
      const pcm16 = new Int16Array(bytes.buffer);
      const numSamples = pcm16.length;

      // Create AudioBuffer
      const audioBuffer = this.audioContext.createBuffer(
        this.CHANNELS,
        numSamples,
        this.SAMPLE_RATE
      );

      // Convert Int16 PCM to Float32 (Web Audio API format)
      // Int16 range: -32768 to 32767
      // Float32 range: -1.0 to 1.0
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      return audioBuffer;
    } catch (error) {
      console.error('[AudioPlaybackQueue] Error converting base64 to AudioBuffer:', error);
      return null;
    }
  }

  /**
   * Stop current playback and clear queue
   * Used when user interrupts AI (e.g., starts speaking)
   */
  stop(): void {
    console.log('[AudioPlaybackQueue] Stopping playback and clearing queue');

    // Stop current audio
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        // Ignore errors from stopping already stopped sources
      }
      this.currentSource = null;
    }

    // Clear queue
    this.queue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
  }

  /**
   * Clear queue without stopping current playback
   */
  clear(): void {
    console.log('[AudioPlaybackQueue] Clearing queue');
    this.queue = [];
  }

  /**
   * Check if audio is currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current queue size
   */
  get queueSize(): number {
    return this.queue.length;
  }

  /**
   * Set callback for when playback completes
   */
  onComplete(callback: () => void): void {
    this.onPlaybackComplete = callback;
  }

  /**
   * Set callback for when playback starts
   */
  onStart(callback: () => void): void {
    this.onPlaybackStart = callback;
  }

  /**
   * Resume audio context if suspended (required by browsers)
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('[AudioPlaybackQueue] AudioContext resumed');
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance for use across the app
export const audioPlaybackQueue = new AudioPlaybackQueue();
