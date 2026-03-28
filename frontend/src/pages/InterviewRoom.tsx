import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Mic, MicOff, Eye, EyeOff, MessageSquare, AlertCircle, Clock, StopCircle, Monitor, MonitorOff, Volume2 } from 'lucide-react';
import { useInterviewStore } from '../store/interviewStore';
import { wsClient } from '../services/websocketClient';
import { NavBar } from '../components/NavBar';
import { ScreenShareService } from '../services/ScreenShareService';
import { audioPlaybackQueue } from '../services/AudioPlaybackQueue';
import { AudioRecorderService } from '../services/AudioRecorderService';
import { debounce } from 'lodash';
import { AiVisualizer } from '../components/AiVisualizer';
import { Card, Button } from '../components/primitives';

function InterviewRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    sessionId: storeSessionId,
    isJoined,
    feedback,
    sessionMetrics,
    code: storeCode,
    language: storeLanguage,
    addFeedback,
    acknowledgeFeedback,
    updateMetrics,
    endSession,
  } = useInterviewStore();

  const [code, setCode] = useState(storeCode);
  const [isListening, setIsListening] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  // Sync with store if code changes from external (tool call)
  useEffect(() => {
    setCode(storeCode);
  }, [storeCode]);

  const frameCaptureInterval = useRef<NodeJS.Timeout | null>(null);

  const codeRef = useRef<string>(code);
  const hasCodeChangesRef = useRef<boolean>(false);

  // Store the WebSocket client instance
  const wsClientRef = useRef(wsClient);

  // Screen share service and preview video element
  const screenShareService = useRef<ScreenShareService>(new ScreenShareService());
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Audio recording service
  const audioRecorderService = useRef<AudioRecorderService>(new AudioRecorderService({ sampleRate: 16000 }));

  // Helper to convert Int16Array to Base64
  const int16ToBase64 = (int16Array: Int16Array): string => {
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return window.btoa(binary);
  };

  useEffect(() => {
    if (!sessionId) return;

    // Set session ID in store
    useInterviewStore.getState().setSessionId(sessionId);

    // Connect to WebSocket
    wsClientRef.current.connect(sessionId, true)
      .then(() => console.log('Connected to WebSocket'))
      .catch((err) => console.error('Failed to connect:', err));

    // Setup audio playback callbacks
    audioPlaybackQueue.onStart(() => {
      setIsAISpeaking(true);
    });

    audioPlaybackQueue.onComplete(() => {
      setIsAISpeaking(false);
    });

    // Setup raw audio capture callback
    audioRecorderService.current.onData((pcm16Data) => {
       const base64Data = int16ToBase64(pcm16Data);
       wsClientRef.current.sendRawAudio(base64Data);
    });

    // Resume audio context on user interaction (required by browsers)
    const resumeAudio = () => {
      audioPlaybackQueue.resume().catch(console.error);
      // Remove listener after first interaction
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };

    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);

    return () => {
      // Cleanup: stop screen sharing and frame capture
      if (frameCaptureInterval.current) {
        clearInterval(frameCaptureInterval.current);
      }
      if (screenShareService.current.isSharing) {
        screenShareService.current.stop();
      }
      if (audioRecorderService.current.isRecording) {
        audioRecorderService.current.stop();
      }
      wsClientRef.current.endSession();
      audioPlaybackQueue.dispose();

      // Remove event listeners
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };
  }, [sessionId]);

  useEffect(() => {
    // Check for WebSocket feedback messages
    const checkFeedback = () => {
      // This would be handled by WebSocket messages
    };

    const interval = setInterval(checkFeedback, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleAudio = async () => {
    if (isListening) {
      await audioRecorderService.current.stop();
      setIsListening(false);
    } else {
      try {
        await audioRecorderService.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start audio recording:', error);
      }
    }
  };

  const toggleScreenShare = async () => {
    const service = screenShareService.current;

    if (isSharing) {
      // Stop sharing
      service.stop();
      service.detachPreview();

      // Stop frame capture interval
      if (frameCaptureInterval.current) {
        clearInterval(frameCaptureInterval.current);
        frameCaptureInterval.current = null;
      }

      setIsSharing(false);
      setShareError(null);
    } else {
      // Start sharing
      try {
        setShareError(null);
        await service.start();

        // Attach to video preview if element is ready
        if (videoPreviewRef.current) {
          service.attachPreview(videoPreviewRef.current);
        }

        // Register callback for when user stops via browser UI
        service.onStop(() => {
          if (frameCaptureInterval.current) {
            clearInterval(frameCaptureInterval.current);
            frameCaptureInterval.current = null;
          }
          setIsSharing(false);
          setShareError(null);
        });

        setIsSharing(true);

        // Start periodic frame capture (1 frame per second)
        // Wait a bit for video preview to be ready
        setTimeout(() => {
          frameCaptureInterval.current = setInterval(() => {
            const frameData = screenShareService.current.captureFrame();
            if (frameData) {
              // Send to backend with code change indicator
              wsClientRef.current.sendScreenFrame(frameData, hasCodeChangesRef.current);
              // Reset code change indicator after sending
              hasCodeChangesRef.current = false;
            }
          }, 1000); // 1 FPS
        }, 500);
      } catch (error: any) {
        setShareError(error.message);
        console.error('Screen share error:', error);
      }
    }
  };

  // Debounce the code sending so we don't flood the websocket
  const debouncedSendCode = useCallback(
    debounce((value: string, lang: string) => {
      wsClientRef.current.sendCodeUpdate(value, lang);
    }, 1000),
    []
  );

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      hasCodeChangesRef.current = true;
      debouncedSendCode(value, storeLanguage);
    }
  };

  const requestFeedback = (reason: string) => {
    wsClientRef.current.requestFeedback(reason);
  };

  const handleEndInterview = () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      wsClientRef.current.endSession();
      endSession();
      navigate(`/summary/${sessionId}`);
    }
  };

  const unacknowledgedFeedback = feedback.filter(f => !f.acknowledged);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation Bar with User Avatar */}
      <NavBar />

      {/* Header */}
      <header className="bg-slate-900/70 border-b border-slate-800/80 px-6 py-4 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-100">Interview Session</h1>
            <span className="text-sm text-slate-400 font-mono">{sessionId?.slice(0, 8)}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-sm text-slate-200">
                {Math.floor(sessionMetrics.totalTime / 60)}:{String(sessionMetrics.totalTime % 60).padStart(2, '0')}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="text-sm">{isListening ? 'Stop' : 'Record'}</span>
            </button>

            {/* Screen Share Toggle */}
            <button
              onClick={toggleScreenShare}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                isSharing
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
              title={shareError || undefined}
            >
              {isSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span className="text-sm">{isSharing ? 'Stop' : 'Share'}</span>
            </button>

            <div className="h-6 w-px bg-slate-700" />

            {/* Request Help */}
            <Button
              onClick={() => requestFeedback('Need a hint')}
              variant="primary"
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Hint</span>
            </Button>

            {/* End Interview */}
            <Button
              onClick={handleEndInterview}
              variant="destructive"
              size="sm"
            >
              <StopCircle className="w-4 h-4" />
              <span>End</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor */}
          <div className="lg:col-span-2">
            <Card variant="primary" className="overflow-hidden p-0 border border-slate-800 bg-slate-900/90">
              <div className="bg-slate-800/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/50">
                <span className="text-sm font-medium text-slate-200">solution.ts</span>
                <span className="text-xs text-slate-400 uppercase tracking-wide">TypeScript</span>
              </div>
              <Editor
                height="600px"
                language={storeLanguage}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Visualizer */}
            <AiVisualizer isSpeaking={isAISpeaking} />

            {/* Feedback Panel */}
            <Card variant="primary" className="p-4 border border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-slate-100">Coach Feedback</h2>
              </div>

              {unacknowledgedFeedback.length > 0 ? (
                <div className="space-y-3">
                  {unacknowledgedFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-cyan-100 text-sm leading-relaxed">{fb.content}</p>
                          {fb.trigger.details && (
                            <p className="text-cyan-400 text-xs mt-1.5 font-medium">
                              {fb.trigger.details}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => acknowledgeFeedback(fb.id)}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-4">
                  No feedback yet. Keep working!
                </p>
              )}
            </Card>

            {/* Metrics Panel */}
            <Card variant="primary" className="p-4 border border-slate-800 bg-slate-900/90">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Session Stats</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Time Active</span>
                  <span className="text-slate-200 font-medium">{Math.floor(sessionMetrics.totalTime / 60)} min</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Lines Written</span>
                  <span className="text-cyan-400 font-medium">{sessionMetrics.codeLinesWritten}</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Hints Requested</span>
                  <span className="text-slate-200 font-medium">{sessionMetrics.hintsRequested}</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Feedback Received</span>
                  <span className="text-slate-200 font-medium">{sessionMetrics.feedbackCount}</span>
                </div>
              </div>
            </Card>

            {/* Screen Share Preview */}
            {isSharing && (
              <Card variant="primary" className="p-4 border border-emerald-500/30 bg-slate-900/90">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-slate-100">Screen Share</h2>
                  <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="relative bg-slate-950 rounded-lg overflow-hidden aspect-video border border-slate-800">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    className="w-full h-full object-contain"
                  />
                </div>
              </Card>
            )}

            {/* Share Error Message */}
            {shareError && (
              <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-200 text-sm">{shareError}</p>
                </div>
              </div>
            )}

            {/* Transcript Preview */}
            <Card variant="primary" className="p-4 border border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-slate-100">Your Speech</h2>
              </div>
              <p className="text-slate-400 text-sm italic">
                Speak to see your transcript...
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InterviewRoom;
