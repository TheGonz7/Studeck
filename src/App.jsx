import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import './index.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('fs_theme') || 'light')

  useEffect(() => {
    // Aplicar tema
    document.body.classList.toggle('light', theme === 'light')
    localStorage.setItem('fs_theme', theme)
  }, [theme])

  useEffect(() => {
    // Verificar sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  if (loading) return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 12
    }}>
      <div style={{ fontSize: '2.5rem' }}>📖</div>
      <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Cargando...</div>
    </div>
  )

  if (!session) return <Login />

  return <Home session={session} theme={theme} toggleTheme={toggleTheme} />
}
