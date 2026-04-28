import { useState, useEffect } from 'react'
import { Leaf, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Herb {
  id: string
  name: string
  hindi: string
  emoji: string
  tagline: string
  benefits: string[]
  conditions: string[]
}

interface Remedy {
  title: string
  ingredients: string[]
  preparation: string
  benefits: string
  why_for_you: string
  frequency: string
  caution: string | null
}

interface RemediesResult {
  remedies: Remedy[]
  general_note: string
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function HerbCard({ herb }: { herb: Herb }) {
  // Show first 3 benefits as pills to keep the card compact
  const visibleBenefits = herb.benefits.slice(0, 3)

  return (
    <div
      className='card card-hover p-3 flex flex-col gap-2'
      style={{ background: 'rgba(143,191,110,0.04)', border: '1px solid rgba(143,191,110,0.08)' }}
    >
      <div className='flex items-start gap-2'>
        <span style={{ fontSize: '32px', lineHeight: 1 }} aria-hidden='true'>{herb.emoji}</span>
        <div className='min-w-0'>
          <p className='text-sm font-semibold leading-tight' style={{ color: '#ede9e0' }}>{herb.name}</p>
          <p className='text-xs' style={{ color: '#7a7a6e' }}>{herb.hindi}</p>
          <p className='text-xs italic mt-0.5 leading-snug' style={{ color: '#7a7a6e' }}>{herb.tagline}</p>
        </div>
      </div>
      <div className='flex flex-wrap gap-1'>
        {visibleBenefits.map((b) => (
          <span
            key={b}
            className='text-xs px-2 py-0.5 rounded-full'
            style={{ background: 'rgba(143,191,110,0.1)', color: '#8fbf6e' }}
          >
            {b}
          </span>
        ))}
      </div>
    </div>
  )
}

function RemedyCard({ remedy }: { remedy: Remedy }) {
  const [prepOpen, setPrepOpen] = useState(false)

  return (
    <div className='card animate-fade-up'>
      {/* Title */}
      <h3 className='text-base font-semibold mb-3' style={{ color: '#ede9e0' }}>{remedy.title}</h3>

      {/* Why for you */}
      <div
        className='rounded-xl p-3 mb-3'
        style={{ background: 'rgba(143,191,110,0.06)', border: '1px solid rgba(143,191,110,0.12)' }}
      >
        <p className='text-xs font-medium mb-0.5' style={{ color: '#8fbf6e' }}>Why this for you</p>
        <p className='text-xs leading-relaxed' style={{ color: '#b8d99c' }}>{remedy.why_for_you}</p>
      </div>

      {/* Ingredients */}
      <div className='mb-3'>
        <p className='text-xs font-medium mb-1.5' style={{ color: 'rgba(143,191,110,0.5)' }}>INGREDIENTS</p>
        <div className='flex flex-wrap gap-1.5'>
          {remedy.ingredients.map((ing) => (
            <span
              key={ing}
              className='text-xs px-2.5 py-1 rounded-full'
              style={{ background: 'rgba(143,191,110,0.08)', color: '#ede9e0' }}
            >
              {ing}
            </span>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <p className='text-xs leading-relaxed mb-3' style={{ color: '#7a7a6e' }}>{remedy.benefits}</p>

      {/* Preparation — collapsible */}
      <button
        onClick={() => setPrepOpen(!prepOpen)}
        className='flex items-center gap-1 text-xs mb-2'
        style={{ color: '#8fbf6e' }}
      >
        {prepOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {prepOpen ? 'Hide preparation' : 'How to prepare'}
      </button>
      {prepOpen && (
        <p
          className='text-xs leading-relaxed mb-3 pl-1'
          style={{ color: '#7a7a6e', borderLeft: '2px solid rgba(143,191,110,0.2)', paddingLeft: '10px' }}
        >
          {remedy.preparation}
        </p>
      )}

      {/* Frequency badge */}
      <div className='flex items-center gap-2 mb-2'>
        <Clock size={12} style={{ color: '#c9a84c' }} />
        <span className='text-xs' style={{ color: '#c9a84c' }}>{remedy.frequency}</span>
      </div>

      {/* Caution */}
      {remedy.caution && (
        <div
          className='flex items-start gap-2 rounded-xl p-2.5 mt-1'
          style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <AlertTriangle size={12} className='shrink-0 mt-0.5' style={{ color: '#c9a84c' }} />
          <p className='text-xs leading-relaxed' style={{ color: '#c9a84c' }}>{remedy.caution}</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HerbsPage() {
  const [herbs, setHerbs] = useState<Herb[]>([])
  const [herbsLoading, setHerbsLoading] = useState(true)
  const [remediesResult, setRemediesResult] = useState<RemediesResult | null>(null)
  const [remediesLoading, setRemediesLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Load the static library on mount
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await apiClient.get('/herbs/library')
        setHerbs(res.data.herbs ?? [])
      } catch {
        toast.error('Failed to load herb library')
      } finally {
        setHerbsLoading(false)
      }
    }
    fetchLibrary()
  }, [])

  const handleGenerateRemedies = async () => {
    // Always fetch fresh — no caching
    setRemediesResult(null)
    setApiError(null)
    setRemediesLoading(true)
    try {
      const res = await apiClient.get('/herbs/remedies')
      setRemediesResult(res.data)
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Could not generate remedies. Please try again.'
      setApiError(detail)
      toast.error(detail)
    } finally {
      setRemediesLoading(false)
    }
  }

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-8'>

        {/* Page header */}
        <div className='flex items-center gap-3 mb-6'>
          <div
            className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0'
            style={{ background: 'rgba(143,191,110,0.1)' }}
          >
            <Leaf size={18} style={{ color: '#8fbf6e' }} />
          </div>
          <div>
            <h1 className='text-2xl font-bold font-display' style={{ color: '#ede9e0' }}>
              Herbs &amp; Remedies
            </h1>
            <p className='text-xs' style={{ color: '#7a7a6e' }}>
              Traditional Indian wisdom, cross-referenced with your health profile
            </p>
          </div>
        </div>

        {/* ── Section 1: Herb Library ──────────────────────────────────── */}
        <p
          className='text-xs font-medium tracking-widest uppercase mb-3'
          style={{ color: 'rgba(143,191,110,0.5)' }}
        >
          Indian Medicine Cabinet
        </p>

        {herbsLoading ? (
          // Skeleton grid
          <div className='grid grid-cols-2 gap-3 mb-8'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='rounded-2xl p-3 h-28 shimmer'
                style={{ background: 'rgba(143,191,110,0.04)', border: '1px solid rgba(143,191,110,0.08)' }}
              />
            ))}
          </div>
        ) : herbs.length === 0 ? (
          <p className='text-sm mb-8' style={{ color: '#7a7a6e' }}>No herbs available.</p>
        ) : (
          <div className='grid grid-cols-2 gap-3 mb-8'>
            {herbs.map((herb) => (
              <HerbCard key={herb.id} herb={herb} />
            ))}
          </div>
        )}

        {/* ── Section 2: AI Personalized Remedies ─────────────────────── */}
        <p
          className='text-xs font-medium tracking-widest uppercase mb-3'
          style={{ color: 'rgba(143,191,110,0.5)' }}
        >
          Remedies For You
        </p>

        <button
          onClick={handleGenerateRemedies}
          disabled={remediesLoading}
          className='btn-primary w-full mb-5'
        >
          {remediesLoading ? 'Generating...' : 'Generate my remedies'}
        </button>

        {/* Loading state */}
        {remediesLoading && (
          <div className='card text-center py-10 mb-4'>
            <div
              className='w-10 h-10 rounded-full border-2 mx-auto mb-4 animate-spin'
              style={{ borderColor: 'rgba(143,191,110,0.2)', borderTopColor: '#8fbf6e' }}
            />
            <p className='font-medium' style={{ color: '#ede9e0' }}>
              Checking your profile for suitable remedies...
            </p>
            <p className='text-sm mt-1' style={{ color: '#7a7a6e' }}>
              Cross-referencing conditions, medications, and nutritional needs
            </p>
          </div>
        )}

        {/* Error state */}
        {apiError && !remediesLoading && (
          <div
            className='mb-4 p-4 rounded-xl'
            style={{ background: 'rgba(217,114,114,0.08)', border: '1px solid rgba(217,114,114,0.3)' }}
          >
            <p className='text-sm font-medium' style={{ color: '#d97272' }}>Generation failed</p>
            <p className='text-xs mt-1' style={{ color: '#7a7a6e' }}>{apiError}</p>
          </div>
        )}

        {/* Remedy cards */}
        {remediesResult && !remediesLoading && (
          <div className='space-y-4'>
            {remediesResult.remedies.map((remedy, i) => (
              <RemedyCard key={`${remedy.title}-${i}`} remedy={remedy} />
            ))}

            {/* General disclaimer */}
            {remediesResult.general_note && (
              <p
                className='text-xs text-center pt-2'
                style={{ color: 'rgba(122,122,110,0.5)' }}
              >
                {remediesResult.general_note}
              </p>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}
