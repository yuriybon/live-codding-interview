import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Star, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { NavBar } from '../components/NavBar';

interface SummaryData {
  session: any;
  assessment: string;
}

function SessionSummary() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return;

    const fetchSummary = async () => {
      try {
        const response = await axios.post(`/api/sessions/${sessionId}/end`);
        setSummary(response.data);
      } catch (err) {
        setError('Failed to load session summary');
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [sessionId]);

  const metrics = summary?.session?.metrics || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Generating your assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 mb-4">{error || 'Summary not available'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NavBar />
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-xl font-semibold text-white">Interview Summary</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Overall Score */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Overall Performance</h2>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-400">
                {Math.round((metrics.communicationScore || 50) + (metrics.technicalScore || 50))}
              </div>
              <p className="text-gray-400 mt-2">Total Score</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Communication</span>
                <span className="text-white ml-auto">{metrics.communicationScore || 50}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full"
                  style={{ width: `${metrics.communicationScore || 50}%` }}
                ></div>
              </div>

              <div className="flex items-center gap-2 mb-2 mt-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Technical Skills</span>
                <span className="text-white ml-auto">{metrics.technicalScore || 50}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full"
                  style={{ width: `${metrics.technicalScore || 50}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold text-white mb-4">AI Assessment</h2>
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap">
              {summary.assessment || 'No assessment available.'}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {Math.floor(metrics.totalTime / 60)}
            </p>
            <p className="text-gray-400 text-sm">Minutes</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {metrics.codeLinesWritten || 0}
            </p>
            <p className="text-gray-400 text-sm">Lines Written</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {metrics.hintsRequested || 0}
            </p>
            <p className="text-gray-400 text-sm">Hints Used</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {metrics.feedbackCount || 0}
            </p>
            <p className="text-gray-400 text-sm">Feedback</p>
          </div>
        </div>

        {/* Feedback History */}
        {summary.session?.feedback && summary.session.feedback.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Feedback History</h2>
            <div className="space-y-3">
              {summary.session.feedback.map((fb: any) => (
                <div key={fb.id} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-gray-300">{fb.content}</p>
                      {fb.trigger.details && (
                        <p className="text-gray-500 text-xs mt-1">
                          Trigger: {fb.trigger.type} - {fb.trigger.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Start Another Interview
          </button>
        </div>
      </main>
    </div>
  );
}

export default SessionSummary;
