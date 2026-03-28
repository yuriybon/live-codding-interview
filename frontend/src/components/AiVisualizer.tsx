import React from 'react';
import { Volume2 } from 'lucide-react';

interface AiVisualizerProps {
  isSpeaking: boolean;
  audioLevel?: number; // 0 to 1
}

export const AiVisualizer: React.FC<AiVisualizerProps> = ({ isSpeaking, audioLevel = 0 }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl transition-all duration-500">
      <div className="relative">
        {/* Outer Glowing Rings */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '2s', transform: 'scale(1.5)' }} />
          </>
        )}

        {/* Central Core */}
        <div 
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
            isSpeaking 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-110' 
              : 'bg-gray-700'
          }`}
        >
          <Volume2 
            className={`w-10 h-10 transition-colors duration-500 ${
              isSpeaking ? 'text-white' : 'text-gray-500'
            }`} 
          />
        </div>

        {/* Real-time Waveform Bars (Simplified) */}
        {isSpeaking && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1 bg-blue-400 rounded-full animate-bounce"
                style={{
                  height: `${20 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <h3 className={`text-lg font-medium transition-colors ${isSpeaking ? 'text-blue-400' : 'text-gray-400'}`}>
          {isSpeaking ? 'Alex is speaking...' : 'Alex is listening...'}
        </h3>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
          Gemini 2.0 Multimodal Live
        </p>
      </div>
    </div>
  );
};
