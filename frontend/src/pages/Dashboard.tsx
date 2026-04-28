import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, Dumbbell, FileText,
  ChevronRight, Lightbulb, Stethoscope,
  Scan, HeartPulse, Wind, Camera, Send,
} from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'
import Layout from '@/components/Layout'
import { ScanPicker } from '@/components/ScanPicker'
import { useProfileStore } from '@/store/profileStore'
import { apiClient } from '@/api/client'

// ─── Types ──────────────────────────────────────────────────────

interface WellnessTip {
  tip_title: string
  tip_body: string
}

// ─── Helpers ────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Good night'
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// Maps blood type string to a subtle background color token
function bloodTypeBg(bt: string): string {
  const map: Record<string, string> = {
    'A+': 'rgba(217,114,114,0.10)',
    'A-': 'rgba(217,114,114,0.10)',
    'B+': 'rgba(128,144,208,0.10)',
    'B-': 'rgba(128,144,208,0.10)',
    'AB+': 'rgba(176,128,208,0.10)',
    'AB-': 'rgba(176,128,208,0.10)',
    'O+': 'rgba(80,200,176,0.10)',
    'O-': 'rgba(80,200,176,0.10)',
  }
  return map[bt] ?? 'rgba(143,191,110,0.10)'
}

// ─── Sub-components ─────────────────────────────────────────────

interface SectionLabelProps {
  children: string
}

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p
      className='text-[9px] uppercase tracking-[0.15em] font-semibold mb-3'
      style={{ color: 'rgba(143,191,110,0.4)' }}
    >
      {children}
    </p>
  )
}

// Wellness tip loading shimmer
function TipShimmer() {
  return (
    <div
      className='card animate-pulse'
      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}
    >
      <div
        className='rounded-lg flex-shrink-0'
        style={{
          width: 32,
          height: 32,
          background: 'rgba(201,168,76,0.06)',
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          className='rounded mb-2'
          style={{ height: 12, width: '55%', background: 'rgba(143,191,110,0.06)' }}
        />
        <div
          className='rounded mb-1'
          style={{ height: 10, width: '100%', background: 'rgba(143,191,110,0.04)' }}
        />
        <div
          className='rounded'
          style={{ height: 10, width: '80%', background: 'rgba(143,191,110,0.04)' }}
        />
      </div>
    </div>
  )
}

interface WellnessTipCardProps {
  tip: WellnessTip
}

// Compact single-tip card (uses only tip_title + tip_body per spec)
function WellnessTipCard({ tip }: WellnessTipCardProps) {
  return (
    <div
      className='card animate-fade-up'
      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}
    >
      <div
        className='rounded-lg flex-shrink-0 flex items-center justify-center'
        style={{
          width: 32,
          height: 32,
          background: 'rgba(201,168,76,0.10)',
        }}
      >
        <Lightbulb size={16} style={{ color: '#c9a84c' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className='text-sm font-semibold' style={{ color: '#ede9e0' }}>
          {tip.tip_title}
        </p>
        <p
          className='text-xs mt-0.5 leading-relaxed'
          style={{
            color: '#7a7a6e',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {tip.tip_body}
        </p>
      </div>
    </div>
  )
}

// ─── AQI Widget ─────────────────────────────────────────────────

const AQI_LEVELS = [
  { max: 50,  label: 'Good',               color: '#8fbf6e', bg: 'rgba(143,191,110,0.08)', advice: 'Air quality is fine — safe for outdoor exercise.' },
  { max: 100, label: 'Moderate',           color: '#c9a84c', bg: 'rgba(201,168,76,0.08)',  advice: 'Acceptable air quality. Sensitive individuals should limit prolonged outdoor exertion.' },
  { max: 150, label: 'Unhealthy for some', color: '#e09050', bg: 'rgba(224,144,80,0.08)',  advice: 'Sensitive groups (asthma, heart conditions) should reduce outdoor activity.' },
  { max: 200, label: 'Unhealthy',          color: '#d97272', bg: 'rgba(217,114,114,0.08)', advice: 'Everyone may experience health effects. Limit outdoor exercise.' },
  { max: 300, label: 'Very Unhealthy',     color: '#c060c0', bg: 'rgba(180,80,180,0.08)',  advice: 'Avoid outdoor activity. Use air purifier if available.' },
  { max: 999, label: 'Hazardous',          color: '#d97272', bg: 'rgba(217,114,114,0.12)', advice: 'Health emergency. Stay indoors with windows closed.' },
]

function getAqiLevel(aqi: number) {
  return AQI_LEVELS.find((l) => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1]
}

interface AqiData { aqi: number; city: string }

function AqiWidget({ data }: { data: AqiData }) {
  const level = getAqiLevel(data.aqi)
  return (
    <div className='card' style={{ background: level.bg, border: `1px solid ${level.color}22`, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wind size={14} style={{ color: level.color }} />
          <span className='text-xs font-medium' style={{ color: '#ede9e0' }}>Air Quality · {data.city}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className='text-xs font-bold' style={{ color: level.color }}>{level.label}</span>
          <span
            className='text-xs font-bold px-2 py-0.5 rounded-full'
            style={{ background: `${level.color}22`, color: level.color }}
          >
            AQI {data.aqi}
          </span>
        </div>
      </div>
      <p className='text-xs mt-1.5' style={{ color: '#7a7a6e' }}>{level.advice}</p>
    </div>
  )
}

// ─── Vitals Sparkline Card ───────────────────────────────────────

interface VitalPoint {
  day: string
  hr?: number
  bp?: number
}

function VitalsSparkCard({ data }: { data: VitalPoint[] }) {
  if (!data.length) {
    return (
      <Link
        to='/vitals'
        className='card'
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
      >
        <div>
          <p className='text-sm font-medium' style={{ color: '#ede9e0' }}>Vitals this week</p>
          <p className='text-xs mt-0.5' style={{ color: '#7a7a6e' }}>No readings yet — log your first vitals</p>
        </div>
        <ChevronRight size={16} style={{ color: '#7a7a6e', flexShrink: 0 }} />
      </Link>
    )
  }
  return (
    <Link to='/vitals' style={{ textDecoration: 'none' }}>
      <div
        className='card card-hover'
        style={{ padding: '14px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} style={{ color: '#50c8b0' }} />
            <span className='text-xs font-medium' style={{ color: '#ede9e0' }}>Vitals this week</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className='text-[10px]' style={{ color: '#d97272' }}>● BP</span>
            <span className='text-[10px]' style={{ color: '#8fbf6e' }}>● HR</span>
            <ChevronRight size={12} style={{ color: '#7a7a6e' }} />
          </div>
        </div>
        <ResponsiveContainer width='100%' height={56}>
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line type='monotone' dataKey='bp' stroke='#d97272' strokeWidth={1.5} dot={false} />
            <Line type='monotone' dataKey='hr' stroke='#8fbf6e' strokeWidth={1.5} dot={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(14,18,14,0.95)', border: '1px solid rgba(143,191,110,0.15)', borderRadius: 8, fontSize: 11, color: '#ede9e0' }}
              labelStyle={{ color: '#7a7a6e', marginBottom: 2 }}
              formatter={(val: number, name: string) => [val, name === 'bp' ? 'Systolic' : 'HR']}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Link>
  )
}

// ─── Page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, setProfile } = useProfileStore()
  const navigate = useNavigate()

  const [tipData, setTipData] = useState<WellnessTip | null>(null)
  const [tipLoading, setTipLoading] = useState(true)
  const [vitalsData, setVitalsData] = useState<VitalPoint[] | null>(null)
  const [aqiData, setAqiData] = useState<AqiData | null>(null)
  const [chatText, setChatText] = useState('')
  const [scanPickerOpen, setScanPickerOpen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load profile if not already in store
  useEffect(() => {
    if (!profile) {
      apiClient.get('/profile/me')
        .then((res) => setProfile(res.data))
        .catch(() => {})
    }
  }, [profile, setProfile])

  // Wellness tip
  useEffect(() => {
    setTipLoading(true)
    apiClient.get('/wellness/today')
      .then((res) => {
        const data = res.data
        const tip: WellnessTip = data.tip ?? data
        setTipData(tip)
      })
      .catch(() => {})
      .finally(() => setTipLoading(false))
  }, [])

  // AQI — fetch when profile city is available, silent fail
  useEffect(() => {
    const city = profile?.personal?.city
    if (!city) return
    fetch(`https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=demo`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'ok' && typeof data.data?.aqi === 'number') {
          setAqiData({ aqi: data.data.aqi, city })
        }
      })
      .catch(() => {})
  }, [profile?.personal?.city])

  // Vitals sparkline — silent fail
  useEffect(() => {
    apiClient.get('/vitals/history?days=7')
      .then((res) => {
        const history: any[] = res.data?.history ?? []
        const points: VitalPoint[] = history.map((h) => ({
          day: new Date(h.timestamp).toLocaleDateString('en-IN', { weekday: 'short' }),
          hr: h.hr_bpm ?? undefined,
          bp: h.bp_systolic ?? undefined,
        }))
        setVitalsData(points)
      })
      .catch(() => setVitalsData([]))
  }, [])

  const firstName = profile?.personal?.name?.split(' ')[0] ?? null
  const bloodType = profile?.personal?.blood_type ?? null
  const conditions: string[] = profile?.medical_history?.conditions ?? []

  const greeting = getGreeting()
  const todayLabel = formatToday()

  // Navigate to /symptoms carrying the typed text as router state
  function handleSend() {
    const trimmed = chatText.trim()
    if (!trimmed) return
    navigate('/symptoms', { state: { initialQuery: trimmed } })
  }

  // Send on Enter (not Shift+Enter which should newline)
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-6 space-y-6'>

        {/* ── Section 1: Greeting Header ─────────────────────── */}
        <div className='animate-slide-up'>
          <div className='flex items-start justify-between gap-3'>

            {/* Left: greeting + date */}
            <div>
              <h1 className='text-2xl font-bold font-display' style={{ color: '#ede9e0' }}>
                {greeting}, {firstName ?? 'Hello there'}
              </h1>
              <p className='text-sm mt-0.5' style={{ color: '#7a7a6e' }}>
                {todayLabel}
              </p>
            </div>

            {/* Right: profile badges */}
            {profile && (
              <div className='flex items-center gap-2 flex-shrink-0 flex-wrap justify-end mt-0.5'>
                {bloodType && (
                  <span
                    className='text-xs font-semibold px-2.5 py-1 rounded-full'
                    style={{
                      background: bloodTypeBg(bloodType),
                      color: '#ede9e0',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {bloodType}
                  </span>
                )}
                {conditions.length > 0 && (
                  <span
                    className='text-xs font-medium px-2.5 py-1 rounded-full'
                    style={{
                      background: 'rgba(217,114,114,0.08)',
                      color: '#d97272',
                      border: '1px solid rgba(217,114,114,0.2)',
                    }}
                  >
                    {conditions.length} condition{conditions.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: Wellness Tip + AQI ─────────────────── */}
        {tipLoading && <TipShimmer />}
        {!tipLoading && tipData && <WellnessTipCard tip={tipData} />}
        {aqiData && <AqiWidget data={aqiData} />}

        {/* ── Section 3: Primary Chat Input ──────────────────── */}
        <div>
          <SectionLabel>Talk to Praana</SectionLabel>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(128,144,208,0.12) 0%, rgba(22,26,22,0.95) 100%)',
              border: '1px solid rgba(128,144,208,0.18)',
              borderRadius: '20px',
              padding: '16px',
            }}
          >
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={3}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How are you feeling? Describe your symptoms, what you've eaten, anything on your mind..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ede9e0',
                fontSize: '0.875rem',
                resize: 'none',
                width: '100%',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.6',
              }}
            />

            {/* Bottom action row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>

              {/* Camera / skin photo attachment */}
              <button
                type='button'
                onClick={() => navigate('/skin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(224,144,80,0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  color: '#e09050',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                <Camera size={16} color='#e09050' />
                Skin photo
              </button>

              {/* Send button — disabled until text is present */}
              <button
                type='button'
                onClick={handleSend}
                disabled={!chatText.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #8fbf6e 0%, #6aab4e 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  cursor: chatText.trim() ? 'pointer' : 'default',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: chatText.trim() ? 1 : 0.4,
                  transition: 'opacity 0.15s',
                }}
              >
                <Send size={14} />
                Send
              </button>
            </div>
          </div>

          {/* Triage link — right-aligned below card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Link
              to='/triage'
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                color: '#d97272',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <HeartPulse size={12} />
              Is this urgent? Run a quick check →
            </Link>
          </div>
        </div>

        {/* ── Section 4: Vitals Sparkline ──────────────────────── */}
        {vitalsData !== null && <VitalsSparkCard data={vitalsData} />}

        {/* ── Section 5: Upload & Analyze (single wide card) ──── */}
        <div>
          <SectionLabel>Scan & Analyse</SectionLabel>
          {/*
            Single consolidated card replaces the old 2×2 scan grid.
            Hover border transitions via inline onMouseEnter/Leave to match
            the existing pattern used throughout the file.
          */}
          <div
            className='card card-hover'
            onClick={() => setScanPickerOpen(true)}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(176,128,208,0.25)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 18px',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '18px',
              background: 'rgba(22,26,22,0.7)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Icon container */}
            <div
              className='rounded-xl flex items-center justify-center flex-shrink-0'
              style={{ width: 36, height: 36, background: 'rgba(176,128,208,0.10)' }}
            >
              <Scan size={18} style={{ color: '#b080d0' }} />
            </div>

            {/* Label + type chips */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className='text-sm font-semibold' style={{ color: '#ede9e0' }}>
                Upload & Analyze
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(143,191,110,0.08)',
                    color: '#8fbf6e',
                    border: '1px solid rgba(143,191,110,0.2)',
                  }}
                >
                  Lab Report
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(128,144,208,0.08)',
                    color: '#8090d0',
                    border: '1px solid rgba(128,144,208,0.2)',
                  }}
                >
                  X-Ray
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(176,128,208,0.08)',
                    color: '#b080d0',
                    border: '1px solid rgba(176,128,208,0.2)',
                  }}
                >
                  Food Label
                </span>
              </div>
            </div>

            <ChevronRight size={18} color='#7a7a6e' />
          </div>
        </div>

        {/* ── Section 6: Exercise & Yoga (full-width card) ─────── */}
        <div>
          <SectionLabel>Wellness</SectionLabel>
          <Link
            to='/exercise'
            className='card card-hover'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '18px 20px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '18px',
              background: 'rgba(22,26,22,0.7)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,160,80,0.2)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'
            }}
          >
            <div
              className='rounded-xl flex items-center justify-center flex-shrink-0'
              style={{
                width: 44,
                height: 44,
                background: 'rgba(220,160,80,0.08)',
              }}
            >
              <Dumbbell size={22} style={{ color: '#dca050' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className='text-sm font-semibold' style={{ color: '#ede9e0' }}>
                Exercise & Yoga
              </p>
              <p className='text-xs mt-0.5 leading-relaxed' style={{ color: '#7a7a6e' }}>
                Personalized workouts, yoga poses, and meditation — calibrated to your conditions
              </p>
            </div>
            <ChevronRight size={18} style={{ color: '#7a7a6e', flexShrink: 0 }} />
          </Link>
        </div>

        {/* ── Section 7: Compact tools row (Doctor Brief + Consult) */}
        {/*
          1 row of 2 equal cards — not a 2×2 grid.
          Padding kept tight at 14px to differentiate from larger action cards.
        */}
        <div className='grid grid-cols-2 gap-3'>
          <Link
            to='/brief'
            className='card card-hover'
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(22,26,22,0.7)',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.2)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'
            }}
          >
            <div
              className='rounded-lg flex items-center justify-center flex-shrink-0'
              style={{ width: 28, height: 28, background: 'rgba(201,168,76,0.08)' }}
            >
              <FileText size={14} style={{ color: '#c9a84c' }} />
            </div>
            <span className='text-xs font-medium' style={{ color: '#ede9e0' }}>
              Doctor Brief
            </span>
          </Link>

          <Link
            to='/consult'
            className='card card-hover'
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(22,26,22,0.7)',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.2)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'
            }}
          >
            <div
              className='rounded-lg flex items-center justify-center flex-shrink-0'
              style={{ width: 28, height: 28, background: 'rgba(201,168,76,0.08)' }}
            >
              <Stethoscope size={14} style={{ color: '#c9a84c' }} />
            </div>
            <span className='text-xs font-medium' style={{ color: '#ede9e0' }}>
              Consult
            </span>
          </Link>
        </div>

        {/* ── Footer hint ─────────────────────────────────────── */}
        <p
          className='text-xs text-center mt-2 pb-4'
          style={{ color: 'rgba(122,122,110,0.4)' }}
        >
          Tap ● below to instantly scan food labels, skin, or reports
        </p>

      </div>

      {/* ScanPicker portal — rendered inside Layout so it can overlay correctly */}
      <ScanPicker open={scanPickerOpen} onClose={() => setScanPickerOpen(false)} />

    </Layout>
  )
}
