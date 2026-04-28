import { useState, useEffect } from 'react'
import { UserCircle, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/api/client'
import { useProfileStore } from '@/store/profileStore'
import Layout from '@/components/Layout'

// ─── Constants (mirrored from Onboarding) ───────────────────────────────────

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

// ─── Sanitization helpers (exact copies from Onboarding) ────────────────────

const none = (v: string | undefined) =>
  v && v.trim().toLowerCase() !== 'none' ? v.trim() : undefined

const noneList = (v: string | undefined) =>
  v ? v.split(',').map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== 'none') : []

const parseEyeNum = (v: string | undefined) => {
  if (!v || v.trim().toLowerCase() === 'none' || v.trim() === '') return undefined
  const n = parseFloat(v)
  return isNaN(n) ? undefined : n
}

// ─── Section heading component ───────────────────────────────────────────────

interface SectionHeadingProps {
  children: React.ReactNode
}

function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <p
      className='text-sm font-semibold mb-4'
      style={{ color: '#8fbf6e' }}
    >
      {children}
    </p>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      className='my-6'
      style={{ height: '1px', background: 'rgba(143,191,110,0.08)' }}
    />
  )
}

// ─── Form data shape ─────────────────────────────────────────────────────────

interface FormData {
  // Personal
  name: string
  dob: string
  gender: string
  height_cm: string
  weight_kg: string
  blood_type: string
  city: string
  state: string
  language_pref: string
  // Emergency contact
  emergency_name: string
  emergency_phone: string
  emergency_relation: string
  // Eyesight
  re_sphere: string
  re_cylinder: string
  re_axis: string
  le_sphere: string
  le_cylinder: string
  le_axis: string
  // Medical history
  conditions: string
  medications: string
  allergies: string
  surgeries: string
  family_history: string
  // Diet
  diet_type: string
  diet_restrictions: string
  cuisine_region: string
}

// ─── Profile page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { profile, setProfile } = useProfileStore()
  const [submitting, setSubmitting] = useState(false)

  // Pre-fill form from store on mount. Cast profile to any where store type
  // is narrower than the actual API shape (emergency_contact, eye fields, family_history).
  const [data, setData] = useState<FormData>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = profile as any
    const personal = p?.personal ?? {}
    const ec = personal.emergency_contact ?? {}
    const re = personal.right_eye ?? {}
    const le = personal.left_eye ?? {}
    const med = p?.medical_history ?? {}
    const diet = p?.diet ?? {}

    return {
      name: personal.name ?? '',
      dob: personal.dob ?? '',
      gender: personal.gender ?? '',
      height_cm: personal.height_cm != null ? String(personal.height_cm) : '',
      weight_kg: personal.weight_kg != null ? String(personal.weight_kg) : '',
      blood_type: personal.blood_type ?? '',
      city: personal.city ?? '',
      state: personal.state ?? '',
      language_pref: personal.language_pref ?? 'en',
      emergency_name: ec.name ?? '',
      emergency_phone: ec.phone ?? '',
      emergency_relation: ec.relation ?? '',
      re_sphere: re.sphere != null ? String(re.sphere) : '',
      re_cylinder: re.cylinder != null ? String(re.cylinder) : '',
      re_axis: re.axis != null ? String(re.axis) : '',
      le_sphere: le.sphere != null ? String(le.sphere) : '',
      le_cylinder: le.cylinder != null ? String(le.cylinder) : '',
      le_axis: le.axis != null ? String(le.axis) : '',
      conditions: (med.conditions ?? []).join(', '),
      medications: (med.medications ?? []).join(', '),
      allergies: (med.allergies ?? []).join(', '),
      surgeries: (med.surgeries ?? []).join(', '),
      family_history: (med.family_history ?? []).join(', '),
      diet_type: diet.type ?? '',
      diet_restrictions: (diet.restrictions ?? []).join(', '),
      cuisine_region: diet.cuisine_region ?? '',
    }
  })

  // Re-sync if profile loads after mount (e.g. hydration from API)
  useEffect(() => {
    if (!profile) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = profile as any
    const personal = p.personal ?? {}
    const ec = personal.emergency_contact ?? {}
    const re = personal.right_eye ?? {}
    const le = personal.left_eye ?? {}
    const med = p.medical_history ?? {}
    const diet = p.diet ?? {}

    setData({
      name: personal.name ?? '',
      dob: personal.dob ?? '',
      gender: personal.gender ?? '',
      height_cm: personal.height_cm != null ? String(personal.height_cm) : '',
      weight_kg: personal.weight_kg != null ? String(personal.weight_kg) : '',
      blood_type: personal.blood_type ?? '',
      city: personal.city ?? '',
      state: personal.state ?? '',
      language_pref: personal.language_pref ?? 'en',
      emergency_name: ec.name ?? '',
      emergency_phone: ec.phone ?? '',
      emergency_relation: ec.relation ?? '',
      re_sphere: re.sphere != null ? String(re.sphere) : '',
      re_cylinder: re.cylinder != null ? String(re.cylinder) : '',
      re_axis: re.axis != null ? String(re.axis) : '',
      le_sphere: le.sphere != null ? String(le.sphere) : '',
      le_cylinder: le.cylinder != null ? String(le.cylinder) : '',
      le_axis: le.axis != null ? String(le.axis) : '',
      conditions: (med.conditions ?? []).join(', '),
      medications: (med.medications ?? []).join(', '),
      allergies: (med.allergies ?? []).join(', '),
      surgeries: (med.surgeries ?? []).join(', '),
      family_history: (med.family_history ?? []).join(', '),
      diet_type: diet.type ?? '',
      diet_restrictions: (diet.restrictions ?? []).join(', '),
      cuisine_region: diet.cuisine_region ?? '',
    })
  }, [profile])

  /** Update a subset of form fields */
  const update = (fields: Partial<FormData>) =>
    setData((prev) => ({ ...prev, ...fields }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.name.trim()) {
      toast.error('Full name is required')
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
      const refreshed = await apiClient.get('/profile/me')
      setProfile(refreshed.data)
      toast.success('Profile updated')
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any
      const detail = e?.response?.data?.detail
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail
      toast.error(msg || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div
        className='min-h-screen px-4 py-8 md:px-8 md:py-10 animate-fade-up'
        style={{ backgroundColor: '#090b09' }}
      >
        <div className='max-w-2xl mx-auto'>

          {/* ── Page header ──────────────────────────────────────── */}
          <div className='flex items-center gap-3 mb-8'>
            <div
              className='w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0'
              style={{ background: 'rgba(143,191,110,0.12)' }}
            >
              <UserCircle size={20} style={{ color: '#8fbf6e' }} />
            </div>
            <div>
              <h1
                className='text-xl font-bold'
                style={{ color: '#ede9e0', fontFamily: 'Syne, sans-serif' }}
              >
                Edit Profile
              </h1>
              <p className='text-sm' style={{ color: '#7a7a6e' }}>
                Keep your health data up to date
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className='space-y-4'>

              {/* ── 1. Personal Info ─────────────────────────────── */}
              <div className='card p-6'>
                <SectionHeading>Personal Info</SectionHeading>
                <div className='space-y-4'>
                  <div>
                    <label className='label'>
                      Full name <span style={{ color: '#8fbf6e' }}>*</span>
                    </label>
                    <input
                      className='input'
                      value={data.name}
                      onChange={(e) => update({ name: e.target.value })}
                      placeholder='Venkatesh Kumar'
                      autoComplete='name'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='label'>Date of birth</label>
                      <input
                        type='date'
                        className='input'
                        value={data.dob}
                        onChange={(e) => update({ dob: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className='label'>Gender</label>
                      <select
                        className='input'
                        value={data.gender}
                        onChange={(e) => update({ gender: e.target.value })}
                      >
                        <option value=''>Select…</option>
                        <option value='male'>Male</option>
                        <option value='female'>Female</option>
                        <option value='other'>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='label'>Height (cm)</label>
                      <input
                        type='number'
                        className='input'
                        value={data.height_cm}
                        onChange={(e) => update({ height_cm: e.target.value })}
                        placeholder='170'
                      />
                    </div>
                    <div>
                      <label className='label'>Weight (kg)</label>
                      <input
                        type='number'
                        className='input'
                        value={data.weight_kg}
                        onChange={(e) => update({ weight_kg: e.target.value })}
                        placeholder='65'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='label'>Blood type</label>
                      <select
                        className='input'
                        value={data.blood_type}
                        onChange={(e) => update({ blood_type: e.target.value })}
                      >
                        <option value=''>Select…</option>
                        {BLOOD_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='label'>Preferred language</label>
                      <select
                        className='input'
                        value={data.language_pref}
                        onChange={(e) => update({ language_pref: e.target.value })}
                      >
                        <option value='en'>English</option>
                        <option value='hi'>हिंदी</option>
                        <option value='ta'>தமிழ்</option>
                      </select>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='label'>City</label>
                      <input
                        className='input'
                        value={data.city}
                        onChange={(e) => update({ city: e.target.value })}
                        placeholder='Bengaluru'
                      />
                    </div>
                    <div>
                      <label className='label'>State</label>
                      <select
                        className='input'
                        value={data.state}
                        onChange={(e) => update({ state: e.target.value })}
                      >
                        <option value=''>Select…</option>
                        {STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. Emergency Contact ─────────────────────────── */}
              <div className='card p-6'>
                <SectionHeading>Emergency Contact</SectionHeading>
                <div className='space-y-3'>
                  <div>
                    <label className='label'>Contact name</label>
                    <input
                      className='input'
                      value={data.emergency_name}
                      onChange={(e) => update({ emergency_name: e.target.value })}
                      placeholder='Ramesh Kumar'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='label'>Phone number</label>
                      <input
                        className='input'
                        value={data.emergency_phone}
                        onChange={(e) => update({ emergency_phone: e.target.value })}
                        placeholder='+91 98765 43210'
                      />
                    </div>
                    <div>
                      <label className='label'>Relation</label>
                      <input
                        className='input'
                        value={data.emergency_relation}
                        onChange={(e) => update({ emergency_relation: e.target.value })}
                        placeholder='Spouse, Parent…'
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 3. Eyesight ──────────────────────────────────── */}
              <div className='card p-6'>
                <SectionHeading>Eyesight Prescription</SectionHeading>
                <p className='text-xs mb-4' style={{ color: '#7a7a6e' }}>
                  Leave blank if you don't wear glasses or contacts.
                </p>
                <div className='space-y-4'>
                  {/* Right eye */}
                  <div>
                    <p
                      className='text-xs font-medium mb-2'
                      style={{ color: 'rgba(184,217,156,0.7)' }}
                    >
                      Right eye (OD)
                    </p>
                    <div className='grid grid-cols-3 gap-2'>
                      <div>
                        <label className='label text-[10px]'>Sphere</label>
                        <input
                          type='number'
                          step='0.25'
                          className='input text-sm py-2'
                          placeholder='-2.50'
                          value={data.re_sphere}
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
                          value={data.re_cylinder}
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
                          value={data.re_axis}
                          onChange={(e) => update({ re_axis: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Left eye */}
                  <div>
                    <p
                      className='text-xs font-medium mb-2'
                      style={{ color: 'rgba(184,217,156,0.7)' }}
                    >
                      Left eye (OS)
                    </p>
                    <div className='grid grid-cols-3 gap-2'>
                      <div>
                        <label className='label text-[10px]'>Sphere</label>
                        <input
                          type='number'
                          step='0.25'
                          className='input text-sm py-2'
                          placeholder='-2.50'
                          value={data.le_sphere}
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
                          value={data.le_cylinder}
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
                          value={data.le_axis}
                          onChange={(e) => update({ le_axis: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 4. Medical History ───────────────────────────── */}
              <div className='card p-6'>
                <SectionHeading>Medical History</SectionHeading>
                <p className='text-xs mb-4' style={{ color: 'rgba(143,191,110,0.4)' }}>
                  Separate multiple entries with commas. Type "none" or leave blank if not applicable.
                </p>
                <div className='space-y-4'>
                  <div>
                    <label className='label'>Existing conditions</label>
                    <input
                      className='input'
                      value={data.conditions}
                      onChange={(e) => update({ conditions: e.target.value })}
                      placeholder='Hypertension, Type 2 Diabetes…'
                    />
                  </div>
                  <div>
                    <label className='label'>Current medications</label>
                    <input
                      className='input'
                      value={data.medications}
                      onChange={(e) => update({ medications: e.target.value })}
                      placeholder='Metformin, Amlodipine…'
                    />
                  </div>
                  <div>
                    <label className='label'>Known allergies</label>
                    <input
                      className='input'
                      value={data.allergies}
                      onChange={(e) => update({ allergies: e.target.value })}
                      placeholder='Penicillin, Sulfa drugs, Nuts…'
                    />
                  </div>
                  <div>
                    <label className='label'>Past surgeries</label>
                    <input
                      className='input'
                      value={data.surgeries}
                      onChange={(e) => update({ surgeries: e.target.value })}
                      placeholder='Appendectomy 2019, Knee surgery…'
                    />
                  </div>
                  <div>
                    <label className='label'>Family medical history</label>
                    <input
                      className='input'
                      value={data.family_history}
                      onChange={(e) => update({ family_history: e.target.value })}
                      placeholder='Father: heart disease, Mother: diabetes…'
                    />
                    <p className='text-xs mt-1.5' style={{ color: 'rgba(143,191,110,0.4)' }}>
                      Helps AI flag hereditary risks
                    </p>
                  </div>
                </div>
              </div>

              {/* ── 5. Diet ──────────────────────────────────────── */}
              <div className='card p-6'>
                <SectionHeading>Diet &amp; Lifestyle</SectionHeading>
                <div className='space-y-4'>
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
                            background: data.diet_type === t.id
                              ? 'rgba(143,191,110,0.12)'
                              : 'rgba(16,20,18,0.6)',
                            border: `1px solid ${data.diet_type === t.id
                              ? 'rgba(143,191,110,0.4)'
                              : 'rgba(143,191,110,0.08)'}`,
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
                      value={data.cuisine_region}
                      onChange={(e) => update({ cuisine_region: e.target.value })}
                      placeholder='South Indian, North Indian…'
                    />
                  </div>
                  <div>
                    <label className='label'>Dietary restrictions</label>
                    <input
                      className='input'
                      value={data.diet_restrictions}
                      onChange={(e) => update({ diet_restrictions: e.target.value })}
                      placeholder='Gluten-free, No onion/garlic…'
                    />
                  </div>
                </div>
              </div>

              {/* ── Submit ───────────────────────────────────────── */}
              <Divider />

              <button
                type='submit'
                disabled={submitting}
                className='btn-primary w-full flex items-center justify-center gap-2 py-3'
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className='animate-spin' />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>

              <p
                className='text-center text-xs pb-6'
                style={{ color: 'rgba(143,191,110,0.35)' }}
              >
                Changes apply to all AI recommendations immediately.
              </p>

            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
