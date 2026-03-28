import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { NavBar } from '../components/NavBar';

function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, checkAuth, login } = useAuthStore();
  
  const [candidateName, setCandidateName] = useState('');
  const [starting, setStarting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    // Check for errors in the URL (e.g. from failed OAuth callback)
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    if (authError) {
      setLocalError(`Authentication failed: ${authError}`);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check auth status
    checkAuth();
  }, [checkAuth]);

  // Pre-fill candidate name when user data loads
  useEffect(() => {
    if (user && user.name && !candidateName) {
      setCandidateName(user.name);
    }
  }, [user, candidateName]);

  // Redirect if user came from a protected route and just logged in
  useEffect(() => {
    if (isAuthenticated && location.state && location.state.from) {
      navigate(location.state.from.pathname);
    }
  }, [isAuthenticated, location, navigate]);

  const startInterview = async () => {
    setStarting(true);
    setLocalError('');

    try {
      // In a real app this would likely come from user selection/session prep
      const response = await axios.post('/api/sessions/new', {
        candidateName: candidateName || user?.name || 'Anonymous',
      });

      if (response.data.sessionId) {
        navigate(`/interview/${response.data.sessionId}`);
      }
    } catch (err) {
      setLocalError('Failed to start interview session. Please try again.');
      console.error('Error starting interview:', err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4 relative">
      
      {/* Navigation Bar with User Avatar */}
      <NavBar />

      <div className="max-w-2xl w-full mt-16 sm:mt-0">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Interview Simulator
          </h1>
          <p className="text-xl text-gray-300">
            Practice coding interviews with real-time AI coaching and feedback
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl min-h-[250px] flex flex-col justify-center">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-6 flex flex-col items-center">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-semibold text-white">Welcome</h2>
                <p className="text-gray-400 mt-2">Sign in to start your practice session</p>
              </div>
              
              {localError && (
                <div className="w-full bg-red-900/50 text-red-200 p-4 rounded-lg text-center">
                  {localError}
                </div>
              )}

              <button
                onClick={login}
                className="flex items-center justify-center gap-3 w-full max-w-sm bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">
                  Ready to code, {user?.name.split(' ')[0]}?
                </label>
                <div className="bg-gray-700 p-4 rounded-lg flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-white font-medium">Full Stack Engineering Interview</p>
                    <p className="text-sm text-gray-400">Duration: 45-60 mins</p>
                  </div>
                  <div className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded text-sm font-medium">
                    React + Node.js
                  </div>
                </div>
              </div>

              {localError && (
                <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
                  {localError}
                </div>
              )}

              <button
                onClick={startInterview}
                disabled={starting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
              >
                {starting ? 'Initializing Session...' : 'Start Interview Session'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Real-time Coaching</h3>
            <p className="text-gray-400 text-sm">
              Get instant feedback when you're stuck or missing key signals
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Voice Recognition</h3>
            <p className="text-gray-400 text-sm">
              Speak your reasoning aloud and get feedback on communication
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Comprehensive Assessment</h3>
            <p className="text-gray-400 text-sm">
              Receive detailed feedback on technical and communication skills
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
