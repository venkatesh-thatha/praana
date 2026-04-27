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
          <Salad className='text-green-400' size={24} />
          <h1 className='text-2xl font-bold text-white'>Diet Intelligence</h1>
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
              <><div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />Analysing...</>
            ) : (
              <><Send size={16} />Analyse Diet</>
            )}
          </button>
        </div>

        {/* Error card */}
        {apiError && (
          <div className='mb-4 p-4 bg-red-900/30 border border-red-700/50 rounded-xl'>
            <p className='text-sm font-medium text-red-300 mb-1'>Analysis failed</p>
            <p className='text-xs text-red-200'>{apiError}</p>
            <p className='text-xs text-slate-400 mt-2'>Check your internet connection and try again. Your food log has been saved.</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className='space-y-4'>
            {/* Nutritional summary */}
            {result.nutritional_summary && (
              <div className='card'>
                <h3 className='font-semibold text-white mb-3'>Nutritional Summary</h3>
                <div className='grid grid-cols-3 gap-3'>
                  {Object.entries(result.nutritional_summary)
                    .filter(([, v]) => v !== null)
                    .slice(0, 9)
                    .map(([key, value]) => (
                      <div key={key} className='bg-slate-700/50 rounded-lg p-2.5 text-center'>
                        <p className='text-lg font-bold text-white'>{String(value)}</p>
                        <p className='text-xs text-slate-400'>{key.replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Deficiency flags */}
            {result.deficiency_flags?.length > 0 && (
              <div className='card border-orange-800/50'>
                <h3 className='font-semibold text-orange-300 mb-3 flex items-center gap-2'>
                  <TrendingDown size={16} /> Deficiency Flags
                </h3>
                {result.deficiency_flags.map((d: any, i: number) => (
                  <div key={i} className='py-2 border-b border-slate-700/50 last:border-0'>
                    <div className='flex items-center justify-between mb-0.5'>
                      <span className='text-sm font-medium text-white'>{d.nutrient}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.severity === 'high' ? 'bg-red-900/50 text-red-300' : d.severity === 'moderate' ? 'bg-amber-900/50 text-amber-300' : 'bg-yellow-900/50 text-yellow-300'}`}>{d.severity}</span>
                    </div>
                    <p className='text-xs text-slate-400'>{d.detail}</p>
                    <p className='text-xs text-teal-400 mt-0.5'>{d.profile_relevance}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Food-symptom correlations */}
            {result.food_symptom_correlations?.length > 0 && (
              <div className='card border-purple-800/50'>
                <h3 className='font-semibold text-purple-300 mb-3'>Food-Symptom Links</h3>
                {result.food_symptom_correlations.map((c: any, i: number) => (
                  <div key={i} className='py-2 border-b border-slate-700/50 last:border-0'>
                    <p className='text-sm text-white'><span className='text-purple-300'>{c.food}</span> → <span className='text-red-300'>{c.symptom}</span></p>
                    <p className='text-xs text-slate-400 mt-0.5'>{c.mechanism}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Additive warnings */}
            {result.additive_warnings?.length > 0 && (
              <div className='card border-red-800/50'>
                <h3 className='font-semibold text-red-300 mb-3 flex items-center gap-2'>
                  <AlertTriangle size={14} /> Additive Warnings
                </h3>
                {result.additive_warnings.map((a: any, i: number) => (
                  <div key={i} className='py-2 border-b border-slate-700/50 last:border-0'>
                    <p className='text-sm text-white'>{a.additive} {a.e_number && <span className='text-slate-500 text-xs'>({a.e_number})</span>}</p>
                    <p className='text-xs text-slate-400'>{a.concern}</p>
                    {a.profile_interaction && <p className='text-xs text-amber-300 mt-0.5'>⚠ {a.profile_interaction}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Substitutions */}
            {result.substitution_suggestions?.length > 0 && (
              <div className='card border-green-800/50'>
                <h3 className='font-semibold text-green-300 mb-3'>Substitution Suggestions</h3>
                {result.substitution_suggestions.map((s: any, i: number) => (
                  <div key={i} className='py-2 border-b border-slate-700/50 last:border-0 flex items-start gap-2'>
                    <span className='text-xs mt-0.5'>🔄</span>
                    <div>
                      <p className='text-sm text-white'><span className='line-through text-slate-400'>{s.replace}</span> → <span className='text-green-300'>{s.with || s.with_food}</span></p>
                      <p className='text-xs text-slate-400'>{s.reason}</p>
                      {s.budget_friendly && <span className='text-xs text-teal-400'>Budget friendly</span>}
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
