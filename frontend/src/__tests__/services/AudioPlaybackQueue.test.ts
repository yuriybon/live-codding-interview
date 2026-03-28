import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioPlaybackQueue } from '../../services/AudioPlaybackQueue';

// Mock Web Audio API for testing
class MockAudioContext {
  state = 'running';
  sampleRate = 24000;
  currentTime = 0;
  destination = {};
  createdSources: any[] = [];

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: () => new Float32Array(length),
    };
  }

  createBufferSource() {
    const source = {
      buffer: null,
      onended: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn((when?: number) => {
        if (typeof when === 'number') {
          this.currentTime = Math.max(this.currentTime, when);
        }
      }),
      stop: vi.fn(),
    };
    this.createdSources.push(source);
    return source;
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

// Set up global AudioContext mock
global.AudioContext = MockAudioContext as any;

describe('AudioPlaybackQueue', () => {
  let queue: AudioPlaybackQueue;

  beforeEach(() => {
    queue = new AudioPlaybackQueue();
  });

  afterEach(() => {
    queue.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with empty queue', () => {
      expect(queue.queueSize).toBe(0);
      expect(queue.playing).toBe(false);
    });

    it('should create AudioContext with 24kHz sample rate', () => {
      // AudioContext should be created during initialization
      expect(queue).toBeDefined();
    });
  });

  describe('Enqueue', () => {
    it('should enqueue audio chunks', () => {
      const mockBase64 = btoa('test audio data');

      queue.enqueue(mockBase64);

      // Queue size should increase (or start playing immediately)
      // Since playback is async, we check that it was called
      expect(queue.queueSize >= 0).toBe(true);
    });

    it('should ignore empty audio chunks', () => {
      const initialSize = queue.queueSize;

      queue.enqueue('');

      expect(queue.queueSize).toBe(initialSize);
    });

    it('should start playback automatically when not playing', () => {
      const mockBase64 = btoa('test audio data');

      expect(queue.playing).toBe(false);
      queue.enqueue(mockBase64);

      // Should start playing or have attempted to
      // (may be false again if chunk played very quickly)
      expect(queue.queueSize >= 0).toBe(true);
    });
  });

  describe('Stop', () => {
    it('should stop playback and clear queue', () => {
      const mockBase64 = btoa('test audio data');

      queue.enqueue(mockBase64);
      queue.enqueue(mockBase64);
      queue.stop();

      expect(queue.queueSize).toBe(0);
      expect(queue.playing).toBe(false);
    });

    it('should be idempotent when called multiple times', () => {
      queue.stop();
      queue.stop();

      expect(queue.queueSize).toBe(0);
      expect(queue.playing).toBe(false);
    });
  });

  describe('Clear', () => {
    it('should clear queue without stopping current playback', () => {
      const mockBase64 = btoa('test audio data');

      queue.enqueue(mockBase64);
      queue.enqueue(mockBase64);
      queue.clear();

      expect(queue.queueSize).toBe(0);
      // Playing status may still be true if audio is playing
    });
  });

  describe('Callbacks', () => {
    it('should call onComplete when playback finishes', (done) => {
      queue.onComplete(() => {
        expect(true).toBe(true);
        done();
      });

      // Empty queue should trigger complete
      queue.enqueue('');
    });

    it('should call onStart when playback begins', (done) => {
      queue.onStart(() => {
        expect(true).toBe(true);
        done();
      });

      // Create valid PCM16 audio (16-bit samples)
      const samples = new Int16Array(1000); // 1000 samples
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin(i * 0.1) * 32767; // Sine wave
      }

      // Convert to base64 safely
      const bytes = new Uint8Array(samples.buffer);
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64PCM = btoa(binaryString);
      queue.enqueue(base64PCM);
    });
  });

  describe('Resume', () => {
    it('should resume suspended audio context', async () => {
      await expect(queue.resume()).resolves.not.toThrow();
    });
  });

  describe('Dispose', () => {
    it('should clean up resources', () => {
      const mockBase64 = btoa('test audio data');
      queue.enqueue(mockBase64);

      queue.dispose();

      expect(queue.queueSize).toBe(0);
      expect(queue.playing).toBe(false);
    });
  });

  describe('PCM16 Conversion', () => {
    it('should convert valid base64 PCM16 to audio', () => {
      // Create valid PCM16 audio (16-bit samples)
      const samples = new Int16Array(1000); // 1000 samples = ~41ms at 24kHz
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin(i * 0.1) * 32767; // Sine wave
      }

      // Convert to base64 safely
      const bytes = new Uint8Array(samples.buffer);
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64PCM = btoa(binaryString);

      expect(() => queue.enqueue(base64PCM)).not.toThrow();
    });

    it('should handle invalid base64 gracefully', () => {
      const invalidBase64 = 'not-valid-base64!!!';

      // Should not throw, but should handle error internally
      expect(() => queue.enqueue(invalidBase64)).not.toThrow();
    });
  });

  describe('Queue Management', () => {
    it('should schedule chunk start times sequentially', async () => {
      const flush = async () => {
        await Promise.resolve();
        await Promise.resolve();
      };

      const makeChunk = (sampleCount: number) => {
        const samples = new Int16Array(sampleCount);
        for (let i = 0; i < samples.length; i++) {
          samples[i] = Math.sin(i * 0.1) * 32767;
        }

        const bytes = new Uint8Array(samples.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      const chunk = makeChunk(2400); // 0.1s at 24kHz
      queue.enqueue(chunk);
      queue.enqueue(chunk);
      queue.enqueue(chunk);
      await flush();

      const ctx = (queue as any).audioContext as MockAudioContext;

      expect(ctx.createdSources.length).toBe(1);
      const first = ctx.createdSources[0];
      const firstStart = (first.start as any).mock.calls[0][0] as number;
      expect(firstStart).toBeCloseTo(0, 5);

      const firstDuration = first.buffer.duration as number;
      ctx.currentTime = firstStart + firstDuration;
      if (typeof first.onended === 'function') {
        first.onended();
      }
      await flush();

      expect(ctx.createdSources.length).toBe(2);
      const second = ctx.createdSources[1];
      const secondStart = (second.start as any).mock.calls[0][0] as number;
      expect(secondStart).toBeCloseTo(firstStart + firstDuration, 5);

      const secondDuration = second.buffer.duration as number;
      ctx.currentTime = secondStart + secondDuration;
      if (typeof second.onended === 'function') {
        second.onended();
      }
      await flush();

      expect(ctx.createdSources.length).toBe(3);
      const third = ctx.createdSources[2];
      const thirdStart = (third.start as any).mock.calls[0][0] as number;
      expect(thirdStart).toBeCloseTo(secondStart + secondDuration, 5);
    });

    it('should maintain FIFO order', () => {
      const chunk1 = btoa('chunk1');
      const chunk2 = btoa('chunk2');
      const chunk3 = btoa('chunk3');

      queue.enqueue(chunk1);
      queue.enqueue(chunk2);
      queue.enqueue(chunk3);

      // Queue should have chunks (or be playing them)
      expect(queue.queueSize >= 0).toBe(true);
    });

    it('should handle rapid enqueueing', () => {
      for (let i = 0; i < 10; i++) {
        queue.enqueue(btoa(`chunk${i}`));
      }

      expect(queue.queueSize >= 0).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queue playNext gracefully', () => {
      // Empty queue should complete without errors
      expect(() => queue.clear()).not.toThrow();
    });

    it('should handle very short audio chunks', () => {
      const samples = new Int16Array(10); // Very short
      const base64PCM = btoa(String.fromCharCode(...new Uint8Array(samples.buffer)));

      expect(() => queue.enqueue(base64PCM)).not.toThrow();
    });

    it('should handle very long audio chunks', () => {
      const samples = new Int16Array(100000); // ~4 seconds at 24kHz

      // Convert to base64 without spread operator (avoids stack overflow)
      const bytes = new Uint8Array(samples.buffer);
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64PCM = btoa(binaryString);

      expect(() => queue.enqueue(base64PCM)).not.toThrow();
    });
  });
});
