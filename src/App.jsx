import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import Privacidad from './pages/Privacidad'
import './index.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('fs_theme') || 'light')

  // Detecta la ruta actual de la URL
  const path = window.location.pathname

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
    localStorage.setItem('fs_theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // Si la URL es /privacidad o /privacy, muestra la política (sin necesidad de login)
  if (path === '/privacidad' || path === '/privacy') {
    return <Privacidad onBack={() => { window.location.href = '/' }} />
  }

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