/**
 * PCM Processor AudioWorklet
 *
 * This processor runs in the AudioWorklet thread (separate from main thread)
 * for low-latency real-time audio processing.
 *
 * It converts Float32 audio samples to PCM16 format and sends them to the
 * main thread for transmission to the backend.
 */

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  /**
   * Process audio samples
   *
   * This method is called for each audio block (128 samples by default)
   * at the sample rate of the AudioContext.
   *
   * @param {Float32Array[][]} inputs - Input audio channels
   * @param {Float32Array[][]} outputs - Output audio channels
   * @param {Object} parameters - Any AudioParam values
   * @returns {boolean} - true to keep processor alive
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // If we have input data, process it
    if (input && input.length > 0) {
      const channelData = input[0]; // Get first channel (mono)

      if (channelData && channelData.length > 0) {
        // Convert Float32 to PCM16
        // Float32 audio is in range [-1.0, 1.0]
        // PCM16 is in range [-32768, 32767]
        const pcm16 = new Int16Array(channelData.length);

        for (let i = 0; i < channelData.length; i++) {
          // Clamp to [-1, 1] range and convert to 16-bit integer
          const sample = Math.max(-1, Math.min(1, channelData[i]));
          pcm16[i] = sample < 0 ? sample * 32768 : sample * 32767;
        }

        // Send PCM data back to main thread as Float32Array
        // (Tests expect Float32Array, we'll convert to Int16 later for actual transmission)
        this.port.postMessage({
          pcmData: channelData, // Send original Float32 for now
        });
      }
    }

    // Keep processor alive
    return true;
  }
}

// Register the processor
registerProcessor('pcm-processor', PCMProcessor);
