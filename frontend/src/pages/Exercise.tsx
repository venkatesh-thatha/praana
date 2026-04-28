import { useState, useEffect } from 'react'
import {
  Dumbbell,
  Leaf,
  Wind,
  Fingerprint,
  HeartPulse,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
} from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrimaryExercise {
  name: string
  duration_minutes: number
  intensity: string
  description: string
  benefits: string[]
  why_for_you: string
}

interface AlternativeExercise {
  name: string
  duration_minutes: number
  intensity: string
  description: string
  why_for_you: string
}

interface YogaPose {
  name: string
  hold_seconds: number
  repetitions: number
  description: string
  benefits: string[]
  why_for_you: string
  caution: string | null
}

interface MeditationStep {
  step: number
  instruction: string
  duration_seconds: number
}

interface AcupressurePoint {
  point_name: string
  location: string
  symptom_relief: string
  technique: string
  duration_seconds: number
}

interface FirstAidItem {
  scenario: string
  when_to_use: string
  steps: string[]
  when_to_call_108: string
}

interface ExerciseResult {
  primary: PrimaryExercise
  alternatives: AlternativeExercise[]
  rest_day_recommended: boolean
  rest_reason: string | null
  yoga: { sequence_note: string; poses: YogaPose[] }
  meditation: {
    technique: string
    duration_minutes: number
    why_for_you: string
    steps: MeditationStep[]
  }
  acupressure: AcupressurePoint[]
  first_aid: FirstAidItem[]
}

type TabId = 'exercise' | 'yoga' | 'meditation' | 'acupressure' | 'firstaid'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: 'exercise', label: 'Exercise', Icon: Dumbbell },
  { id: 'yoga', label: 'Yoga', Icon: Leaf },
  { id: 'meditation', label: 'Meditation', Icon: Wind },
  { id: 'acupressure', label: 'Acupressure', Icon: Fingerprint },
  { id: 'firstaid', label: 'First Aid', Icon: HeartPulse },
]

const INTENSITY_COLOR: Record<string, string> = {
  very_low: 'rgba(143,191,110,0.15)',
  low: 'rgba(143,191,110,0.2)',
  moderate: 'rgba(201,168,76,0.2)',
  high: 'rgba(217,114,114,0.2)',
}

const INTENSITY_TEXT: Record<string, string> = {
  very_low: '#8fbf6e',
  low: '#b8d99c',
  moderate: '#c9a84c',
  high: '#d97272',
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function IntensityBadge({ intensity }: { intensity: string }) {
  const bg = INTENSITY_COLOR[intensity] ?? 'rgba(122,122,110,0.15)'
  const color = INTENSITY_TEXT[intensity] ?? '#7a7a6e'
  return (
    <span
      className='text-xs px-2 py-0.5 rounded-full font-medium'
      style={{ background: bg, color }}
    >
      {intensity.replace('_', ' ')}
    </span>
  )
}

function DurationBadge({ minutes }: { minutes: number }) {
  return (
    <span
      className='text-xs px-2 py-0.5 rounded-full font-medium'
      style={{ background: 'rgba(122,122,110,0.12)', color: '#7a7a6e' }}
    >
      {minutes} min
    </span>
  )
}

function WhyBox({ text }: { text: string }) {
  return (
    <p
      className='text-sm rounded-lg p-2.5 leading-relaxed'
      style={{
        background: 'rgba(143,191,110,0.06)',
        border: '1px solid rgba(143,191,110,0.1)',
        color: '#b8d99c',
      }}
    >
      {text}
    </p>
  )
}

function BenefitPills({ benefits }: { benefits: string[] }) {
  return (
    <div className='flex flex-wrap gap-1.5'>
      {benefits.map((b) => (
        <span
          key={b}
          className='text-xs px-2 py-0.5 rounded'
          style={{ background: 'rgba(143,191,110,0.08)', color: '#8fbf6e' }}
        >
          {b}
        </span>
      ))}
    </div>
  )
}

// ─── Tab 1: Exercise ──────────────────────────────────────────────────────────

function AlternativeCard({ alt }: { alt: AlternativeExercise }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='card card-hover cursor-pointer' onClick={() => setOpen((v) => !v)}>
      <div className='flex items-start justify-between gap-2'>
        <p className='font-medium text-sm' style={{ color: '#ede9e0' }}>
          {alt.name}
        </p>
        <button
          aria-label={open ? 'Collapse' : 'Expand'}
          className='shrink-0 mt-0.5'
          style={{ color: '#7a7a6e' }}
        >
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
      <div className='flex items-center gap-2 mt-1.5'>
        <DurationBadge minutes={alt.duration_minutes} />
        <IntensityBadge intensity={alt.intensity} />
      </div>
      {open && (
        <div className='mt-3 space-y-2'>
          <p className='text-sm' style={{ color: '#7a7a6e' }}>
            {alt.description}
          </p>
          <WhyBox text={alt.why_for_you} />
        </div>
      )}
    </div>
  )
}

function ExerciseTab({ data }: { data: ExerciseResult }) {
  if (data.rest_day_recommended) {
    return (
      <div
        className='rounded-xl p-4 mb-4'
        style={{
          background: 'rgba(80,130,200,0.1)',
          border: '1px solid rgba(80,130,200,0.25)',
        }}
      >
        <p className='font-semibold mb-1' style={{ color: '#90b8e8' }}>
          Rest day recommended
        </p>
        <p className='text-sm' style={{ color: '#b8d0ec' }}>
          {data.rest_reason}
        </p>
      </div>
    )
  }

  const { primary, alternatives } = data

  return (
    <div className='space-y-4'>
      {/* Primary card */}
      <div className='card' style={{ border: '1px solid rgba(143,191,110,0.16)' }}>
        <div className='flex items-start justify-between mb-2'>
          <h3 className='text-lg font-semibold' style={{ color: '#ede9e0' }}>
            {primary.name}
          </h3>
          <span
            className='text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2'
            style={{ background: 'rgba(143,191,110,0.15)', color: '#8fbf6e' }}
          >
            Recommended
          </span>
        </div>
        <div className='flex items-center gap-2 mb-3'>
          <DurationBadge minutes={primary.duration_minutes} />
          <IntensityBadge intensity={primary.intensity} />
        </div>
        <WhyBox text={primary.why_for_you} />
        <p className='text-sm mt-3 leading-relaxed' style={{ color: '#7a7a6e' }}>
          {primary.description}
        </p>
        {primary.benefits?.length > 0 && (
          <div className='mt-3'>
            <BenefitPills benefits={primary.benefits} />
          </div>
        )}
      </div>

      {/* Alternatives */}
      {alternatives?.length > 0 && (
        <>
          <p className='text-xs font-medium uppercase tracking-wider' style={{ color: '#7a7a6e' }}>
            Alternatives
          </p>
          {alternatives.map((alt) => (
            <AlternativeCard key={alt.name} alt={alt} />
          ))}
        </>
      )}
    </div>
  )
}

// ─── Tab 2: Yoga ──────────────────────────────────────────────────────────────

function PoseCard({ pose }: { pose: YogaPose }) {
  return (
    <div className='card space-y-3'>
      <div className='flex items-start justify-between gap-2'>
        <h4 className='font-semibold' style={{ color: '#ede9e0' }}>
          {pose.name}
        </h4>
        <span
          className='text-xs px-2 py-0.5 rounded-full shrink-0'
          style={{ background: 'rgba(143,191,110,0.1)', color: '#8fbf6e' }}
        >
          {pose.hold_seconds}s &times; {pose.repetitions} reps
        </span>
      </div>
      <p className='text-sm leading-relaxed' style={{ color: '#7a7a6e' }}>
        {pose.description}
      </p>
      {pose.benefits?.length > 0 && <BenefitPills benefits={pose.benefits} />}
      <WhyBox text={pose.why_for_you} />
      {pose.caution && (
        <div
          className='flex items-start gap-2 rounded-lg px-3 py-2 text-xs'
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#c9a84c',
          }}
        >
          <span>&#9888;</span>
          <span>{pose.caution}</span>
        </div>
      )}
    </div>
  )
}

function YogaTab({ data }: { data: ExerciseResult }) {
  return (
    <div className='space-y-4'>
      <p
        className='text-sm italic rounded-lg px-3 py-2.5'
        style={{
          background: 'rgba(143,191,110,0.04)',
          border: '1px solid rgba(143,191,110,0.08)',
          color: '#b8d99c',
        }}
      >
        {data.yoga.sequence_note}
      </p>
      {data.yoga.poses.map((pose) => (
        <PoseCard key={pose.name} pose={pose} />
      ))}
    </div>
  )
}

// ─── Tab 3: Meditation ────────────────────────────────────────────────────────

function MeditationTab({ data }: { data: ExerciseResult }) {
  const med = data.meditation
  return (
    <div className='card space-y-4'>
      <div className='flex items-start justify-between gap-2'>
        <h3 className='text-xl font-semibold' style={{ color: '#ede9e0' }}>
          {med.technique}
        </h3>
        <DurationBadge minutes={med.duration_minutes} />
      </div>
      <div
        className='rounded-lg p-2.5 text-sm'
        style={{
          background: 'rgba(128,144,208,0.07)',
          border: '1px solid rgba(128,144,208,0.12)',
          color: '#a0b0e0',
        }}
      >
        {med.why_for_you}
      </div>
      <div className='space-y-3'>
        {med.steps.map((s) => (
          <div key={s.step} className='flex gap-3'>
            <span
              className='w-6 h-6 rounded-full text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold'
              style={{ background: 'rgba(128,144,208,0.15)', color: '#8090d0' }}
            >
              {s.step}
            </span>
            <div>
              <p className='text-sm' style={{ color: '#ede9e0' }}>
                {s.instruction}
              </p>
              {s.duration_seconds > 0 && (
                <p className='text-xs mt-0.5' style={{ color: '#7a7a6e' }}>
                  {s.duration_seconds}s
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 4: Acupressure ───────────────────────────────────────────────────────

function AcupressureTab({ data }: { data: ExerciseResult }) {
  return (
    <div className='space-y-4'>
      <p className='text-xs' style={{ color: '#7a7a6e' }}>
        Apply firm circular pressure for 1–2 min per point. Stop if you feel sharp pain.
      </p>
      {data.acupressure.map((pt) => (
        <div key={pt.point_name} className='card card-hover'>
          <div className='flex items-start justify-between gap-2 mb-2'>
            <p className='font-semibold text-sm' style={{ color: '#ede9e0' }}>
              {pt.point_name}
            </p>
            <span
              className='text-xs px-2 py-0.5 rounded-full shrink-0'
              style={{ background: 'rgba(143,191,110,0.08)', color: '#8fbf6e' }}
            >
              {pt.symptom_relief}
            </span>
          </div>
          <div className='flex items-start gap-1.5 text-xs mb-1' style={{ color: '#7a7a6e' }}>
            <MapPin size={12} className='shrink-0 mt-0.5' />
            <span>Find it: {pt.location}</span>
          </div>
          <p className='text-xs' style={{ color: '#7a7a6e' }}>
            Technique: {pt.technique} for {pt.duration_seconds}s
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Tab 5: First Aid ─────────────────────────────────────────────────────────

function FirstAidCard({ item }: { item: FirstAidItem }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? item.steps : item.steps.slice(0, 2)

  return (
    <div className='card'>
      <p className='font-semibold text-base mb-1' style={{ color: '#ede9e0' }}>
        {item.scenario}
      </p>
      <p className='text-xs mb-3 leading-relaxed' style={{ color: '#7a7a6e' }}>
        <span className='font-medium' style={{ color: '#7a7a6e' }}>Signs to watch for: </span>
        {item.when_to_use}
      </p>
      <div className='space-y-2 mb-2'>
        {visible.map((step, i) => (
          <div key={i} className='flex gap-3'>
            <span
              className='w-5 h-5 rounded-full text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold'
              style={{ background: 'rgba(217,114,114,0.1)', color: '#d97272' }}
            >
              {i + 1}
            </span>
            <p className='text-sm leading-relaxed' style={{ color: '#ede9e0' }}>
              {step}
            </p>
          </div>
        ))}
      </div>
      {item.steps.length > 2 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className='text-xs mb-3 flex items-center gap-1'
          style={{ color: '#7a7a6e' }}
        >
          {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showAll ? 'Show less' : `Show all ${item.steps.length} steps`}
        </button>
      )}
      <div
        className='flex items-start gap-2 rounded-lg px-3 py-2 text-xs'
        style={{
          background: 'rgba(217,114,114,0.07)',
          border: '1px solid rgba(217,114,114,0.15)',
          color: '#d97272',
        }}
      >
        <Phone size={12} className='shrink-0 mt-0.5' />
        <span>
          <span className='font-semibold'>Call 108 if: </span>
          {item.when_to_call_108}
        </span>
      </div>
    </div>
  )
}

function FirstAidTab({ data }: { data: ExerciseResult }) {
  return (
    <div className='space-y-4'>
      <div
        className='rounded-lg px-3 py-2.5 text-xs leading-relaxed'
        style={{
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.15)',
          color: '#c9a84c',
        }}
      >
        For emergencies, call 108 immediately. These steps are for awareness only.
      </div>
      {data.first_aid.map((item) => (
        <FirstAidCard key={item.scenario} item={item} />
      ))}
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div
      className='sticky top-0 z-10 flex overflow-x-auto'
      style={{
        background: 'rgba(9,11,9,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(143,191,110,0.06)',
        // Hide scrollbar cross-browser
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === active
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className='flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150'
            style={{
              color: isActive ? '#ede9e0' : '#7a7a6e',
              borderBottom: isActive
                ? '2px solid #8fbf6e'
                : '2px solid transparent',
              background: isActive ? 'rgba(143,191,110,0.1)' : 'transparent',
            }}
            aria-selected={isActive}
            role='tab'
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExercisePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExerciseResult | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('exercise')

  const load = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await apiClient.post('/exercise/recommend')
      setResult(res.data)
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ??
        'Could not load recommendations. Check your internet connection and try again.'
      setApiError(detail)
      toast.error('Could not load recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 pt-6 pb-10'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <Dumbbell size={22} style={{ color: '#8fbf6e' }} />
            <h1 className='text-2xl font-bold' style={{ color: '#ede9e0' }}>
              Exercise
            </h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className='btn-secondary flex items-center gap-2 text-sm'
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {apiError && (
          <div
            className='mb-5 rounded-xl p-4'
            style={{
              background: 'rgba(217,114,114,0.08)',
              border: '1px solid rgba(217,114,114,0.2)',
            }}
          >
            <p className='text-sm font-semibold mb-1' style={{ color: '#d97272' }}>
              Could not load recommendations
            </p>
            <p className='text-xs mb-2' style={{ color: '#e8a0a0' }}>
              {apiError}
            </p>
            <p className='text-xs' style={{ color: '#7a7a6e' }}>
              Make sure your health profile is complete, then tap Refresh.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className='card text-center py-10'>
            <div
              className='w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3'
              style={{
                borderColor: 'rgba(143,191,110,0.25)',
                borderTopColor: '#8fbf6e',
              }}
            />
            <p className='text-sm' style={{ color: '#7a7a6e' }}>
              Getting personalised recommendations...
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && result && (
          <div className='animate-fade-up'>
            <TabBar active={activeTab} onChange={setActiveTab} />
            <div className='mt-5'>
              {activeTab === 'exercise' && <ExerciseTab data={result} />}
              {activeTab === 'yoga' && <YogaTab data={result} />}
              {activeTab === 'meditation' && <MeditationTab data={result} />}
              {activeTab === 'acupressure' && <AcupressureTab data={result} />}
              {activeTab === 'firstaid' && <FirstAidTab data={result} />}
            </div>
          </div>
        )}

        <p className='text-xs text-center mt-6' style={{ color: '#4a5a44' }}>
          Recommendations are calibrated to your conditions, recent vitals, and current symptoms.
        </p>
      </div>
    </Layout>
  )
}
