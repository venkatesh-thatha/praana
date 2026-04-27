import { useState, useEffect } from 'react'
import { Dumbbell, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

interface ExerciseItem {
  exercise_id: string
  name: string
  category: string
  intensity: string
  duration_minutes: number
  equipment: string[]
  steps: { step_number: number; instruction: string; duration_seconds: number }[]
  contraindications: string[]
  benefits: string[]
  why_for_you?: string
}

const INTENSITY_STYLE: Record<string, string> = {
  very_low: 'bg-green-900/50 text-green-300',
  low: 'bg-teal-900/50 text-teal-300',
  moderate: 'bg-yellow-900/50 text-yellow-300',
  high: 'bg-red-900/50 text-red-300',
}

function ExerciseCard({ ex, isPrimary }: { ex: ExerciseItem; isPrimary?: boolean }) {
  const [showSteps, setShowSteps] = useState(isPrimary || false)

  return (
    <div className={`card ${isPrimary ? 'border-teal-700/60 bg-teal-900/10' : 'border-slate-600'}`}>
      <div className='flex items-start justify-between mb-2'>
        <div>
          <h3 className='font-semibold text-white'>{ex.name}</h3>
          <div className='flex items-center gap-2 mt-1'>
            <span className={`text-xs px-2 py-0.5 rounded-full ${INTENSITY_STYLE[ex.intensity] || 'bg-slate-700 text-slate-300'}`}>{ex.intensity?.replace('_', ' ')}</span>
            <span className='text-xs text-slate-400'>{ex.duration_minutes} min</span>
            <span className='text-xs text-slate-500 capitalize'>{ex.category}</span>
          </div>
        </div>
        {isPrimary && <span className='text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full'>Recommended</span>}
      </div>

      {ex.why_for_you && (
        <p className='text-sm text-teal-300 bg-teal-900/30 rounded-lg p-2.5 mb-3'>{ex.why_for_you}</p>
      )}

      <div className='flex flex-wrap gap-1 mb-3'>
        {ex.benefits?.slice(0, 3).map((b) => (
          <span key={b} className='text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded'>{b}</span>
        ))}
      </div>

      <button
        onClick={() => setShowSteps(!showSteps)}
        className='flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300'
      >
        {showSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showSteps ? 'Hide steps' : `Show ${ex.steps?.length || 0} steps`}
      </button>

      {showSteps && ex.steps?.length > 0 && (
        <div className='mt-3 space-y-2 border-t border-slate-700 pt-3'>
          {ex.steps.map((s) => (
            <div key={s.step_number} className='flex gap-3'>
              <span className='w-5 h-5 bg-teal-600 rounded-full text-white text-xs flex items-center justify-center shrink-0 mt-0.5'>{s.step_number}</span>
              <div>
                <p className='text-sm text-slate-300'>{s.instruction}</p>
                {s.duration_seconds > 0 && <p className='text-xs text-slate-500'>{s.duration_seconds}s</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ExercisePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await apiClient.post('/exercise/recommend')
      setResult(res.data)
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Could not load recommendations. Check your internet connection and try again.'
      setApiError(detail)
      toast.error('Could not load recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <Dumbbell className='text-orange-400' size={24} />
            <h1 className='text-2xl font-bold text-white'>Exercise</h1>
          </div>
          <button onClick={load} disabled={loading} className='btn-secondary flex items-center gap-2 text-sm'>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error card */}
        {apiError && (
          <div className='mb-4 p-4 bg-red-900/30 border border-red-700/50 rounded-xl'>
            <p className='text-sm font-medium text-red-300 mb-1'>Could not load recommendations</p>
            <p className='text-xs text-red-200'>{apiError}</p>
            <p className='text-xs text-slate-400 mt-2'>Check your internet connection and tap Refresh to try again. Make sure you have completed your health profile.</p>
          </div>
        )}

        {loading && (
          <div className='card text-center py-8'>
            <div className='w-8 h-8 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin mx-auto mb-3' />
            <p className='text-slate-300 text-sm'>Getting personalized recommendations...</p>
          </div>
        )}

        {result?.rest_day_recommended && (
          <div className='mb-4 p-4 bg-blue-900/30 border border-blue-700/50 rounded-xl'>
            <p className='text-blue-300 font-medium'>Rest day recommended</p>
            <p className='text-sm text-blue-200 mt-0.5'>{result.rest_reason}</p>
          </div>
        )}

        {result && !result.rest_day_recommended && (
          <div className='space-y-4'>
            {result.primary && <ExerciseCard ex={result.primary} isPrimary />}

            {result.alternatives?.length > 0 && (
              <>
                <h3 className='text-sm font-medium text-slate-400 mt-2'>Alternatives</h3>
                {result.alternatives.map((ex: ExerciseItem) => (
                  <ExerciseCard key={ex.exercise_id || ex.name} ex={ex} />
                ))}
              </>
            )}
          </div>
        )}

        <p className='text-xs text-slate-500 text-center mt-6'>
          Recommendations are calibrated to your conditions, recent vitals, and current symptoms.
        </p>
      </div>
    </Layout>
  )
}
