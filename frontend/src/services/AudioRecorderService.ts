/**
 * AudioRecorderService
 *
 * Hardware Abstraction Layer (HAL) for browser audio capture.
 * Provides low-latency PCM16 audio streaming using AudioWorklet API.
 *
 * This service abstracts the complexity of:
 * - getUserMedia microphone access
 * - AudioContext setup
 * - AudioWorklet processor loading and management
 * - Real-time PCM audio data streaming
 */

export interface AudioRecorderConfig {
  sampleRate?: number; // 16000, 24000, or 48000 Hz
}

export class AudioRecorderService {
  // Private browser API instances (hidden from public interface)
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private recording: boolean = false;
  private config: AudioRecorderConfig;
  private dataCallback: ((data: Float32Array) => void) | null = null;

  constructor(config: AudioRecorderConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate || 16000,
    };
  }

  /**
   * Start recording audio from the microphone
   */
  async start(): Promise<void> {
    // Check for getUserMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }

    // Request microphone access with optimal constraints
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1, // Mono audio
        sampleRate: this.config.sampleRate,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    // Create AudioContext
    this.audioContext = new AudioContext({
      sampleRate: this.config.sampleRate,
    });

    // Ensure AudioContext is running
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Load the PCM processor AudioWorklet
    await this.audioContext.audioWorklet.addModule('/pcm-processor.js');

    // Create the AudioWorklet node for PCM processing
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      'pcm-processor',
      {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      }
    );

    // Set up message handler to receive PCM data from worklet
    this.workletNode.port.onmessage = (event) => {
      if (event.data.pcmData && this.dataCallback) {
        this.dataCallback(event.data.pcmData);
      }
    };

    // Create source node from media stream
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Connect the audio pipeline: source -> worklet -> destination
    this.sourceNode.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);

    this.recording = true;
  }

  /**
   * Stop recording and clean up resources
   */
  async stop(): Promise<void> {
    this.recording = false;

    // Disconnect audio nodes
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close AudioContext
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Register callback for PCM data
   */
  onData(callback: (data: Float32Array) => void): void {
    this.dataCallback = callback;
  }

  /**
   * Check if currently recording
   */
  get isRecording(): boolean {
    return this.recording;
  }
}
