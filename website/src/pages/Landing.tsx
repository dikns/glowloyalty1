import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HexColorPicker } from 'react-colorful'
import PhoneMockup from '../components/PhoneMockup'
import { MinimalistHero } from '../components/ui/minimalist-hero'

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

// Section label with lines on each side
function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <div className="flex-1 max-w-16 h-px bg-[#D8D0B8]" />
      <span className="text-xs tracking-[0.3em] text-[#8A8070] uppercase">{children}</span>
      <div className="flex-1 max-w-16 h-px bg-[#D8D0B8]" />
    </div>
  )
}

const DEMO_COLORS = ['#C9A84C', '#1a1a1a', '#8B4513', '#2C5F2E', '#1B4F72', '#6B3A7D']

export default function Landing() {
  const navigate = useNavigate()
  const [demoColor, setDemoColor] = useState('#C9A84C')
  const [showPicker, setShowPicker] = useState(false)

  const scrollToDemo = () => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0F0E0A]" style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── HERO ── */}
      <MinimalistHero
        logoText="GLOWLOYALTY"
        navLinks={[
          { label: 'FUNKCIJE', href: '#features' },
          { label: 'CENIK', href: '#pricing' },
          { label: 'PRIJAVA', href: '/prijava' },
        ]}
        mainText="Sistem zvestobe in rezervacij za kozmetične salone — z vašim imenom, vašimi barvami, vašim linkom."
        ctaPrimary={{ label: 'ZAČNI 14-DNEVNI PREIZKUS', onClick: () => navigate('/registracija') }}
        ctaSecondary={{ label: 'OGLEJ SI DEMO', onClick: scrollToDemo }}
        centerContent={<PhoneMockup primaryColor="#C9A84C" salonName="Salon Aurora" animated />}
        overlayText={{ part1: 'vaša', part2: 'aplikacija.' }}
        locationText="Slovenija · 2025"
      />

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 px-6 md:px-16 bg-[#F5F0E8] border-t border-[#D8D0B8]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fade}><SectionLabel>Kako deluje</SectionLabel></motion.div>
            <motion.h2 variants={fade}
              className="text-4xl md:text-5xl font-light text-center mb-20 text-[#0F0E0A]"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              V treh korakih do vaše <em className="italic text-[#C9A84C]">aplikacije</em>
            </motion.h2>
            <motion.div variants={stagger} className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D8D0B8]">
              {[
                { n: '01', title: 'Registriraj se', desc: 'Ustvari račun in izberi ime za svojo aplikacijo.' },
                { n: '02', title: 'Prilagodi', desc: 'Nastavi barve, logo in storitve v 5 minutah.' },
                { n: '03', title: 'Deli link', desc: 'Stranke odprejo tvojo aplikacijo na svojem telefonu.' },
              ].map((s) => (
                <motion.div key={s.n} variants={fade} className="px-10 py-8 md:py-0 flex flex-col gap-4 first:pl-0 last:pr-0">
                  <span className="text-8xl font-light text-[#D8D0B8] leading-none"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}>{s.n}</span>
                  <h3 className="text-sm font-semibold tracking-[0.2em] uppercase text-[#0F0E0A]">{s.title}</h3>
                  <p className="text-sm text-[#8A8070] leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6 md:px-16 bg-[#EDEAD8]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fade}><SectionLabel>Funkcije</SectionLabel></motion.div>
            <motion.h2 variants={fade}
              className="text-4xl md:text-5xl font-light text-center mb-16 text-[#0F0E0A]"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Vse kar vaš salon <em className="italic text-[#C9A84C]">potrebuje</em>
            </motion.h2>
            <motion.div variants={stagger} className="grid md:grid-cols-2 gap-0 border border-[#D8D0B8]">
              {[
                { title: 'Sistem zvestobe', desc: 'Točke, nagrade in push obvestila za vaše stranke. Avtomatiziran program zvestobe brez dela.' },
                { title: 'Rezervacije', desc: 'Stranke rezervirajo same, 24/7. Upravljajte urnik, blokirajte termine, pošiljajte opominke.' },
                { title: 'Vaš branding', desc: 'Logo, barve, pisave — vse prilagojeno vašemu salonu. Stranke vidijo vaš salon, ne naše platforme.' },
                { title: 'Lastni link', desc: 'glowloyalty.netlify.app/app/vasalon — delite z en klik. QR koda za natis ali digitalno delitev.' },
              ].map((f, i) => (
                <motion.div key={f.title} variants={fade}
                  className={`p-10 group border-[#D8D0B8] hover:bg-[#F5F0E8] transition-colors border-t-2 border-t-transparent hover:border-t-[#0F0E0A]
                    ${i % 2 === 0 ? 'border-r border-[#D8D0B8]' : ''}
                    ${i < 2 ? 'border-b border-[#D8D0B8]' : ''}
                  `}>
                  <span className="text-[#C9A84C] text-xl mb-6 block">◆</span>
                  <h3 className="text-xl font-light mb-3 group-hover:text-[#C9A84C] transition-colors"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}>{f.title}</h3>
                  <p className="text-sm text-[#8A8070] leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ── */}
      <section id="demo" className="py-28 px-6 md:px-16 bg-[#F5F0E8] border-t border-[#D8D0B8]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <motion.div variants={fade}><SectionLabel>Interaktivni demo</SectionLabel></motion.div>
              <motion.h2 variants={fade}
                className="text-4xl md:text-5xl font-light mt-4 mb-6 text-[#0F0E0A]"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Preizkusite svojo <em className="italic text-[#C9A84C]">barvo</em>
              </motion.h2>
              <motion.p variants={fade} className="text-sm text-[#8A8070] leading-relaxed mb-8 max-w-sm">
                Izberite primarno barvo in takoj vidite, kako bo vaša aplikacija izgledala na telefonu stranke.
              </motion.p>

              {/* Color swatches */}
              <motion.div variants={fade} className="space-y-5">
                <div className="flex gap-3 flex-wrap">
                  {DEMO_COLORS.map((c) => (
                    <button key={c} onClick={() => setDemoColor(c)}
                      className={`w-9 h-9 transition-all ${demoColor === c ? 'ring-2 ring-offset-2 ring-[#0F0E0A] ring-offset-[#F5F0E8]' : 'hover:scale-110'}`}
                      style={{ background: c }} />
                  ))}
                  {/* Custom picker */}
                  <div className="relative">
                    <button onClick={() => setShowPicker(!showPicker)}
                      className="w-9 h-9 border border-dashed border-[#D8D0B8] flex items-center justify-center text-[#8A8070] text-lg hover:border-[#0F0E0A] transition-colors">
                      +
                    </button>
                    {showPicker && (
                      <div className="absolute top-full left-0 mt-2 z-20 p-3 bg-white border border-[#D8D0B8] shadow-lg">
                        <HexColorPicker color={demoColor} onChange={setDemoColor} />
                        <button onClick={() => setShowPicker(false)}
                          className="mt-2 w-full text-xs text-center text-[#8A8070] hover:text-[#0F0E0A] py-1">Zapri</button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Hex input */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5" style={{ background: demoColor }} />
                  <input value={demoColor} onChange={(e) => setDemoColor(e.target.value)}
                    className="font-mono text-sm bg-transparent border-b border-[#D8D0B8] focus:outline-none focus:border-[#0F0E0A] text-[#0F0E0A] w-24 pb-1"
                    maxLength={7} />
                </div>
                <Link to="/registracija"
                  className="inline-block bg-[#0F0E0A] text-[#F5F0E8] text-xs tracking-[0.2em] px-8 py-4 hover:bg-[#C9A84C] hover:text-[#0F0E0A] transition-colors">
                  ZAČNI Z VAŠIMI BARVAMI →
                </Link>
              </motion.div>
            </div>

            {/* Right — phone */}
            <motion.div variants={fade} className="flex justify-center">
              <PhoneMockup primaryColor={demoColor} salonName="Vaš Salon" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-28 px-6 md:px-16 bg-[#EDEAD8] border-t border-[#D8D0B8]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fade}><SectionLabel>Cenik</SectionLabel></motion.div>
            <motion.h2 variants={fade}
              className="text-4xl md:text-5xl font-light text-center mb-16 text-[#0F0E0A]"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Enostavne cene. Brez <em className="italic text-[#C9A84C]">presenečenj.</em>
            </motion.h2>
            <motion.div variants={stagger} className="grid md:grid-cols-3 gap-px bg-[#D8D0B8]">
              {/* Trial */}
              <motion.div variants={fade} className="bg-[#EDEAD8] p-10 flex flex-col">
                <p className="text-xs tracking-[0.3em] uppercase text-[#8A8070] mb-6">Preizkus</p>
                <div className="flex items-end gap-1 mb-8">
                  <span className="text-5xl font-light text-[#0F0E0A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>0€</span>
                  <span className="text-[#8A8070] text-sm mb-2">· 14 dni</span>
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                  {['Loyalty program', 'Rezervacije', 'Personalizacija', 'Link do aplikacije'].map((f) => (
                    <li key={f} className="text-sm text-[#8A8070] flex items-start gap-2">
                      <span className="text-[#C9A84C] mt-0.5">—</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/registracija"
                  className="text-center py-3.5 text-xs tracking-[0.2em] border border-[#D8D0B8] text-[#8A8070] hover:border-[#0F0E0A] hover:text-[#0F0E0A] transition-all">
                  ZAČNI PREIZKUS
                </Link>
              </motion.div>

              {/* Basic — featured, black */}
              <motion.div variants={fade} className="bg-[#0F0E0A] p-10 flex flex-col relative">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#C9A84C]" />
                <p className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] mb-6">Basic</p>
                <div className="flex items-end gap-1 mb-8">
                  <span className="text-5xl font-light text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>29€</span>
                  <span className="text-[#6B6050] text-sm mb-2">· /mesec</span>
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                  {['Vse iz Preizkusa', 'Brez časovne omejitve', 'Email podpora', 'Neomejene stranke'].map((f) => (
                    <li key={f} className="text-sm text-[#8A8070] flex items-start gap-2">
                      <span className="text-[#C9A84C] mt-0.5">—</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/registracija"
                  className="text-center py-3.5 text-xs tracking-[0.2em] bg-[#C9A84C] text-[#0F0E0A] hover:bg-[#E8C76A] transition-all font-semibold">
                  ZAČNI ZDAJ
                </Link>
              </motion.div>

              {/* Pro */}
              <motion.div variants={fade} className="bg-[#EDEAD8] p-10 flex flex-col relative">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#D8D0B8]" />
                <p className="text-xs tracking-[0.3em] uppercase text-[#8A8070] mb-6">Pro</p>
                <div className="flex items-end gap-1 mb-8">
                  <span className="text-5xl font-light text-[#0F0E0A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>59€</span>
                  <span className="text-[#8A8070] text-sm mb-2">· /mesec</span>
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                  {['Vse iz Basic', 'Priority podpora', 'Analytics', 'Zgodnji dostop'].map((f) => (
                    <li key={f} className="text-sm text-[#8A8070] flex items-start gap-2">
                      <span className="text-[#C9A84C] mt-0.5">—</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/registracija"
                  className="text-center py-3.5 text-xs tracking-[0.2em] border border-[#D8D0B8] text-[#8A8070] hover:border-[#0F0E0A] hover:text-[#0F0E0A] transition-all">
                  ZAČNI ZDAJ
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0F0E0A] border-t border-[#C9A84C]">
        <div className="max-w-6xl mx-auto px-6 md:px-16 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-[#F5F0E8]">GLOWLOYALTY</p>
            <p className="text-xs text-[#6B6050] mt-1">Vaša aplikacija. Vaš salon.</p>
          </div>
          <div className="flex flex-wrap gap-8 text-xs tracking-[0.2em] text-[#6B6050]">
            <a href="/" className="hover:text-[#F5F0E8] transition-colors">DOMOV</a>
            <Link to="/registracija" className="hover:text-[#F5F0E8] transition-colors">REGISTRACIJA</Link>
            <Link to="/prijava" className="hover:text-[#F5F0E8] transition-colors">PRIJAVA</Link>
            <a href="mailto:info@glowloyalty.si" className="hover:text-[#F5F0E8] transition-colors">KONTAKT</a>
          </div>
          <p className="text-xs text-[#333] tracking-widest">© 2025 GLOWLOYALTY</p>
        </div>
      </footer>
    </div>
  )
}
