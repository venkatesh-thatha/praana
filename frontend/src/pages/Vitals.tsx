import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

interface Trend {
  metric: string
  average_7d: number
  average_30d: number | null
  baseline: number | null
  trend_direction: 'rising' | 'falling' | 'stable'
  anomaly: boolean
}

interface VitalsHistoryEntry {
  timestamp: string
  hr_bpm?: number
  bp_systolic?: number
  bp_diastolic?: number
  spo2?: number
  temperature?: number
  weight_kg?: number
  [key: string]: string | number | undefined
}

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  hr_bpm: { label: 'Heart Rate', unit: 'bpm' },
  bp_systolic: { label: 'BP Systolic', unit: 'mmHg' },
  bp_diastolic: { label: 'BP Diastolic', unit: 'mmHg' },
  spo2: { label: 'SpO2', unit: '%' },
  temperature: { label: 'Temperature', unit: '°C' },
  weight_kg: { label: 'Weight', unit: 'kg' },
}

// TrendIcon colors match design tokens: rising = danger, falling = soft blue, stable = muted
const TrendIcon = ({ dir }: { dir: string }) => {
  if (dir === 'rising') return <TrendingUp size={14} style={{ color: '#d97272' }} />
  if (dir === 'falling') return <TrendingDown size={14} style={{ color: '#8090d0' }} />
  return <Minus size={14} style={{ color: '#7a7a6e' }} />
}

/** Extract the last N readings for a given metric from history, formatted for Recharts */
function buildSparklineData(history: VitalsHistoryEntry[], metric: string, n = 7) {
  return history
    .filter((h) => h[metric] != null)
    .slice(-n)
    .map((h, i) => ({ i, value: h[metric] as number }))
}

/** Determine sparkline stroke color based on anomaly flag and trend direction */
function sparklineColor(anomaly: boolean, dir: string) {
  if (anomaly) return '#f59e0b'  // amber — unchanged
  if (dir === 'rising') return '#d97272'   // danger red
  if (dir === 'falling') return '#8090d0'  // soft blue
  return '#8fbf6e'               // sage — replaces old teal #34d399
}

export default function VitalsPage() {
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [trends, setTrends] = useState<Trend[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [constellations, setConstellations] = useState<any[]>([])
  const [history, setHistory] = useState<VitalsHistoryEntry[]>([])

  const loadHistory = async () => {
    try {
      const res = await apiClient.get('/vitals/history?days=7')
      setHistory(res.data.history || [])
    } catch {
      // sparklines are enhancement — fail silently
    }
  }

  const loadAnalysis = async () => {
    setAnalysisLoading(true)
    try {
      const res = await apiClient.get('/vitals/analysis')
      setTrends(res.data.trends || [])
      setAlerts(res.data.ai_analysis?.alerts || [])
      setConstellations(res.data.constellation_patterns || [])
    } catch {}
    finally { setAnalysisLoading(false) }
  }

  useEffect(() => {
    loadAnalysis()
    loadHistory()
  }, [])

  const logVitals = async () => {
    const data = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '').map(([k, v]) => [k, parseFloat(v)])
    )
    if (Object.keys(data).length === 0) return toast.error('Enter at least one metric')
    setLoading(true)
    try {
      await apiClient.post('/vitals/log', data)
      toast.success('Vitals logged')
      setForm({})
      await Promise.all([loadAnalysis(), loadHistory()])
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to log vitals')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-8'>
        <div className='flex items-center gap-3 mb-6'>
          {/* Teal-green matches Dashboard module card icon color */}
          <Activity size={24} style={{ color: '#50c8b0' }} />
          <h1 className='text-2xl font-bold' style={{ color: '#ede9e0' }}>Vitals Tracker</h1>
        </div>

        {/* Log form */}
        <div className='card mb-6'>
          <h2 className='font-semibold mb-4' style={{ color: '#ede9e0' }}>Log today's vitals</h2>
          <div className='grid grid-cols-2 gap-3 mb-4'>
            {Object.entries(METRIC_LABELS).map(([key, { label, unit }]) => (
              <div key={key}>
                <label className='label text-xs'>{label} ({unit})</label>
                <input
                  type='number'
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={unit}
                  className='input text-sm py-2'
                />
              </div>
            ))}
          </div>
          <button onClick={logVitals} disabled={loading} className='btn-primary w-full'>
            {loading ? 'Saving...' : 'Log Vitals'}
          </button>
        </div>

        {/* Constellation alerts — amber/gold styling kept as is, already correct */}
        {constellations.length > 0 && (
          <div className='space-y-2 mb-4'>
            {constellations.map((c, i) => (
              <div
                key={i}
                className='p-4 rounded-xl flex gap-3'
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}
              >
                <AlertTriangle size={16} className='shrink-0 mt-0.5' style={{ color: '#c9a84c' }} />
                <div>
                  <p className='text-sm font-medium' style={{ color: '#c9a84c' }}>{c.pattern_name?.replace(/_/g, ' ')}</p>
                  <p className='text-xs mt-0.5' style={{ color: '#e0c878' }}>{c.clinical_significance}</p>
                  <p className='text-xs mt-1 font-medium' style={{ color: 'rgba(201,168,76,0.8)' }}>{c.action}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trends + Sparklines */}
        {analysisLoading ? (
          <div className='card text-center py-6'>
            {/* Spinner uses teal accent to match the page icon */}
            <div
              className='w-6 h-6 border-2 rounded-full animate-spin mx-auto'
              style={{ borderColor: 'rgba(80,200,176,0.2)', borderTopColor: '#50c8b0' }}
            />
          </div>
        ) : trends.length > 0 ? (
          <div className='grid grid-cols-2 gap-3'>
            {trends.map((t) => {
              const meta = METRIC_LABELS[t.metric]
              const sparkData = buildSparklineData(history, t.metric, 7)
              const color = sparklineColor(t.anomaly, t.trend_direction)
              return (
                <div
                  key={t.metric}
                  className='card card-hover'
                  style={t.anomaly ? { borderColor: 'rgba(201,168,76,0.4)' } : {}}
                >
                  <div className='flex items-center justify-between mb-1'>
                    <p className='text-xs' style={{ color: '#7a7a6e' }}>{meta?.label || t.metric}</p>
                    <TrendIcon dir={t.trend_direction} />
                  </div>
                  <p className='text-2xl font-bold' style={{ color: '#ede9e0' }}>
                    {t.average_7d}
                    <span className='text-sm font-normal ml-1' style={{ color: '#7a7a6e' }}>{meta?.unit}</span>
                  </p>
                  <p className='text-xs mt-1' style={{ color: '#7a7a6e' }}>
                    7-day avg{t.baseline ? ` · baseline: ${t.baseline}` : ''}
                  </p>
                  {t.anomaly && (
                    <p className='text-xs mt-1' style={{ color: '#f59e0b' }}>deviation from baseline</p>
                  )}

                  {/* Sparkline — shows last 7 readings */}
                  {sparkData.length >= 2 && (
                    <div className='mt-2' style={{ height: 48 }}>
                      <ResponsiveContainer width='100%' height={48}>
                        <LineChart data={sparkData}>
                          <Tooltip
                            contentStyle={{ background: 'rgba(22,26,22,0.95)', border: '1px solid rgba(143,191,110,0.15)', borderRadius: 6, fontSize: 11 }}
                            formatter={(v: number) => [`${v} ${meta?.unit}`, meta?.label]}
                            labelFormatter={() => ''}
                          />
                          <Line
                            type='monotone'
                            dataKey='value'
                            stroke={color}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {sparkData.length < 2 && (
                    <p className='text-xs mt-2' style={{ color: 'rgba(122,122,110,0.5)' }}>Log more readings to see trend</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className='card text-center py-8'>
            {/* Empty state icon uses sage tint */}
            <Activity size={32} className='mx-auto mb-2' style={{ color: 'rgba(143,191,110,0.3)' }} />
            <p className='text-sm' style={{ color: '#7a7a6e' }}>No vitals logged yet. Log your first entry above.</p>
          </div>
        )}

        {/* AI Alert details */}
        {alerts.length > 0 && (
          <div className='mt-4 space-y-2'>
            <h3 className='text-sm font-semibold mb-2' style={{ color: '#ede9e0' }}>AI Pattern Analysis</h3>
            {alerts
              .filter((a) => a.concern_level !== 'normal')
              .map((a, i) => (
                <div
                  key={i}
                  className='p-3 rounded-lg border text-xs'
                  style={
                    a.concern_level === 'urgent'
                      ? { background: 'rgba(217,114,114,0.08)', border: '1px solid rgba(217,114,114,0.25)', color: '#f0a0a0' }
                      : a.concern_level === 'concern'
                      ? { background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#e0c878' }
                      : { background: 'rgba(16,20,18,0.8)', border: '1px solid rgba(143,191,110,0.1)', color: '#b8d99c' }
                  }
                >
                  <p className='font-medium mb-0.5'>{a.plain_description}</p>
                  <p className='opacity-80'>{a.recommendation}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
