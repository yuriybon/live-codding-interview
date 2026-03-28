import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { NavBar } from '../components/NavBar';
import { Card, Badge, Button, SectionHeader } from '../components/primitives';
import { SessionConfigModal } from '../components/SessionConfigModal';
import { Sparkles, Zap, Shield, Target, Play } from 'lucide-react';

function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, checkAuth, login } = useAuthStore();
  
  const [candidateName, setCandidateName] = useState('');
  const [starting, setStarting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    if (authError) {
      setLocalError(`Authentication failed: ${authError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user && user.name && !candidateName) {
      setCandidateName(user.name);
    }
  }, [user, candidateName]);

  useEffect(() => {
    if (isAuthenticated && location.state && location.state.from) {
      navigate(location.state.from.pathname);
    }
  }, [isAuthenticated, location, navigate]);

  const handleOpenConfigModal = () => {
    setShowConfigModal(true);
  };

  const startInterview = async (config: { language: string; exerciseId: string }) => {
    setStarting(true);
    setLocalError('');

    try {
      const response = await axios.post('/api/sessions/new', {
        candidateName: candidateName || user?.name || 'Anonymous',
        language: config.language,
        exerciseId: config.exerciseId
      });

      if (response.data.sessionId) {
        navigate(`/interview/${response.data.sessionId}`);
      }
    } catch (err) {
      setLocalError('Failed to start interview session. Please try again.');
      console.error('Error starting interview:', err);
    } finally {
      setStarting(false);
      setShowConfigModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <NavBar />

      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Interview Preparation</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Coding Interview</span> with Real-Time AI.
              </h1>
              
              <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
                Practice with Alex, our multimodal AI architect who hears your voice and watches your code in real-time. Get instant feedback on logic, complexity, and communication.
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Secure OAuth2</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">Sub-second Latency</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Multimodal Vision</span>
                </div>
              </div>
            </div>

            {/* CTA Card Section */}
            <div className="relative animate-in zoom-in duration-1000">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl blur-2xl" />
              
              <Card variant="elevated" className="relative border border-gray-800 bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
                {isLoading ? (
                  <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-gray-400 animate-pulse">Authenticating...</p>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
                      <p className="text-gray-400">Sign in with your Google account to access the simulator and track your progress.</p>
                    </div>
                    
                    {localError && (
                      <div className="w-full bg-red-900/30 border border-red-800/50 text-red-200 p-4 rounded-xl text-center text-sm">
                        {localError}
                      </div>
                    )}

                    <button
                      onClick={login}
                      className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                      <img src={user?.picture} alt={user?.name} className="w-12 h-12 rounded-full border border-blue-500/50" />
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Welcome back,</p>
                        <p className="text-white font-bold text-lg leading-tight">{user?.name}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Active Plan</span>
                          <Badge status="info">Professional</Badge>
                        </div>
                        <p className="text-white font-semibold">Live Architecture Review</p>
                        <p className="text-gray-400 text-xs mt-1">Unlimited real-time voice & screen sessions</p>
                      </div>
                    </div>

                    {localError && (
                      <div className="bg-red-900/30 border border-red-800/50 text-red-200 p-4 rounded-xl text-sm text-center">
                        {localError}
                      </div>
                    )}

                    <Button
                      onClick={handleOpenConfigModal}
                      disabled={starting}
                      variant="primary"
                      size="lg"
                      className="w-full py-5 rounded-2xl text-lg font-bold group shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    >
                      {starting ? 'Preparing AI...' : (
                        <>
                          <Play className="w-5 h-5 fill-current" />
                          <span>Start New Session</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-3xl bg-gray-900/40 border border-gray-800 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Coaching</h3>
              <p className="text-gray-400 leading-relaxed">
                Alex detects when you're stuck or heading into pitfalls, providing gentle hints without giving away the solution.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gray-900/40 border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Voice-to-Voice</h3>
              <p className="text-gray-400 leading-relaxed">
                Natural, low-latency conversations. Explain your thought process out loud just like a real technical interview.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gray-900/40 border border-gray-800 hover:border-pink-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Visual Analysis</h3>
              <p className="text-gray-400 leading-relaxed">
                The AI literally "sees" your editor and terminal, allowing it to comment on your code style and algorithmic efficiency.
              </p>
            </div>
          </div>
        </div>
      </main>

      {showConfigModal && (
        <SessionConfigModal 
          onStart={startInterview} 
          onCancel={() => setShowConfigModal(false)}
          isLoading={starting}
        />
      )}
    </div>
  );
}

export default LandingPage;
