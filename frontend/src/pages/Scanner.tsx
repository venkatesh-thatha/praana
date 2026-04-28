import { useState, useRef } from 'react'
import { Camera, Upload, AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

interface Ingredient {
  ingredient_name: string
  category: string
  function_in_product: string
  effect_on_body: string
  daily_safe_limit: string | null
  safety_level: 'safe' | 'caution' | 'avoid'
  profile_interaction: boolean
  interaction_detail: string | null
  score_weight: number
}

interface ScanResult {
  product_name: string | null
  overall_score: 'A' | 'B' | 'C' | 'D'
  score_explanation: string
  ingredients: Ingredient[]
  drug_interactions: string[]
  critical_warnings: string[]
}

// Score badge uses design token colors — not Tailwind green/yellow/orange/red
const SCORE_STYLE: Record<string, { background: string; color: string; border: string }> = {
  A: { background: 'rgba(143,191,110,0.2)', color: '#8fbf6e', border: '2px solid rgba(143,191,110,0.5)' },
  B: { background: 'rgba(201,168,76,0.2)', color: '#c9a84c', border: '2px solid rgba(201,168,76,0.5)' },
  C: { background: 'rgba(224,128,64,0.2)', color: '#e08040', border: '2px solid rgba(224,128,64,0.5)' },
  D: { background: 'rgba(217,114,114,0.2)', color: '#d97272', border: '2px solid rgba(217,114,114,0.5)' },
}

const SAFETY_ICON: Record<string, JSX.Element> = {
  safe: <CheckCircle size={16} style={{ color: '#8fbf6e', flexShrink: 0 }} />,
  caution: <AlertCircle size={16} style={{ color: '#c9a84c', flexShrink: 0 }} />,
  avoid: <XCircle size={16} style={{ color: '#d97272', flexShrink: 0 }} />,
}

export default function ScannerPage() {
  const [scanMode, setScanMode] = useState<'food' | 'medicine'>('food')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Image too large (max 5MB)')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1]
      setPreview(e.target?.result as string)
      setLoading(true)
      setResult(null)
      setApiError(null)
      try {
        const res = await apiClient.post('/scanner/analyze', {
          image_base64: base64,
          scan_mode: scanMode,
        })
        setResult(res.data)
      } catch (err: any) {
        const detail = err.response?.data?.detail || 'Scan failed. Check your internet connection and try again.'
        setApiError(detail)
        toast.error(detail)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-8'>
        <div className='flex items-center gap-3 mb-6'>
          {/* Purple matches Dashboard module card icon color */}
          <Camera size={24} style={{ color: '#b080d0' }} />
          <h1 className='text-2xl font-bold' style={{ color: '#ede9e0' }}>Label Scanner</h1>
        </div>

        {/* Mode toggle — active uses purple tint to match page icon accent */}
        <div className='flex gap-2 mb-6'>
          {(['food', 'medicine'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setScanMode(mode); setResult(null); setPreview(null) }}
              className='flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize'
              style={
                scanMode === mode
                  ? {
                      background: 'rgba(176,128,208,0.2)',
                      border: '1px solid rgba(176,128,208,0.4)',
                      color: '#c0a0e0',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid rgba(143,191,110,0.25)',
                      color: '#7a7a6e',
                    }
              }
            >
              {mode} label
            </button>
          ))}
        </div>

        {/* Upload area */}
        <div className='card mb-6'>
          <div
            className='rounded-xl p-8 text-center cursor-pointer transition-all'
            style={{ border: '1px dashed rgba(143,191,110,0.2)' }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(143,191,110,0.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(143,191,110,0.2)')}
          >
            {preview ? (
              <img src={preview} alt='Label preview' className='max-h-48 mx-auto rounded-lg object-contain' />
            ) : (
              <>
                <Upload size={40} className='mx-auto mb-3' style={{ color: '#7a7a6e' }} />
                <p className='font-medium' style={{ color: '#ede9e0' }}>Upload {scanMode} label image</p>
                <p className='text-sm mt-1' style={{ color: '#7a7a6e' }}>JPEG, PNG, WEBP · max 5MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type='file' accept='image/*' className='hidden' onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <div className='flex gap-3 mt-4'>
            <button
              onClick={() => cameraRef.current?.click()}
              className='flex items-center gap-2 flex-1 btn-secondary justify-center text-sm'
            >
              <Camera size={16} /> Camera
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className='flex items-center gap-2 flex-1 btn-secondary justify-center text-sm'
            >
              <Upload size={16} /> Gallery
            </button>
          </div>
          <input ref={cameraRef} type='file' accept='image/*' capture='environment' className='hidden' onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {/* Error card */}
        {apiError && (
          <div className='mb-4 p-4 rounded-xl' style={{ background: 'rgba(217,114,114,0.08)', border: '1px solid rgba(217,114,114,0.25)' }}>
            <p className='text-sm font-medium mb-1' style={{ color: '#d97272' }}>Scan failed</p>
            <p className='text-xs' style={{ color: '#f0a0a0' }}>{apiError}</p>
            <p className='text-xs mt-2' style={{ color: '#7a7a6e' }}>Make sure the label is clearly visible and well-lit. Try uploading a clearer photo.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className='card text-center py-8'>
            {/* Spinner uses purple accent to match the page icon */}
            <div
              className='w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3'
              style={{ borderColor: 'rgba(176,128,208,0.2)', borderTopColor: '#b080d0' }}
            />
            <p style={{ color: '#b8d99c' }}>Analysing ingredients with AI...</p>
            <p className='text-xs mt-1' style={{ color: '#7a7a6e' }}>Checking against your health profile</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className='space-y-4'>
            {/* Score card */}
            <div className='card flex items-center gap-4'>
              <div
                className='w-16 h-16 rounded-xl flex items-center justify-center shrink-0'
                style={{
                  background: SCORE_STYLE[result.overall_score].background,
                  border: SCORE_STYLE[result.overall_score].border,
                }}
              >
                <span className='text-3xl font-bold' style={{ color: SCORE_STYLE[result.overall_score].color }}>
                  {result.overall_score}
                </span>
              </div>
              <div>
                {result.product_name && (
                  <p className='font-semibold' style={{ color: '#ede9e0' }}>{result.product_name}</p>
                )}
                <p className='text-sm' style={{ color: '#b8d99c' }}>{result.score_explanation}</p>
              </div>
            </div>

            {/* Critical warnings */}
            {result.critical_warnings?.length > 0 && (
              <div className='p-4 rounded-xl' style={{ background: 'rgba(217,114,114,0.08)', border: '1px solid rgba(217,114,114,0.25)' }}>
                {result.critical_warnings.map((w, i) => (
                  <div key={i} className='flex gap-2 items-start'>
                    <AlertTriangle size={14} className='mt-0.5 shrink-0' style={{ color: '#d97272' }} />
                    <p className='text-sm' style={{ color: '#f0a0a0' }}>{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Drug interactions — gold banner */}
            {result.drug_interactions?.length > 0 && (
              <div className='p-4 rounded-xl' style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <p className='text-sm font-medium mb-2' style={{ color: '#c9a84c' }}>Drug Interaction Alerts</p>
                {result.drug_interactions.map((w, i) => (
                  <p key={i} className='text-sm' style={{ color: '#e0c878' }}>• {w}</p>
                ))}
              </div>
            )}

            {/* Ingredients */}
            <div className='card'>
              <h3 className='font-semibold mb-3' style={{ color: '#ede9e0' }}>Ingredient Analysis</h3>
              <div className='space-y-3'>
                {result.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className='flex gap-3 py-2 last:border-0'
                    style={{ borderBottom: '1px solid rgba(143,191,110,0.08)' }}
                  >
                    {SAFETY_ICON[ing.safety_level]}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='text-sm font-medium' style={{ color: '#ede9e0' }}>{ing.ingredient_name}</p>
                        <span className='text-xs shrink-0' style={{ color: '#7a7a6e' }}>{ing.category}</span>
                      </div>
                      <p className='text-xs mt-0.5' style={{ color: '#7a7a6e' }}>{ing.effect_on_body}</p>
                      {ing.profile_interaction && ing.interaction_detail && (
                        <p className='text-xs mt-1 flex items-center gap-1' style={{ color: '#c9a84c' }}>
                          <AlertTriangle size={10} /> {ing.interaction_detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
