import { NavLink, useNavigate } from 'react-router-dom'
import { Activity, Brain, Camera, Salad, Heart, Dumbbell, FileText, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/symptoms', icon: Brain, label: 'Symptoms' },
  { to: '/scanner', icon: Camera, label: 'Scanner' },
  { to: '/diet', icon: Salad, label: 'Diet' },
  { to: '/vitals', icon: Activity, label: 'Vitals' },
  { to: '/exercise', icon: Dumbbell, label: 'Exercise' },
  { to: '/brief', icon: FileText, label: 'Brief' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthStore()
  const { profile } = useProfileStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className='flex min-h-screen bg-slate-900'>
      {/* Sidebar — desktop */}
      <aside className='hidden md:flex flex-col w-60 bg-slate-800 border-r border-slate-700 px-4 py-6 fixed h-full'>
        <div className='flex items-center gap-2 mb-8 px-2'>
          <Heart className='text-teal-400' size={24} />
          <span className='text-xl font-bold text-white'>Praana</span>
        </div>

        {profile && (
          <div className='mb-6 px-2 py-3 bg-slate-700/50 rounded-lg'>
            <p className='text-xs text-slate-400'>Logged in as</p>
            <p className='text-sm font-medium text-white truncate'>{profile.personal.name}</p>
            {profile.age && <p className='text-xs text-slate-400'>{profile.age}y · {profile.personal.blood_type || '—'}</p>}
          </div>
        )}

        <nav className='flex-1 space-y-1'>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className='flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-red-400 transition-colors mt-4'
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className='flex-1 md:ml-60 pb-20 md:pb-0'>
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav className='md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around px-2 py-2 z-50'>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors',
                isActive ? 'text-teal-400' : 'text-slate-400')
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
