'use client'
import { apiFetch } from '@/lib/api'
import { storeAuthSession } from '@/lib/auth-session'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fbPixel } from '@/components/FacebookPixel'
import { Building2, Palette, Truck, User, ChevronRight, ChevronLeft, Loader2, ShieldCheck, CheckCircle } from 'lucide-react'

const ROLES = [
  { value: 'customer', label: 'Хэрэглэгч', desc: 'Хэвлэлийн захиалга өгөх', icon: User, color: '#3B82F6' },
  { value: 'vendor', label: 'Борлуулагч', desc: 'Бүтээгдэхүүн борлуулах', icon: Building2, color: '#10B981' },
  { value: 'factory', label: 'Үйлдвэр', desc: 'Хэвлэлийн үйлдвэр', icon: Building2, color: '#8B5CF6' },
  { value: 'designer', label: 'Дизайнер', desc: 'Дизайн хийж өгөх', icon: Palette, color: '#F59E0B' },
  { value: 'courier', label: 'Жолооч', desc: 'Хүргэлтийн үйлчилгээ', icon: Truck, color: '#EF4444' },
]

const BUSINESS_ROLES = ['vendor', 'factory', 'sales']
const DESIGNER_ROLES = ['designer', 'creator']
const DRIVER_ROLES = ['courier']

const inp = "w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-4 py-3 text-sm text-[#F1F5F9] outline-none focus:border-[#FF6B00] transition-colors"

interface RegisterRequest {
  [key: string]: string | undefined
  email: string
  password: string
  full_name: string
  phone?: string
  role: string
  referral_code?: string
  company_name?: string
  register_number?: string
  tax_id?: string
  bank_name?: string
  bank_account?: string
  bank_account_name?: string
  office_address?: string
  portfolio_url?: string
  professional_bio?: string
  driver_license_number?: string
  vehicle_plate_number?: string
  vehicle_type?: string
  insurance_details?: string
}

interface RegisterResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: {
    id?: string
    email?: string
    full_name?: string
    role?: string
  }
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : ''

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Sales agent referral code: persisted across step navigation via state +
  // localStorage so the user could browse around (or refresh) before
  // signing up and we'd still credit the right agent.
  const [referralCode, setReferralCode] = useState<string>('')
  useEffect(() => {
    const fromUrl = searchParams.get('ref')?.trim().toUpperCase()
    const fromStorage = (typeof window !== 'undefined') ? localStorage.getItem('bp_referral_code') : null
    const code = fromUrl || fromStorage || ''
    if (!code) return
    const timer = window.setTimeout(() => {
      setReferralCode(code)
    }, 0)
    try { localStorage.setItem('bp_referral_code', code) } catch {}
    return () => window.clearTimeout(timer)
  }, [searchParams])
  const [step, setStep] = useState(0) // 0=role, 1=basic, 2=role-specific, 3=done
  const [role, setRole] = useState('customer')
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirmPassword: '',
    // Business
    company_name: '', register_number: '', tax_id: '', bank_name: '', bank_account: '', bank_account_name: '', office_address: '',
    // Designer
    portfolio_url: '', professional_bio: '',
    // Courier
    driver_license_number: '', vehicle_plate_number: '', vehicle_type: '', insurance_details: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const needsRoleFields = BUSINESS_ROLES.includes(role) || DESIGNER_ROLES.includes(role) || DRIVER_ROLES.includes(role)
  const totalSteps = needsRoleFields ? 3 : 2

  const validateBasic = () => {
    if (!form.full_name.trim()) return 'Бүтэн нэрээ оруулна уу'
    if (!form.email.trim()) return 'Имэйл оруулна уу'
    if (form.password.length < 8) return 'Нууц үг хамгийн багадаа 8 тэмдэгт'
    if (form.password !== form.confirmPassword) return 'Нууц үг таарахгүй байна'
    return ''
  }

  const validateRoleFields = () => {
    if (BUSINESS_ROLES.includes(role)) {
      if (!form.company_name.trim()) return 'Компанийн нэр заавал шаардлагатай'
      if (!form.register_number.trim()) return 'Регистрийн дугаар заавал шаардлагатай'
    }
    if (DESIGNER_ROLES.includes(role)) {
      if (!form.portfolio_url.trim() && !form.professional_bio.trim()) return 'Портфолио эсвэл танилцуулга заавал шаардлагатай'
    }
    if (DRIVER_ROLES.includes(role)) {
      if (!form.driver_license_number.trim()) return 'Жолооны үнэмлэхний дугаар заавал'
      if (!form.vehicle_plate_number.trim()) return 'Тээврийн хэрэгслийн улсын дугаар заавал'
    }
    return ''
  }

  const nextStep = () => {
    setError('')
    if (step === 1) {
      const err = validateBasic()
      if (err) { setError(err); return }
    }
    if (step === 2 && needsRoleFields) {
      const err = validateRoleFields()
      if (err) { setError(err); return }
    }
    if ((step === 1 && !needsRoleFields) || (step === 2 && needsRoleFields)) {
      submitRegister()
      return
    }
    setStep(s => s + 1)
  }

  const submitRegister = async () => {
    setLoading(true); setError('')
    try {
      const body: RegisterRequest = {
        email: form.email, password: form.password, full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined, role,
        referral_code: referralCode || undefined,
      }
      if (BUSINESS_ROLES.includes(role)) {
        Object.assign(body, {
          company_name: form.company_name, register_number: form.register_number,
          tax_id: form.tax_id || undefined, bank_name: form.bank_name || undefined,
          bank_account: form.bank_account || undefined, bank_account_name: form.bank_account_name || undefined,
          office_address: form.office_address || undefined,
        })
      }
      if (DESIGNER_ROLES.includes(role)) {
        Object.assign(body, {
          portfolio_url: form.portfolio_url || undefined,
          professional_bio: form.professional_bio || undefined,
        })
      }
      if (DRIVER_ROLES.includes(role)) {
        Object.assign(body, {
          driver_license_number: form.driver_license_number,
          vehicle_plate_number: form.vehicle_plate_number,
          vehicle_type: form.vehicle_type || undefined,
          insurance_details: form.insurance_details || undefined,
        })
      }

      const data = await apiFetch<RegisterResponse>('/auth/register', { method: 'POST', body, auth: false })
      if (data.access_token) {
        storeAuthSession(data)
        try { localStorage.removeItem('bp_referral_code') } catch {}
        fbPixel.completeRegistration()
        setStep(totalSteps + 1) // success step
        setTimeout(() => {
          if (role === 'customer') router.push('/dashboard/customer')
          else router.push('/dashboard')
        }, 2000)
      }
    } catch (e: unknown) {
      const message = errorMessage(e)
      setError(message.includes('409') ? 'Энэ имэйл бүртгэлтэй байна' : (message || 'Серверт холбогдож чадсангүй'))
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", background: '#0A0A0A' }}>

      {/* Left brand panel */}
      <div className="hide-mobile flex-[0_0_52%] relative overflow-hidden flex flex-col justify-between p-12" style={{ borderRight: '1px solid #1A1A1A' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0A0A0A, #111)' }}/>
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'rgba(255,107,0,0.08)', filter: 'blur(100px)' }}/>
        <div className="relative z-10">
          <Link href="/" className="text-[22px] font-bold text-[#F1F5F9] no-underline"><span className="text-[#FF6B00]">Biz</span>Print</Link>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 mb-7" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
            <div className="w-[7px] h-[7px] rounded-full bg-[#FF6B00]"/>
            <span className="text-xs text-[#FF6B00] font-medium">Хэвлэлийн платформ</span>
          </div>
          <h1 className="text-[48px] font-bold text-[#F1F5F9] leading-[1.1] tracking-[-1.5px] mb-5">
            Захиалга бүхэн,<br/><span className="text-[#FF6B00]">нэг дор</span>
          </h1>
          <p className="text-[15px] text-[#666] leading-relaxed max-w-[360px]">
            AI-д суурилсан үнийн тооцоо, автомат үйлдвэр сонголт, бодит цагийн хүргэлт — бүгд нэг платформд.
          </p>
        </div>
        <div className="relative z-10 pt-7 flex gap-9" style={{ borderTop: '1px solid #1A1A1A' }}>
          {[{ v: '250+', l: 'Захиалга' }, { v: '3', l: 'Үйлдвэр' }, { v: '99%', l: 'Сэтгэл ханамж' }].map(st => (
            <div key={st.l}><div className="text-2xl font-bold text-[#FF6B00]">{st.v}</div><div className="text-xs text-[#555] mt-0.5">{st.l}</div></div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10" style={{ background: '#111' }}>
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="show-mobile mb-8 text-center">
            <Link href="/" className="text-[22px] font-bold text-[#F1F5F9] no-underline"><span className="text-[#FF6B00]">Biz</span>Print</Link>
          </div>

          <div className="mb-6">
            <h2 className="text-[26px] font-bold text-[#F1F5F9] mb-1 tracking-[-0.5px]">Бүртгүүлэх</h2>
            <p className="text-sm text-[#555]">
              Бүртгэлтэй юу? <Link href="/login" className="text-[#FF6B00] no-underline font-medium">Нэвтрэх</Link>
            </p>
          </div>

          {/* Step indicator */}
          {step <= totalSteps && (
            <div className="flex gap-2 mb-6">
              {Array.from({ length: totalSteps + 1 }, (_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i <= step ? '#FF6B00' : '#2A2A2A' }}/>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-[10px] text-sm text-[#e24b4a]" style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)' }}>
              {error}
            </div>
          )}

          {/* ═══ STEP 0: Role Selection ═══ */}
          {step === 0 && (
            <div>
              <p className="text-xs text-[#888] mb-3 font-medium">Та ямар зорилгоор бүртгүүлэх вэ?</p>
              <div className="flex flex-col gap-2">
                {ROLES.map(r => {
                  const Icon = r.icon
                  const active = role === r.value
                  return (
                    <button key={r.value} onClick={() => setRole(r.value)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer"
                      style={{
                        border: `1px solid ${active ? r.color : '#2A2A2A'}`,
                        background: active ? `${r.color}10` : '#1A1A1A',
                      }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${r.color}15` }}>
                        <Icon className="w-4.5 h-4.5" style={{ color: r.color }} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#F1F5F9]">{r.label}</div>
                        <div className="text-[11px] text-[#666]">{r.desc}</div>
                      </div>
                      {active && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: r.color }}><CheckCircle className="w-3 h-3 text-white" /></div>}
                    </button>
                  )
                })}
              </div>
              <button onClick={nextStep} className="w-full mt-5 py-3.5 bg-[#FF6B00] text-white rounded-[10px] text-[15px] font-semibold cursor-pointer hover:bg-[#E55D00] transition-colors flex items-center justify-center gap-2">
                Үргэлжлүүлэх <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ═══ STEP 1: Basic Info ═══ */}
          {step === 1 && (
            <div>
              <div className="mb-3">
                <label className="block text-xs text-[#888] mb-2 font-medium">Бүтэн нэр *</label>
                <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Овог нэр" className={inp} autoFocus />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-[#888] mb-2 font-medium">Имэйл *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className={inp} />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-[#888] mb-2 font-medium">Утас</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="99112233" className={inp} />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-[#888] mb-2 font-medium">Нууц үг * <span className="text-[#444] font-normal">(8+ тэмдэгт)</span></label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" className={`${inp} pr-14`} />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#555] text-[11px] font-semibold tracking-wider">
                    {showPass ? 'НУУХ' : 'ХАРАХ'}
                  </button>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs text-[#888] mb-2 font-medium">Нууц үг давтах *</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="••••••••" className={inp} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-5 py-3 rounded-[10px] text-sm font-medium cursor-pointer transition-colors" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextStep} disabled={loading} className="flex-1 py-3 bg-[#FF6B00] text-white rounded-[10px] text-[15px] font-semibold cursor-pointer hover:bg-[#E55D00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : needsRoleFields ? <>Үргэлжлүүлэх <ChevronRight className="w-4 h-4" /></> : 'Бүртгүүлэх'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Role-specific fields ═══ */}
          {step === 2 && needsRoleFields && (
            <>
              {BUSINESS_ROLES.includes(role) && (
                <>
                  <p className="text-xs text-[#FF6B00] font-semibold mb-3 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Байгууллагын мэдээлэл</p>
                  <div className="mb-3"><label className="block text-xs text-[#888] mb-2 font-medium">Компанийн нэр *</label><input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="ХХК нэр" className={inp} autoFocus /></div>
                  <div className="mb-3"><label className="block text-xs text-[#888] mb-2 font-medium">Регистрийн дугаар *</label><input value={form.register_number} onChange={e => set('register_number', e.target.value)} placeholder="1234567" className={inp} /></div>
                  <div className="mb-3"><label className="block text-xs text-[#888] mb-2 font-medium">ТТД (Татварын дугаар)</label><input value={form.tax_id} onChange={e => set('tax_id', e.target.value)} className={inp} /></div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><label className="block text-xs text-[#888] mb-2 font-medium">Банкны нэр</label><input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs text-[#888] mb-2 font-medium">Дансны дугаар</label><input value={form.bank_account} onChange={e => set('bank_account', e.target.value)} className={inp} /></div>
                  </div>
                  <div className="mb-3"><label className="block text-xs text-[#888] mb-2 font-medium">Дансны нэр</label><input value={form.bank_account_name} onChange={e => set('bank_account_name', e.target.value)} className={inp} /></div>
                  <div className="mb-4"><label className="block text-xs text-[#888] mb-2 font-medium">Оффис/Агуулахын хаяг</label><input value={form.office_address} onChange={e => set('office_address', e.target.value)} className={inp} /></div>
                </>
              )}
              {DESIGNER_ROLES.includes(role) && (
                <>
                  <p className="text-xs text-[#F59E0B] font-semibold mb-3 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Мэргэжлийн мэдээлэл</p>
                  <div className="mb-3"><label className="block text-xs text-[#888] mb-2 font-medium">Портфолио линк *</label><input value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} placeholder="https://behance.net/..." className={inp} autoFocus /></div>
                  <div className="mb-4"><label className="block text-xs text-[#888] mb-2 font-medium">Мэргэжлийн танилцуулга *</label><textarea value={form.professional_bio} onChange={e => set('professional_bio', e.target.value)} placeholder="Туршлага, ур чадвар..." className={`${inp} min-h-[80px] resize-y`} /></div>
                </>
              )}
              {DRIVER_ROLES.includes(role) && (
                <>
                  <p className="text-xs text-[#EF4444] font-semibold mb-3 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Жолоочийн мэдээлэл</p>
                  <div className="mb-3"><label className="block text-xs text-[#888] mb-2 font-medium">Жолооны үнэмлэхний дугаар *</label><input value={form.driver_license_number} onChange={e => set('driver_license_number', e.target.value)} className={inp} autoFocus /></div>
                  <div className="mb-3"><label className="block text-xs text-[#888] mb-2 font-medium">Улсын дугаар *</label><input value={form.vehicle_plate_number} onChange={e => set('vehicle_plate_number', e.target.value)} placeholder="1234 УНА" className={inp} /></div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div><label className="block text-xs text-[#888] mb-2 font-medium">Тээврийн хэрэгслийн төрөл</label><input value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)} placeholder="Портер, Фургон" className={inp} /></div>
                    <div><label className="block text-xs text-[#888] mb-2 font-medium">Даатгал</label><input value={form.insurance_details} onChange={e => set('insurance_details', e.target.value)} className={inp} /></div>
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-5 py-3 rounded-[10px] text-sm font-medium cursor-pointer" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextStep} disabled={loading} className="flex-1 py-3 bg-[#FF6B00] text-white rounded-[10px] text-[15px] font-semibold cursor-pointer hover:bg-[#E55D00] disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Бүртгүүлэх'}
                </button>
              </div>
            </>
          )}

          {/* ═══ SUCCESS ═══ */}
          {step > totalSteps && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: role === 'customer' ? 'rgba(16,185,129,0.15)' : 'rgba(255,107,0,0.15)' }}>
                {role === 'customer'
                  ? <CheckCircle className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
                  : <ShieldCheck className="w-8 h-8 text-[#FF6B00]" strokeWidth={1.5} />}
              </div>
              <h3 className="text-lg font-bold text-[#F1F5F9] mb-2">Бүртгэл амжилттай!</h3>
              {role === 'customer' ? (
                <p className="text-sm text-[#666]">Dashboard руу шилжиж байна...</p>
              ) : (
                <div>
                  <p className="text-sm text-[#FF6B00] font-medium mb-2">Баталгаажуулалт хүлээгдэж байна</p>
                  <p className="text-xs text-[#555] leading-relaxed">
                    Таны бүртгэлийг админ шалгаж баталгаажуулсны дараа бүрэн хандалт нээгдэнэ.
                    Имэйл хаягаар мэдэгдэл илгээнэ.
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="mt-5 text-[11px] text-[#333] text-center leading-relaxed">
            Бүртгүүлснээр үйлчилгээний нөхцөлийг зөвшөөрсөнд тооцно.
          </p>
        </div>
      </div>
    </div>
  )
}
