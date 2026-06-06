import { useLang } from '../LangContext'
import Perfil from './Perfil'
import ReviewMateria from './ReviewMateria.jsx'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import Materias from './Materias'
import Repasar from './Repasar'
import Logros from './Logros'

function Toast({ msg }) {
  return <div className={`toast ${msg ? 'show' : ''}`}>{msg}</div>
}

function ThemeSwitch({ theme, toggle }) {
  return (
    <div className="theme-switch" onClick={toggle}>
      <span>🌙</span>
      <div className="theme-track"><div className="theme-thumb" /></div>
      <span>☀️</span>
    </div>
  )
}

export default function Home({ session, theme, toggleTheme }) {
  const [tab, setTab] = useState('home')
  const { t } = useLang()
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const userName = session.user.user_metadata?.name || session.user.email.split('@')[0]

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const loadMaterias = useCallback(async () => {
    const { data } = await supabase
      .from('materias')
      .select('*, tarjetas(*)')
      .order('created_at', { ascending: false })
    if (data) setMaterias(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadMaterias() }, [loadMaterias])

  async function doLogout() {
    await supabase.auth.signOut()
  }

  const active = materias.filter(m => m.status !== 'crown')
  const crowned = materias.filter(m => m.status === 'crown')
  const totalTarjetas = materias.reduce((a, m) => a + (m.tarjetas?.length || 0), 0)
  const totalRepasos = materias.reduce((a, m) => a + (m.repasos || 0), 0)

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text3)' }}>Cargando...</div>
    </div>
  )

  return (
    <>
      <Toast msg={toast} />

      {tab === 'home' && (
        <>
          <div className="topbar">
            <div>
              <div className="topbar-title">{t('hello')}, {userName} 👋</div>
              <div className="topbar-sub">{t('whatToday')}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ThemeSwitch theme={theme} toggle={toggleTheme} />
              <button className="icon-btn" onClick={() => setTab('perfil')} title="Mi perfil"
                style={{ fontSize: '1.2rem' }}>
                {session.user.user_metadata?.avatar || '👤'}
              </button>
            </div>
          </div>

          <div className="scroll">
            <div className="stats-bar">
              <div className="stat">
                <div className="stat-num">{active.length}</div>
                <div className="stat-label">{t('subjects')}</div>
              </div>
              <div className="stat">
                <div className="stat-num">{totalTarjetas}</div>
                <div className="stat-label">{t('cards')}</div>
              </div>
              <div className="stat">
                <div className="stat-num">{totalRepasos}</div>
                <div className="stat-label">{t('reviews')}</div>
              </div>
            </div>

            <div className="section-label">🔥 {t('studyingNow')}</div>
            {active.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📚</div>
                <p>{t('noSubjects')}<br />{t('createFirst')}</p>
              </div>
            ) : (
              active.map(m => (
                <MateriaCard key={m.id} materia={m} onClick={() => setTab('materia_' + m.id)} />
              ))
            )}

            {crowned.length > 0 && (
              <>
                <div className="section-label">👑 {t('myCrowns')}</div>
                {crowned.map(m => (
                  <MateriaCard key={m.id} materia={m} onClick={() => setTab('materia_' + m.id)} />
                ))}
              </>
            )}

            <button className="btn btn-secondary" style={{ marginTop: 8 }}
              onClick={() => setTab('nueva_materia')}>
              ➕ {t('newSubject')}
            </button>
          </div>
        </>
      )}

      {tab === 'repasar' && (
        <Repasar materias={active} onBack={() => setTab('home')} showToast={showToast} onUpdate={loadMaterias} />
      )}

      {tab === 'logros' && (
        <Logros materias={crowned} onBack={() => setTab('home')} onUpdate={loadMaterias} showToast={showToast} />
      )}
      {tab === 'perfil' && (
        <Perfil
          session={session}
          onBack={() => setTab('home')}
          onUpdate={loadMaterias}
          showToast={showToast}
        />
      )}
      {tab === 'nueva_materia' && (
        <Materias
          materia={null}
          session={session}
          onBack={() => setTab('home')}
          onSave={() => { loadMaterias(); setTab('home'); showToast('✅ Materia guardada') }}
          showToast={showToast}
        />
      )}
    
      {tab.startsWith('review_') && (() => {
        const id = tab.replace('review_', '')
        const m = materias.find(x => x.id === id)
        if (!m) return null
        return (
          <ReviewMateria
            materia={m}
            onBack={() => setTab('materia_' + m.id)}
            showToast={showToast}
            onUpdate={loadMaterias}
          />
        )
      })()}


      {tab.startsWith('materia_') && (() => {
        const id = tab.replace('materia_', '')
        const m = materias.find(x => x.id === id)
        if (!m) return null
        return (
          <Materias
            materia={m}
            onBack={() => setTab('home')}
            onSave={() => { loadMaterias(); showToast('✅ Guardado') }}
            onDelete={() => { loadMaterias(); setTab('home'); showToast('🗑️ Eliminado') }}
            onReview={(m) => { setTab('review_' + m.id); }}
            showToast={showToast}
            onUpdate={loadMaterias}
            session={session}
          />
        )
      })()}

      <nav className="navbar">
        <button className={`nav-item ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">{t('home')}</span>
        </button>
        <button className={`nav-item ${tab === 'repasar' ? 'active' : ''}`} onClick={() => setTab('repasar')}>
          <span className="nav-icon">🎯</span>
          <span className="nav-label">{t('reviewNav')}</span>
        </button>
        <button className={`nav-item ${tab === 'logros' ? 'active' : ''}`} onClick={() => setTab('logros')}>
          <span className="nav-icon">🏆</span>
          <span className="nav-label">{t('achievements')}</span>
        </button>
      </nav>
    </>
  )
}

function MateriaCard({ materia: m, onClick }) {
  const { t } = useLang()
  const count = m.tarjetas?.length || 0
  const badge = m.status === 'crown' ? '👑' : m.status === 'dominated' ? '⭐' : '🔥'
  const cardWord = count === 1 ? t('card') : t('cardsPlural')
  return (
    <div className="materia-card" onClick={onClick}>
      <div className="materia-icon" style={{ background: m.color + '22', color: m.color }}>
        {m.icon || '📚'}
      </div>
      <div style={{ flex: 1 }}>
        <div className="materia-name">{m.name}</div>
        <div className="materia-meta">{count} {cardWord} · {m.last_review ? t('reviewed') + ': ' + m.last_review : t('noReviews')}</div>
      </div>
      <div style={{ fontSize: '1.2rem' }}>{badge}</div>
    </div>
  )
}
