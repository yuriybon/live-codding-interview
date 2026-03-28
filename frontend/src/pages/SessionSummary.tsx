import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Star,
  CheckCircle,
  TrendingUp,
  Clock,
  Code,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { NavBar } from '../components/NavBar';
import { Card, Button, SectionHeader, MetricCard, Badge } from '../components/primitives';

interface SummaryData {
  session: any;
  assessment: string;
}

function getScoreLabel(score: number): { label: string; tone: 'success' | 'info' | 'warning' } {
  if (score >= 80) {
    return { label: 'Strong Performance', tone: 'success' };
  }

  if (score >= 60) {
    return { label: 'Solid Foundation', tone: 'info' };
  }

  return { label: 'Growth Opportunity', tone: 'warning' };
}

function formatTimestamp(timestamp: string | number | Date): string {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown time';
  }

  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  const communicationScore = metrics.communicationScore || 50;
  const technicalScore = metrics.technicalScore || 50;
  const totalScore = Math.round(communicationScore + technicalScore);
  const overallScore = Math.round((communicationScore + technicalScore) / 2);
  const scoreLabel = getScoreLabel(overallScore);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
          <p>Generating your assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 mb-4">{error || 'Summary not available'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />

      <header className="border-b border-slate-800/80 bg-slate-900/70 px-6 py-4 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>

          <div className="h-6 w-px bg-slate-700" />
          <SectionHeader level={3} className="text-slate-100">Interview Summary</SectionHeader>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <Card
          variant="elevated"
          className="relative overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40"
        >
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="mb-4">
                <Badge status={scoreLabel.tone}>{scoreLabel.label}</Badge>
              </div>
              <SectionHeader level={2} className="mb-2">
                Session Complete
              </SectionHeader>
              <p className="text-slate-300">
                Your interview performance has been evaluated across communication and technical execution.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-6 py-5 min-w-[220px]">
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Combined Score</p>
              <div className="text-5xl font-black text-cyan-300 leading-none">
                {totalScore}
              </div>
              <p className="text-xs text-slate-400 mt-2">Average {overallScore}/100</p>
            </div>
          </div>
        </Card>

        <Card variant="primary" className="border border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3 mb-5">
            <Star className="w-5 h-5 text-amber-300" />
            <SectionHeader level={2}>Overall Result</SectionHeader>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-300">Communication</span>
                <span className="text-white ml-auto">{communicationScore}/100</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-300 h-2.5 rounded-full"
                  style={{ width: `${communicationScore}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 mt-4">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-300">Technical Skills</span>
                <span className="text-white ml-auto">{technicalScore}/100</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-sky-300 h-2.5 rounded-full"
                  style={{ width: `${technicalScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Clock}
            label="Minutes"
            value={Math.floor((metrics.totalTime || 0) / 60)}
            className="bg-slate-900 border border-slate-800"
          />
          <MetricCard
            icon={Code}
            label="Lines Written"
            value={metrics.codeLinesWritten || 0}
            className="bg-slate-900 border border-slate-800"
          />
          <MetricCard
            icon={Lightbulb}
            label="Hints Used"
            value={metrics.hintsRequested || 0}
            className="bg-slate-900 border border-slate-800"
          />
          <MetricCard
            icon={MessageSquare}
            label="Feedback"
            value={metrics.feedbackCount || 0}
            className="bg-slate-900 border border-slate-800"
          />
        </div>

        <Card variant="primary" className="border border-slate-800 bg-slate-900/90">
          <SectionHeader level={2} className="mb-4">Detailed Assessment</SectionHeader>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {summary.assessment || 'No assessment available.'}
            </div>
          </div>
        </Card>

        <Card variant="primary" className="border border-slate-800 bg-slate-900/90">
          <SectionHeader level={2} className="mb-4">Feedback Highlights</SectionHeader>

          {summary.session?.feedback && summary.session.feedback.length > 0 ? (
            <div className="space-y-3">
              {summary.session.feedback.map((fb: any) => (
                <div key={fb.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-slate-200 leading-relaxed">{fb.content}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Trigger: {fb.trigger?.type || 'unknown'}
                        {fb.trigger?.details ? ` - ${fb.trigger.details}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatTimestamp(fb.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No feedback events were captured for this session.</p>
          )}
        </Card>

        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/')}
            variant="primary"
            size="md"
            className="min-w-[230px] bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          >
            Start Another Interview
          </Button>
        </div>
      </main>
    </div>
  );
}

export default SessionSummary;
