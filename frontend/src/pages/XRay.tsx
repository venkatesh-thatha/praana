import { useState, useRef } from 'react'
import { Layers, Upload, Camera, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'
import toast from 'react-hot-toast'

const SIGNIFICANCE_CONFIG: Record<string, { color: string; bg: string }> = {
  normal:                   { color: '#8fbf6e', bg: 'rgba(143,191,110,0.08)' },
  within_normal_variation:  { color: '#b8d99c', bg: 'rgba(143,191,110,0.06)' },
  notable:                  { color: '#c9a84c', bg: 'rgba(201,168,76,0.08)' },
  concerning:               { color: '#d97272', bg: 'rgba(217,114,114,0.08)' },
}

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  routine:         { label: 'Routine follow-up', color: '#8fbf6e', bg: 'rgba(143,191,110,0.08)', border: 'rgba(143,191,110,0.25)', Icon: CheckCircle },
  within_2_weeks:  { label: 'Follow up within 2 weeks', color: '#b8d99c', bg: 'rgba(143,191,110,0.08)', border: 'rgba(143,191,110,0.2)', Icon: Clock },
  soon:            { label: 'See a doctor soon', color: '#c9a84c', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)', Icon: Clock },
  urgent:          { label: 'Seek urgent attention', color: '#d97272', bg: 'rgba(217,114,114,0.1)', border: 'rgba(217,114,114,0.4)', Icon: AlertTriangle },
}

function FindingCard({ finding }: { finding: any }) {
  const [expanded, setExpanded] = useState(false)
  const sigConfig = SIGNIFICANCE_CONFIG[finding.significance] || SIGNIFICANCE_CONFIG['normal']
  const density = finding.density_assessment?.visual_density

  return (
    <div className='card card-hover'>
      <div className='flex items-start justify-between gap-3 mb-2'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold text-sm' style={{ color: '#ede9e0' }}>{finding.structure}</h3>
            <span className='text-xs px-2 py-0.5 rounded-full' style={{ background: sigConfig.bg, color: sigConfig.color }}>
              {finding.significance?.replace(/_/g, ' ')}
            </span>
          </div>
          {density !== undefined && (
            <div className='flex items-center gap-2 mt-2'>
              <span className='text-xs' style={{ color: '#7a7a6e' }}>Density</span>
              <div className='flex-1 h-1.5 rounded-full' style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className='h-full rounded-full'
                  style={{ width: `${density * 100}%`, background: `rgba(143,191,110,${0.3 + density * 0.7})` }}
                />
              </div>
              <span className='text-xs font-mono' style={{ color: '#b8d99c' }}>{density.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
      <p className='text-sm leading-relaxed' style={{ color: '#7a7a6e' }}>{finding.plain_interpretation}</p>
      {finding.observation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className='flex items-center gap-1 text-xs mt-3'
          style={{ color: '#8fbf6e' }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide observation' : 'Show visual observation'}
        </button>
      )}
      {expanded && finding.observation && (
        <p className='mt-2 pt-2 text-xs' style={{ color: '#7a7a6e', borderTop: '1px solid rgba(143,191,110,0.1)' }}>
          <span style={{ color: '#b8d99c' }}>Observation: </span>{finding.observation}
        </p>
      )}
    </div>
  )
}

export default function XRayPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast.error('File too large (max 10MB)')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      if (file.type.startsWith('image/')) setPreview(dataUrl)
      setLoading(true)
      setResult(null)
      setApiError(null)
      try {
        const res = await apiClient.post('/xray/analyze', {
          image_base64: base64,
          media_type: file.type,
        })
        setResult(res.data)
      } catch (err: any) {
        const detail = err.response?.data?.detail || 'Analysis failed. Try a clearer image.'
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

  const urgencyConfig = result?.follow_up_urgency ? URGENCY_CONFIG[result.follow_up_urgency] : null

  return (
    <Layout>
      <div className='max-w-2xl mx-auto px-4 py-8'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center' style={{ background: 'rgba(128,144,208,0.12)' }}>
            <Layers size={18} style={{ color: '#8090d0' }} />
          </div>
          <div>
            <h1 className='text-2xl font-bold font-display' style={{ color: '#ede9e0' }}>X-Ray Analyser</h1>
            <p className='text-xs' style={{ color: '#7a7a6e' }}>AI-assisted radiological description</p>
          </div>
        </div>

        <div className='mt-2 mb-6 p-3 rounded-xl' style={{ background: 'rgba(128,144,208,0.06)', border: '1px solid rgba(128,144,208,0.15)' }}>
          <p className='text-xs' style={{ color: '#8090d0' }}>
            This provides a visual description of your X-ray, not a formal radiological report. Always obtain an official report from a qualified radiologist.
          </p>
        </div>

        {/* Upload area */}
        <div
          className='card mb-6 cursor-pointer transition-all duration-200'
          style={{ border: isDragging ? '1px dashed rgba(128,144,208,0.6)' : '1px dashed rgba(128,144,208,0.25)' }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className='p-6 text-center'>
            {preview ? (
              <img src={preview} alt='X-ray preview' className='max-h-52 mx-auto rounded-xl object-contain' style={{ filter: 'invert(0.05)' }} />
            ) : (
              <>
                <div className='w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3' style={{ background: 'rgba(128,144,208,0.1)' }}>
                  <Layers size={28} style={{ color: '#8090d0' }} />
                </div>
                <p className='font-medium mb-1' style={{ color: '#ede9e0' }}>Upload your X-ray image or PDF</p>
                <p className='text-sm' style={{ color: '#7a7a6e' }}>JPEG, PNG, WEBP or PDF · max 10MB</p>
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
              <Upload size={15} /> Upload
            </button>
          </div>
        </div>
        <input ref={fileRef} type='file' accept='image/*,application/pdf' className='hidden' onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
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
            <div className='w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4' style={{ borderColor: 'rgba(128,144,208,0.2)', borderTopColor: '#8090d0' }} />
            <p className='font-medium' style={{ color: '#ede9e0' }}>Analysing X-ray...</p>
            <p className='text-sm mt-1' style={{ color: '#7a7a6e' }}>Describing structures and cross-referencing your profile</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className='space-y-4'>

            {/* Region + image quality */}
            <div className='flex items-center gap-3'>
              {result.region_analyzed && (
                <span className='text-xs px-3 py-1 rounded-full capitalize font-medium' style={{ background: 'rgba(128,144,208,0.1)', color: '#8090d0' }}>
                  {result.region_analyzed.replace(/_/g, ' ')} X-ray
                </span>
              )}
              {result.image_quality && result.image_quality !== 'good' && (
                <span className='text-xs px-3 py-1 rounded-full' style={{ background: 'rgba(201,168,76,0.08)', color: '#c9a84c' }}>
                  Image quality: {result.image_quality}
                </span>
              )}
            </div>

            {/* Urgency */}
            {urgencyConfig && (
              <div className='p-4 rounded-xl flex items-center gap-3' style={{ background: urgencyConfig.bg, border: `1px solid ${urgencyConfig.border}` }}>
                <urgencyConfig.Icon size={18} style={{ color: urgencyConfig.color }} />
                <p className='font-semibold text-sm' style={{ color: urgencyConfig.color }}>{urgencyConfig.label}</p>
              </div>
            )}

            {/* Overall impression */}
            {result.overall_impression && (
              <div className='card'>
                <h3 className='font-semibold text-sm mb-2' style={{ color: '#ede9e0' }}>Overall Impression</h3>
                <p className='text-sm leading-relaxed' style={{ color: '#b8d99c' }}>{result.overall_impression}</p>
              </div>
            )}

            {/* Key observations */}
            {result.key_observations?.length > 0 && (
              <div className='card'>
                <h3 className='font-semibold text-sm mb-3' style={{ color: '#ede9e0' }}>Key Observations</h3>
                <ul className='space-y-2'>
                  {result.key_observations.map((obs: string, i: number) => (
                    <li key={i} className='text-sm flex gap-2' style={{ color: '#7a7a6e' }}>
                      <span style={{ color: '#8090d0' }}>•</span> {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structure findings */}
            {result.findings?.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-3'>
                  <p className='text-xs font-medium tracking-wide uppercase' style={{ color: 'rgba(128,144,208,0.6)' }}>Structure analysis</p>
                  <div className='flex items-center gap-1 text-xs' style={{ color: '#7a7a6e' }}>
                    <HelpCircle size={10} />
                    <span>Density: 0.0 (air) → 1.0 (bone/metal)</span>
                  </div>
                </div>
                <div className='space-y-3'>
                  {result.findings.map((f: any, i: number) => (
                    <FindingCard key={i} finding={f} />
                  ))}
                </div>
              </div>
            )}

            {/* Profile correlation */}
            {result.profile_correlation && (
              <div className='p-4 rounded-xl' style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                <p className='text-xs font-medium mb-1' style={{ color: '#c9a84c' }}>Your health profile</p>
                <p className='text-sm' style={{ color: '#7a7a6e' }}>{result.profile_correlation}</p>
              </div>
            )}

            {/* Questions for radiologist */}
            {result.questions_for_radiologist?.length > 0 && (
              <div className='card'>
                <h3 className='font-semibold text-sm mb-3' style={{ color: '#ede9e0' }}>Ask your radiologist / doctor</h3>
                <ul className='space-y-2'>
                  {result.questions_for_radiologist.map((q: string, i: number) => (
                    <li key={i} className='text-sm flex gap-2' style={{ color: '#7a7a6e' }}>
                      <span style={{ color: '#8fbf6e' }}>{i + 1}.</span> {q}
                    </li>
                  ))}
                </ul>
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
