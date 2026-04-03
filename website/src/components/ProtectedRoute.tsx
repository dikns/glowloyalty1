import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const [state, setState] = useState<'loading' | 'ok' | 'redirect'>('loading')
  const [redirectTo, setRedirectTo] = useState('/login')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (!session) { setState('redirect'); setRedirectTo('/login'); return }
      if (adminOnly && session.user.email !== 'master@glowloyalty.si') {
        setState('redirect'); setRedirectTo('/dashboard'); return
      }
      setState('ok')
    })
  }, [adminOnly])

  if (state === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (state === 'redirect') return <Navigate to={redirectTo} replace />
  return <>{children}</>
}
