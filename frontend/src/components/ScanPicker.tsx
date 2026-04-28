import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Scan, Layers, FlaskConical, X } from 'lucide-react'

interface ScanPickerProps {
  open: boolean
  onClose: () => void
}

const SCAN_OPTIONS = [
  {
    icon: Camera,
    label: 'Food Label',
    sub: 'Ingredients & interactions',
    to: '/scanner',
    color: '#b080d0',
    bg: 'rgba(176,128,208,0.1)',
    border: 'rgba(176,128,208,0.2)',
  },
  {
    icon: Scan,
    label: 'Skin Check',
    sub: 'Condition assessment',
    to: '/skin',
    color: '#e09050',
    bg: 'rgba(224,144,80,0.1)',
    border: 'rgba(224,144,80,0.2)',
  },
  {
    icon: Layers,
    label: 'X-Ray',
    sub: 'Density analysis',
    to: '/xray',
    color: '#8090d0',
    bg: 'rgba(128,144,208,0.1)',
    border: 'rgba(128,144,208,0.2)',
  },
  {
    icon: FlaskConical,
    label: 'Lab Report',
    sub: 'Blood test analysis',
    to: '/lab-report',
    color: '#8fbf6e',
    bg: 'rgba(143,191,110,0.1)',
    border: 'rgba(143,191,110,0.2)',
  },
] as const

export function ScanPicker({ open, onClose }: ScanPickerProps) {
  const navigate = useNavigate()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleOptionClick = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      />

      <div
        ref={sheetRef}
        role='dialog'
        aria-modal='true'
        aria-label='Scan options'
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          background: 'rgba(14,18,14,0.98)',
          borderTop: '1px solid rgba(143,191,110,0.1)',
          borderRadius: '24px 24px 0 0',
          padding: '24px',
          maxHeight: '60vh',
          overflowY: 'auto',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
        }}
      >
        <button
          onClick={onClose}
          aria-label='Close scan picker'
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(143,191,110,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#7a7a6e',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.09)'
            e.currentTarget.style.color = '#ede9e0'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = '#7a7a6e'
          }}
        >
          <X size={14} />
        </button>

        <div
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(143,191,110,0.2)',
            margin: '0 auto 20px',
          }}
        />

        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#ede9e0',
            marginBottom: '4px',
            letterSpacing: '-0.01em',
          }}
        >
          What would you like to scan?
        </p>
        <p
          style={{
            fontSize: '11px',
            color: '#7a7a6e',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
        >
          AI analysis cross-referenced with your health profile
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {SCAN_OPTIONS.map(({ icon: Icon, label, sub, to, color, bg, border }) => (
            <button
              key={to}
              onClick={() => handleOptionClick(to)}
              style={{
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                background: bg,
                border: `1px solid ${border}`,
                cursor: 'pointer',
                transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.025)'
                e.currentTarget.style.boxShadow = `0 4px 24px ${border}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.025)'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: bg,
                  border: `1px solid ${border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color,
                }}
              >
                <Icon size={22} />
              </div>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#ede9e0',
                  lineHeight: 1.2,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: '#7a7a6e',
                  lineHeight: 1.4,
                }}
              >
                {sub}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
