import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse,
  Phone,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react'
import Layout from '@/components/Layout'

// ─── Types ───────────────────────────────────────────────────────────────────

type OutcomeKey = 'CALL_108' | 'ER_TONIGHT' | 'GP_THIS_WEEK' | 'MONITOR_AT_HOME'

interface Question {
  id: string
  text: string
}

interface OutcomeConfig {
  label: string
  sublabel: string
  color: string
  bg: string
  border: string
  icon: React.ElementType
  action: string
  actionHref: string | null
  advice: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Are you experiencing chest pain, difficulty breathing, or a sudden severe headache?',
  },
  {
    id: 'q2',
    text: 'Did the symptoms start suddenly (within the last hour) and are they getting worse?',
  },
  {
    id: 'q3',
    text: 'Do you have a fever above 39°C, are unable to keep fluids down, or have you lost consciousness recently?',
  },
  {
    id: 'q4',
    text: 'Are your symptoms significantly limiting your daily activity — you can\'t walk, work, or eat normally?',
  },
  {
    id: 'q5',
    text: 'Have these symptoms persisted for more than 5 days without improvement?',
  },
]

const OUTCOMES: Record<OutcomeKey, OutcomeConfig> = {
  CALL_108: {
    label: 'Call 108 Now',
    sublabel: 'This could be a medical emergency',
    color: '#d97272',
    bg: 'rgba(217,114,114,0.1)',
    border: 'rgba(217,114,114,0.35)',
    icon: Phone,
    action: 'Call 108',
    actionHref: 'tel:108',
    advice:
      'Do not drive yourself. Call emergency services or have someone take you to the nearest hospital immediately.',
  },
  ER_TONIGHT: {
    label: 'Go to Emergency Room Tonight',
    sublabel: 'Symptoms need same-day evaluation',
    color: '#e09050',
    bg: 'rgba(224,144,80,0.1)',
    border: 'rgba(224,144,80,0.3)',
    icon: AlertTriangle,
    action: 'Find nearest hospital',
    actionHref: null,
    advice:
      'Go to your nearest government hospital emergency department. If symptoms worsen, call 108.',
  },
  GP_THIS_WEEK: {
    label: 'See a Doctor This Week',
    sublabel: 'Book an appointment within 2–3 days',
    color: '#c9a84c',
    bg: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.25)',
    icon: Clock,
    action: 'Generate doctor brief',
    actionHref: '/brief',
    advice:
      "Book an appointment with your general physician. Use Praana's Doctor Brief to share your health history.",
  },
  MONITOR_AT_HOME: {
    label: 'Monitor at Home',
    sublabel: 'Your symptoms appear manageable for now',
    color: '#8fbf6e',
    bg: 'rgba(143,191,110,0.1)',
    border: 'rgba(143,191,110,0.2)',
    icon: CheckCircle,
    action: 'Log your symptoms',
    actionHref: '/symptoms',
    advice:
      'Rest, stay hydrated, and monitor your symptoms. If anything changes or worsens, run this check again.',
  },
}

// ─── Logic ────────────────────────────────────────────────────────────────────

/**
 * Returns an outcome key when the current answer resolves triage,
 * or null to continue to the next question.
 */
function computeOutcome(questionId: string, answer: 'yes' | 'no'): OutcomeKey | null {
  if (answer === 'yes') {
    if (questionId === 'q1') return 'CALL_108'
    if (questionId === 'q2' || questionId === 'q3') return 'ER_TONIGHT'
    if (questionId === 'q4' || questionId === 'q5') return 'GP_THIS_WEEK'
  } else {
    if (questionId === 'q5') return 'MONITOR_AT_HOME'
  }
  return null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProgressBarProps {
  answered: number
  total: number
}

function ProgressBar({ answered, total }: ProgressBarProps) {
  const pct = (answered / total) * 100

  return (
    <div
      className='w-full h-1 rounded-full mb-6'
      style={{ background: 'rgba(143,191,110,0.08)' }}
      role='progressbar'
      aria-valuenow={answered}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${answered} of ${total} questions answered`}
    >
      <div
        className='h-full rounded-full'
        style={{
          width: `${pct}%`,
          background: '#8fbf6e',
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  )
}

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  onAnswer: (answer: 'yes' | 'no') => void
}

function QuestionCard({ question, index, total, onAnswer }: QuestionCardProps) {
  return (
    <div className='card animate-slide-up' style={{ padding: '1.75rem' }}>
      {/* Badge */}
      <span
        className='inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-4'
        style={{
          background: 'rgba(143,191,110,0.08)',
          border: '1px solid rgba(143,191,110,0.18)',
          color: '#7a7a6e',
        }}
      >
        Q{index + 1} of {total}
      </span>

      {/* Question */}
      <p
        className='text-xl font-semibold leading-snug mb-8'
        style={{ color: '#ede9e0' }}
      >
        {question.text}
      </p>

      {/* Buttons */}
      <div className='flex flex-col sm:flex-row gap-3'>
        <button
          onClick={() => onAnswer('yes')}
          className='flex-1 font-semibold text-base rounded-xl transition-all duration-200 active:scale-[0.98]'
          style={{
            minHeight: '52px',
            background: 'rgba(217,114,114,0.12)',
            border: '1px solid rgba(217,114,114,0.3)',
            color: '#d97272',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(217,114,114,0.2)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(217,114,114,0.12)'
          }}
        >
          Yes
        </button>
        <button
          onClick={() => onAnswer('no')}
          className='flex-1 font-semibold text-base rounded-xl transition-all duration-200 active:scale-[0.98]'
          style={{
            minHeight: '52px',
            background: 'rgba(143,191,110,0.08)',
            border: '1px solid rgba(143,191,110,0.2)',
            color: '#8fbf6e',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(143,191,110,0.16)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(143,191,110,0.08)'
          }}
        >
          No, continue
        </button>
      </div>
    </div>
  )
}

interface OutcomeCardProps {
  outcomeKey: OutcomeKey
  onReset: () => void
}

function OutcomeCard({ outcomeKey, onReset }: OutcomeCardProps) {
  const outcome = OUTCOMES[outcomeKey]
  const Icon = outcome.icon
  const isTelLink = outcome.actionHref?.startsWith('tel:')
  const isInternalLink = outcome.actionHref?.startsWith('/')

  return (
    <div className='space-y-4 animate-slide-up'>
      {/* Main card */}
      <div
        className='w-full rounded-2xl p-6'
        style={{
          background: outcome.bg,
          border: `1px solid ${outcome.border}`,
        }}
      >
        {/* Icon container */}
        <div
          className='flex items-center justify-center mb-4'
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: `rgba(0,0,0,0.25)`,
            border: `1px solid ${outcome.border}`,
          }}
        >
          <Icon size={26} style={{ color: outcome.color }} />
        </div>

        {/* Labels */}
        <h2 className='text-2xl font-bold mb-1' style={{ color: outcome.color }}>
          {outcome.label}
        </h2>
        <p className='text-sm mb-4' style={{ color: '#7a7a6e' }}>
          {outcome.sublabel}
        </p>

        {/* Advice block */}
        <div
          className='rounded-xl p-4 mb-5'
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <p className='text-sm leading-relaxed' style={{ color: '#b8d99c' }}>
            {outcome.advice}
          </p>
        </div>

        {/* Action button */}
        {isTelLink ? (
          <a
            href={outcome.actionHref!}
            className='flex items-center justify-center gap-2 w-full font-semibold text-base rounded-xl transition-all duration-200 active:scale-[0.98]'
            style={{
              minHeight: '52px',
              background: outcome.color,
              color: '#0f1a0a',
            }}
          >
            <Phone size={16} />
            {outcome.action}
          </a>
        ) : isInternalLink ? (
          <Link
            to={outcome.actionHref!}
            className='flex items-center justify-center gap-2 w-full font-semibold text-base rounded-xl transition-all duration-200 active:scale-[0.98]'
            style={{
              minHeight: '52px',
              background: outcome.color,
              color: '#0f1a0a',
              display: 'flex',
            }}
          >
            {outcome.action}
          </Link>
        ) : (
          // actionHref is null — non-functional placeholder
          <button
            disabled
            className='flex items-center justify-center gap-2 w-full font-semibold text-base rounded-xl cursor-not-allowed opacity-60'
            style={{
              minHeight: '52px',
              background: outcome.color,
              color: '#0f1a0a',
            }}
            title='Open Google Maps in your browser to find the nearest hospital'
          >
            {outcome.action}
          </button>
        )}

        {/* Start over */}
        <button
          onClick={onReset}
          className='block w-full text-center text-xs mt-4 transition-opacity hover:opacity-70'
          style={{ color: '#7a7a6e' }}
        >
          Start over
        </button>
      </div>

      {/* Log symptoms CTA */}
      <p className='text-sm text-center'>
        <Link
          to='/symptoms'
          className='transition-opacity hover:opacity-80'
          style={{ color: '#8fbf6e' }}
        >
          Log full symptoms with Praana AI →
        </Link>
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TriagePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [outcome, setOutcome] = useState<OutcomeKey | null>(null)

  const answeredCount = outcome !== null ? QUESTIONS.length : currentIndex

  /** Handle YES or NO tap on the current question */
  const handleAnswer = (answer: 'yes' | 'no') => {
    const question = QUESTIONS[currentIndex]
    const resolved = computeOutcome(question.id, answer)

    if (resolved) {
      setOutcome(resolved)
    } else {
      // NO on any question except q5 — advance to next
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setOutcome(null)
  }

  return (
    <Layout>
      <div className='max-w-xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-2'>
          <HeartPulse size={24} style={{ color: '#d97272' }} />
          <h1 className='text-2xl font-bold' style={{ color: '#ede9e0' }}>
            Is This Urgent?
          </h1>
        </div>
        <p className='text-sm mb-6' style={{ color: '#7a7a6e' }}>
          Quick 5-question triage — takes 30 seconds
        </p>

        {/* Progress bar */}
        <ProgressBar answered={answeredCount} total={QUESTIONS.length} />

        {/* Content */}
        {outcome ? (
          <OutcomeCard outcomeKey={outcome} onReset={handleReset} />
        ) : (
          <QuestionCard
            key={currentIndex}
            question={QUESTIONS[currentIndex]}
            index={currentIndex}
            total={QUESTIONS.length}
            onAnswer={handleAnswer}
          />
        )}
      </div>
    </Layout>
  )
}
