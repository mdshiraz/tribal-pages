import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth'
import { AuthState } from '@/types'

const AuthContext = createContext<AuthState & {
  setViewAs: (v: 'admin' | 'member') => void
}>({
  user: null,
  role: null,
  loading: true,
  viewAs: 'member',
  setViewAs: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'admin' | 'member' | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewAs, setViewAs] = useState<'admin' | 'member'>('member')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getUserRole(session.user.id).then((r) => {
          setRole(r)
          setViewAs(r === 'admin' ? 'admin' : 'member')
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getUserRole(session.user.id).then((r) => {
          setRole(r)
          setViewAs(r === 'admin' ? 'admin' : 'member')
        })
      } else {
        setRole(null)
        setViewAs('member')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading, viewAs, setViewAs }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
