import { Phone, MessageCircle, Stethoscope, FileText, Leaf, Activity, AlertTriangle } from 'lucide-react'
import Layout from '@/components/Layout'

const CONSULT_REASONS = [
  {
    icon: FileText,
    title: 'Lab Report Questions',
    desc: 'When your blood test results are confusing or you want an expert to walk through flagged values with you.',
    accentColor: 'rgba(143,191,110,0.12)',
    iconColor: '#8fbf6e',
  },
  {
    icon: Leaf,
    title: 'Ayurvedic Remedies',
    desc: 'For guidance on herbs, diet, and lifestyle interventions for chronic conditions like diabetes, thyroid, or joint pain.',
    accentColor: 'rgba(201,168,76,0.12)',
    iconColor: '#c9a84c',
  },
  {
    icon: Activity,
    title: 'Medication & Lifestyle',
    desc: 'When you need personalized guidance on managing medications alongside diet, exercise, or natural therapies.',
    accentColor: 'rgba(100,130,220,0.12)',
    iconColor: '#8090d0',
  },
]

export default function ConsultPage() {
  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 sm:px-6 py-8'>

        {/* Header */}
        <div className='mb-8 animate-slide-up'>
          <div className='flex items-center gap-3 mb-2'>
            <div
              className='w-10 h-10 rounded-xl flex items-center justify-center'
              style={{ background: 'rgba(201,168,76,0.12)' }}
            >
              <Stethoscope size={20} style={{ color: '#c9a84c' }} />
            </div>
            <h1 className='text-2xl sm:text-3xl font-bold font-display' style={{ color: '#ede9e0' }}>
              Talk to a Doctor
            </h1>
          </div>
          <p className='text-sm mt-2' style={{ color: '#7a7a6e' }}>
            Connect directly with Dr. Ankita for personalized Ayurvedic guidance.
          </p>
        </div>

        {/* Doctor card */}
        <div
          className='glass-card p-6 mb-6 animate-fade-up'
        >
          <div className='flex items-start gap-5'>

            {/* Avatar */}
            <div
              className='w-16 h-16 rounded-full shrink-0 flex items-center justify-center font-display font-bold text-xl'
              style={{
                background: 'linear-gradient(135deg, rgba(143,191,110,0.25) 0%, rgba(143,191,110,0.1) 100%)',
                border: '2px solid rgba(143,191,110,0.2)',
                color: '#8fbf6e',
              }}
            >
              AV
            </div>

            {/* Info */}
            <div className='flex-1 min-w-0'>
              <h2 className='font-display font-bold text-lg mb-0.5' style={{ color: '#ede9e0' }}>
                Dr. Ankita Vikas Agarkar
              </h2>
              <span
                className='inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3'
                style={{
                  background: 'rgba(143,191,110,0.1)',
                  border: '1px solid rgba(143,191,110,0.2)',
                  color: '#8fbf6e',
                }}
              >
                BAMS
              </span>

              {/* Specialty chips */}
              <div className='flex flex-wrap gap-2 mb-4'>
                {['Ayurvedic Medicine', 'Holistic Health'].map((s) => (
                  <span
                    key={s}
                    className='text-xs px-2.5 py-1 rounded-lg'
                    style={{
                      background: 'rgba(201,168,76,0.08)',
                      border: '1px solid rgba(201,168,76,0.15)',
                      color: 'rgba(201,168,76,0.85)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Availability */}
              <div className='flex items-center gap-2 mb-5'>
                <span
                  className='w-2 h-2 rounded-full animate-pulse-slow'
                  style={{ background: '#8fbf6e' }}
                />
                <p className='text-sm' style={{ color: 'rgba(184,217,156,0.75)' }}>
                  Available for consultation
                </p>
              </div>

              {/* CTA buttons */}
              <div className='flex flex-col sm:flex-row gap-3'>
                <a
                  href='tel:8767703059'
                  className='flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm transition-all duration-200'
                  style={{
                    background: '#8fbf6e',
                    color: '#0f1a0a',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#b8d99c')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#8fbf6e')}
                >
                  <Phone size={16} />
                  Call Now
                </a>
                <a
                  href='https://wa.me/918767703059'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm transition-all duration-200'
                  style={{
                    background: 'rgba(143,191,110,0.12)',
                    border: '1px solid rgba(143,191,110,0.2)',
                    color: '#8fbf6e',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(143,191,110,0.18)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(143,191,110,0.12)'
                  }}
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* When to consult */}
        <div className='mb-6 animate-fade-up-1'>
          <h2 className='font-display font-semibold text-base mb-4' style={{ color: '#ede9e0' }}>
            When to Consult
          </h2>
          <div className='space-y-3'>
            {CONSULT_REASONS.map(({ icon: Icon, title, desc, accentColor, iconColor }) => (
              <div
                key={title}
                className='rounded-xl p-4 flex items-start gap-4'
                style={{
                  background: accentColor,
                  border: `1px solid ${iconColor}22`,
                }}
              >
                <div
                  className='w-9 h-9 rounded-xl shrink-0 flex items-center justify-center'
                  style={{ background: `${iconColor}1a` }}
                >
                  <Icon size={18} style={{ color: iconColor }} />
                </div>
                <div>
                  <p className='font-semibold text-sm mb-1' style={{ color: '#ede9e0' }}>{title}</p>
                  <p className='text-xs leading-relaxed' style={{ color: '#7a7a6e' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency notice */}
        <div
          className='rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-up-2'
          style={{
            background: 'rgba(201,168,76,0.07)',
            border: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          <AlertTriangle size={18} style={{ color: '#c9a84c' }} className='shrink-0 mt-0.5' />
          <div>
            <p className='font-semibold text-sm mb-1' style={{ color: '#c9a84c' }}>
              This is NOT an emergency service
            </p>
            <p className='text-xs leading-relaxed' style={{ color: 'rgba(201,168,76,0.7)' }}>
              For medical emergencies, call <strong>112</strong> immediately. Dr. Agarkar provides Ayurvedic consultation only — not emergency or critical care.
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className='text-xs text-center animate-fade-up-3' style={{ color: 'rgba(122,122,110,0.5)' }}>
          Dr. Agarkar is a team member of Praana and provides Ayurvedic consultation.
        </p>
      </div>
    </Layout>
  )
}
