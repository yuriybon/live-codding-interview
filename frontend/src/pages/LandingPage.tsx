import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LandingPage() {
  const navigate = useNavigate();
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startInterview = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/sessions/new', {
        candidateName: candidateName || 'Anonymous',
      });

      if (response.data.sessionId) {
        navigate(`/interview/${response.data.sessionId}`);
      }
    } catch (err) {
      setError('Failed to start interview session. Please try again.');
      console.error('Error starting interview:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Interview Simulator
          </h1>
          <p className="text-xl text-gray-300">
            Practice coding interviews with real-time AI coaching and feedback
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">
                Your Name (optional)
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={startInterview}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Starting Interview...' : 'Start Interview'}
            </button>
          </div>
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
