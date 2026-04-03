import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HexColorPicker } from 'react-colorful'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, type Salon } from '../lib/supabase'
import PhoneMockup from '../components/PhoneMockup'
import toast from 'react-hot-toast'
import { Copy, ExternalLink, LogOut, LayoutDashboard, Smartphone, Palette, CreditCard, QrCode } from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL || 'https://glowloyalty.netlify.app'
const FONTS = ['Cormorant Garamond', 'Playfair Display', 'DM Sans']

type Tab = 'overview' | 'app' | 'customize' | 'subscription'

const NAV: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'overview', label: 'Pregled', Icon: LayoutDashboard },
  { id: 'app', label: 'Moja aplikacija', Icon: Smartphone },
  { id: 'customize', label: 'Personalizacija', Icon: Palette },
  { id: 'subscription', label: 'Naročnina', Icon: CreditCard },
]

const PLAN_LABELS: Record<string, string> = { trial: 'Preizkus', basic: 'Basic', pro: 'Pro' }
const PLAN_COLORS: Record<string, string> = { trial: '#6B6050', basic: '#C9A84C', pro: '#E8C76A' }

export default function Dashboard() {
  const navigate = useNavigate()
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [mobile, setMobile] = useState(false)

  // Customize form state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [primary, setPrimary] = useState('#C9A84C')
  const [secondary, setSecondary] = useState('#1a1a1a')
  const [font, setFont] = useState('Cormorant Garamond')
  const [showPrimary, setShowPrimary] = useState(false)
  const [showSecondary, setShowSecondary] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const { data } = await supabase.from('salons').select('*').eq('owner_email', session.user.email).single()
      if (data) {
        setSalon(data)
        setPrimary(data.primary_color)
        setSecondary(data.secondary_color)
        setFont(data.font_family)
        setLogoPreview(data.logo_url || '')
      }
      setLoading(false)
    }
    load()
  }, [navigate])

  const appUrl = salon ? `${APP_URL}/app/${salon.slug}` : ''

  const copyUrl = () => { navigator.clipboard.writeText(appUrl); toast.success('Link kopiran!') }

  const trialDaysLeft = salon?.plan === 'trial' && salon.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(salon.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setLogoFile(f); setLogoPreview(URL.createObjectURL(f))
  }

  const handleSaveCustomize = async () => {
    if (!salon) return
    setSaving(true)
    try {
      let logoUrl = salon.logo_url
      if (logoFile) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const ext = logoFile.name.split('.').pop()
          const path = `${session.user.id}.${ext}`
          await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
          const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
          logoUrl = urlData.publicUrl
        }
      }
      const { error } = await supabase.from('salons').update({
        primary_color: primary, secondary_color: secondary, font_family: font, logo_url: logoUrl,
      }).eq('id', salon.id)
      if (error) throw error
      setSalon((s) => s ? { ...s, primary_color: primary, secondary_color: secondary, font_family: font, logo_url: logoUrl } : s)
      toast.success('Spremembe shranjene')
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally { setSaving(false) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut(); navigate('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Sidebar */}
      <aside className={`${mobile ? 'hidden' : ''} md:flex flex-col w-56 border-r border-[#111] bg-[#050505] fixed top-0 left-0 bottom-0 z-40`}>
        <div className="px-6 py-6 border-b border-[#111]">
          <p className="text-[#C9A84C] text-base tracking-widest uppercase" style={{ fontFamily: 'Cormorant Garamond' }}>GlowLoyalty</p>
          <p className="text-xs text-[#4a4040] mt-1 truncate">{salon?.salon_name}</p>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                tab === id ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'text-[#6B6050] hover:text-[#F5F0E8] hover:bg-[#111]'
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#111]">
          {salon?.plan && (
            <div className="mb-3 px-4 py-2 bg-[#111] flex items-center justify-between">
              <span className="text-xs text-[#6B6050]">Plan</span>
              <span className="text-xs font-semibold" style={{ color: PLAN_COLORS[salon.plan] }}>{PLAN_LABELS[salon.plan]}</span>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B6050] hover:text-[#F5F0E8] transition-all">
            <LogOut size={15} /> Odjava
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-56 min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-[#111]">
          <p className="text-[#C9A84C] text-sm tracking-widest uppercase" style={{ fontFamily: 'Cormorant Garamond' }}>GlowLoyalty</p>
          <button onClick={() => setMobile(!mobile)} className="text-[#6B6050]">☰</button>
        </div>

        <div className="p-6 md:p-10 max-w-5xl">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-light text-[#F5F0E8] mb-1" style={{ fontFamily: 'Cormorant Garamond' }}>
                    {salon?.salon_name}
                  </h1>
                  {trialDaysLeft !== null && (
                    <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20">
                      <span className="text-xs text-[#C9A84C]">⏳</span>
                      <span className="text-sm text-[#C9A84C]"><strong>{trialDaysLeft}</strong> dni preizkusa ostane</span>
                      <button onClick={() => setTab('subscription')} className="text-xs underline text-[#8A7040] hover:text-[#C9A84C] ml-1">Nadgradi</button>
                    </div>
                  )}
                </div>

                {/* App link */}
                <div className="border border-[#1a1a1a] p-6">
                  <p className="text-xs tracking-widest uppercase text-[#6B6050] mb-3">Vaša aplikacija</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <code className="text-sm text-[#C9A84C] bg-[#0d0d0d] px-3 py-2 font-mono">{appUrl}</code>
                    <button onClick={copyUrl} className="flex items-center gap-1.5 px-3 py-2 border border-[#333] text-xs text-[#6B6050] hover:border-[#C9A84C] hover:text-[#F5F0E8] transition-all">
                      <Copy size={13} /> Kopiraj
                    </button>
                    <a href={appUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 border border-[#333] text-xs text-[#6B6050] hover:border-[#C9A84C] hover:text-[#F5F0E8] transition-all">
                      <ExternalLink size={13} /> Odpri
                    </a>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1a1a1a]">
                  {[
                    { label: 'Skupaj stranke', value: '—' },
                    { label: 'Rezervacije ta mesec', value: '—' },
                    { label: 'Točke podeljene', value: '—' },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#080808] p-6">
                      <p className="text-3xl font-light text-[#F5F0E8] mb-1" style={{ fontFamily: 'Cormorant Garamond' }}>{s.value}</p>
                      <p className="text-xs text-[#4a4040]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── MY APP ── */}
            {tab === 'app' && (
              <div className="space-y-8">
                <h1 className="text-4xl font-light text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Moja aplikacija</h1>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="border border-[#1a1a1a] p-6 space-y-5">
                    <div>
                      <p className="text-xs tracking-widest uppercase text-[#6B6050] mb-3">QR koda</p>
                      <div className="bg-white p-4 inline-block">
                        <QRCodeSVG value={appUrl} size={180} bgColor="#ffffff" fgColor="#080808" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs tracking-widest uppercase text-[#6B6050] mb-3">Link</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm text-[#C9A84C] bg-[#0d0d0d] px-3 py-2 font-mono flex-1 min-w-0 truncate">{appUrl}</code>
                        <button onClick={copyUrl} className="flex items-center gap-1.5 px-3 py-2 border border-[#333] text-xs hover:border-[#C9A84C] transition-all">
                          <Copy size={13} /> Kopiraj
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-[#111] pt-5">
                      <p className="text-xs text-[#6B6050] leading-relaxed">
                        Pošljite ta link vašim strankam ali natisnite QR kodo in jo prilepite v salon.
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <QrCode size={64} className="text-[#C9A84C] mx-auto" />
                      <p className="text-xs text-[#4a4040] max-w-xs">Stranke poskenirajo QR kodo s telefonom in takoj dostopijo do vaše aplikacije</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CUSTOMIZE ── */}
            {tab === 'customize' && (
              <div className="space-y-8">
                <h1 className="text-4xl font-light text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Personalizacija</h1>
                <div className="grid lg:grid-cols-[1fr_280px] gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-3">Logo</label>
                      <div className="flex items-center gap-4">
                        {logoPreview ? (
                          <img src={logoPreview} alt="logo" className="w-12 h-12 object-contain bg-[#111] p-1" />
                        ) : (
                          <div className="w-12 h-12 border border-dashed border-[#333] flex items-center justify-center text-[#333] text-xl">+</div>
                        )}
                        <label className="cursor-pointer px-4 py-2 border border-[#333] text-xs text-[#6B6050] hover:border-[#C9A84C] hover:text-[#F5F0E8] transition-all">
                          Naloži logo
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Primarna barva</label>
                        <div className="relative">
                          <button onClick={() => { setShowPrimary(!showPrimary); setShowSecondary(false) }}
                            className="flex items-center gap-3 w-full border border-[#222] px-3 py-2.5 hover:border-[#C9A84C] transition-colors">
                            <div className="w-5 h-5" style={{ background: primary }} />
                            <span className="font-mono text-xs text-[#8A8070]">{primary.toUpperCase()}</span>
                          </button>
                          {showPrimary && (
                            <div className="absolute top-full left-0 mt-1 z-20 p-3 bg-[#111] border border-[#222] shadow-2xl">
                              <HexColorPicker color={primary} onChange={setPrimary} />
                              <button onClick={() => setShowPrimary(false)} className="mt-2 w-full text-xs text-[#6B6050] hover:text-white py-1">Zapri</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Sekundarna barva</label>
                        <div className="relative">
                          <button onClick={() => { setShowSecondary(!showSecondary); setShowPrimary(false) }}
                            className="flex items-center gap-3 w-full border border-[#222] px-3 py-2.5 hover:border-[#C9A84C] transition-colors">
                            <div className="w-5 h-5" style={{ background: secondary }} />
                            <span className="font-mono text-xs text-[#8A8070]">{secondary.toUpperCase()}</span>
                          </button>
                          {showSecondary && (
                            <div className="absolute top-full left-0 mt-1 z-20 p-3 bg-[#111] border border-[#222] shadow-2xl">
                              <HexColorPicker color={secondary} onChange={setSecondary} />
                              <button onClick={() => setShowSecondary(false)} className="mt-2 w-full text-xs text-[#6B6050] hover:text-white py-1">Zapri</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
                    <button onClick={handleSaveCustomize} disabled={saving}
                      className="px-8 py-3.5 bg-[#C9A84C] text-[#080808] font-semibold text-sm hover:bg-[#E8C76A] transition-all disabled:opacity-50">
                      {saving ? 'Shranjevanje...' : 'Shrani spremembe'}
                    </button>
                  </div>
                  <div className="hidden lg:flex flex-col items-center gap-3">
                    <p className="text-xs tracking-widest uppercase text-[#4a4040]">Predogled</p>
                    <PhoneMockup primaryColor={primary} salonName={salon?.salon_name || 'Vaš Salon'} />
                  </div>
                </div>
              </div>
            )}

            {/* ── SUBSCRIPTION ── */}
            {tab === 'subscription' && (
              <div className="space-y-8">
                <h1 className="text-4xl font-light text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Naročnina</h1>
                <div className="border border-[#1a1a1a] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs tracking-widest uppercase text-[#6B6050] mb-1">Trenutni plan</p>
                      <p className="text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond', color: PLAN_COLORS[salon?.plan || 'trial'] }}>
                        {PLAN_LABELS[salon?.plan || 'trial']}
                      </p>
                    </div>
                    {trialDaysLeft !== null && (
                      <div className="text-right">
                        <p className="text-xs text-[#6B6050]">Poteče čez</p>
                        <p className="text-2xl text-[#C9A84C]" style={{ fontFamily: 'Cormorant Garamond' }}>{trialDaysLeft} dni</p>
                      </div>
                    )}
                  </div>
                  {trialDaysLeft !== null && (
                    <p className="text-xs text-[#6B6050] mb-6">Po koncu preizkusa boste morali izbrati plačljiv plan za nadaljevanje uporabe.</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-px bg-[#1a1a1a]">
                  {[
                    { name: 'Basic', price: '29€/mes', features: ['Brez časovne omejitve', 'Neomejene stranke', 'Email podpora'], key: 'basic' },
                    { name: 'Pro', price: '59€/mes', features: ['Vse iz Basic', 'Priority podpora', 'Analytics'], key: 'pro' },
                  ].map((p) => (
                    <div key={p.key} className="bg-[#080808] p-8">
                      <p className="text-xs tracking-widest uppercase text-[#6B6050] mb-2">{p.name}</p>
                      <p className="text-3xl font-light text-[#C9A84C] mb-4" style={{ fontFamily: 'Cormorant Garamond' }}>{p.price}</p>
                      <ul className="space-y-2 mb-6">
                        {p.features.map((f) => <li key={f} className="text-sm text-[#6B6050]">✓ {f}</li>)}
                      </ul>
                      <button disabled className="w-full py-3 border border-[#333] text-sm text-[#4a4040] cursor-not-allowed">
                        Stripe — kmalu
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </main>
    </div>
  )
}
