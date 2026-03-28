/**
 * ScreenShareService
 *
 * Handles screen sharing using the Screen Capture API.
 * Provides a clean interface for starting/stopping screen sharing
 * and accessing the media stream for preview and frame capture.
 *
 * Browser Compatibility:
 * - Chrome/Edge: Full support for getDisplayMedia
 * - Firefox: Full support
 * - Safari: Requires user gesture and HTTPS
 */

export interface ScreenShareConfig {
  // Desired video resolution (constraints passed to getDisplayMedia)
  width?: number;
  height?: number;
  frameRate?: number;
}

export class ScreenShareService {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private sharing: boolean = false;
  private config: ScreenShareConfig;
  private stopCallback: (() => void) | null = null;

  constructor(config: ScreenShareConfig = {}) {
    this.config = {
      width: config.width || 1920,
      height: config.height || 1080,
      frameRate: config.frameRate || 30,
    };
  }

  /**
   * Start screen sharing
   * Prompts the user to select a screen/window/tab to share
   */
  async start(): Promise<MediaStream> {
    // Check for getDisplayMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen sharing not supported in this browser');
    }

    try {
      // Request screen sharing permission
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          frameRate: { ideal: this.config.frameRate },
        },
        audio: false, // Don't capture system audio for now
      });

      // Listen for when user stops sharing via browser UI
      const videoTrack = this.mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.handleStreamEnded();
        };
      }

      this.sharing = true;
      return this.mediaStream;
    } catch (error: any) {
      // User cancelled the permission dialog
      if (error.name === 'NotAllowedError') {
        throw new Error('Screen sharing permission denied');
      }
      // Other errors
      throw new Error(`Failed to start screen sharing: ${error.message}`);
    }
  }

  /**
   * Stop screen sharing and clean up resources
   */
  stop(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.sharing = false;

    // Call the stop callback if registered
    if (this.stopCallback) {
      this.stopCallback();
    }
  }

  /**
   * Attach the media stream to a video element for preview
   */
  attachPreview(videoElement: HTMLVideoElement): void {
    if (!this.mediaStream) {
      throw new Error('No active screen share to preview');
    }

    this.videoElement = videoElement;
    this.videoElement.srcObject = this.mediaStream;
    this.videoElement.play().catch(err => {
      console.error('Failed to play video preview:', err);
    });
  }

  /**
   * Detach the preview video element
   */
  detachPreview(): void {
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Get the current media stream
   */
  getStream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * Check if currently sharing
   */
  get isSharing(): boolean {
    return this.sharing;
  }

  /**
   * Register callback for when sharing stops
   */
  onStop(callback: () => void): void {
    this.stopCallback = callback;
  }

  /**
   * Capture a single frame from the screen share
   * Returns a base64-encoded JPEG image
   */
  captureFrame(): string | null {
    if (!this.videoElement || !this.sharing) {
      return null;
    }

    try {
      // Create an off-screen canvas
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      // Draw the current video frame to the canvas
      ctx.drawImage(this.videoElement, 0, 0);

      // Convert to base64 JPEG (quality: 0.8 for good compression)
      return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    } catch (error) {
      console.error('Failed to capture frame:', error);
      return null;
    }
  }

  /**
   * Handle when the stream ends (user stopped sharing via browser UI)
   */
  private handleStreamEnded(): void {
    this.sharing = false;
    this.mediaStream = null;

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    // Notify the application
    if (this.stopCallback) {
      this.stopCallback();
    }
  }
}
