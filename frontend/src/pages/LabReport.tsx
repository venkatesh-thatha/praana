import { useCallback, useRef, useState } from 'react'
import {
  FlaskConical, Upload, Loader2, AlertTriangle, CheckCircle2,
  AlertCircle, Info, X,
} from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/api/client'

interface TestResult {
  test_name: string
  value: string
  reference_range: string
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high'
  plain_explanation: string
  profile_relevance: string | null
}

interface LabAnalysis {
  report_summary: string
  tests_extracted: TestResult[]
  flagged_tests: string[]
  critical_alerts: string[]
  talk_to_doctor_about: string[]
  overall_assessment: 'normal' | 'some_concerns' | 'needs_attention' | 'urgent'
  disclaimer: string
}

const STATUS_STYLES: Record<string, { label: string; bg: string; border: string; color: string }> = {
  normal: { label: 'Normal', bg: 'rgba(143,191,110,0.1)', border: 'rgba(143,191,110,0.25)', color: '#8fbf6e' },
  low: { label: 'Low', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)', color: '#c9a84c' },
  high: { label: 'High', bg: 'rgba(217,114,114,0.1)', border: 'rgba(217,114,114,0.25)', color: '#d97272' },
  critical_low: { label: 'Critical Low', bg: 'rgba(217,114,114,0.18)', border: 'rgba(217,114,114,0.4)', color: '#e88080' },
  critical_high: { label: 'Critical High', bg: 'rgba(217,114,114,0.18)', border: 'rgba(217,114,114,0.4)', color: '#e88080' },
}

const ASSESSMENT_STYLES: Record<string, { label: string; bg: string; border: string; color: string }> = {
  normal: { label: 'All Clear', bg: 'rgba(143,191,110,0.1)', border: 'rgba(143,191,110,0.25)', color: '#8fbf6e' },
  some_concerns: { label: 'Some Concerns', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)', color: '#c9a84c' },
  needs_attention: { label: 'Needs Attention', bg: 'rgba(217,114,114,0.12)', border: 'rgba(217,114,114,0.3)', color: '#d97272' },
  urgent: { label: 'Urgent', bg: 'rgba(217,114,114,0.2)', border: 'rgba(217,114,114,0.45)', color: '#e88080' },
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function TestCard({ test }: { test: TestResult }) {
  const style = STATUS_STYLES[test.status] ?? STATUS_STYLES.normal
  return (
    <div className='card p-4 space-y-2'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='font-semibold text-sm' style={{ color: '#ede9e0' }}>{test.test_name}</p>
          <p className='text-sm font-mono tabular-nums mt-0.5' style={{ color: '#b8d99c' }}>{test.value}</p>
        </div>
        <span
          className='shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border'
          style={{ background: style.bg, borderColor: style.border, color: style.color }}
        >
          {style.label}
        </span>
      </div>
      <p className='text-xs' style={{ color: '#7a7a6e' }}>
        Ref: <span style={{ color: 'rgba(237,233,224,0.5)' }}>{test.reference_range}</span>
      </p>
      <p className='text-xs leading-relaxed' style={{ color: '#7a7a6e' }}>{test.plain_explanation}</p>
      {test.profile_relevance && (
        <div
          className='rounded-lg p-2.5 text-xs'
          style={{
            background: 'rgba(201,168,76,0.07)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: 'rgba(201,168,76,0.85)',
          }}
        >
          <span className='font-semibold'>Your profile: </span>
          {test.profile_relevance}
        </div>
      )}
    </div>
  )
}

export default function LabReportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<LabAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError('Please upload an image (JPG, PNG) or PDF file.')
      return
    }
    setFile(f)
    setAnalysis(null)
    setError(null)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (picked) handleFile(picked)
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setAnalysis(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const base64 = await fileToBase64(file)
      const res = await apiClient.post('/lab-report/analyze', {
        image_base64: base64,
        media_type: file.type,
      })
      setAnalysis(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const assessment = analysis ? ASSESSMENT_STYLES[analysis.overall_assessment] : null

  return (
    <Layout>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 py-8'>

        {/* Header */}
        <div className='mb-8 animate-slide-up'>
          <div className='flex items-center gap-3 mb-2'>
            <div
              className='w-10 h-10 rounded-xl flex items-center justify-center'
              style={{ background: 'rgba(143,191,110,0.12)' }}
            >
              <FlaskConical size={20} style={{ color: '#8fbf6e' }} />
            </div>
            <h1 className='text-2xl sm:text-3xl font-bold font-display' style={{ color: '#ede9e0' }}>
              Lab Report Analysis
            </h1>
          </div>
          <p className='text-sm leading-relaxed mt-2' style={{ color: '#7a7a6e' }}>
            Upload a photo or scan of your blood test report. Get plain-language explanations personalized to your health profile.
          </p>
        </div>

        {/* Upload zone */}
        {!analysis && (
          <div className='animate-fade-up'>
            <input
              ref={inputRef}
              type='file'
              accept='image/*,application/pdf'
              className='hidden'
              onChange={onInputChange}
              id='lab-upload'
            />

            {!file ? (
              <label
                htmlFor='lab-upload'
                className='block cursor-pointer rounded-2xl p-10 text-center transition-all duration-300'
                style={{
                  border: `2px dashed ${dragging ? 'rgba(143,191,110,0.5)' : 'rgba(143,191,110,0.18)'}`,
                  background: dragging ? 'rgba(143,191,110,0.04)' : 'rgba(16,20,18,0.6)',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <div
                  className='w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center'
                  style={{ background: 'rgba(143,191,110,0.1)' }}
                >
                  <Upload size={28} style={{ color: '#8fbf6e' }} />
                </div>
                <p className='font-semibold mb-1' style={{ color: '#ede9e0' }}>
                  Drag & drop or click to upload
                </p>
                <p className='text-sm' style={{ color: '#7a7a6e' }}>
                  Supports JPG, PNG, and PDF lab reports
                </p>
              </label>
            ) : (
              <div
                className='rounded-2xl p-5'
                style={{
                  border: '1px solid rgba(143,191,110,0.15)',
                  background: 'rgba(16,20,18,0.8)',
                }}
              >
                <div className='flex items-start gap-4'>
                  {preview ? (
                    <img
                      src={preview}
                      alt='Lab report preview'
                      className='w-24 h-24 rounded-xl object-cover shrink-0'
                      style={{ border: '1px solid rgba(143,191,110,0.1)' }}
                    />
                  ) : (
                    <div
                      className='w-24 h-24 rounded-xl shrink-0 flex flex-col items-center justify-center gap-1'
                      style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.12)' }}
                    >
                      <FlaskConical size={24} style={{ color: '#c9a84c' }} />
                      <span className='text-xs font-medium' style={{ color: '#c9a84c' }}>PDF</span>
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-sm truncate mb-1' style={{ color: '#ede9e0' }}>{file.name}</p>
                    <p className='text-xs mb-4' style={{ color: '#7a7a6e' }}>
                      {(file.size / 1024).toFixed(1)} KB · {file.type}
                    </p>
                    <div className='flex gap-3'>
                      <button
                        onClick={analyze}
                        disabled={loading}
                        className='btn-primary flex items-center gap-2 text-sm px-4 py-2'
                      >
                        {loading ? (
                          <><Loader2 size={15} className='animate-spin' /> Analyzing…</>
                        ) : (
                          <><FlaskConical size={15} /> Analyze Report</>
                        )}
                      </button>
                      <button
                        onClick={clearFile}
                        disabled={loading}
                        className='btn-secondary flex items-center gap-1.5 text-sm px-3 py-2'
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className='mt-4 rounded-xl p-4 flex items-start gap-3'
            style={{ background: 'rgba(217,114,114,0.08)', border: '1px solid rgba(217,114,114,0.2)' }}
          >
            <AlertCircle size={16} style={{ color: '#d97272' }} className='mt-0.5 shrink-0' />
            <p className='text-sm' style={{ color: '#d97272' }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className='mt-6 space-y-6 animate-fade-up'>

            {/* Reset button */}
            <button onClick={clearFile} className='btn-secondary flex items-center gap-2 text-sm'>
              <Upload size={14} /> Upload another report
            </button>

            {/* Critical alerts */}
            {analysis.critical_alerts.length > 0 && (
              <div
                className='rounded-xl p-4 space-y-2'
                style={{ background: 'rgba(217,114,114,0.1)', border: '1px solid rgba(217,114,114,0.3)' }}
              >
                <div className='flex items-center gap-2 mb-3'>
                  <AlertTriangle size={16} style={{ color: '#d97272' }} />
                  <p className='font-semibold text-sm' style={{ color: '#d97272' }}>Critical Alerts</p>
                </div>
                {analysis.critical_alerts.map((alert, i) => (
                  <p key={i} className='text-sm' style={{ color: '#e89090' }}>• {alert}</p>
                ))}
              </div>
            )}

            {/* Summary card */}
            <div className='card p-5'>
              <div className='flex items-start justify-between gap-4 mb-3'>
                <h2 className='font-display font-semibold text-lg' style={{ color: '#ede9e0' }}>Report Summary</h2>
                {assessment && (
                  <span
                    className='shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5'
                    style={{ background: assessment.bg, borderColor: assessment.border, color: assessment.color }}
                  >
                    {analysis.overall_assessment === 'normal' ? <CheckCircle2 size={12} /> : <Info size={12} />}
                    {assessment.label}
                  </span>
                )}
              </div>
              <p className='text-sm leading-relaxed' style={{ color: '#7a7a6e' }}>{analysis.report_summary}</p>
            </div>

            {/* Tests grid */}
            {analysis.tests_extracted.length > 0 && (
              <div>
                <h2 className='font-display font-semibold mb-3' style={{ color: '#ede9e0' }}>
                  Tests Extracted{' '}
                  <span className='text-sm font-normal' style={{ color: '#7a7a6e' }}>
                    ({analysis.tests_extracted.length} found, {analysis.flagged_tests.length} flagged)
                  </span>
                </h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {analysis.tests_extracted.map((test, i) => (
                    <TestCard key={i} test={test} />
                  ))}
                </div>
              </div>
            )}

            {/* Talk to doctor */}
            {analysis.talk_to_doctor_about.length > 0 && (
              <div className='card p-5'>
                <div className='flex items-center gap-2 mb-4'>
                  <div
                    className='w-8 h-8 rounded-lg flex items-center justify-center'
                    style={{ background: 'rgba(201,168,76,0.12)' }}
                  >
                    <Info size={16} style={{ color: '#c9a84c' }} />
                  </div>
                  <h2 className='font-display font-semibold' style={{ color: '#ede9e0' }}>Talk to Your Doctor About</h2>
                </div>
                <ol className='space-y-2.5'>
                  {analysis.talk_to_doctor_about.map((q, i) => (
                    <li key={i} className='flex items-start gap-3'>
                      <span
                        className='shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5'
                        style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}
                      >
                        {i + 1}
                      </span>
                      <p className='text-sm leading-relaxed' style={{ color: '#7a7a6e' }}>{q}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Disclaimer */}
            <p
              className='text-xs text-center leading-relaxed px-4'
              style={{ color: 'rgba(122,122,110,0.6)' }}
            >
              {analysis.disclaimer}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
