import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  Activity, Brain, Camera, Salad, Heart, Dumbbell, FileText,
  LogOut, LayoutDashboard, FlaskConical, Stethoscope, Scan, Layers, Leaf,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { ScanPicker } from '@/components/ScanPicker'
import clsx from 'clsx'

const SIDEBAR_SECTIONS = [
  {
    label: 'DIAGNOSE',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/symptoms', icon: Brain, label: 'Symptoms' },
      { to: '/vitals', icon: Activity, label: 'Vitals' },
    ],
  },
  {
    label: 'SCAN & ANALYSE',
    items: [
      { to: '/scanner', icon: Camera, label: 'Food Scanner' },
      { to: '/skin', icon: Scan, label: 'Skin Check' },
      { to: '/xray', icon: Layers, label: 'X-Ray' },
      { to: '/lab-report', icon: FlaskConical, label: 'Lab Report' },
    ],
  },
  {
    label: 'WELLNESS',
    items: [
      { to: '/diet', icon: Salad, label: 'Diet' },
      { to: '/exercise', icon: Dumbbell, label: 'Exercise' },
      { to: '/herbs', icon: Leaf, label: 'Herbs & Remedies' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { to: '/brief', icon: FileText, label: 'Doctor Brief' },
      { to: '/consult', icon: Stethoscope, label: 'Consult' },
    ],
  },
] as const

const BOTTOM_TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/symptoms', icon: Brain, label: 'Health' },
  null,
  { to: '/exercise', icon: Dumbbell, label: 'Move' },
  { to: '/consult', icon: Stethoscope, label: 'Me' },
] as const

function bloodTypeBg(bt: string): string {
  const map: Record<string, string> = {
    'A+': 'bg-red-500/20 text-red-300 border-red-500/30',
    'A-': 'bg-red-500/20 text-red-300 border-red-500/30',
    'B+': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'B-': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'AB+': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'AB-': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'O+': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'O-': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }
  return map[bt] ?? 'bg-slate-700/50 text-slate-300 border-slate-600/50'
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthStore()
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const [scanPickerOpen, setScanPickerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const bloodType = profile?.personal?.blood_type || null
  const conditions = profile?.medical_history?.conditions || []

  return (
    <div className='flex min-h-screen' style={{ backgroundColor: '#090b09' }}>

      {/* ─── Sidebar — desktop only ─────────────────────────────── */}
      <aside
        className='hidden md:flex flex-col w-64 fixed h-full z-20'
        style={{ borderRight: '1px solid rgba(143,191,110,0.06)' }}
      >
        <div
          className='absolute inset-0 backdrop-blur-xl'
          style={{ background: 'rgba(14,18,14,0.92)' }}
        />

        <div className='relative flex flex-col h-full px-4 py-6'>

          {/* Logo */}
          <div className='flex items-center gap-2.5 mb-7 px-2'>
            <div
              className='w-8 h-8 rounded-lg flex items-center justify-center glow-teal flex-shrink-0'
              style={{ background: 'rgba(143,191,110,0.15)' }}
            >
              <Heart size={16} fill='currentColor' style={{ color: '#8fbf6e' }} />
            </div>
            <span
              className='text-lg font-bold tracking-tight'
              style={{ color: '#ede9e0', fontFamily: 'Syne, sans-serif' }}
            >
              Praana
            </span>
          </div>

          {/* Grouped nav */}
          <nav className='flex-1 overflow-y-auto'>
            {SIDEBAR_SECTIONS.map(({ label, items }, sectionIdx) => (
              <div key={label}>
                <p
                  className={clsx('px-3 py-1.5', sectionIdx !== 0 && 'mt-4')}
                  style={{
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontWeight: 600,
                    color: 'rgba(143,191,110,0.35)',
                  }}
                >
                  {label}
                </p>

                <div className='space-y-0.5'>
                  {items.map(({ to, icon: Icon, label: itemLabel }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                          isActive ? 'text-[#ede9e0]' : 'hover:text-[#ede9e0]',
                        )
                      }
                      style={({ isActive }) => isActive ? {} : { color: '#7a7a6e' }}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              className='absolute inset-0 rounded-xl'
                              style={{
                                background: 'linear-gradient(135deg, rgba(143,191,110,0.15) 0%, rgba(143,191,110,0.06) 100%)',
                                border: '1px solid rgba(143,191,110,0.2)',
                              }}
                            />
                          )}
                          {!isActive && (
                            <span
                              className='absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                              style={{ background: 'rgba(255,255,255,0.03)' }}
                            />
                          )}
                          <span
                            className='relative z-10 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 flex-shrink-0'
                            style={
                              isActive
                                ? { background: 'rgba(143,191,110,0.2)', color: '#8fbf6e' }
                                : { color: '#7a7a6e' }
                            }
                          >
                            <Icon size={16} />
                          </span>
                          <span className='relative z-10'>{itemLabel}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User health card */}
          {profile && (
            <div
              className='mt-4 mb-4 p-3 rounded-xl'
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(143,191,110,0.06)',
              }}
            >
              <div className='flex items-center justify-between mb-2'>
                <div className='min-w-0'>
                  <p className='text-xs mb-0.5' style={{ color: '#7a7a6e' }}>Logged in as</p>
                  <p
                    className='text-sm font-semibold truncate max-w-[130px]'
                    style={{ color: '#ede9e0' }}
                  >
                    {profile.personal.name}
                  </p>
                  {profile.age && (
                    <p className='text-xs mt-0.5' style={{ color: '#7a7a6e' }}>
                      {profile.age}y{profile.personal.gender ? ` · ${profile.personal.gender}` : ''}
                    </p>
                  )}
                </div>
                {bloodType && (
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${bloodTypeBg(bloodType)}`}
                  >
                    {bloodType}
                  </span>
                )}
              </div>
              {conditions.length > 0 && (
                <div className='flex flex-wrap gap-1 mt-1.5'>
                  {conditions.slice(0, 2).map((c: string) => (
                    <span
                      key={c}
                      className='text-xs px-1.5 py-0.5 rounded-md'
                      style={{
                        background: 'rgba(217,114,114,0.1)',
                        border: '1px solid rgba(217,114,114,0.2)',
                        color: '#d97272',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                  {conditions.length > 2 && (
                    <span className='text-xs' style={{ color: '#7a7a6e' }}>
                      +{conditions.length - 2} more
                    </span>
                  )}
                </div>
              )}
              <Link
                to='/profile'
                style={{
                  fontSize: '11px',
                  color: '#8fbf6e',
                  marginTop: '6px',
                  display: 'inline-block',
                }}
              >
                Edit profile →
              </Link>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className='flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200'
            style={{ color: '#7a7a6e' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d97272')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#7a7a6e')}
          >
            <span className='w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0'>
              <LogOut size={15} />
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Main content ────────────────────────────────────────── */}
      <main className='flex-1 md:ml-64 pb-20 md:pb-0 min-w-0'>
        {children}
      </main>

      {/* ─── Bottom nav — mobile only ────────────────────────────── */}
      <nav
        className='md:hidden fixed bottom-0 left-0 right-0 z-40'
        style={{
          background: 'rgba(9,11,9,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(143,191,110,0.07)',
        }}
      >
        <div
          className='flex items-end'
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        >
          {BOTTOM_TABS.map((tab) => {
            if (tab === null) {
              return (
                <div
                  key='fab-slot'
                  className='flex-1 flex justify-center'
                  style={{ paddingBottom: '8px' }}
                >
                  <button
                    onClick={() => setScanPickerOpen(true)}
                    aria-label='Open scan picker'
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8fbf6e 0%, #6aab4e 100%)',
                      boxShadow: '0 4px 20px rgba(143,191,110,0.45), 0 0 0 3px rgba(143,191,110,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '-14px',
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.07)'
                      e.currentTarget.style.boxShadow = '0 6px 28px rgba(143,191,110,0.6), 0 0 0 4px rgba(143,191,110,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(143,191,110,0.45), 0 0 0 3px rgba(143,191,110,0.15)'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.94)'
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.07)'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.94)'
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <Scan size={24} color='#ffffff' strokeWidth={2} />
                  </button>
                </div>
              )
            }

            const { to, icon: Icon, label } = tab

            return (
              <NavLink
                key={to}
                to={to}
                className='flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors duration-200'
                style={({ isActive }) => ({
                  color: isActive ? '#8fbf6e' : '#7a7a6e',
                })}
              >
                {({ isActive }) => (
                  <>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(143,191,110,0.1)' : 'transparent',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <Icon size={18} />
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 500,
                        lineHeight: 1,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* ─── Scan picker sheet ──────────────────────────────────── */}
      <ScanPicker
        open={scanPickerOpen}
        onClose={() => setScanPickerOpen(false)}
      />
    </div>
  )
}
