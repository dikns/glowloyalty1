import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, type Salon } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, Users, BarChart3, ExternalLink, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

type Tab = 'saloni' | 'statistike'

const PLAN_COLORS: Record<string, string> = { trial: '#6B6050', basic: '#C9A84C', pro: '#E8C76A' }
const PLAN_LABELS: Record<string, string> = { trial: 'Preizkus', basic: 'Basic', pro: 'Pro' }

const APP_URL = import.meta.env.VITE_APP_URL || 'https://glowloyalty.netlify.app'

export default function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('saloni')
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('salons').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setSalons(data); setLoading(false) })
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login') }

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('salons').update({ active: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setSalons((s) => s.map((x) => x.id === id ? { ...x, active: !current } : x))
    toast.success(!current ? 'Salon aktiviran' : 'Salon deaktiviran')
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('salons').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setSalons((s) => s.filter((x) => x.id !== id))
    setDeleteConfirm(null)
    toast.success('Salon izbrisan')
  }

  const stats = {
    total: salons.length,
    active: salons.filter((s) => s.plan !== 'trial').length,
    trial: salons.filter((s) => s.plan === 'trial').length,
    thisMonth: salons.filter((s) => {
      const d = new Date(s.created_at)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length,
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-[#111] bg-[#050505] fixed top-0 left-0 bottom-0">
        <div className="px-6 py-6 border-b border-[#111]">
          <p className="text-[#C9A84C] text-base tracking-widest uppercase" style={{ fontFamily: 'Cormorant Garamond' }}>GlowLoyalty</p>
          <p className="text-xs text-[#C9A84C]/50 mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {([
            { id: 'saloni', label: 'Saloni', Icon: Users },
            { id: 'statistike', label: 'Statistike', Icon: BarChart3 },
          ] as const).map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                tab === id ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'text-[#6B6050] hover:text-[#F5F0E8] hover:bg-[#111]'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#111]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B6050] hover:text-[#F5F0E8] transition-all">
            <LogOut size={15} /> Odjava
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-56 min-h-screen p-6 md:p-10">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

          {/* ── SALONI ── */}
          {tab === 'saloni' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-light text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Saloni</h1>
                <p className="text-sm text-[#6B6050] mt-1">{salons.length} registriranih salonov</p>
              </div>

              {/* Table */}
              <div className="border border-[#1a1a1a] overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      {['Ime salona', 'Slug', 'Plan', 'Aktiven', 'Ustvarjen', 'Akcije'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#6B6050] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salons.map((s) => (
                      <tr key={s.id} className="border-b border-[#111] hover:bg-[#0d0d0d] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#F5F0E8]">{s.salon_name}</div>
                          <div className="text-xs text-[#4a4040]">{s.owner_email}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#C9A84C]">{s.slug}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs font-semibold" style={{ color: PLAN_COLORS[s.plan], background: PLAN_COLORS[s.plan] + '18' }}>
                            {PLAN_LABELS[s.plan]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleActive(s.id, s.active)} className="text-[#6B6050] hover:text-[#C9A84C] transition-colors">
                            {s.active ? <ToggleRight size={20} className="text-[#C9A84C]" /> : <ToggleLeft size={20} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#4a4040]">
                          {new Date(s.created_at).toLocaleDateString('sl-SI')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a href={`${APP_URL}/app/${s.slug}`} target="_blank" rel="noreferrer"
                              className="p-1.5 text-[#6B6050] hover:text-[#C9A84C] transition-colors">
                              <ExternalLink size={14} />
                            </a>
                            {deleteConfirm === s.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDelete(s.id)} className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700">Da</button>
                                <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs border border-[#333] text-[#6B6050]">Ne</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 text-[#6B6050] hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {salons.length === 0 && (
                  <div className="text-center py-16 text-[#4a4040] text-sm">Ni registriranih salonov</div>
                )}
              </div>
            </div>
          )}

          {/* ── STATISTIKE ── */}
          {tab === 'statistike' && (
            <div className="space-y-8">
              <h1 className="text-4xl font-light text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Statistike</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a]">
                {[
                  { label: 'Skupaj salonov', value: stats.total },
                  { label: 'Aktivne naročnine', value: stats.active },
                  { label: 'V preizkusu', value: stats.trial },
                  { label: 'Ta mesec', value: stats.thisMonth },
                ].map((s) => (
                  <div key={s.label} className="bg-[#080808] p-8">
                    <p className="text-4xl font-light text-[#C9A84C] mb-1" style={{ fontFamily: 'Cormorant Garamond' }}>{s.value}</p>
                    <p className="text-xs text-[#4a4040]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Distribution */}
              <div className="border border-[#1a1a1a] p-6">
                <p className="text-xs tracking-widest uppercase text-[#6B6050] mb-6">Porazdelitev planov</p>
                <div className="space-y-4">
                  {([['trial', 'Preizkus'], ['basic', 'Basic'], ['pro', 'Pro']] as const).map(([key, label]) => {
                    const count = salons.filter((s) => s.plan === key).length
                    const pct = salons.length > 0 ? (count / salons.length) * 100 : 0
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm" style={{ color: PLAN_COLORS[key] }}>{label}</span>
                          <span className="text-xs text-[#4a4040]">{count} salonov</span>
                        </div>
                        <div className="h-1.5 bg-[#111]">
                          <div className="h-1.5 transition-all duration-500" style={{ width: `${pct}%`, background: PLAN_COLORS[key] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  )
}
