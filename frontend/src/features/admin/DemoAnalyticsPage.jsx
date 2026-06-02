import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, Clock, CheckCircle, Activity, ArrowLeft } from 'lucide-react';
import { api, apiError } from '@/lib/apiClient';
import { LoadingView, ErrorView } from '@/components/StateViews';

export default function DemoAnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, requestsRes] = await Promise.all([
        api.get('/admin/demo-analytics/overview'),
        api.get('/admin/demo-analytics/requests?limit=20')
      ]);
      // Backend wraps responses as { success, data: ... }
      // overview: data is the analytics object
      // requests: data is { total, data: [] }
      setAnalytics(overviewRes.data?.data || null);
      setRequests(requestsRes.data?.data?.data || []);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={loadAnalytics} />;
  if (!analytics) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="demo-analytics-page">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/portal/admin/demo-config')}
          className="flex items-center gap-2 text-sm mb-4 transition-colors hover:text-white"
          style={{ color: 'rgba(232,234,242,0.6)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Demo Config
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Demo Analytics</h1>
            <p className="text-sm" style={{ color: 'rgba(232,234,242,0.6)' }}>
              Track demo performance and user engagement
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={Users}
          label="Total Requests"
          value={analytics.total_requests}
          color="rgba(124,104,225,0.2)"
          iconColor="#7C68E1"
        />
        <MetricCard
          icon={TrendingUp}
          label="Last 30 Days"
          value={analytics.recent_requests_30d}
          color="rgba(115,209,173,0.2)"
          iconColor="#73D1AD"
        />
        <MetricCard
          icon={Activity}
          label="Active Sessions"
          value={analytics.active_sessions}
          color="rgba(251,146,60,0.2)"
          iconColor="#FB923C"
        />
        <MetricCard
          icon={CheckCircle}
          label="Completion Rate"
          value={`${analytics.completion_rate}%`}
          color="rgba(74,222,128,0.2)"
          iconColor="#4ADE80"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl p-6" style={{ background: 'rgba(11,13,23,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5" style={{ color: '#73D1AD' }} />
            <h3 className="font-semibold text-white">Avg. Session Duration</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-1">
            {analytics.avg_session_duration_minutes}
            <span className="text-lg font-normal ml-2" style={{ color: 'rgba(232,234,242,0.5)' }}>min</span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(232,234,242,0.5)' }}>
            Average time users spend in demos
          </p>
        </div>

        <div className="rounded-xl p-6" style={{ background: 'rgba(11,13,23,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5" style={{ color: '#4ADE80' }} />
            <h3 className="font-semibold text-white">Completed Sessions</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-1">
            {analytics.completed_sessions}
            <span className="text-lg font-normal ml-2" style={{ color: 'rgba(232,234,242,0.5)' }}>
              / {analytics.total_requests}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(232,234,242,0.5)' }}>
            Users who finished the demo experience
          </p>
        </div>
      </div>

      {/* Demo Performance by Case */}
      <div className="rounded-xl p-6 mb-8" style={{ background: 'rgba(11,13,23,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="font-semibold text-white mb-4">Demo Requests by Case</h3>
        <div className="space-y-3">
          {(analytics.by_case || []).length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'rgba(232,234,242,0.4)' }}>
              Belum ada data permintaan demo.
            </p>
          ) : (
            (analytics.by_case || []).map((item, index) => (
            <div key={item.case_slug} className="flex items-center gap-4">
              <div className="w-8 text-center">
                <span className="text-sm font-bold" style={{ color: 'rgba(232,234,242,0.4)' }}>
                  #{index + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white">{item.case_slug}</span>
                  <span className="text-sm font-semibold" style={{ color: '#73D1AD' }}>
                    {item.requests} requests
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${analytics.total_requests > 0 ? (item.requests / analytics.total_requests) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #7C68E1 0%, #73D1AD 100%)',
                    }}
                  />
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Demo Requests */}
      <div className="rounded-xl p-6" style={{ background: 'rgba(11,13,23,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="font-semibold text-white mb-4">Recent Demo Requests</h3>
        <div className="space-y-3">
          {(requests || []).length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'rgba(232,234,242,0.4)' }}>
              Belum ada permintaan demo terbaru.
            </p>
          ) : (
            (requests || []).map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white">{request.user_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: request.status === 'completed' ? 'rgba(74,222,128,0.15)' : 'rgba(251,146,60,0.15)',
                    color: request.status === 'completed' ? '#4ADE80' : '#FB923C',
                  }}>
                    {request.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(232,234,242,0.5)' }}>
                  <span>{request.user_email}</span>
                  {request.user_company && <span>• {request.user_company}</span>}
                  <span>• {request.demo_slug}</span>
                </div>
              </div>
              <div className="text-xs text-right" style={{ color: 'rgba(232,234,242,0.5)' }}>
                {new Date(request.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, iconColor }) {
  return (
    <div className="rounded-xl p-6" style={{ background: color, border: `1px solid ${color}` }}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
        <span className="text-sm font-medium" style={{ color: 'rgba(232,234,242,0.7)' }}>
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
