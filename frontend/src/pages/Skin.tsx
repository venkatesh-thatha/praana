import { useState, useRef } from 'react'
import { Scan, Upload, Camera, AlertTriangle, CheckCircle, Clock, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  self_care:        { label: 'Self-care at home', color: '#8fbf6e', bg: 'rgba(143,191,110,0.08)', border: 'rgba(143,191,110,0.25)' },
  pharmacy_otc:     { label: 'Try a pharmacy remedy', color: '#b8d99c', bg: 'rgba(143,191,110,0.08)', border: 'rgba(143,191,110,0.2)' },
  gp_within_7_days: { label: 'See a GP within 7 days', color: '#c9a84c', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)' },
  gp_urgently:      { label: 'See a doctor soon', color: '#e08040', bg: 'rgba(220,128,64,0.08)', border: 'rgba(220,128,64,0.3)' },
  emergency:        { label: 'Seek emergency care', color: '#d97272', bg: 'rgba(217,114,114,0.1)', border: 'rgba(217,114,114,0.4)' },
}

const LIKELIHOOD_CONFIG: Record<string, { color: string; bar: string }> = {
  'higher likelihood': { color: '#d97272', bar: '80%' },
  'moderate likelihood': { color: '#c9a84c', bar: '50%' },
  'lower likelihood':   { color: '#7a7a6e', bar: '25%' },
}

function FindingCard({ finding }: { finding: any }) {
  const [expanded, setExpanded] = useState(false)
  const lk = finding.likelihood?.toLowerCase() || 'moderate likelihood'
  const lkConfig = LIKELIHOOD_CONFIG[lk] || LIKELIHOOD_CONFIG['moderate likelihood']

  return (
    <div className='card card-hover'>
      <div className='flex items-start justify-between gap-3 mb-2'>
        <div className='flex-1'>
          <h3 className='font-semibold text-sm' style={{ color: '#ede9e0' }}>{finding.condition_name}</h3>
          <div className='flex items-center gap-2 mt-1.5'>
            <div className='flex-1 h-1 rounded-full' style={{ background: 'rgba(143,191,110,0.1)' }}>
              <div
                className='h-full rounded-full transition-all'
                style={{ width: lkConfig.bar, background: lkConfig.color }}
              />
            </div>
            <span className='text-xs shrink-0' style={{ color: lkConfig.color }}>{finding.likelihood}</span>
          </div>
        </div>
      </div>
      <p className='text-sm leading-relaxed' style={{ color: '#7a7a6e' }}>{finding.description}</p>
      <button
        onClick={() => setExpanded(!expanded)}
        className='flex items-center gap-1 text-xs mt-3'
        style={{ color: '#8fbf6e' }}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide details' : 'What suggests this & profile notes'}
      </button>
      {expanded && (
        <div className='mt-3 pt-3 space-y-2' style={{ borderTop: '1px solid rgba(143,191,110,0.1)' }}>
          {finding.visual_indicators && (
            <p className='text-xs' style={{ color: '#7a7a6e' }}>
              <span style={{ color: '#b8d99c' }}>Visual cues: </span>{finding.visual_indicators}
            </p>
          )}
          {finding.profile_factors && (
            <p className='text-xs' style={{ color: '#7a7a6e' }}>
              <span style={{ color: '#b8d99c' }}>Your profile: </span>{finding.profile_factors}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function SkinPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) return toast.error('Image too large (max 8MB)')
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      setPreview(dataUrl)
      setLoading(true)
      setResult(null)
      setApiError(null)
      try {
        const res = await apiClient.post('/skin/analyze', {
          image_base64: base64,
          media_type: file.type,
        })
        setResult(res.data)
      } catch (err: any) {
        const detail = err.response?.data?.detail || 'Analysis failed. Try again with a clearer photo.'
        setApiError(detail)
        toast.error(detail)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const urgencyConfig = result?.urgency ? URGENCY_CONFIG[result.urgency] : null

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-8'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center' style={{ background: 'rgba(255,160,100,0.1)' }}>
            <Scan size={18} style={{ color: '#e09050' }} />
          </div>
          <div>
            <h1 className='text-2xl font-bold font-display' style={{ color: '#ede9e0' }}>Skin Analyser</h1>
            <p className='text-xs' style={{ color: '#7a7a6e' }}>AI-assisted skin condition assessment</p>
          </div>
        </div>

        <div className='mt-2 mb-6 p-3 rounded-xl' style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
          <p className='text-xs' style={{ color: '#c9a84c' }}>
            For initial guidance only. Not a medical diagnosis. Always consult a dermatologist for proper evaluation.
          </p>
        </div>

        {/* Upload area */}
        <div
          className='card mb-6 cursor-pointer transition-all duration-200'
          style={{ border: isDragging ? '1px dashed rgba(143,191,110,0.5)' : '1px dashed rgba(143,191,110,0.2)' }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className='p-6 text-center'>
            {preview ? (
              <img src={preview} alt='Skin preview' className='max-h-52 mx-auto rounded-xl object-contain' />
            ) : (
              <>
                <div className='w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3' style={{ background: 'rgba(255,160,100,0.08)' }}>
                  <Upload size={24} style={{ color: '#e09050' }} />
                </div>
                <p className='font-medium mb-1' style={{ color: '#ede9e0' }}>Upload a photo of the skin area</p>
                <p className='text-sm' style={{ color: '#7a7a6e' }}>Clear, well-lit photo · JPEG, PNG, WEBP · max 8MB</p>
              </>
            )}
          </div>
          <div className='flex gap-3 px-4 pb-4'>
            <button
              onClick={(e) => { e.stopPropagation(); cameraRef.current?.click() }}
              className='btn-secondary flex items-center gap-2 flex-1 justify-center text-sm py-2'
            >
              <Camera size={15} /> Camera
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
              className='btn-secondary flex items-center gap-2 flex-1 justify-center text-sm py-2'
            >
              <Upload size={15} /> Gallery
            </button>
          </div>
        </div>
        <input ref={fileRef} type='file' accept='image/*' className='hidden' onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input ref={cameraRef} type='file' accept='image/*' capture='environment' className='hidden' onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {/* Error */}
        {apiError && (
          <div className='mb-4 p-4 rounded-xl' style={{ background: 'rgba(217,114,114,0.08)', border: '1px solid rgba(217,114,114,0.3)' }}>
            <p className='text-sm font-medium' style={{ color: '#d97272' }}>Analysis failed</p>
            <p className='text-xs mt-1' style={{ color: '#7a7a6e' }}>{apiError}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className='card text-center py-10'>
            <div className='w-10 h-10 rounded-full border-2 border-t-[#e09050] mx-auto mb-4 animate-spin' style={{ borderColor: 'rgba(224,144,80,0.2)', borderTopColor: '#e09050' }} />
            <p className='font-medium' style={{ color: '#ede9e0' }}>Analysing skin condition...</p>
            <p className='text-sm mt-1' style={{ color: '#7a7a6e' }}>Cross-referencing your health profile</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className='space-y-4'>

            {/* Urgency banner */}
            {urgencyConfig && (
              <div className='p-4 rounded-xl flex items-center gap-3' style={{ background: urgencyConfig.bg, border: `1px solid ${urgencyConfig.border}` }}>
                {result.urgency === 'self_care' || result.urgency === 'pharmacy_otc'
                  ? <CheckCircle size={18} style={{ color: urgencyConfig.color }} />
                  : result.urgency === 'emergency'
                  ? <AlertTriangle size={18} style={{ color: urgencyConfig.color }} />
                  : <Clock size={18} style={{ color: urgencyConfig.color }} />
                }
                <div>
                  <p className='font-semibold text-sm' style={{ color: urgencyConfig.color }}>{urgencyConfig.label}</p>
                  {result.urgency_reason && <p className='text-xs mt-0.5' style={{ color: '#7a7a6e' }}>{result.urgency_reason}</p>}
                </div>
              </div>
            )}

            {/* Overall assessment */}
            {result.overall_assessment && (
              <div className='card'>
                <h3 className='font-semibold text-sm mb-2' style={{ color: '#ede9e0' }}>Overall Assessment</h3>
                <p className='text-sm leading-relaxed' style={{ color: '#b8d99c' }}>{result.overall_assessment}</p>
              </div>
            )}

            {/* Findings */}
            {result.findings?.length > 0 && (
              <div>
                <p className='text-xs font-medium mb-3 tracking-wide uppercase' style={{ color: 'rgba(143,191,110,0.5)' }}>Possible conditions</p>
                <div className='space-y-3'>
                  {result.findings.map((f: any, i: number) => (
                    <FindingCard key={i} finding={f} />
                  ))}
                </div>
              </div>
            )}

            {/* Profile-specific notes */}
            {result.profile_specific_notes && (
              <div className='p-4 rounded-xl' style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                <p className='text-xs font-medium mb-1' style={{ color: '#c9a84c' }}>Your health profile notes</p>
                <p className='text-sm' style={{ color: '#7a7a6e' }}>{result.profile_specific_notes}</p>
              </div>
            )}

            {/* OTC suggestions */}
            {result.otc_suggestions?.length > 0 && (
              <div className='card'>
                <div className='flex items-center gap-2 mb-3'>
                  <ShoppingBag size={15} style={{ color: '#8fbf6e' }} />
                  <h3 className='font-semibold text-sm' style={{ color: '#ede9e0' }}>Pharmacy options to try</h3>
                </div>
                <div className='space-y-3'>
                  {result.otc_suggestions.map((otc: any, i: number) => (
                    <div key={i} className='pb-3 last:pb-0' style={{ borderBottom: i < result.otc_suggestions.length - 1 ? '1px solid rgba(143,191,110,0.08)' : 'none' }}>
                      <div className='flex items-center justify-between mb-1'>
                        <p className='text-sm font-medium' style={{ color: '#ede9e0' }}>{otc.product_type}</p>
                        <span className='text-xs px-2 py-0.5 rounded-full' style={{ background: 'rgba(143,191,110,0.1)', color: '#8fbf6e' }}>{otc.active_ingredient}</span>
                      </div>
                      {otc.indian_brand_example && (
                        <p className='text-xs' style={{ color: '#7a7a6e' }}>Example: {otc.indian_brand_example}</p>
                      )}
                      <p className='text-xs mt-1' style={{ color: '#7a7a6e' }}>{otc.how_to_use}</p>
                      {otc.when_to_stop && (
                        <p className='text-xs mt-1' style={{ color: '#d97272' }}>Stop if: {otc.when_to_stop}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Red flags */}
            {result.when_to_see_doctor_immediately?.length > 0 && (
              <div className='p-4 rounded-xl' style={{ background: 'rgba(217,114,114,0.06)', border: '1px solid rgba(217,114,114,0.2)' }}>
                <p className='text-xs font-medium mb-2' style={{ color: '#d97272' }}>See a doctor immediately if you notice:</p>
                {result.when_to_see_doctor_immediately.map((flag: string, i: number) => (
                  <p key={i} className='text-xs flex gap-2 mt-1' style={{ color: '#7a7a6e' }}>
                    <span style={{ color: '#d97272' }}>•</span> {flag}
                  </p>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <p className='text-xs text-center' style={{ color: 'rgba(122,122,110,0.5)' }}>
              {result.disclaimer}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
