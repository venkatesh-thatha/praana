import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
})
type FormData = z.infer<typeof schema>

const FEATURES = [
  'Symptom analysis with ICD-11 mapping',
  'Lab report interpretation in plain English',
  'Doctor-ready PDF brief in one tap',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiClient.post('/auth/register', data)
      setAuth(res.data.access_token, res.data.user_id)
      navigate('/onboarding')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    }
  }

  return (
    <div className='min-h-screen flex' style={{ backgroundColor: '#090b09' }}>

      {/* ── Left panel — brand (desktop only) ─────────────────── */}
      <div
        className='hidden lg:flex flex-col justify-between w-[44%] px-12 py-14'
        style={{ background: 'linear-gradient(160deg, #101412 0%, #0b0e0b 100%)', borderRight: '1px solid rgba(143,191,110,0.05)' }}
      >
        {/* Logo */}
        <div className='flex items-center gap-3'>
          <div
            className='w-9 h-9 rounded-xl flex items-center justify-center'
            style={{ background: 'rgba(143,191,110,0.12)' }}
          >
            <Leaf size={18} style={{ color: '#8fbf6e' }} />
          </div>
          <span className='font-display text-lg font-bold tracking-tight' style={{ color: '#ede9e0' }}>
            Praana
          </span>
        </div>

        {/* Middle copy */}
        <div>
          <p className='text-xs font-medium tracking-[0.2em] uppercase mb-5' style={{ color: 'rgba(143,191,110,0.5)' }}>
            Health Intelligence
          </p>
          <h2 className='font-display text-4xl font-bold leading-[1.15] mb-6'>
            <span className='gradient-text'>Your intelligent</span>
            <br />
            <span style={{ color: '#ede9e0' }}>health companion.</span>
          </h2>
          <p className='text-base leading-relaxed max-w-xs' style={{ color: '#7a7a6e' }}>
            Praana tracks your vitals, reads your lab reports, and prepares you for every doctor visit — in Hindi, Tamil, or English.
          </p>

          <div className='mt-10 space-y-4'>
            {FEATURES.map((item) => (
              <div key={item} className='flex items-start gap-3'>
                <div
                  className='w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center'
                  style={{ background: 'rgba(143,191,110,0.12)' }}
                >
                  <div className='w-1.5 h-1.5 rounded-full' style={{ background: '#8fbf6e' }} />
                </div>
                <p className='text-sm' style={{ color: 'rgba(184,217,156,0.6)' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className='text-xs' style={{ color: 'rgba(143,191,110,0.3)' }}>
          CBC Spring 2026 · Track 1 — Biology &amp; Physical Health
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────── */}
      <div
        className='flex-1 flex flex-col items-center justify-center px-6 py-12 animate-fade-up'
        style={{ backgroundColor: '#090b09' }}
      >
        {/* Mobile logo */}
        <div className='flex items-center gap-2.5 mb-10 lg:hidden'>
          <div
            className='w-8 h-8 rounded-lg flex items-center justify-center'
            style={{ background: 'rgba(143,191,110,0.12)' }}
          >
            <Leaf size={16} style={{ color: '#8fbf6e' }} />
          </div>
          <span className='font-display text-lg font-bold' style={{ color: '#ede9e0' }}>Praana</span>
        </div>

        <div className='w-full max-w-[380px]'>
          <div className='mb-8'>
            <h1 className='font-display text-2xl font-bold mb-2' style={{ color: '#ede9e0' }}>
              Create your account
            </h1>
            <p className='text-sm' style={{ color: '#7a7a6e' }}>Begin your health journey.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-5' noValidate>
            <div>
              <label className='label'>Full name</label>
              <input
                {...register('name')}
                className='input'
                placeholder='Venkatesh Kumar'
                autoComplete='name'
              />
              {errors.name && (
                <p className='text-xs mt-1.5' style={{ color: '#d97272' }}>{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className='label'>Email address</label>
              <input
                {...register('email')}
                className='input'
                placeholder='you@example.com'
                type='email'
                autoComplete='email'
              />
              {errors.email && (
                <p className='text-xs mt-1.5' style={{ color: '#d97272' }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className='label'>Password</label>
              <input
                {...register('password')}
                className='input'
                placeholder='Min. 8 characters'
                type='password'
                autoComplete='new-password'
              />
              {errors.password && (
                <p className='text-xs mt-1.5' style={{ color: '#d97272' }}>{errors.password.message}</p>
              )}
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='btn-primary w-full flex items-center justify-center gap-2 mt-2'
            >
              {isSubmitting ? (
                <><Loader2 size={16} className='animate-spin' /> Creating account…</>
              ) : (
                <>Create account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className='text-center text-sm mt-6' style={{ color: 'rgba(143,191,110,0.35)' }}>
            Already have an account?{' '}
            <Link
              to='/login'
              className='font-medium transition-colors'
              style={{ color: 'rgba(184,217,156,0.75)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#8fbf6e')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(184,217,156,0.75)')}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
