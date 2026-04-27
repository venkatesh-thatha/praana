import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/api/client'
import { useProfileStore } from '@/store/profileStore'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const DIET_TYPES = ['veg', 'non_veg', 'vegan', 'eggetarian']
const STATES = ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana', 'Maharashtra', 'Gujarat', 'Delhi', 'West Bengal', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Punjab', 'Other']

const steps = [
  { title: 'Personal Details', subtitle: 'Basic demographic information' },
  { title: 'Physical Profile', subtitle: 'Height, weight and blood type' },
  { title: 'Medical History', subtitle: 'Existing conditions and medications' },
  { title: 'Diet & Preferences', subtitle: 'Dietary type and restrictions' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { setProfile } = useProfileStore()

  const update = (fields: Record<string, any>) => setData((prev) => ({ ...prev, ...fields }))

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const submit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        personal: {
          name: data.name,
          dob: data.dob,
          gender: data.gender,
          height_cm: data.height_cm ? parseFloat(data.height_cm) : undefined,
          weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : undefined,
          blood_type: data.blood_type,
          city: data.city,
          state: data.state,
          language_pref: data.language_pref || 'en',
        },
        medical_history: {
          conditions: data.conditions ? data.conditions.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          medications: data.medications ? data.medications.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          allergies: data.allergies ? data.allergies.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          surgeries: [],
        },
        diet: {
          type: data.diet_type,
          restrictions: data.diet_restrictions ? data.diet_restrictions.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          cuisine_region: data.cuisine_region,
        },
      }
      const res = await apiClient.post('/profile', payload)
      // Fetch full profile
      const profileRes = await apiClient.get(`/profile/${res.data.user_id}`)
      setProfile(profileRes.data)
      toast.success('Profile saved!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-8'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='flex items-center gap-2 mb-8 justify-center'>
          <Heart className='text-teal-400' size={24} />
          <span className='text-xl font-bold text-white'>Praana</span>
        </div>

        {/* Step indicator */}
        <div className='flex items-center justify-between mb-8'>
          {steps.map((s, i) => (
            <div key={i} className='flex items-center'>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < step ? 'bg-teal-600 text-white' : i === step ? 'bg-teal-600 text-white ring-4 ring-teal-600/30' : 'bg-slate-700 text-slate-400'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 sm:w-12 mx-1 ${i < step ? 'bg-teal-600' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className='card'>
          <h2 className='text-lg font-semibold text-white mb-0.5'>{steps[step].title}</h2>
          <p className='text-sm text-slate-400 mb-5'>{steps[step].subtitle}</p>

          {/* Step 0: Personal */}
          {step === 0 && (
            <div className='space-y-4'>
              <div>
                <label className='label'>Full Name *</label>
                <input className='input' defaultValue={data.name} onBlur={(e) => update({ name: e.target.value })} placeholder='Venkatesh Kumar' />
              </div>
              <div>
                <label className='label'>Date of Birth</label>
                <input type='date' className='input' defaultValue={data.dob} onBlur={(e) => update({ dob: e.target.value })} />
              </div>
              <div>
                <label className='label'>Gender</label>
                <select className='input' defaultValue={data.gender} onChange={(e) => update({ gender: e.target.value })}>
                  <option value=''>Select...</option>
                  <option value='male'>Male</option>
                  <option value='female'>Female</option>
                  <option value='other'>Other</option>
                </select>
              </div>
              <div>
                <label className='label'>Preferred Language</label>
                <select className='input' defaultValue={data.language_pref || 'en'} onChange={(e) => update({ language_pref: e.target.value })}>
                  <option value='en'>English</option>
                  <option value='hi'>हिंदी</option>
                  <option value='ta'>தமிழ்</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Physical */}
          {step === 1 && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='label'>Height (cm)</label>
                  <input type='number' className='input' defaultValue={data.height_cm} onBlur={(e) => update({ height_cm: e.target.value })} placeholder='170' />
                </div>
                <div>
                  <label className='label'>Weight (kg)</label>
                  <input type='number' className='input' defaultValue={data.weight_kg} onBlur={(e) => update({ weight_kg: e.target.value })} placeholder='65' />
                </div>
              </div>
              <div>
                <label className='label'>Blood Type</label>
                <select className='input' defaultValue={data.blood_type} onChange={(e) => update({ blood_type: e.target.value })}>
                  <option value=''>Select...</option>
                  {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className='label'>City</label>
                <input className='input' defaultValue={data.city} onBlur={(e) => update({ city: e.target.value })} placeholder='Bengaluru' />
              </div>
              <div>
                <label className='label'>State</label>
                <select className='input' defaultValue={data.state} onChange={(e) => update({ state: e.target.value })}>
                  <option value=''>Select...</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Medical */}
          {step === 2 && (
            <div className='space-y-4'>
              <div>
                <label className='label'>Existing Conditions</label>
                <input className='input' defaultValue={data.conditions} onBlur={(e) => update({ conditions: e.target.value })} placeholder='Hypertension, Type 2 Diabetes (comma separated)' />
                <p className='text-xs text-slate-500 mt-1'>Separate multiple conditions with commas</p>
              </div>
              <div>
                <label className='label'>Current Medications</label>
                <input className='input' defaultValue={data.medications} onBlur={(e) => update({ medications: e.target.value })} placeholder='Metformin, Amlodipine (comma separated)' />
              </div>
              <div>
                <label className='label'>Known Allergies</label>
                <input className='input' defaultValue={data.allergies} onBlur={(e) => update({ allergies: e.target.value })} placeholder='Penicillin, Sulfa drugs (comma separated)' />
              </div>
            </div>
          )}

          {/* Step 3: Diet */}
          {step === 3 && (
            <div className='space-y-4'>
              <div>
                <label className='label'>Diet Type</label>
                <div className='grid grid-cols-2 gap-2'>
                  {DIET_TYPES.map((t) => (
                    <button
                      key={t}
                      type='button'
                      onClick={() => update({ diet_type: t })}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                        data.diet_type === t ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {t.replace('_', '-')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className='label'>Cuisine Region</label>
                <input className='input' defaultValue={data.cuisine_region} onBlur={(e) => update({ cuisine_region: e.target.value })} placeholder='South Indian, North Indian, etc.' />
              </div>
              <div>
                <label className='label'>Dietary Restrictions</label>
                <input className='input' defaultValue={data.diet_restrictions} onBlur={(e) => update({ diet_restrictions: e.target.value })} placeholder='Gluten-free, No onion/garlic (comma separated)' />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className='flex items-center justify-between mt-6 pt-4 border-t border-slate-700'>
            <button
              onClick={back}
              disabled={step === 0}
              className='flex items-center gap-1 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors'
            >
              <ChevronLeft size={16} /> Back
            </button>

            {step < steps.length - 1 ? (
              <button onClick={next} className='btn-primary flex items-center gap-1'>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className='btn-primary flex items-center gap-1'>
                {submitting ? 'Saving...' : <><Check size={16} /> Complete Setup</>}
              </button>
            )}
          </div>
        </div>

        <p className='text-center text-xs text-slate-500 mt-4'>
          You can update your profile at any time.
        </p>
      </div>
    </div>
  )
}
