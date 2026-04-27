import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
    <div className='min-h-screen flex items-center justify-center bg-slate-900 px-4'>
      <div className='w-full max-w-sm'>
        <div className='flex items-center justify-center gap-2 mb-8'>
          <Heart className='text-teal-400' size={28} />
          <span className='text-2xl font-bold text-white'>Praana</span>
        </div>
        <div className='card'>
          <h1 className='text-xl font-semibold text-white mb-6'>Log in to your account</h1>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <label className='label'>Email</label>
              <input {...register('email')} className='input' placeholder='you@example.com' type='email' />
              {errors.email && <p className='text-red-400 text-xs mt-1'>{errors.email.message}</p>}
            </div>
            <div>
              <label className='label'>Password</label>
              <input {...register('password')} className='input' placeholder='••••••••' type='password' />
              {errors.password && <p className='text-red-400 text-xs mt-1'>{errors.password.message}</p>}
            </div>
            <button type='submit' disabled={isSubmitting} className='btn-primary w-full mt-2'>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <p className='text-center text-sm text-slate-400 mt-4'>
            Don't have an account?{' '}
            <Link to='/register' className='text-teal-400 hover:text-teal-300'>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
