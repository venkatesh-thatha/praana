import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Brain, Mic, MicOff, Send, AlertTriangle, Phone, ChevronDown, ChevronUp } from 'lucide-react'
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
  likelihood?: 'higher likelihood' | 'moderate likelihood' | 'lower likelihood'
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

const LIKELIHOOD_CONFIG: Record<string, { color: string; bar: string; label: string }> = {
  'higher likelihood': { color: '#d97272', bar: '78%', label: 'Higher likelihood' },
  'moderate likelihood': { color: '#c9a84c', bar: '48%', label: 'Moderate likelihood' },
  'lower likelihood': { color: '#7a7a6e', bar: '22%', label: 'Lower likelihood' },
}

// Urgency badge uses inline styles to match design token system precisely
const URGENCY_BADGE_STYLE: Record<string, { background: string; border: string; color: string }> = {
  routine: {
    background: 'rgba(143,191,110,0.12)',
    border: '1px solid rgba(143,191,110,0.3)',
    color: '#8fbf6e',
  },
  soon: {
    background: 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.3)',
    color: '#c9a84c',
  },
  urgent: {
    background: 'rgba(217,114,114,0.12)',
    border: '1px solid rgba(217,114,114,0.3)',
    color: '#d97272',
  },
}

function ConditionCard({ cond }: { cond: Condition }) {
  const [expanded, setExpanded] = useState(false)
  const badge = URGENCY_BADGE_STYLE[cond.urgency]
  // Normalise to lowercase so casing differences from the API don't break lookup
  const lkKey = cond.likelihood?.toLowerCase()
  const lkConfig = lkKey ? LIKELIHOOD_CONFIG[lkKey] : undefined

  return (
    <div className='card'>
      <div className='flex items-start justify-between gap-2 mb-2'>
        <div>
          <h3 className='font-semibold' style={{ color: '#ede9e0' }}>{cond.name}</h3>
          <span className='text-xs' style={{ color: '#7a7a6e' }}>{cond.icd_code}</span>
        </div>
        <span
          className='text-xs px-2 py-0.5 rounded-full shrink-0'
          style={{ background: badge.background, border: badge.border, color: badge.color }}
        >
          {cond.urgency}
        </span>
      </div>
      {lkConfig && (
        <div className='flex items-center gap-2 mb-3'>
          <div className='flex-1 h-1 rounded-full' style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className='h-full rounded-full'
              style={{ width: lkConfig.bar, background: lkConfig.color }}
            />
          </div>
          <span className='text-xs shrink-0' style={{ color: lkConfig.color }}>{lkConfig.label}</span>
        </div>
      )}
      <p className='text-sm leading-relaxed' style={{ color: '#b8d99c' }}>{cond.plain_explanation}</p>
      <button
        onClick={() => setExpanded(!expanded)}
        className='flex items-center gap-1 text-xs mt-3 transition-opacity hover:opacity-80'
        style={{ color: '#8fbf6e' }}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide details' : 'Show clinical reasoning & what to tell doctor'}
      </button>
      {expanded && (
        <div
          className='mt-3 space-y-2 pt-3'
          style={{ borderTop: '1px solid rgba(143,191,110,0.12)' }}
        >
          <p className='text-xs' style={{ color: '#7a7a6e' }}>
            <span className='font-medium' style={{ color: '#ede9e0' }}>Reasoning: </span>
            {cond.probability_reasoning}
          </p>
          <p className='text-xs' style={{ color: '#7a7a6e' }}>
            <span className='font-medium' style={{ color: '#ede9e0' }}>Tell your doctor: </span>
            {cond.what_to_tell_doctor}
          </p>
        </div>
      )}
    </div>
  )
}

const LANG_TO_SPEECH: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
}

export default function SymptomsPage() {
  const location = useLocation()
  const [symptomText, setSymptomText] = useState<string>(
    (location.state as { initialQuery?: string } | null)?.initialQuery ?? ''
  )
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const loadingStageMessage = useLoadingStage(loading)

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }, [])

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return toast.error('Voice input not supported in this browser')

    if (isRecording) {
      stopRecording()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = LANG_TO_SPEECH[language] ?? 'en-IN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
      setSymptomText(transcript)
    }
    recognition.onerror = () => { setIsRecording(false) }
    recognition.onend = () => { setIsRecording(false) }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [isRecording, language, stopRecording])

  useEffect(() => () => recognitionRef.current?.stop(), [])

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

  // RED FLAG SCREEN — kept exactly as is, already correct
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
          {/* Indigo matches Dashboard module card icon color */}
          <Brain size={24} style={{ color: '#8090d0' }} />
          <h1 className='text-2xl font-bold' style={{ color: '#ede9e0' }}>Symptom Analysis</h1>
        </div>

        {/* Input */}
        <div className='card mb-6'>
          <div className='flex items-center justify-between mb-3'>
            <label className='label mb-0'>Describe your symptoms</label>
            {/* Language select uses .input class styling via inline style override for the select element */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className='input'
              style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value='en'>English</option>
              <option value='hi'>हिंदी</option>
              <option value='ta'>தமிழ்</option>
            </select>
          </div>
          <div className='relative mb-3'>
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder='e.g. "Chest mein dard ho raha hai aur left haath mein numbness hai" or "Tired all the time, hair falling, feeling cold always"'
              className='input resize-none h-32'
              style={{ paddingRight: '3rem' }}
            />
            <button
              type='button'
              onClick={toggleVoice}
              title={isRecording ? 'Stop recording' : 'Speak your symptoms'}
              style={{
                position: 'absolute',
                right: '10px',
                bottom: '10px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isRecording ? 'rgba(217,114,114,0.2)' : 'rgba(143,191,110,0.12)',
                color: isRecording ? '#d97272' : '#8fbf6e',
                transition: 'all 0.2s ease',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
              }}
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          </div>
          <p className='text-xs mb-3' style={{ color: '#7a7a6e' }}>
            {isRecording
              ? '🔴 Listening… speak your symptoms, then tap mic to stop'
              : 'Type or tap the mic to speak — Hindi, Tamil, or English supported'}
          </p>
          <button
            onClick={analyze}
            disabled={loading || !symptomText.trim()}
            className='btn-primary flex items-center gap-2 w-full justify-center'
          >
            {loading ? (
              <>
                <div className='w-4 h-4 border-2 rounded-full animate-spin' style={{ borderColor: 'rgba(143,191,110,0.2)', borderTopColor: '#8fbf6e' }} />
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
          <div className='mb-4 p-4 rounded-xl' style={{ background: 'rgba(217,114,114,0.08)', border: '1px solid rgba(217,114,114,0.25)' }}>
            <p className='text-sm font-medium mb-1' style={{ color: '#d97272' }}>Analysis failed</p>
            <p className='text-xs' style={{ color: '#f0a0a0' }}>{apiError}</p>
            <p className='text-xs mt-2' style={{ color: '#7a7a6e' }}>What to do: check your internet connection and try again. If the issue persists, the AI service may be temporarily unavailable.</p>
          </div>
        )}

        {/* Results */}
        {result && !result.red_flag && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-2 h-2 rounded-full' style={{ background: '#8fbf6e' }} />
              <p className='text-sm' style={{ color: '#7a7a6e' }}>No emergency flags detected · {result.shortlist.length} possibilities identified</p>
            </div>

            {result.shortlist.map((cond) => (
              <ConditionCard key={cond.icd_code} cond={cond} />
            ))}

            {/* "What to tell your doctor" — sage green card */}
            {result.doctor_talking_points.length > 0 && (
              <div className='card' style={{ background: 'rgba(143,191,110,0.05)', borderColor: 'rgba(143,191,110,0.2)' }}>
                <h3 className='font-semibold mb-3' style={{ color: '#8fbf6e' }}>What to tell your doctor</h3>
                <ul className='space-y-2'>
                  {result.doctor_talking_points.map((pt, i) => (
                    <li key={i} className='text-sm flex gap-2' style={{ color: '#b8d99c' }}>
                      <span className='shrink-0' style={{ color: '#8fbf6e' }}>•</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className='p-3 rounded-lg' style={{ background: 'rgba(16,20,18,0.8)' }}>
              <p className='text-xs text-center' style={{ color: '#7a7a6e' }}>Session ID: {result.session_id} · Use this to generate a Doctor Brief</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
