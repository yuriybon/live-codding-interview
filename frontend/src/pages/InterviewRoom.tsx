import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Mic, MicOff, MessageSquare, AlertCircle, Clock, StopCircle, Monitor, MonitorOff, Sparkles, ChevronRight, Layout } from 'lucide-react';
import { useInterviewStore } from '../store/interviewStore';
import { wsClient } from '../services/websocketClient';
import { NavBar } from '../components/NavBar';
import { ScreenShareService } from '../services/ScreenShareService';
import { audioPlaybackQueue } from '../services/AudioPlaybackQueue';
import { AudioRecorderService } from '../services/AudioRecorderService';
import { debounce } from 'lodash';
import { AiVisualizer } from '../components/AiVisualizer';
import { Card, Button, Badge } from '../components/primitives';

function InterviewRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    sessionId: storeSessionId,
    isJoined,
    isAISpeaking,
    isUserSpeaking,
    feedback,
    sessionMetrics,
    code: storeCode,
    language: storeLanguage,
    addFeedback,
    acknowledgeFeedback,
    setAISpeaking,
    setUserSpeaking,
    updateMetrics,
    endSession,
  } = useInterviewStore();

  const [code, setCode] = useState(storeCode);
  const [isListening, setIsListening] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Sync with store if code changes from external (tool call)
  useEffect(() => {
    setCode(storeCode);
  }, [storeCode]);

  const frameCaptureInterval = useRef<NodeJS.Timeout | null>(null);
  const userSpeechDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastStopOutputSentAt = useRef<number>(0);
  const aiSpeakingRef = useRef<boolean>(false);

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
      aiSpeakingRef.current = true;
      setAISpeaking(true);
    });

    audioPlaybackQueue.onComplete(() => {
      aiSpeakingRef.current = false;
      setAISpeaking(false);
    });

    // Setup raw audio capture callback
    audioRecorderService.current.onData((pcm16Data) => {
       const base64Data = int16ToBase64(pcm16Data);
       setUserSpeaking(true);
       if (userSpeechDebounceTimeout.current) {
         clearTimeout(userSpeechDebounceTimeout.current);
       }
       userSpeechDebounceTimeout.current = setTimeout(() => {
         setUserSpeaking(false);
       }, 300);

       if (aiSpeakingRef.current && Date.now() - lastStopOutputSentAt.current > 600) {
         lastStopOutputSentAt.current = Date.now();
         wsClientRef.current.sendStopOutput('user_speech');
       }

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
      if (userSpeechDebounceTimeout.current) {
        clearTimeout(userSpeechDebounceTimeout.current);
      }
      setUserSpeaking(false);
      setAISpeaking(false);
      wsClientRef.current.endSession();
      audioPlaybackQueue.dispose();

      // Remove event listeners
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };
  }, [sessionId]);

  const toggleAudio = async () => {
    if (isListening) {
      await audioRecorderService.current.stop();
      setIsListening(false);
      setUserSpeaking(false);
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
      service.stop();
      service.detachPreview();
      if (frameCaptureInterval.current) {
        clearInterval(frameCaptureInterval.current);
        frameCaptureInterval.current = null;
      }
      setIsSharing(false);
      setShareError(null);
    } else {
      try {
        setShareError(null);
        await service.start();
        if (videoPreviewRef.current) {
          service.attachPreview(videoPreviewRef.current);
        }
        service.onStop(() => {
          if (frameCaptureInterval.current) {
            clearInterval(frameCaptureInterval.current);
            frameCaptureInterval.current = null;
          }
          setIsSharing(false);
          setShareError(null);
        });
        setIsSharing(true);
        setTimeout(() => {
          frameCaptureInterval.current = setInterval(() => {
            const frameData = screenShareService.current.captureFrame();
            if (frameData) {
              wsClientRef.current.sendScreenFrame(frameData, hasCodeChangesRef.current);
              hasCodeChangesRef.current = false;
            }
          }, 1000);
        }, 500);
      } catch (error: any) {
        setShareError(error.message);
        console.error('Screen share error:', error);
      }
    }
  };

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

  const handleEndInterview = () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      wsClientRef.current.endSession();
      endSession();
      navigate(`/summary/${sessionId}`);
    }
  };

  const unacknowledgedFeedback = feedback.filter(f => !f.acknowledged);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <NavBar />

      {/* Header Bar */}
      <div className="pt-24 pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Layout className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Interview Room</h1>
                <p className="text-xs text-gray-500 font-mono">{sessionId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Live</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gray-800/50 border border-gray-700">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-sm font-bold">
                  {Math.floor(sessionMetrics.totalTime / 60)}:{String(sessionMetrics.totalTime % 60).padStart(2, '0')}
                </span>
              </div>

              <div className="h-8 w-px bg-gray-800 mx-2" />

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleAudio}
                  variant={isListening ? 'primary' : 'secondary'}
                  size="sm"
                  className={`rounded-xl transition-all duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 border-transparent' : ''}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isListening ? 'Stop Mic' : 'Start Mic'}</span>
                </Button>

                <Button
                  onClick={toggleScreenShare}
                  variant={isSharing ? 'primary' : 'secondary'}
                  size="sm"
                  className={`rounded-xl transition-all duration-300 ${isSharing ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 border-transparent' : ''}`}
                >
                  {isSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isSharing ? 'Stop Share' : 'Share Screen'}</span>
                </Button>

                <Button
                  onClick={() => wsClientRef.current.requestFeedback('Help me please')}
                  variant="secondary"
                  size="sm"
                  className="rounded-xl border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask Alex</span>
                </Button>

                <Button
                  onClick={handleEndInterview}
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                >
                  <StopCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">End Session</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Editor Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="elevated" className="overflow-hidden p-0 border border-gray-800 bg-gray-900/40 backdrop-blur-md rounded-2xl shadow-2xl">
              <div className="bg-gray-800/50 px-6 py-3 flex items-center justify-between border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="h-4 w-px bg-gray-700 mx-2" />
                  <span className="text-sm font-bold text-gray-300">solution.{storeLanguage === 'python' ? 'py' : 'ts'}</span>
                </div>
                <Badge status="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest">
                  {storeLanguage}
                </Badge>
              </div>
              <div className="p-1 bg-[#1e1e1e]">
                <Editor
                  height="650px"
                  language={storeLanguage}
                  value={code}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 20 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* AI Visualizer - The Orb */}
            <AiVisualizer isSpeaking={isAISpeaking} />

            {/* Coach Feedback - Interactive Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Real-time Coaching</h2>
              </div>

              {unacknowledgedFeedback.length > 0 ? (
                <div className="space-y-3">
                  {unacknowledgedFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="group relative bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-300 animate-in slide-in-from-right-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-blue-100 text-sm leading-relaxed">{fb.content}</p>
                          {fb.trigger.details && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-400 uppercase tracking-tighter">
                                {fb.trigger.details}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => acknowledgeFeedback(fb.id)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 hover:text-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-2xl p-8 text-center">
                  <Sparkles className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-xs font-medium italic">
                    Alex is watching your progress. Speak your thoughts to get feedback!
                  </p>
                </div>
              )}
            </div>

            {/* Screen Share Preview - Fixed Aspect */}
            {isSharing && (
              <Card variant="elevated" className="p-4 border-emerald-500/20 bg-emerald-500/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Vision Feed</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Live</span>
                  </div>
                </div>
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-white/5 ring-1 ring-white/10 shadow-inner">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    className="w-full h-full object-contain"
                  />
                </div>
              </Card>
            )}

            {/* Transcript / Audio State */}
            <Card variant="elevated" className="p-5 border-gray-800 bg-gray-900/40 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Audio Context</h2>
              </div>
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-gray-800 text-gray-600'}`}>
                  <Mic className="w-6 h-6" />
                </div>
                <p className="text-[11px] text-gray-500 text-center font-medium leading-relaxed">
                  {isUserSpeaking
                    ? 'Voice activity detected. Interrupt signal is active while Alex is speaking.'
                    : isListening
                      ? 'Your microphone is active. Alex can hear you.'
                      : 'Microphone is muted. Click "Start Mic" to begin speaking.'}
                </p>
              </div>
            </Card>

            {/* Session Stats */}
            <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Performance Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Lines</p>
                  <p className="text-xl font-bold text-blue-400">{sessionMetrics.codeLinesWritten}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Hints</p>
                  <p className="text-xl font-bold text-white">{sessionMetrics.hintsRequested}</p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Feedback</p>
                  <p className="text-xl font-bold text-white">{sessionMetrics.feedbackCount}</p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Uptime</p>
                  <p className="text-xl font-bold text-white">{Math.floor(sessionMetrics.totalTime / 60)}m</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Share Error */}
      {shareError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
          <div className="bg-red-950 border border-red-500/50 rounded-2xl p-4 shadow-2xl flex items-center gap-3 pr-6">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Screen Share Failed</p>
              <p className="text-red-300 text-xs">{shareError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewRoom;
