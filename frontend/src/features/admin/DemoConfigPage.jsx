import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ToggleLeft, ToggleRight, PlayCircle, Settings, BarChart3, ExternalLink } from 'lucide-react';
import { api, apiError } from '@/lib/apiClient';
import { toast } from 'sonner';
import { LoadingView, ErrorView } from '@/components/StateViews';

export default function DemoConfigPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/cases');
      setCases(response.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const updateDemoConfig = async (caseId, config) => {
    setSaving(caseId);
    try {
      await api.patch(`/admin/cases/${caseId}/demo-config`, config);
      toast.success('Demo config updated successfully');
      loadCases();
    } catch (err) {
      toast.error(apiError(err, 'Failed to update demo config'));
    } finally {
      setSaving(null);
    }
  };

  const toggleDemo = async (caseItem) => {
    await updateDemoConfig(caseItem.id, {
      demo_enabled: !caseItem.demo_enabled
    });
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={loadCases} />;

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="demo-config-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Demo Configuration</h1>
              <p className="text-sm" style={{ color: 'rgba(232,234,242,0.6)' }}>
                Manage interactive demos for case studies
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/demo-analytics')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all hover:scale-105"
            style={{
              background: 'rgba(124,104,225,0.15)',
              border: '1px solid rgba(124,104,225,0.3)',
              color: 'rgba(232,234,242,0.9)',
            }}
            data-testid="view-analytics-button"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-6" style={{ background: 'rgba(115,209,173,0.1)', border: '1px solid rgba(115,209,173,0.2)' }}>
          <div className="text-3xl font-bold text-white mb-1">
            {cases.filter(c => c.demo_enabled).length}
          </div>
          <div className="text-sm" style={{ color: 'rgba(232,234,242,0.6)' }}>
            Active Demos
          </div>
        </div>
        <div className="rounded-xl p-6" style={{ background: 'rgba(124,104,225,0.1)', border: '1px solid rgba(124,104,225,0.2)' }}>
          <div className="text-3xl font-bold text-white mb-1">
            {cases.length}
          </div>
          <div className="text-sm" style={{ color: 'rgba(232,234,242,0.6)' }}>
            Total Cases
          </div>
        </div>
        <div className="rounded-xl p-6" style={{ background: 'rgba(183,168,255,0.1)', border: '1px solid rgba(183,168,255,0.2)' }}>
          <div className="text-3xl font-bold text-white mb-1">
            {Math.round((cases.filter(c => c.demo_enabled).length / cases.length) * 100)}%
          </div>
          <div className="text-sm" style={{ color: 'rgba(232,234,242,0.6)' }}>
            Demo Coverage
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {cases.map((caseItem) => (
          <DemoConfigCard
            key={caseItem.id}
            caseItem={caseItem}
            onToggle={toggleDemo}
            onUpdate={updateDemoConfig}
            isSaving={saving === caseItem.id}
          />
        ))}
      </div>
    </div>
  );
}

function DemoConfigCard({ caseItem, onToggle, onUpdate, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    demo_slug: caseItem.demo_slug || '',
    demo_label_id: caseItem.demo_label_id || '',
    demo_label_en: caseItem.demo_label_en || '',
  });

  const handleSave = async () => {
    await onUpdate(caseItem.id, {
      ...formData,
      demo_enabled: caseItem.demo_enabled,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      demo_slug: caseItem.demo_slug || '',
      demo_label_id: caseItem.demo_label_id || '',
      demo_label_en: caseItem.demo_label_en || '',
    });
    setIsEditing(false);
  };

  return (
    <div
      className="rounded-2xl p-6 transition-all"
      style={{
        background: 'rgba(11,13,23,0.6)',
        border: caseItem.demo_enabled ? '1px solid rgba(115,209,173,0.3)' : '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
      }}
      data-testid={`demo-config-card-${caseItem.slug}`}
    >
      <div className="flex items-start gap-4">
        {/* Toggle */}
        <button
          onClick={() => onToggle(caseItem)}
          disabled={isSaving}
          className="shrink-0 transition-all hover:scale-110 disabled:opacity-50"
          data-testid={`demo-toggle-${caseItem.slug}`}
        >
          {caseItem.demo_enabled ? (
            <ToggleRight className="w-12 h-12" style={{ color: '#73D1AD' }} />
          ) : (
            <ToggleLeft className="w-12 h-12" style={{ color: 'rgba(232,234,242,0.3)' }} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold text-white">
                  {caseItem.title_id || caseItem.title_en}
                </h3>
                {caseItem.demo_enabled && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}>
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: 'rgba(232,234,242,0.5)' }}>
                {caseItem.client_name} • {caseItem.industry_id || caseItem.industry_en}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {caseItem.demo_enabled && caseItem.demo_slug && (
                <a
                  href={`/demo/${caseItem.demo_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-colors hover:bg-white/10"
                  title="Open Demo"
                >
                  <ExternalLink className="w-4 h-4" style={{ color: 'rgba(232,234,242,0.7)' }} />
                </a>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                data-testid={`demo-edit-${caseItem.slug}`}
              >
                <Settings className="w-4 h-4" style={{ color: 'rgba(232,234,242,0.7)' }} />
              </button>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(232,234,242,0.7)' }}>
                  Demo Slug *
                </label>
                <input
                  type="text"
                  value={formData.demo_slug}
                  onChange={(e) => setFormData({ ...formData, demo_slug: e.target.value })}
                  placeholder="e.g., kn3"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                  data-testid={`demo-slug-input-${caseItem.slug}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(232,234,242,0.7)' }}>
                  Demo Label (Indonesian)
                </label>
                <input
                  type="text"
                  value={formData.demo_label_id}
                  onChange={(e) => setFormData({ ...formData, demo_label_id: e.target.value })}
                  placeholder="e.g., Coba Demo WMS Interaktif"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                  data-testid={`demo-label-id-input-${caseItem.slug}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(232,234,242,0.7)' }}>
                  Demo Label (English)
                </label>
                <input
                  type="text"
                  value={formData.demo_label_en}
                  onChange={(e) => setFormData({ ...formData, demo_label_en: e.target.value })}
                  placeholder="e.g., Try Interactive WMS Demo"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                  data-testid={`demo-label-en-input-${caseItem.slug}`}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.demo_slug}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #7C68E1 0%, #73D1AD 100%)' }}
                  data-testid={`demo-save-${caseItem.slug}`}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(232,234,242,0.7)' }}
                  data-testid={`demo-cancel-${caseItem.slug}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'rgba(232,234,242,0.5)' }}>Demo Slug</div>
                <div className="text-sm font-mono text-white">{caseItem.demo_slug || '—'}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'rgba(232,234,242,0.5)' }}>Label (ID)</div>
                <div className="text-sm text-white truncate">{caseItem.demo_label_id || '—'}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'rgba(232,234,242,0.5)' }}>Label (EN)</div>
                <div className="text-sm text-white truncate">{caseItem.demo_label_en || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
