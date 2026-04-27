import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Camera, Salad, Activity, Dumbbell, FileText, ChevronRight, Heart, AlertCircle } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { apiClient } from '@/api/client'

const MODULES = [
  {
    to: '/symptoms',
    icon: Brain,
    title: 'Symptom Analysis',
    desc: 'Describe how you feel. Get evidence-based possibilities.',
    color: 'bg-blue-900/40 border-blue-700/50',
    iconColor: 'text-blue-400',
  },
  {
    to: '/scanner',
    icon: Camera,
    title: 'Label Scanner',
    desc: 'Scan food or medicine labels. Know what it does to you.',
    color: 'bg-purple-900/40 border-purple-700/50',
    iconColor: 'text-purple-400',
  },
  {
    to: '/diet',
    icon: Salad,
    title: 'Diet Intelligence',
    desc: 'Log what you ate. See nutritional gaps and warnings.',
    color: 'bg-green-900/40 border-green-700/50',
    iconColor: 'text-green-400',
  },
  {
    to: '/vitals',
    icon: Activity,
    title: 'Vitals Tracker',
    desc: 'Log BP, heart rate, SpO2. Track trends from your baseline.',
    color: 'bg-red-900/40 border-red-700/50',
    iconColor: 'text-red-400',
  },
  {
    to: '/exercise',
    icon: Dumbbell,
    title: 'Exercise',
    desc: 'Get daily recommendations calibrated to your conditions.',
    color: 'bg-orange-900/40 border-orange-700/50',
    iconColor: 'text-orange-400',
  },
  {
    to: '/brief',
    icon: FileText,
    title: 'Doctor Brief',
    desc: 'Generate a PDF for your next consultation.',
    color: 'bg-teal-900/40 border-teal-700/50',
    iconColor: 'text-teal-400',
  },
]

interface LatestVitals {
  hr_bpm?: number
  bp_systolic?: number
  bp_diastolic?: number
  spo2?: number
  timestamp?: string
}

interface LastSession {
  created_at: string
  red_flag: boolean
}

function vitalsDot(vitals: LatestVitals): { color: string; label: string } {
  if (!vitals) return { color: 'bg-slate-500', label: 'No data' }
  const { bp_systolic, spo2, hr_bpm } = vitals
  if (
    (bp_systolic && bp_systolic > 160) ||
    (spo2 && spo2 < 92) ||
    (hr_bpm && hr_bpm > 110)
  ) return { color: 'bg-red-500', label: 'Needs attention' }
  if (
    (bp_systolic && bp_systolic > 140) ||
    (spo2 && spo2 < 95) ||
    (hr_bpm && hr_bpm > 100)
  ) return { color: 'bg-amber-400', label: 'Watch' }
  return { color: 'bg-green-400', label: 'Normal range' }
}

function motivationalMessage(conditions: string[]): string {
  const lower = conditions.map((c) => c.toLowerCase())
  if (lower.some((c) => c.includes('diabetes'))) {
    return 'Managing diabetes with consistent monitoring is a superpower. Keep logging your glucose and meals daily.'
  }
  if (lower.some((c) => c.includes('hypertension') || c.includes('blood pressure'))) {
    return 'Every logged vital is a data point your heart thanks you for. Stay consistent with your readings.'
  }
  if (lower.some((c) => c.includes('thyroid'))) {
    return 'Thyroid health responds well to routine. Your symptom logs help spot patterns your doctor needs to see.'
  }
  if (conditions.length > 0) {
    return 'Living well with chronic conditions takes knowledge. Praana helps you stay one step ahead.'
  }
  return 'Prevention is the best medicine. Keep tracking your health every day.'
}

export default function DashboardPage() {
  const { userId } = useAuthStore()
  const { profile, setProfile } = useProfileStore()
  const [latestVitals, setLatestVitals] = useState<LatestVitals | null>(null)
  const [lastSession, setLastSession] = useState<LastSession | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)

  useEffect(() => {
    if (!profile) {
      apiClient.get('/profile/me')
        .then((res) => setProfile(res.data))
        .catch(() => {})
    }
  }, [profile, setProfile])

  useEffect(() => {
    setHealthLoading(true)
    Promise.allSettled([
      apiClient.get('/vitals/history?days=1'),
      apiClient.get('/symptoms/sessions?limit=1'),
    ]).then(([vitalsRes, sessionRes]) => {
      if (vitalsRes.status === 'fulfilled') {
        const hist = vitalsRes.value.data.history || []
        if (hist.length > 0) setLatestVitals(hist[hist.length - 1])
      }
      if (sessionRes.status === 'fulfilled') {
        const sessions = sessionRes.value.data || []
        if (sessions.length > 0) setLastSession(sessions[0])
      }
    }).finally(() => setHealthLoading(false))
  }, [])

  const name = profile?.personal?.name?.split(' ')[0] || 'there'
  const conditions = profile?.medical_history?.conditions || []
  const dot = latestVitals ? vitalsDot(latestVitals) : null

  return (
    <Layout>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-2'>
          <Heart className='text-teal-400' size={24} />
          <h1 className='text-2xl font-bold text-white'>Good morning, {name}</h1>
        </div>
        {profile && (
          <p className='text-slate-400 text-sm mb-6 ml-9'>
            {profile.age && `${profile.age}y`}
            {profile.personal.gender && ` · ${profile.personal.gender}`}
            {profile.personal.blood_type && ` · ${profile.personal.blood_type}`}
            {profile.bmi && ` · BMI ${profile.bmi}`}
            {profile.personal.city && ` · ${profile.personal.city}`}
          </p>
        )}

        {!profile && (
          <div className='mb-6 p-4 bg-amber-900/30 border border-amber-700/50 rounded-xl'>
            <p className='text-amber-300 text-sm'>
              Complete your health profile to get personalized recommendations.{' '}
              <Link to='/onboarding' className='underline font-medium'>Set up profile</Link>
            </p>
          </div>
        )}

        {/* Health Summary Card */}
        {profile && (
          <div className='mb-6 p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-3'>
            <h2 className='text-sm font-semibold text-slate-300'>Health Summary</h2>

            {/* Latest vitals */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className={`w-2.5 h-2.5 rounded-full ${dot?.color ?? 'bg-slate-500'}`} />
                <span className='text-xs text-slate-400'>Last vitals</span>
              </div>
              {latestVitals ? (
                <div className='flex items-center gap-3 text-xs text-slate-300'>
                  {latestVitals.bp_systolic && (
                    <span>BP {latestVitals.bp_systolic}/{latestVitals.bp_diastolic}</span>
                  )}
                  {latestVitals.hr_bpm && <span>HR {latestVitals.hr_bpm}</span>}
                  {latestVitals.spo2 && <span>SpO2 {latestVitals.spo2}%</span>}
                  <span className={`font-medium ${dot?.color === 'bg-red-500' ? 'text-red-400' : dot?.color === 'bg-amber-400' ? 'text-amber-400' : 'text-green-400'}`}>
                    {dot?.label}
                  </span>
                </div>
              ) : (
                <Link to='/vitals' className='text-xs text-teal-400 hover:underline'>Log first reading</Link>
              )}
            </div>

            {/* Last symptom session */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {lastSession?.red_flag ? (
                  <AlertCircle className='text-red-400' size={10} />
                ) : (
                  <div className='w-2.5 h-2.5 rounded-full bg-blue-400' />
                )}
                <span className='text-xs text-slate-400'>Last symptom check</span>
              </div>
              {lastSession ? (
                <span className='text-xs text-slate-300'>
                  {new Date(lastSession.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short',
                  })}
                  {lastSession.red_flag && <span className='text-red-400 ml-1'>· Emergency flag raised</span>}
                </span>
              ) : (
                <Link to='/symptoms' className='text-xs text-teal-400 hover:underline'>Run first analysis</Link>
              )}
            </div>

            {/* Motivational message */}
            <p className='text-xs text-slate-400 border-t border-slate-700 pt-3 leading-relaxed'>
              {motivationalMessage(conditions)}
            </p>
          </div>
        )}

        {/* Conditions summary */}
        {conditions.length > 0 && (
          <div className='mb-6 p-4 bg-slate-800 border border-slate-700 rounded-xl'>
            <p className='text-xs text-slate-400 mb-2'>Known conditions on file</p>
            <div className='flex flex-wrap gap-2'>
              {conditions.map((c) => (
                <span key={c} className='text-xs bg-red-900/40 border border-red-700/50 text-red-300 px-2.5 py-1 rounded-full'>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Module grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {MODULES.map(({ to, icon: Icon, title, desc, color, iconColor }) => (
            <Link
              key={to}
              to={to}
              className={`border rounded-xl p-5 hover:scale-[1.02] transition-transform cursor-pointer ${color}`}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='w-10 h-10 bg-slate-800/60 rounded-lg flex items-center justify-center'>
                  <Icon className={iconColor} size={20} />
                </div>
                <ChevronRight className='text-slate-500' size={16} />
              </div>
              <h3 className='font-semibold text-white mb-1'>{title}</h3>
              <p className='text-xs text-slate-400 leading-relaxed'>{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
