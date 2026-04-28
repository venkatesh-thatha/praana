import { useState } from 'react'
import { Salad, Send, AlertTriangle, TrendingDown } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

export default function DietPage() {
  const [foodText, setFoodText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const analyze = async () => {
    if (!foodText.trim()) return toast.error('Describe what you ate today')
    setLoading(true)
    setResult(null)
    setApiError(null)
    try {
      // Log first, then analyze
      await apiClient.post('/diet/log', {
        food_log_text: foodText,
        date: new Date().toISOString().split('T')[0],
      })
      const res = await apiClient.post('/diet/analyze', {
        food_log_text: foodText,
        date: new Date().toISOString().split('T')[0],
      })
      setResult(res.data)
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Analysis failed. Check your internet connection and try again.'
      setApiError(detail)
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-8'>
        <div className='flex items-center gap-3 mb-6'>
          {/* Sage matches Dashboard module card icon color */}
          <Salad size={24} style={{ color: '#8fbf6e' }} />
          <h1 className='text-2xl font-bold' style={{ color: '#ede9e0' }}>Diet Intelligence</h1>
        </div>

        {/* Input */}
        <div className='card mb-6'>
          <label className='label'>What did you eat today?</label>
          <textarea
            value={foodText}
            onChange={(e) => setFoodText(e.target.value)}
            placeholder='e.g. "Breakfast: 2 idlis with sambar, coffee with milk. Lunch: rice, dal, sabzi. Evening: Maggi noodles. Dinner: roti with paneer curry"'
            className='input resize-none h-32 mb-3'
          />
          <button
            onClick={analyze}
            disabled={loading || !foodText.trim()}
            className='btn-primary flex items-center gap-2 w-full justify-center'
          >
            {loading ? (
              <>
                <div
                  className='w-4 h-4 border-2 rounded-full animate-spin'
                  style={{ borderColor: 'rgba(143,191,110,0.2)', borderTopColor: '#8fbf6e' }}
                />
                Analysing...
              </>
            ) : (
              <><Send size={16} />Analyse Diet</>
            )}
          </button>
        </div>

        {/* Error card */}
        {apiError && (
          <div className='mb-4 p-4 rounded-xl' style={{ background: 'rgba(217,114,114,0.08)', border: '1px solid rgba(217,114,114,0.25)' }}>
            <p className='text-sm font-medium mb-1' style={{ color: '#d97272' }}>Analysis failed</p>
            <p className='text-xs' style={{ color: '#f0a0a0' }}>{apiError}</p>
            <p className='text-xs mt-2' style={{ color: '#7a7a6e' }}>Check your internet connection and try again. Your food log has been saved.</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className='space-y-4'>
            {/* Nutritional summary */}
            {result.nutritional_summary && (
              <div className='card'>
                <h3 className='font-semibold mb-3' style={{ color: '#ede9e0' }}>Nutritional Summary</h3>
                <div className='grid grid-cols-3 gap-3'>
                  {Object.entries(result.nutritional_summary)
                    .filter(([, v]) => v !== null)
                    .slice(0, 9)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className='rounded-lg p-2.5 text-center'
                        style={{ background: 'rgba(16,20,18,0.8)', border: '1px solid rgba(143,191,110,0.1)' }}
                      >
                        <p className='text-lg font-bold' style={{ color: '#ede9e0' }}>{String(value)}</p>
                        <p className='text-xs' style={{ color: '#7a7a6e' }}>{key.replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Deficiency flags — gold header */}
            {result.deficiency_flags?.length > 0 && (
              <div className='card' style={{ borderColor: 'rgba(201,168,76,0.25)' }}>
                <h3 className='font-semibold mb-3 flex items-center gap-2' style={{ color: '#c9a84c' }}>
                  <TrendingDown size={16} /> Deficiency Flags
                </h3>
                {result.deficiency_flags.map((d: any, i: number) => (
                  <div
                    key={i}
                    className='py-2 last:border-0'
                    style={{ borderBottom: '1px solid rgba(143,191,110,0.08)' }}
                  >
                    <div className='flex items-center justify-between mb-0.5'>
                      <span className='text-sm font-medium' style={{ color: '#ede9e0' }}>{d.nutrient}</span>
                      <span
                        className='text-xs px-2 py-0.5 rounded-full'
                        style={
                          d.severity === 'high'
                            ? { background: 'rgba(217,114,114,0.15)', color: '#d97272' }
                            : d.severity === 'moderate'
                            ? { background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }
                            : { background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }
                        }
                      >
                        {d.severity}
                      </span>
                    </div>
                    <p className='text-xs' style={{ color: '#7a7a6e' }}>{d.detail}</p>
                    {/* Profile relevance uses sage accent */}
                    <p className='text-xs mt-0.5' style={{ color: '#8fbf6e' }}>{d.profile_relevance}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Food-symptom correlations — sage header */}
            {result.food_symptom_correlations?.length > 0 && (
              <div className='card' style={{ borderColor: 'rgba(143,191,110,0.2)' }}>
                <h3 className='font-semibold mb-3' style={{ color: '#8fbf6e' }}>Food-Symptom Links</h3>
                {result.food_symptom_correlations.map((c: any, i: number) => (
                  <div
                    key={i}
                    className='py-2 last:border-0'
                    style={{ borderBottom: '1px solid rgba(143,191,110,0.08)' }}
                  >
                    <p className='text-sm' style={{ color: '#ede9e0' }}>
                      <span style={{ color: '#8fbf6e' }}>{c.food}</span>
                      {' → '}
                      <span style={{ color: '#d97272' }}>{c.symptom}</span>
                    </p>
                    <p className='text-xs mt-0.5' style={{ color: '#7a7a6e' }}>{c.mechanism}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Additive warnings — danger header */}
            {result.additive_warnings?.length > 0 && (
              <div className='card' style={{ borderColor: 'rgba(217,114,114,0.2)' }}>
                <h3 className='font-semibold mb-3 flex items-center gap-2' style={{ color: '#d97272' }}>
                  <AlertTriangle size={14} /> Additive Warnings
                </h3>
                {result.additive_warnings.map((a: any, i: number) => (
                  <div
                    key={i}
                    className='py-2 last:border-0'
                    style={{ borderBottom: '1px solid rgba(143,191,110,0.08)' }}
                  >
                    <p className='text-sm' style={{ color: '#ede9e0' }}>
                      {a.additive}{' '}
                      {a.e_number && <span style={{ color: '#7a7a6e', fontSize: '0.75rem' }}>({a.e_number})</span>}
                    </p>
                    <p className='text-xs' style={{ color: '#7a7a6e' }}>{a.concern}</p>
                    {a.profile_interaction && (
                      <p className='text-xs mt-0.5' style={{ color: '#c9a84c' }}>⚠ {a.profile_interaction}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Substitutions — sage header */}
            {result.substitution_suggestions?.length > 0 && (
              <div className='card' style={{ borderColor: 'rgba(143,191,110,0.2)' }}>
                <h3 className='font-semibold mb-3' style={{ color: '#8fbf6e' }}>Substitution Suggestions</h3>
                {result.substitution_suggestions.map((s: any, i: number) => (
                  <div
                    key={i}
                    className='py-2 last:border-0 flex items-start gap-2'
                    style={{ borderBottom: '1px solid rgba(143,191,110,0.08)' }}
                  >
                    <span className='text-xs mt-0.5'>🔄</span>
                    <div>
                      <p className='text-sm' style={{ color: '#ede9e0' }}>
                        <span style={{ textDecoration: 'line-through', color: '#7a7a6e' }}>{s.replace}</span>
                        {' → '}
                        <span style={{ color: '#8fbf6e' }}>{s.with || s.with_food}</span>
                      </p>
                      <p className='text-xs' style={{ color: '#7a7a6e' }}>{s.reason}</p>
                      {s.budget_friendly && (
                        <span className='text-xs' style={{ color: '#8fbf6e' }}>Budget friendly</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
