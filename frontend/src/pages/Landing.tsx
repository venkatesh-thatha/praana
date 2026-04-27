import { Link } from 'react-router-dom'
import { Heart, Brain, Camera, Activity, FileText, ArrowRight, AlertTriangle } from 'lucide-react'

const STATS = [
  { value: '1 : 1,456', label: 'Doctor-to-patient ratio in India' },
  { value: '1.4B', label: 'People without adequate doctor access' },
  { value: '72%', label: 'Indians self-diagnose via Google first' },
  { value: '2–3 min', label: 'Average GP consultation time' },
]

const FEATURES = [
  { icon: Brain, title: 'Symptom Intelligence', desc: 'Describe symptoms in Hindi, Tamil, or English. Get evidence-based shortlists using WHO ICD-11 — calibrated to your profile.' },
  { icon: Camera, title: 'Label Scanner', desc: 'Scan any food or medicine label. Know exactly how every ingredient affects your specific health conditions.' },
  { icon: Activity, title: 'Vitals Tracker', desc: 'Log BP, heart rate, SpO2, temperature. We track trends from your personal baseline — not population averages.' },
  { icon: FileText, title: 'Doctor Brief', desc: 'Generate a structured PDF your doctor reads in 90 seconds. The 3-minute consultation starts informed.' },
]

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-slate-900'>
      {/* Header */}
      <header className='flex items-center justify-between px-6 py-4 max-w-6xl mx-auto'>
        <div className='flex items-center gap-2'>
          <Heart className='text-teal-400' size={28} />
          <span className='text-2xl font-bold text-white'>Praana</span>
        </div>
        <div className='flex items-center gap-3'>
          <Link to='/login' className='text-slate-300 hover:text-white text-sm font-medium'>Log in</Link>
          <Link to='/register' className='btn-primary text-sm'>Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className='max-w-4xl mx-auto px-6 pt-20 pb-16 text-center'>
        <div className='inline-flex items-center gap-2 bg-teal-900/40 border border-teal-700/50 rounded-full px-4 py-1.5 text-teal-300 text-sm mb-6'>
          <AlertTriangle size={14} />
          CBC Spring 2026 · Track 1 — Biology & Physical Health
        </div>
        <h1 className='text-5xl md:text-6xl font-bold text-white leading-tight mb-6'>
          India's intelligent<br />
          <span className='text-teal-400'>health companion</span>
        </h1>
        <p className='text-xl text-slate-300 max-w-2xl mx-auto mb-10'>
          Praana doesn't replace doctors. It makes the 3 minutes count — by preparing every patient before they walk in.
        </p>
        <div className='flex items-center justify-center gap-4'>
          <Link to='/register' className='flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-lg'>
            Start for free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className='max-w-5xl mx-auto px-6 pb-16'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {STATS.map((s) => (
            <div key={s.value} className='bg-slate-800 border border-slate-700 rounded-xl p-5 text-center'>
              <p className='text-3xl font-bold text-teal-400 mb-1'>{s.value}</p>
              <p className='text-sm text-slate-400'>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className='max-w-5xl mx-auto px-6 pb-20'>
        <h2 className='text-3xl font-bold text-white text-center mb-10'>Six modules. One mission.</h2>
        <div className='grid md:grid-cols-2 gap-5'>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className='bg-slate-800 border border-slate-700 rounded-xl p-6 flex gap-4'>
              <div className='w-10 h-10 bg-teal-900/60 rounded-lg flex items-center justify-center shrink-0'>
                <Icon className='text-teal-400' size={20} />
              </div>
              <div>
                <h3 className='font-semibold text-white mb-1'>{title}</h3>
                <p className='text-sm text-slate-400 leading-relaxed'>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ethics badge */}
      <section className='max-w-3xl mx-auto px-6 pb-20 text-center'>
        <div className='bg-slate-800/60 border border-slate-700 rounded-xl p-8'>
          <p className='text-slate-300 text-sm leading-relaxed'>
            <span className='text-white font-semibold'>Praana never diagnoses.</span> Every output is probabilistic — a preparation for your doctor, never a replacement. Emergency symptoms trigger an immediate redirect to real emergency services.
          </p>
        </div>
      </section>
    </div>
  )
}
