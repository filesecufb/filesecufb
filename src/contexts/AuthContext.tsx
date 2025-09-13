import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, UserProfile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  refreshRole: () => Promise<void>
  isAdmin: boolean
  isClient: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const storedRole = sessionStorage.getItem('user_role') as 'admin' | 'client' || 'client'
        
        const directProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email!,
          full_name: null,
          phone: null,
          role: storedRole,
          billing_name: null,
          tax_id: null,
          billing_address: null,
          billing_city: null,
          billing_postal_code: null,
          billing_country: null,
          billing_state: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(directProfile)
        setLoading(false)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Solo crear perfil directo si no es un evento de SIGNED_IN (lo maneja signIn)
          if (event !== 'SIGNED_IN') {
            // Always use stored role or default to client
            const storedRole = sessionStorage.getItem('user_role') as 'admin' | 'client' || 'client'
            
            const directProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email!,
              full_name: null,
              phone: null,
              role: storedRole,
              billing_name: null,
              tax_id: null,
              billing_address: null,
              billing_city: null,
              billing_postal_code: null,
              billing_country: null,
              billing_state: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setProfile(directProfile)
          }
          setLoading(false)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()


      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser()
          if (userData.user?.email) {
            await supabase.from('profiles').insert({
              id: userId,
              email: userData.user.email,
              role: 'client'
            })
            
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single()
            
            setProfile(newProfile)
            // Store the role for direct profile creation
            sessionStorage.setItem('user_role', newProfile?.role || 'client')
          }
        }
      } else {
        setProfile(data)
        // Also update the direct profile creation for auth changes
        if (data.role === 'admin') {
          sessionStorage.setItem('user_role', 'admin')
        } else {
          sessionStorage.setItem('user_role', 'client')
        }
      }
    } catch (error) {
      console.error('💥 Error en loadProfile:', error)
      // Fallback: create profile in memory
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user?.email) {
        const defaultProfile: UserProfile = {
          id: userId,
          email: userData.user.email,
          full_name: null,
          phone: null,
          role: 'client',
          billing_name: null,
          tax_id: null,
          billing_address: null,
          billing_city: null,
          billing_postal_code: null,
          billing_country: null,
          billing_state: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(defaultProfile)
      }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    // Si el login es exitoso, obtener el rol real de la BD una sola vez
    if (!error) {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userData.user.id)
            .single()
          
          if (profileData?.role) {
            sessionStorage.setItem('user_role', profileData.role)
            
            // Crear perfil inmediatamente con el rol correcto
            const updatedProfile: UserProfile = {
              id: userData.user.id,
              email: userData.user.email!,
              full_name: null,
              phone: null,
              role: profileData.role,
              billing_name: null,
              tax_id: null,
              billing_address: null,
              billing_city: null,
              billing_postal_code: null,
              billing_country: null,
              billing_state: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setProfile(updatedProfile)
          }
        }
      } catch (profileError) {
        sessionStorage.setItem('user_role', 'client')
      }
    }
    
    return { error }
  }

  const refreshRole = async () => {
    if (!user) return
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profileData?.role) {
        sessionStorage.setItem('user_role', profileData.role)
        
        // Actualizar el perfil actual con el nuevo rol
        if (profile) {
          const updatedProfile = { ...profile, role: profileData.role }
          setProfile(updatedProfile)
        }
      }
    } catch (error) {
      console.error('Error refrescando rol:', error)
    }
  }

  const signOut = async () => {
    // Clear stored role
    sessionStorage.removeItem('user_role')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://filesecufb.com/reset-password'
    })
    return { error }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshRole,
    isAdmin: profile?.role === 'admin',
    isClient: profile?.role === 'client'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}