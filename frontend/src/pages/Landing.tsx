import { Link } from 'react-router-dom'
import { Heart, Brain, Camera, Activity, FileText, ArrowRight, AlertTriangle, Zap, Shield, Globe } from 'lucide-react'

const STATS = [
  { value: '1 : 1,456', label: 'Doctor-to-patient ratio in India' },
  { value: '1.4B', label: 'People without adequate doctor access' },
  { value: '72%', label: 'Indians self-diagnose via Google first' },
  { value: '2–3 min', label: 'Average GP consultation time' },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'Symptom Intelligence',
    desc: 'Describe symptoms in Hindi, Tamil, or English. Get evidence-based shortlists using WHO ICD-11 — calibrated to your profile.',
    accent: 'from-blue-500/20 to-cyan-500/10',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    border: 'hover:border-blue-500/30',
  },
  {
    icon: Camera,
    title: 'Label Scanner',
    desc: 'Scan any food or medicine label. Know exactly how every ingredient affects your specific health conditions.',
    accent: 'from-purple-500/20 to-pink-500/10',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    border: 'hover:border-purple-500/30',
  },
  {
    icon: Activity,
    title: 'Vitals Tracker',
    desc: 'Log BP, heart rate, SpO2, temperature. We track trends from your personal baseline — not population averages.',
    accent: 'from-teal-500/20 to-emerald-500/10',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    border: 'hover:border-teal-500/30',
  },
  {
    icon: FileText,
    title: 'Doctor Brief',
    desc: 'Generate a structured PDF your doctor reads in 90 seconds. The 3-minute consultation starts informed.',
    accent: 'from-amber-500/20 to-orange-500/10',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    border: 'hover:border-amber-500/30',
  },
]

const TRUST_ITEMS = [
  { icon: Zap, label: '6 AI-powered modules' },
  { icon: Globe, label: 'ICD-11 integrated' },
  { icon: Shield, label: '30+ Indian foods tracked' },
]

/** Decorative floating health metric bubble */
function MetricBubble({
  label,
  value,
  unit,
  color,
  className,
}: {
  label: string
  value: string
  unit: string
  color: string
  className: string
}) {
  return (
    <div
      className={`absolute glass-card px-4 py-3 select-none pointer-events-none ${className}`}
      style={{ minWidth: 110 }}
    >
      <p className='text-xs text-slate-400 mb-0.5 tracking-wider uppercase font-medium'>{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {value}
        <span className='text-xs font-normal text-slate-400 ml-1'>{unit}</span>
      </p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-midnight overflow-x-hidden'>

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className='flex items-center justify-between px-6 py-5 max-w-6xl mx-auto relative z-10'>
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center glow-teal'>
            <Heart className='text-teal-400' size={18} fill='currentColor' />
          </div>
          <span className='text-xl font-bold text-white font-display tracking-tight'>Praana</span>
        </div>
        <div className='flex items-center gap-3'>
          <Link
            to='/login'
            className='text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.05]'
          >
            Log in
          </Link>
          <Link
            to='/register'
            className='btn-primary text-sm flex items-center gap-1.5'
          >
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className='relative max-w-5xl mx-auto px-6 pt-16 pb-20 text-center overflow-visible'>

        {/* Ambient background glow */}
        <div
          className='absolute inset-0 pointer-events-none'
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(20,184,166,0.1) 0%, transparent 70%)',
          }}
        />

        {/* Floating metric bubbles — decorative */}
        <MetricBubble
          label='Heart Rate'
          value='72'
          unit='bpm'
          color='text-teal-400'
          className='hidden lg:block -left-4 top-24 animate-float'
        />
        <MetricBubble
          label='SpO2'
          value='98'
          unit='%'
          color='text-cyan-400'
          className='hidden lg:block -right-4 top-16 animate-float-delayed'
        />
        <MetricBubble
          label='Blood Pressure'
          value='118/76'
          unit='mmHg'
          color='text-green-400'
          className='hidden lg:block -left-8 bottom-32 animate-float-slow'
        />

        {/* Hero headline */}
        <h1 className='animate-slide-up-1 text-5xl sm:text-6xl md:text-7xl font-bold font-display leading-[1.05] mb-6 tracking-tight'>
          <span className='text-white'>India&rsquo;s intelligent</span>
          <br />
          <span className='gradient-text'>health companion</span>
        </h1>

        <p className='animate-slide-up-2 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed'>
          Praana doesn&rsquo;t replace doctors. It makes the{' '}
          <span className='text-white font-medium'>3 minutes count</span>
          {' '}— by preparing every patient before they walk in.
        </p>

        {/* CTA */}
        <div className='animate-slide-up-3 flex flex-col sm:flex-row items-center justify-center gap-4'>
          <Link
            to='/register'
            className='flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold
                       px-8 py-4 rounded-xl transition-all duration-200 text-base shadow-teal-glow
                       hover:shadow-teal-glow-lg hover:-translate-y-0.5'
          >
            Start for free <ArrowRight size={18} />
          </Link>
          <Link
            to='/login'
            className='flex items-center gap-2 glass-card px-8 py-4 text-slate-300
                       hover:text-white font-semibold text-base transition-all duration-200 hover:border-white/[0.14]'
          >
            I have an account
          </Link>
        </div>

        {/* Trust strip */}
        <div className='flex items-center justify-center gap-6 mt-12 flex-wrap'>
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className='flex items-center gap-2 text-slate-500 text-sm'>
              <Icon size={14} className='text-teal-500' />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────── */}
      <section className='max-w-5xl mx-auto px-6 pb-20'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {STATS.map((s, i) => (
            <div
              key={s.value}
              className='glass-card p-5 text-center group hover:border-teal-500/20 transition-all duration-300'
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className='text-2xl sm:text-3xl font-bold font-display gradient-text mb-1.5 leading-tight'>
                {s.value}
              </p>
              <p className='text-xs sm:text-sm text-slate-500 leading-snug'>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section className='max-w-5xl mx-auto px-6 pb-20'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl sm:text-4xl font-bold font-display text-white mb-3'>
            Six modules. One mission.
          </h2>
          <p className='text-slate-500 text-base max-w-xl mx-auto'>
            Every feature is built around one question: how do we make the next doctor visit more effective?
          </p>
        </div>
        <div className='grid md:grid-cols-2 gap-4'>
          {FEATURES.map(({ icon: Icon, title, desc, accent, iconBg, iconColor, border }) => (
            <div
              key={title}
              className={`glass-card p-6 flex gap-4 group transition-all duration-300 ${border} hover:-translate-y-0.5`}
            >
              <div
                className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0
                            group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className={iconColor} size={20} />
              </div>
              <div>
                <h3 className='font-semibold text-white mb-1.5 font-display'>{title}</h3>
                <p className='text-sm text-slate-400 leading-relaxed'>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Ethics disclaimer ──────────────────────────────────── */}
      <section className='max-w-3xl mx-auto px-6 pb-24 text-center'>
        <div className='glass-card p-8 border-amber-500/10'>
          <div className='w-10 h-10 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Shield className='text-amber-400' size={18} />
          </div>
          <p className='text-slate-300 text-sm leading-relaxed max-w-lg mx-auto'>
            <span className='text-white font-semibold'>Praana never diagnoses.</span>{' '}
            Every output is probabilistic — a preparation for your doctor, never a replacement.
            Emergency symptoms trigger an immediate redirect to real emergency services.
          </p>
        </div>
      </section>
    </div>
  )
}
