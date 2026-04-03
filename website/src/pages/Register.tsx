import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HexColorPicker } from 'react-colorful'
import { supabase } from '../lib/supabase'
import PhoneMockup from '../components/PhoneMockup'
import toast from 'react-hot-toast'

const APP_URL = import.meta.env.VITE_APP_URL || 'https://glowloyalty.netlify.app'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
}

const FONTS = ['Cormorant Garamond', 'Playfair Display', 'DM Sans']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Step 1
  const [salonName, setSalonName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [slug, setSlug] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [primary, setPrimary] = useState('#C9A84C')
  const [secondary, setSecondary] = useState('#1a1a1a')
  const [font, setFont] = useState('Cormorant Garamond')
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false)
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false)

  // Step 3
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'basic' | 'pro'>('trial')
  const [loading, setLoading] = useState(false)

  const handleSalonName = (v: string) => {
    setSalonName(v)
    setSlug(slugify(v))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  const handleFinish = async () => {
    if (!salonName || !ownerName || !email || !password || !slug) {
      toast.error('Izpolnite vsa obvezna polja'); return
    }
    setLoading(true)
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError

      // Upload logo if provided
      let logoUrl: string | null = null
      if (logoFile && authData.user) {
        const ext = logoFile.name.split('.').pop()
        const path = `${authData.user.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
          logoUrl = urlData.publicUrl
        }
      }

      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      // Insert salon
      const { data: salon, error: salonError } = await supabase.from('salons').insert({
        slug, salon_name: salonName, owner_email: email, owner_name: ownerName,
        logo_url: logoUrl, primary_color: primary, secondary_color: secondary,
        font_family: font, city: city || null, phone: phone || null,
        plan: selectedPlan, active: selectedPlan === 'trial',
        trial_ends_at: trialEnd,
      }).select().single()
      if (salonError) throw salonError

      // Insert staff (owner)
      if (authData.user) {
        await supabase.from('staff').insert({
          salon_id: salon.id, name: ownerName, email,
          role: 'owner', supabase_user_id: authData.user.id,
        })
      }

      toast.success('Salon uspešno ustvarjen!')
      navigate('/dashboard')
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Napaka pri registraciji')
    } finally {
      setLoading(false)
    }
  }

  const stepVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Left panel */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 max-w-2xl mx-auto w-full">
        <div className="mb-10">
          <Link to="/" className="text-[#C9A84C] text-xl tracking-widest uppercase" style={{ fontFamily: 'Cormorant Garamond' }}>
            GlowLoyalty
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {[1, 2, 3].map((n, i) => (
            <div key={n} className="flex items-center">
              <div className={`w-8 h-8 flex items-center justify-center text-xs font-semibold transition-all ${
                step >= n ? 'bg-[#C9A84C] text-[#080808]' : 'bg-[#1a1a1a] text-[#4a4040]'
              }`}>
                {step > n ? '✓' : n}
              </div>
              {i < 2 && <div className={`w-16 h-px ${step > n ? 'bg-[#C9A84C]' : 'bg-[#1a1a1a]'}`} />}
            </div>
          ))}
          <span className="ml-4 text-xs text-[#6B6050]">
            {step === 1 ? 'Račun' : step === 2 ? 'Personalizacija' : 'Plan'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-3xl font-light mb-1 text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Ustvarite račun</h2>
              <p className="text-sm text-[#6B6050] mb-8">Povedite nam o vašem salonu</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Ime salona *</label>
                  <input value={salonName} onChange={(e) => handleSalonName(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#333]"
                    placeholder="Salon Aurora" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Vaše ime *</label>
                  <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#333]"
                    placeholder="Ana Novak" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#333]"
                    placeholder="ana@salon.si" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Geslo *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#333]"
                    placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Vaš link</label>
                  <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))}
                    className="w-full bg-[#0d0d0d] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors font-mono"
                    placeholder="salon-aurora" />
                  {slug && (
                    <p className="mt-1.5 text-xs text-[#4a4040] font-mono">{APP_URL}/app/<span className="text-[#C9A84C]">{slug}</span></p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Mesto</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#333]"
                      placeholder="Ljubljana" />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Telefon</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#333]"
                      placeholder="+386 40 000 000" />
                  </div>
                </div>
                <button onClick={() => {
                  if (!salonName || !ownerName || !email || !password) { toast.error('Izpolnite vsa obvezna polja'); return }
                  setStep(2)
                }} className="w-full py-3.5 bg-[#C9A84C] text-[#080808] font-semibold text-sm hover:bg-[#E8C76A] transition-all mt-2">
                  Naprej →
                </button>
              </div>
              <p className="mt-6 text-center text-sm text-[#6B6050]">
                Že imate račun?{' '}
                <Link to="/prijava" className="text-[#C9A84C] hover:text-[#E8C76A]">Prijavite se</Link>
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-3xl font-light mb-1 text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Personalizirajte</h2>
              <p className="text-sm text-[#6B6050] mb-8">Prilagodite videz vaše aplikacije</p>
              <div className="space-y-6">
                {/* Logo */}
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Logo</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="logo" className="w-12 h-12 object-contain bg-[#111] p-1" />
                    ) : (
                      <div className="w-12 h-12 border border-dashed border-[#333] flex items-center justify-center text-[#333] text-xl">+</div>
                    )}
                    <label className="cursor-pointer px-4 py-2 border border-[#333] text-xs text-[#6B6050] hover:border-[#C9A84C] hover:text-[#F5F0E8] transition-all">
                      Naloži sliko
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Primarna barva</label>
                    <div className="relative">
                      <button onClick={() => { setShowPrimaryPicker(!showPrimaryPicker); setShowSecondaryPicker(false) }}
                        className="flex items-center gap-3 w-full border border-[#222] px-3 py-2.5 hover:border-[#C9A84C] transition-colors">
                        <div className="w-5 h-5" style={{ background: primary }} />
                        <span className="font-mono text-xs text-[#8A8070]">{primary.toUpperCase()}</span>
                      </button>
                      {showPrimaryPicker && (
                        <div className="absolute top-full left-0 mt-1 z-20 p-3 bg-[#111] border border-[#222] shadow-2xl">
                          <HexColorPicker color={primary} onChange={setPrimary} />
                          <button onClick={() => setShowPrimaryPicker(false)} className="mt-2 w-full text-xs text-[#6B6050] hover:text-white py-1">Zapri</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Sekundarna barva</label>
                    <div className="relative">
                      <button onClick={() => { setShowSecondaryPicker(!showSecondaryPicker); setShowPrimaryPicker(false) }}
                        className="flex items-center gap-3 w-full border border-[#222] px-3 py-2.5 hover:border-[#C9A84C] transition-colors">
                        <div className="w-5 h-5" style={{ background: secondary }} />
                        <span className="font-mono text-xs text-[#8A8070]">{secondary.toUpperCase()}</span>
                      </button>
                      {showSecondaryPicker && (
                        <div className="absolute top-full left-0 mt-1 z-20 p-3 bg-[#111] border border-[#222] shadow-2xl">
                          <HexColorPicker color={secondary} onChange={setSecondary} />
                          <button onClick={() => setShowSecondaryPicker(false)} className="mt-2 w-full text-xs text-[#6B6050] hover:text-white py-1">Zapri</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Font */}
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Pisava</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FONTS.map((f) => (
                      <button key={f} onClick={() => setFont(f)}
                        className={`py-2.5 text-xs border transition-all ${font === f ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#222] text-[#6B6050] hover:border-[#444]'}`}
                        style={{ fontFamily: f }}>
                        {f.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-6 py-3.5 border border-[#333] text-[#6B6050] text-sm hover:border-[#555] transition-all">
                    ← Nazaj
                  </button>
                  <button onClick={() => setStep(3)} className="flex-1 py-3.5 bg-[#C9A84C] text-[#080808] font-semibold text-sm hover:bg-[#E8C76A] transition-all">
                    Naprej →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-3xl font-light mb-1 text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Izberite plan</h2>
              <p className="text-sm text-[#6B6050] mb-8">Začnete lahko brezplačno</p>
              <div className="space-y-3 mb-6">
                {([
                  { key: 'trial', name: 'Preizkus', price: '0€', sub: '14 dni', features: ['Loyalty program', 'Rezervacije', 'Personalizacija', 'Link do aplikacije'] },
                  { key: 'basic', name: 'Basic', price: '29€', sub: '/mes', features: ['Vse iz Preizkusa', 'Brez časovne omejitve', 'Email podpora'] },
                  { key: 'pro', name: 'Pro', price: '59€', sub: '/mes', features: ['Vse iz Basic', 'Priority podpora', 'Analytics'] },
                ] as const).map((p) => (
                  <button key={p.key} onClick={() => setSelectedPlan(p.key)}
                    className={`w-full text-left p-5 border transition-all ${selectedPlan === p.key ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#1a1a1a] hover:border-[#333]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 border ${selectedPlan === p.key ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-[#444]'} flex items-center justify-center`}>
                          {selectedPlan === p.key && <span className="text-[#080808] text-[10px] font-bold">✓</span>}
                        </div>
                        <span className="text-sm font-semibold text-[#F5F0E8]">{p.name}</span>
                      </div>
                      <span className="text-[#C9A84C] text-sm font-semibold">{p.price}<span className="text-[#6B6050] font-normal text-xs">{p.sub}</span></span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 ml-7">
                      {p.features.map((f) => <span key={f} className="text-xs text-[#6B6050]">✓ {f}</span>)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-6 py-3.5 border border-[#333] text-[#6B6050] text-sm hover:border-[#555] transition-all">
                  ← Nazaj
                </button>
                <button onClick={handleFinish} disabled={loading}
                  className="flex-1 py-3.5 bg-[#C9A84C] text-[#080808] font-semibold text-sm hover:bg-[#E8C76A] transition-all disabled:opacity-50">
                  {loading ? 'Ustvarjam salon...' : selectedPlan === 'trial' ? 'Začni preizkus' : 'Nadaljuj na plačilo'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right panel — live preview (desktop only) */}
      {step === 2 && (
        <div className="hidden lg:flex w-96 border-l border-[#111] items-center justify-center bg-[#050505] flex-col gap-6 px-8">
          <p className="text-xs tracking-widest uppercase text-[#6B6050]">Predogled</p>
          <PhoneMockup primaryColor={primary} salonName={salonName || 'Vaš Salon'} />
          <p className="text-xs text-[#333] text-center">Spremembe se odražajo v realnem času</p>
        </div>
      )}
    </div>
  )
}
