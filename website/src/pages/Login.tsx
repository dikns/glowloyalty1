import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { toast.error('Napačen email ali geslo'); return }
    if (data.user?.email === 'master@glowloyalty.si') navigate('/admin')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="text-[#C9A84C] text-2xl tracking-widest uppercase" style={{ fontFamily: 'Cormorant Garamond' }}>
            GlowLoyalty
          </Link>
          <h1 className="text-3xl font-light mt-6 mb-2 text-[#F5F0E8]" style={{ fontFamily: 'Cormorant Garamond' }}>Prijava</h1>
          <p className="text-sm text-[#6B6050]">Dobrodošli nazaj</p>
        </div>

        <div className="border border-[#1a1a1a] p-8 bg-[#0d0d0d]">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-[#080808] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#333]"
                placeholder="vasalon@email.com" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#6B6050] mb-2">Geslo</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-[#080808] border border-[#222] px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#333]"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#C9A84C] text-[#080808] font-semibold text-sm tracking-wide hover:bg-[#E8C76A] transition-all disabled:opacity-50 mt-2">
              {loading ? 'Prijavljanje...' : 'Prijavi se'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[#6B6050]">
            Nimate računa?{' '}
            <Link to="/registracija" className="text-[#C9A84C] hover:text-[#E8C76A] transition-colors">Registrirajte se</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
