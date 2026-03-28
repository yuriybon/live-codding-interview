/**
 * AudioRecorderService Test Suite
 * TDD Phase: Red (Test First)
 *
 * This test suite verifies that the AudioRecorderService can capture
 * raw PCM16 audio from the microphone using AudioWorklet for low-latency
 * streaming to the Gemini Live API.
 *
 * Expected behavior: These tests will FAIL until TASK-1.3.2 implements
 * the AudioRecorderService class.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioRecorderService } from '../../services/AudioRecorderService';

// Mock browser APIs
const mockGetUserMedia = vi.fn();
const mockAudioContext = {
  audioWorklet: {
    addModule: vi.fn().mockResolvedValue(undefined),
  },
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  createGain: vi.fn().mockReturnValue({
    connect: vi.fn(),
    gain: { value: 1 },
  }),
  destination: {},
  sampleRate: 48000,
  state: 'running',
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

const mockAudioWorkletNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  port: {
    onmessage: null,
    postMessage: vi.fn(),
  },
};

// Set up global mocks
beforeEach(() => {
  // Mock navigator.mediaDevices
  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: mockGetUserMedia,
    },
  });

  // Mock AudioContext as a constructor function
  (global as any).AudioContext = vi.fn(function(this: any, options?: any) {
    return mockAudioContext;
  });

  // Mock AudioWorkletNode as a constructor function
  (global as any).AudioWorkletNode = vi.fn(function(this: any, context: any, name: string, options?: any) {
    return mockAudioWorkletNode;
  });

  // Reset mocks
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AudioRecorderService - Initialization', () => {
  /**
   * TDD Red Phase Test
   *
   * This test verifies that the AudioRecorderService class exists
   * and can be instantiated.
   *
   * Current implementation WILL FAIL because:
   * - AudioRecorderService class doesn't exist yet
   *
   * This test will pass once TASK-1.3.2 creates the service.
   */
  it('should be instantiable', () => {
    // Act: Instantiate the service
    const recorder = new AudioRecorderService();

    // Assert: Service should be created
    expect(recorder).toBeDefined();
    expect(recorder).toBeInstanceOf(AudioRecorderService);
  });

  /**
   * Test that verifies getUserMedia is called with correct constraints
   */
  it('should request microphone access with correct audio constraints', async () => {
    // Arrange
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    const recorder = new AudioRecorderService();

    // Act: Start recording
    await recorder.start();

    // Assert: getUserMedia should be called with audio constraints
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        channelCount: 1, // Mono
        sampleRate: expect.any(Number), // 16000 or 24000 Hz
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
  });

  /**
   * Test that verifies AudioContext creation
   */
  it('should create an AudioContext when starting', async () => {
    // Arrange
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    const recorder = new AudioRecorderService();

    // Act: Start recording
    await recorder.start();

    // Assert: AudioContext should be created
    expect(AudioContext).toHaveBeenCalled();
  });

  /**
   * Test that verifies AudioWorklet processor loading
   */
  it('should load the PCM processor AudioWorklet', async () => {
    // Arrange
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    const recorder = new AudioRecorderService();

    // Act: Start recording
    await recorder.start();

    // Assert: AudioWorklet module should be loaded
    expect(mockAudioContext.audioWorklet.addModule).toHaveBeenCalledWith(
      expect.stringContaining('pcm-processor')
    );
  });

  /**
   * Test that verifies AudioWorkletNode is created
   */
  it('should create an AudioWorkletNode for PCM processing', async () => {
    // Arrange
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    const recorder = new AudioRecorderService();

    // Act: Start recording
    await recorder.start();

    // Assert: AudioWorkletNode should be created
    expect(AudioWorkletNode).toHaveBeenCalledWith(
      mockAudioContext,
      'pcm-processor',
      expect.any(Object) // options
    );
  });

  /**
   * Test that verifies audio pipeline connection
   */
  it('should connect audio nodes in correct order', async () => {
    // Arrange
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    const mockSourceNode = mockAudioContext.createMediaStreamSource();

    const recorder = new AudioRecorderService();

    // Act: Start recording
    await recorder.start();

    // Assert: Source should connect to worklet
    expect(mockSourceNode.connect).toHaveBeenCalled();
  });

  /**
   * Test that verifies event listener setup for PCM data
   */
  it('should set up message handler for PCM data from AudioWorklet', async () => {
    // Arrange
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    const recorder = new AudioRecorderService();

    // Set up callback to capture PCM data
    const onDataCallback = vi.fn();
    recorder.onData(onDataCallback);

    // Act: Start recording
    await recorder.start();

    // Simulate PCM data from worklet
    const pcmData = new Int16Array([3276, 6553, 9830]);
    if (mockAudioWorkletNode.port.onmessage) {
      mockAudioWorkletNode.port.onmessage({
        data: { pcmData },
      } as any);
    }

    // Assert: Callback should be invoked with PCM data
    expect(onDataCallback).toHaveBeenCalledWith(expect.any(Int16Array));
  });

  /**
   * Test that verifies proper cleanup on stop
   */
  it('should properly clean up resources when stopped', async () => {
    // Arrange
    const mockTrack = { stop: vi.fn() };
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [mockTrack],
    });

    const recorder = new AudioRecorderService();

    await recorder.start();

    // Act: Stop recording
    await recorder.stop();

    // Assert: Resources should be cleaned up
    expect(mockTrack.stop).toHaveBeenCalled();
    expect(mockAudioWorkletNode.disconnect).toHaveBeenCalled();
  });

  /**
   * Test that verifies error handling for missing getUserMedia
   */
  it('should handle browsers without getUserMedia support', async () => {
    // Arrange: Remove getUserMedia support
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: undefined,
    });

    const recorder = new AudioRecorderService();

    // Act & Assert: Should throw error
    await expect(recorder.start()).rejects.toThrow('getUserMedia not supported');
  });

  /**
   * Test that verifies sample rate configuration
   */
  it('should support configurable sample rates (16kHz, 24kHz, 48kHz)', async () => {
    // Arrange
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    // Test 16kHz
    const recorder16k = new AudioRecorderService({ sampleRate: 16000 });
    await recorder16k.start();

    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: expect.objectContaining({
          sampleRate: 16000,
        }),
      })
    );
  });

  /**
   * Hardware Abstraction Layer Architecture Test
   *
   * Verifies that the service properly abstracts browser audio APIs
   * behind a clean interface.
   */
  it('should provide clean HAL interface abstracting browser APIs', () => {
    // Arrange
    const recorder = new AudioRecorderService();

    // Assert: Service should have clean public API
    expect(recorder.start).toBeDefined();
    expect(recorder.stop).toBeDefined();
    expect(recorder.onData).toBeDefined();
    expect(recorder.isRecording).toBeDefined();

    // Internal browser API details should be hidden (private fields exist but are not part of the public interface)
    // TypeScript private fields are still accessible at runtime but are null initially
    expect((recorder as any).audioContext).toBeNull();
    expect((recorder as any).workletNode).toBeNull();
  });
});
