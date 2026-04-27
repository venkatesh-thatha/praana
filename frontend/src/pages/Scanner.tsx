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

const SCORE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-400' },
  B: { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-400' },
  C: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-400' },
  D: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-400' },
}

const SAFETY_ICON: Record<string, JSX.Element> = {
  safe: <CheckCircle className='text-green-400 shrink-0' size={16} />,
  caution: <AlertCircle className='text-amber-400 shrink-0' size={16} />,
  avoid: <XCircle className='text-red-400 shrink-0' size={16} />,
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
          <Camera className='text-purple-400' size={24} />
          <h1 className='text-2xl font-bold text-white'>Label Scanner</h1>
        </div>

        {/* Mode toggle */}
        <div className='flex gap-2 mb-6'>
          {(['food', 'medicine'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setScanMode(mode); setResult(null); setPreview(null) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                scanMode === mode ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {mode} label
            </button>
          ))}
        </div>

        {/* Upload area */}
        <div className='card mb-6'>
          <div
            className='border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors'
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt='Label preview' className='max-h-48 mx-auto rounded-lg object-contain' />
            ) : (
              <>
                <Upload className='text-slate-400 mx-auto mb-3' size={40} />
                <p className='text-slate-300 font-medium'>Upload {scanMode} label image</p>
                <p className='text-slate-500 text-sm mt-1'>JPEG, PNG, WEBP · max 5MB</p>
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
          <div className='mb-4 p-4 bg-red-900/30 border border-red-700/50 rounded-xl'>
            <p className='text-sm font-medium text-red-300 mb-1'>Scan failed</p>
            <p className='text-xs text-red-200'>{apiError}</p>
            <p className='text-xs text-slate-400 mt-2'>Make sure the label is clearly visible and well-lit. Try uploading a clearer photo.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className='card text-center py-8'>
            <div className='w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-3' />
            <p className='text-slate-300'>Analysing ingredients with AI...</p>
            <p className='text-slate-500 text-xs mt-1'>Checking against your health profile</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className='space-y-4'>
            {/* Score card */}
            <div className='card flex items-center gap-4'>
              <div className={`w-16 h-16 rounded-xl ${SCORE_STYLE[result.overall_score].bg} flex items-center justify-center shrink-0`}>
                <span className='text-3xl font-bold text-white'>{result.overall_score}</span>
              </div>
              <div>
                {result.product_name && <p className='font-semibold text-white'>{result.product_name}</p>}
                <p className='text-sm text-slate-300'>{result.score_explanation}</p>
              </div>
            </div>

            {/* Critical warnings */}
            {result.critical_warnings?.length > 0 && (
              <div className='p-4 bg-red-900/30 border border-red-700/50 rounded-xl'>
                {result.critical_warnings.map((w, i) => (
                  <div key={i} className='flex gap-2 items-start'>
                    <AlertTriangle className='text-red-400 shrink-0 mt-0.5' size={14} />
                    <p className='text-sm text-red-200'>{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Drug interactions */}
            {result.drug_interactions?.length > 0 && (
              <div className='p-4 bg-orange-900/30 border border-orange-700/50 rounded-xl'>
                <p className='text-sm font-medium text-orange-300 mb-2'>Drug Interaction Alerts</p>
                {result.drug_interactions.map((w, i) => (
                  <p key={i} className='text-sm text-orange-200'>• {w}</p>
                ))}
              </div>
            )}

            {/* Ingredients */}
            <div className='card'>
              <h3 className='font-semibold text-white mb-3'>Ingredient Analysis</h3>
              <div className='space-y-3'>
                {result.ingredients.map((ing, i) => (
                  <div key={i} className='flex gap-3 py-2 border-b border-slate-700/50 last:border-0'>
                    {SAFETY_ICON[ing.safety_level]}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='text-sm font-medium text-white'>{ing.ingredient_name}</p>
                        <span className='text-xs text-slate-500 shrink-0'>{ing.category}</span>
                      </div>
                      <p className='text-xs text-slate-400 mt-0.5'>{ing.effect_on_body}</p>
                      {ing.profile_interaction && ing.interaction_detail && (
                        <p className='text-xs text-amber-300 mt-1 flex items-center gap-1'>
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
