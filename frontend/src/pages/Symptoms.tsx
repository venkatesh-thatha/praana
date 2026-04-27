import { useState, useEffect, useRef } from 'react'
import { Brain, Mic, Send, AlertTriangle, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

const LOADING_STAGES = [
  { message: 'Reading your symptoms...', duration: 2000 },
  { message: 'Checking for emergency flags...', duration: 2000 },
  { message: 'Searching ICD-11 database...', duration: 3000 },
  { message: 'Ranking conditions for your profile...', duration: 4000 },
]

function useLoadingStage(active: boolean) {
  const [stageIndex, setStageIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active) {
      setStageIndex(0)
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    let idx = 0
    const advance = () => {
      idx = idx + 1
      if (idx < LOADING_STAGES.length) {
        setStageIndex(idx)
        timerRef.current = setTimeout(advance, LOADING_STAGES[idx].duration)
      }
    }
    setStageIndex(0)
    timerRef.current = setTimeout(advance, LOADING_STAGES[0].duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active])

  return LOADING_STAGES[stageIndex]?.message ?? 'Analyzing...'
}

interface Condition {
  icd_code: string
  name: string
  probability_reasoning: string
  plain_explanation: string
  urgency: 'routine' | 'soon' | 'urgent'
  what_to_tell_doctor: string
}

interface AnalysisResult {
  session_id: string
  shortlist: Condition[]
  red_flag: boolean
  red_flag_message: string | null
  doctor_talking_points: string[]
}

const URGENCY_STYLE: Record<string, string> = {
  routine: 'bg-green-900/40 border-green-700/50 text-green-300',
  soon: 'bg-amber-900/40 border-amber-700/50 text-amber-300',
  urgent: 'bg-red-900/40 border-red-700/50 text-red-300',
}

function ConditionCard({ cond }: { cond: Condition }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className='card border-slate-600'>
      <div className='flex items-start justify-between gap-2 mb-2'>
        <div>
          <h3 className='font-semibold text-white'>{cond.name}</h3>
          <span className='text-xs text-slate-500'>{cond.icd_code}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${URGENCY_STYLE[cond.urgency]}`}>
          {cond.urgency}
        </span>
      </div>
      <p className='text-sm text-slate-300 leading-relaxed'>{cond.plain_explanation}</p>
      <button
        onClick={() => setExpanded(!expanded)}
        className='flex items-center gap-1 text-xs text-teal-400 mt-3 hover:text-teal-300'
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide details' : 'Show clinical reasoning & what to tell doctor'}
      </button>
      {expanded && (
        <div className='mt-3 space-y-2 border-t border-slate-700 pt-3'>
          <p className='text-xs text-slate-400'><span className='text-slate-300 font-medium'>Reasoning: </span>{cond.probability_reasoning}</p>
          <p className='text-xs text-slate-400'><span className='text-slate-300 font-medium'>Tell your doctor: </span>{cond.what_to_tell_doctor}</p>
        </div>
      )}
    </div>
  )
}

export default function SymptomsPage() {
  const [symptomText, setSymptomText] = useState('')
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const loadingStageMessage = useLoadingStage(loading)

  const analyze = async () => {
    if (!symptomText.trim()) return toast.error('Please describe your symptoms')
    setLoading(true)
    setResult(null)
    setApiError(null)
    try {
      const res = await apiClient.post('/symptoms/analyze', { symptom_text: symptomText, language })
      setResult(res.data)
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Analysis failed. Check your internet connection and try again.'
      setApiError(detail)
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  // RED FLAG SCREEN
  if (result?.red_flag) {
    return (
      <div className='fixed inset-0 bg-red-950 flex flex-col items-center justify-center p-6 z-50'>
        <div className='max-w-md w-full text-center'>
          <div className='w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse'>
            <AlertTriangle className='text-white' size={40} />
          </div>
          <h1 className='text-3xl font-bold text-white mb-4'>Emergency Alert</h1>
          <p className='text-red-100 text-lg mb-8 leading-relaxed'>{result.red_flag_message}</p>
          <a
            href='tel:112'
            className='flex items-center justify-center gap-3 w-full bg-white text-red-800 font-bold text-xl py-5 rounded-xl mb-4 hover:bg-red-50'
          >
            <Phone size={28} />
            Call 112 — Emergency
          </a>
          <button
            onClick={() => setResult(null)}
            className='text-red-300 text-sm underline'
          >
            I have already contacted emergency services
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-8'>
        <div className='flex items-center gap-3 mb-6'>
          <Brain className='text-blue-400' size={24} />
          <h1 className='text-2xl font-bold text-white'>Symptom Analysis</h1>
        </div>

        {/* Input */}
        <div className='card mb-6'>
          <div className='flex items-center justify-between mb-3'>
            <label className='label mb-0'>Describe your symptoms</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className='bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-sm text-white'
            >
              <option value='en'>English</option>
              <option value='hi'>हिंदी</option>
              <option value='ta'>தமிழ்</option>
            </select>
          </div>
          <textarea
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            placeholder='e.g. "Chest mein dard ho raha hai aur left haath mein numbness hai" or "Tired all the time, hair falling, feeling cold always"'
            className='input resize-none h-32 mb-3'
          />
          <p className='text-xs text-slate-400 mb-3'>You can type in Hindi, Tamil, or English — including mixed language.</p>
          <button
            onClick={analyze}
            disabled={loading || !symptomText.trim()}
            className='btn-primary flex items-center gap-2 w-full justify-center'
          >
            {loading ? (
              <>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                {loadingStageMessage}
              </>
            ) : (
              <>
                <Send size={16} />
                Analyze Symptoms
              </>
            )}
          </button>
        </div>

        {/* Error card */}
        {apiError && (
          <div className='mb-4 p-4 bg-red-900/30 border border-red-700/50 rounded-xl'>
            <p className='text-sm font-medium text-red-300 mb-1'>Analysis failed</p>
            <p className='text-xs text-red-200'>{apiError}</p>
            <p className='text-xs text-slate-400 mt-2'>What to do: check your internet connection and try again. If the issue persists, the AI service may be temporarily unavailable.</p>
          </div>
        )}

        {/* Results */}
        {result && !result.red_flag && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-2 h-2 bg-green-400 rounded-full' />
              <p className='text-sm text-slate-400'>No emergency flags detected · {result.shortlist.length} possibilities identified</p>
            </div>

            {result.shortlist.map((cond) => (
              <ConditionCard key={cond.icd_code} cond={cond} />
            ))}

            {result.doctor_talking_points.length > 0 && (
              <div className='card border-teal-800/50 bg-teal-900/20'>
                <h3 className='font-semibold text-teal-300 mb-3'>What to tell your doctor</h3>
                <ul className='space-y-2'>
                  {result.doctor_talking_points.map((pt, i) => (
                    <li key={i} className='text-sm text-slate-300 flex gap-2'>
                      <span className='text-teal-400 shrink-0'>•</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className='p-3 bg-slate-800/50 rounded-lg'>
              <p className='text-xs text-slate-500 text-center'>Session ID: {result.session_id} · Use this to generate a Doctor Brief</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
