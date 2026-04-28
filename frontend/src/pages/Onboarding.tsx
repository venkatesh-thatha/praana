import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/api/client'
import { useProfileStore } from '@/store/profileStore'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const DIET_TYPES = [
  { id: 'veg', label: 'Vegetarian', emoji: '🥦' },
  { id: 'non_veg', label: 'Non-Veg', emoji: '🍗' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'eggetarian', label: 'Eggetarian', emoji: '🥚' },
]
const STATES = [
  'Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana',
  'Maharashtra', 'Gujarat', 'Delhi', 'West Bengal', 'Rajasthan',
  'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Punjab', 'Other',
]

const STEPS = [
  { title: 'Personal Details', sub: 'Tell us a little about you' },
  { title: 'Physical Profile', sub: 'Height, weight, vision & blood type' },
  { title: 'Medical History', sub: 'Conditions, medications & allergies' },
  { title: 'Diet & Lifestyle', sub: 'How you eat and live' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { setProfile } = useProfileStore()

  const update = (fields: Record<string, any>) => setData((prev) => ({ ...prev, ...fields }))

  const none = (v: string | undefined) =>
    v && v.trim().toLowerCase() !== 'none' ? v.trim() : undefined

  const noneList = (v: string | undefined) =>
    v ? v.split(',').map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== 'none') : []

  const parseEyeNum = (v: string | undefined) => {
    if (!v || v.trim().toLowerCase() === 'none' || v.trim() === '') return undefined
    const n = parseFloat(v)
    return isNaN(n) ? undefined : n
  }

  const submit = async () => {
    if (!data.name?.trim()) {
      toast.error('Please go back and enter your full name')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        personal: {
          name: data.name.trim(),
          dob: none(data.dob),
          gender: none(data.gender),
          height_cm: data.height_cm ? parseFloat(data.height_cm) : undefined,
          weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : undefined,
          blood_type: none(data.blood_type),
          city: none(data.city),
          state: none(data.state),
          language_pref: data.language_pref || 'en',
          right_eye: {
            sphere: parseEyeNum(data.re_sphere),
            cylinder: parseEyeNum(data.re_cylinder),
            axis: data.re_axis ? parseInt(data.re_axis) : undefined,
          },
          left_eye: {
            sphere: parseEyeNum(data.le_sphere),
            cylinder: parseEyeNum(data.le_cylinder),
            axis: data.le_axis ? parseInt(data.le_axis) : undefined,
          },
          emergency_contact: {
            name: none(data.emergency_name),
            phone: none(data.emergency_phone),
            relation: none(data.emergency_relation),
          },
        },
        medical_history: {
          conditions: noneList(data.conditions),
          medications: noneList(data.medications),
          allergies: noneList(data.allergies),
          surgeries: noneList(data.surgeries),
          family_history: noneList(data.family_history),
        },
        diet: {
          type: none(data.diet_type),
          restrictions: noneList(data.diet_restrictions),
          cuisine_region: none(data.cuisine_region),
        },
      }
      await apiClient.post('/profile', payload)
      const profileRes = await apiClient.get('/profile/me')
      setProfile(profileRes.data)
      toast.success('Profile saved!')
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail
      toast.error(msg || 'Failed to save profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center px-4 py-10 animate-fade-in' style={{ backgroundColor: '#090b09' }}>

      {/* Header */}
      <div className='flex items-center gap-2.5 mb-10'>
        <div className='w-8 h-8 rounded-lg flex items-center justify-center' style={{ background: 'rgba(143,191,110,0.12)' }}>
          <Leaf style={{ color: '#8fbf6e' }} size={16} />
        </div>
        <span className='font-display text-lg font-bold' style={{ color: '#ede9e0' }}>Praana</span>
      </div>

      <div className='w-full max-w-md'>

        {/* Step indicator */}
        <div className='flex items-center justify-between mb-8 px-1'>
          {STEPS.map((s, i) => (
            <div key={i} className='flex items-center flex-1'>
              <div className='flex flex-col items-center'>
                <div
                  className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300'
                  style={{
                    background: i < step ? '#8fbf6e' : i === step ? 'rgba(143,191,110,0.12)' : 'rgba(16,20,18,0.8)',
                    color: i < step ? '#0f1a0a' : i === step ? '#8fbf6e' : 'rgba(143,191,110,0.3)',
                    boxShadow: i === step ? '0 0 0 2px rgba(143,191,110,0.25)' : 'none',
                    border: i < step ? 'none' : '1px solid rgba(143,191,110,0.12)',
                  }}
                >
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <p
                  className='text-[10px] mt-1.5 hidden sm:block transition-colors'
                  style={{ color: i === step ? '#b8d99c' : 'rgba(143,191,110,0.3)' }}
                >
                  {s.title.split(' ')[0]}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className='flex-1 h-px mx-2 mb-4 transition-colors duration-300'
                  style={{ background: i < step ? 'rgba(143,191,110,0.5)' : 'rgba(143,191,110,0.1)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className='card p-7'>
          <p className='text-xs font-medium tracking-[0.15em] uppercase mb-1' style={{ color: 'rgba(143,191,110,0.5)' }}>
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className='font-display text-xl font-semibold mb-0.5' style={{ color: '#ede9e0' }}>{STEPS[step].title}</h2>
          <p className='text-sm mb-6' style={{ color: '#7a7a6e' }}>{STEPS[step].sub}</p>

          {/* ── Step 0: Personal ──────────────────────────────────── */}
          {step === 0 && (
            <div className='space-y-4'>
              <div>
                <label className='label'>Full name <span style={{ color: '#8fbf6e' }}>*</span></label>
                <input
                  className='input'
                  value={data.name || ''}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder='Venkatesh Kumar'
                  autoComplete='name'
                />
              </div>
              <div>
                <label className='label'>Date of birth</label>
                <input
                  type='date'
                  className='input'
                  value={data.dob || ''}
                  onChange={(e) => update({ dob: e.target.value })}
                />
              </div>
              <div>
                <label className='label'>Gender</label>
                <select
                  className='input'
                  value={data.gender || ''}
                  onChange={(e) => update({ gender: e.target.value })}
                >
                  <option value=''>Select…</option>
                  <option value='male'>Male</option>
                  <option value='female'>Female</option>
                  <option value='other'>Other</option>
                </select>
              </div>
              <div>
                <label className='label'>Preferred language</label>
                <select
                  className='input'
                  value={data.language_pref || 'en'}
                  onChange={(e) => update({ language_pref: e.target.value })}
                >
                  <option value='en'>English</option>
                  <option value='hi'>हिंदी</option>
                  <option value='ta'>தமிழ்</option>
                </select>
              </div>
              <div className='pt-2 border-t' style={{ borderColor: 'rgba(143,191,110,0.08)' }}>
                <p className='text-xs font-medium mb-3' style={{ color: 'rgba(143,191,110,0.5)' }}>Emergency contact (optional)</p>
                <div className='space-y-3'>
                  <input
                    className='input'
                    placeholder='Contact name'
                    value={data.emergency_name || ''}
                    onChange={(e) => update({ emergency_name: e.target.value })}
                  />
                  <div className='grid grid-cols-2 gap-3'>
                    <input
                      className='input'
                      placeholder='Phone number'
                      value={data.emergency_phone || ''}
                      onChange={(e) => update({ emergency_phone: e.target.value })}
                    />
                    <input
                      className='input'
                      placeholder='Relation (Spouse…)'
                      value={data.emergency_relation || ''}
                      onChange={(e) => update({ emergency_relation: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Physical ──────────────────────────────────── */}
          {step === 1 && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='label'>Height (cm)</label>
                  <input
                    type='number'
                    className='input'
                    value={data.height_cm || ''}
                    onChange={(e) => update({ height_cm: e.target.value })}
                    placeholder='170'
                  />
                </div>
                <div>
                  <label className='label'>Weight (kg)</label>
                  <input
                    type='number'
                    className='input'
                    value={data.weight_kg || ''}
                    onChange={(e) => update({ weight_kg: e.target.value })}
                    placeholder='65'
                  />
                </div>
              </div>
              <div>
                <label className='label'>Blood type</label>
                <select
                  className='input'
                  value={data.blood_type || ''}
                  onChange={(e) => update({ blood_type: e.target.value })}
                >
                  <option value=''>Select…</option>
                  {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='label'>City</label>
                  <input
                    className='input'
                    value={data.city || ''}
                    onChange={(e) => update({ city: e.target.value })}
                    placeholder='Bengaluru'
                  />
                </div>
                <div>
                  <label className='label'>State</label>
                  <select
                    className='input'
                    value={data.state || ''}
                    onChange={(e) => update({ state: e.target.value })}
                  >
                    <option value=''>Select…</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Eyesight section */}
              <div className='pt-2 border-t' style={{ borderColor: 'rgba(143,191,110,0.08)' }}>
                <p className='text-xs font-medium mb-1' style={{ color: 'rgba(143,191,110,0.5)' }}>Eyesight prescription (optional)</p>
                <p className='text-xs mb-3' style={{ color: '#7a7a6e' }}>Leave blank if you don't wear glasses/contacts</p>
                <div className='space-y-3'>
                  <div>
                    <p className='text-xs mb-2' style={{ color: 'rgba(184,217,156,0.6)' }}>Right eye (OD)</p>
                    <div className='grid grid-cols-3 gap-2'>
                      <div>
                        <label className='label text-[10px]'>Sphere</label>
                        <input
                          type='number'
                          step='0.25'
                          className='input text-sm py-2'
                          placeholder='-2.50'
                          value={data.re_sphere || ''}
                          onChange={(e) => update({ re_sphere: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className='label text-[10px]'>Cylinder</label>
                        <input
                          type='number'
                          step='0.25'
                          className='input text-sm py-2'
                          placeholder='-0.75'
                          value={data.re_cylinder || ''}
                          onChange={(e) => update({ re_cylinder: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className='label text-[10px]'>Axis °</label>
                        <input
                          type='number'
                          min='0'
                          max='180'
                          className='input text-sm py-2'
                          placeholder='90'
                          value={data.re_axis || ''}
                          onChange={(e) => update({ re_axis: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className='text-xs mb-2' style={{ color: 'rgba(184,217,156,0.6)' }}>Left eye (OS)</p>
                    <div className='grid grid-cols-3 gap-2'>
                      <div>
                        <label className='label text-[10px]'>Sphere</label>
                        <input
                          type='number'
                          step='0.25'
                          className='input text-sm py-2'
                          placeholder='-2.50'
                          value={data.le_sphere || ''}
                          onChange={(e) => update({ le_sphere: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className='label text-[10px]'>Cylinder</label>
                        <input
                          type='number'
                          step='0.25'
                          className='input text-sm py-2'
                          placeholder='-0.75'
                          value={data.le_cylinder || ''}
                          onChange={(e) => update({ le_cylinder: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className='label text-[10px]'>Axis °</label>
                        <input
                          type='number'
                          min='0'
                          max='180'
                          className='input text-sm py-2'
                          placeholder='90'
                          value={data.le_axis || ''}
                          onChange={(e) => update({ le_axis: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Medical ───────────────────────────────────── */}
          {step === 2 && (
            <div className='space-y-4'>
              <div>
                <label className='label'>Existing conditions</label>
                <input
                  className='input'
                  value={data.conditions || ''}
                  onChange={(e) => update({ conditions: e.target.value })}
                  placeholder='Hypertension, Type 2 Diabetes…'
                />
                <p className='text-xs mt-1.5' style={{ color: 'rgba(143,191,110,0.4)' }}>Separate with commas · Type "none" or leave blank if none</p>
              </div>
              <div>
                <label className='label'>Current medications</label>
                <input
                  className='input'
                  value={data.medications || ''}
                  onChange={(e) => update({ medications: e.target.value })}
                  placeholder='Metformin, Amlodipine…'
                />
              </div>
              <div>
                <label className='label'>Known allergies</label>
                <input
                  className='input'
                  value={data.allergies || ''}
                  onChange={(e) => update({ allergies: e.target.value })}
                  placeholder='Penicillin, Sulfa drugs, Nuts…'
                />
              </div>
              <div>
                <label className='label'>Past surgeries</label>
                <input
                  className='input'
                  value={data.surgeries || ''}
                  onChange={(e) => update({ surgeries: e.target.value })}
                  placeholder='Appendectomy 2019, Knee surgery…'
                />
              </div>
              <div>
                <label className='label'>Family medical history</label>
                <input
                  className='input'
                  value={data.family_history || ''}
                  onChange={(e) => update({ family_history: e.target.value })}
                  placeholder='Father: heart disease, Mother: diabetes…'
                />
                <p className='text-xs mt-1.5' style={{ color: 'rgba(143,191,110,0.4)' }}>Helps AI flag hereditary risks</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Diet ──────────────────────────────────────── */}
          {step === 3 && (
            <div className='space-y-5'>
              <div>
                <label className='label'>Diet type</label>
                <div className='grid grid-cols-2 gap-2.5 mt-1'>
                  {DIET_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type='button'
                      onClick={() => update({ diet_type: t.id })}
                      className='flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200'
                      style={{
                        background: data.diet_type === t.id ? 'rgba(143,191,110,0.12)' : 'rgba(16,20,18,0.6)',
                        border: `1px solid ${data.diet_type === t.id ? 'rgba(143,191,110,0.4)' : 'rgba(143,191,110,0.08)'}`,
                        color: data.diet_type === t.id ? '#b8d99c' : '#7a7a6e',
                      }}
                    >
                      <span className='text-base'>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className='label'>Cuisine region</label>
                <input
                  className='input'
                  value={data.cuisine_region || ''}
                  onChange={(e) => update({ cuisine_region: e.target.value })}
                  placeholder='South Indian, North Indian…'
                />
              </div>
              <div>
                <label className='label'>Dietary restrictions</label>
                <input
                  className='input'
                  value={data.diet_restrictions || ''}
                  onChange={(e) => update({ diet_restrictions: e.target.value })}
                  placeholder='Gluten-free, No onion/garlic…'
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className='flex items-center justify-between mt-8 pt-5 border-t' style={{ borderColor: 'rgba(143,191,110,0.1)' }}>
            <button
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
              className='flex items-center gap-1.5 text-sm transition-colors disabled:opacity-0'
              style={{ color: '#7a7a6e' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#8fbf6e')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#7a7a6e')}
            >
              <ChevronLeft size={15} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                className='btn-primary flex items-center gap-1.5 text-sm'
              >
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className='btn-primary flex items-center gap-2 text-sm'
              >
                {submitting
                  ? <><Loader2 size={15} className='animate-spin' /> Saving…</>
                  : <><Check size={15} /> Complete setup</>
                }
              </button>
            )}
          </div>
        </div>

        <p className='text-center text-xs mt-5' style={{ color: 'rgba(143,191,110,0.3)' }}>
          You can update your profile anytime from settings.
        </p>
      </div>
    </div>
  )
}
