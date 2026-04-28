import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiClient.post('/auth/login', data)
      setAuth(res.data.access_token, res.data.user_id)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className='min-h-screen flex' style={{ backgroundColor: '#090b09' }}>

      {/* ── Left panel — form ────────────────────────────────────── */}
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
            <h1 className='font-display text-2xl font-bold mb-2' style={{ color: '#ede9e0' }}>Welcome back</h1>
            <p className='text-sm' style={{ color: '#7a7a6e' }}>Continue your health journey.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-5' noValidate>
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
                placeholder='••••••••'
                type='password'
                autoComplete='current-password'
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
                <><Loader2 size={16} className='animate-spin' /> Logging in…</>
              ) : (
                <>Log in <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className='text-center text-sm mt-6' style={{ color: 'rgba(143,191,110,0.35)' }}>
            Don&apos;t have an account?{' '}
            <Link
              to='/register'
              className='font-medium transition-colors'
              style={{ color: 'rgba(184,217,156,0.75)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#8fbf6e')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(184,217,156,0.75)')}
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right panel — brand (desktop only) ──────────────────── */}
      <div
        className='hidden lg:flex flex-col justify-between w-[44%] px-12 py-14'
        style={{ background: 'linear-gradient(160deg, #101412 0%, #0b0e0b 100%)', borderLeft: '1px solid rgba(143,191,110,0.05)' }}
      >
        {/* Logo */}
        <div className='flex items-center gap-3 justify-end'>
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

        {/* Quote */}
        <div>
          <div className='w-8 h-px mb-6' style={{ background: 'rgba(143,191,110,0.3)' }} />
          <blockquote className='font-display text-3xl font-semibold leading-[1.3] mb-6'>
            <span style={{ color: '#ede9e0' }}>"The body keeps score.</span>
            <br />
            <span className='gradient-text'>Praana keeps track."</span>
          </blockquote>
          <p className='text-sm leading-relaxed max-w-xs' style={{ color: '#7a7a6e' }}>
            Log symptoms, track vitals, scan food labels, and walk into every doctor visit fully prepared.
          </p>
        </div>

        {/* Social proof dots */}
        <div className='flex items-center gap-3'>
          <div className='flex -space-x-2'>
            {['rgba(143,191,110,0.25)', 'rgba(143,191,110,0.18)', 'rgba(143,191,110,0.12)'].map((bg, i) => (
              <div
                key={i}
                className='w-7 h-7 rounded-full border-2'
                style={{ background: bg, borderColor: '#101412' }}
              />
            ))}
          </div>
          <p className='text-xs' style={{ color: 'rgba(143,191,110,0.4)' }}>
            Join thousands managing their health proactively
          </p>
        </div>
      </div>
    </div>
  )
}
