import { useState } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'

export default function Repasar({ materias, onBack, showToast, onUpdate }) {
  const { t } = useLang()
  const [selected, setSelected] = useState(materias.map(m => m.id))
  const [modo, setModo] = useState('all')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)

  function toggleMateria(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function startReview() {
    if (selected.length === 0) { showToast(t('selectOneSubject')); return }
    let pool = []
    selected.forEach(id => {
      const m = materias.find(x => x.id === id)
      if (m) pool = pool.concat(m.tarjetas || [])
    })
    if (modo === 'hard') pool = pool.filter(tj => tj.difficulty === 'hard')
    if (pool.length === 0) { showToast(t('noCardsFilterReview')); return }
    const fullPool = [...pool]
    const shuffled = pool.sort(() => Math.random() - .5).slice(0, 20)
    setSession({ cards: shuffled, fullPool, index: 0, results: [], yes: 0, partial: 0, no: 0, title: t('generalReview') })
    setResult(null)
  }

  if (result) return (
    <ReviewResult
      result={result}
      onHome={onBack}
      onRetry={() => {
        const failed = session.cards.filter((_, i) => session.results[i] !== 'yes')
        if (failed.length === 0) { showToast(t('noFailedCards')); return }
        setSession({ ...session, cards: failed, index: 0, results: [], yes: 0, partial: 0, no: 0, title: t('failedCardsTitle') })
        setResult(null)
      }}
      onReplaySame={() => {
        const reshuffled = [...session.cards].sort(() => Math.random() - .5)
        setSession({ ...session, cards: reshuffled, index: 0, results: [], yes: 0, partial: 0, no: 0 })
        setResult(null)
      }}
      onReplayNew={() => {
        const fresh = [...(session.fullPool || session.cards)].sort(() => Math.random() - .5).slice(0, 20)
        setSession({ ...session, cards: fresh, index: 0, results: [], yes: 0, partial: 0, no: 0 })
        setResult(null)
      }}
    />
  )

  if (session) return (
    <ReviewSession
      session={session}
      onEval={(r) => {
        const s = { ...session }
        if (r === 'yes') s.yes++
        else if (r === 'partial') s.partial++
        else s.no++
        s.results = [...s.results, r]
        s.index++
        if (s.index >= s.cards.length) {
          setResult({ yes: s.yes, partial: s.partial, no: s.no, total: s.cards.length, cards: s.cards, results: s.results })
          setSession(s)
        } else {
          setSession({ ...s })
        }
      }}
      onExit={() => { setSession(null); setResult(null) }}
    />
  )

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">{t('reviewNav')}</div>
      </div>
      <div className="scroll">
        <div className="section-label">{t('chooseSubjects')}</div>
        {materias.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📚</div>
            <p>{t('noActiveSubjects')}</p>
          </div>
        ) : (
          materias.map(m => (
            <div key={m.id} className="materia-card" onClick={() => toggleMateria(m.id)}
              style={{ opacity: selected.includes(m.id) ? 1 : 0.5 }}>
              <div className="materia-icon" style={{ background: m.color + '22', color: m.color }}>
                {m.icon || '📚'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="materia-name">{m.name}</div>
                <div className="materia-meta">{(m.tarjetas || []).length} {t('cardsPlural')}</div>
              </div>
              <div style={{ fontSize: '1.2rem' }}>{selected.includes(m.id) ? '✅' : '⬜'}</div>
            </div>
          ))
        )}

        <div className="card" style={{ marginTop: 8 }}>
          <div className="card-title">{t('mode')}</div>
          {[
            { id: 'all', label: t('allMixed'), sub: t('allMixedSub') },
            { id: 'hard', label: t('hardOnlyMode'), sub: t('hardOnlyModeSub') }
          ].map(opt => (
            <div key={opt.id}
              className="materia-card"
              style={{ borderColor: modo === opt.id ? 'var(--accent)' : undefined, marginBottom: 8, cursor: 'pointer' }}
              onClick={() => setModo(opt.id)}>
              <div style={{ flex: 1 }}>
                <div className="materia-name">{opt.label}</div>
                <div className="materia-meta">{opt.sub}</div>
              </div>
              {modo === opt.id && <span style={{ color: 'var(--accent)' }}>✓</span>}
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={startReview}>
          {t('start')}
        </button>
      </div>
    </>
  )
}

function ReviewSession({ session, onEval, onExit }) {
  const { t } = useLang()
  const [revealed, setRevealed] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const card = session.cards[session.index]
  const total = session.cards.length
  const pct = Math.round((session.index / total) * 100)

  function handleReveal() { setRevealed(true) }
  function handleEval(r) { setRevealed(false); setHintShown(false); onEval(r) }

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={() => { if (confirm(t('exitReview'))) onExit() }}>✕</button>
        <div className="topbar-title">{session.title}</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: pct + '%' }} />
          </div>
          <div className="progress-text">{session.index} / {total}</div>
        </div>

        <div className="flashcard">
          <div className="fc-hint">{t('whatsAnswer')}</div>
          <div className="fc-word">{card.pregunta}</div>
          {hintShown && card.pista && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 8 }}>💡 {card.pista}</div>
          )}
          {revealed && <div className="fc-answer">{card.respuesta}</div>}
        </div>

        {!revealed ? (
          <>
            {card.pista && !hintShown && (
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }}
                  onClick={() => setHintShown(true)}>{t('showHint')}</button>
              </div>
            )}
            <button className="btn btn-primary" onClick={handleReveal}>{t('revealAnswer')}</button>
          </>
        ) : (
          <>
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('howDidYouDo')}
            </p>
            <div className="eval-row">
              <button className="eval-btn" onClick={() => handleEval('yes')}>
                <span className="eval-icon">✅</span>
                <span className="eval-label">{t('knewIt')}</span>
              </button>
              <button className="eval-btn" onClick={() => handleEval('partial')}>
                <span className="eval-icon">😐</span>
                <span className="eval-label">{t('soSo')}</span>
              </button>
              <button className="eval-btn" onClick={() => handleEval('no')}>
                <span className="eval-icon">❌</span>
                <span className="eval-label">{t('didntKnow')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function ReviewResult({ result, onHome, onRetry, onReplaySame, onReplayNew }) {
  const { t } = useLang()
  const pct = Math.round((result.yes / result.total) * 100)
  return (
    <>
      <div className="topbar">
        <div className="topbar-title">{t('result')}</div>
      </div>
      <div className="scroll">
        <div className="big-stat">
          <div className="big-num">{pct}%</div>
          <div className="big-label">{t('accuracy')}</div>
        </div>
        <div className="stats-bar">
          <div className="stat">
            <div className="stat-num" style={{ color: 'var(--success)' }}>{result.yes}</div>
            <div className="stat-label">{t('correct')}</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: 'var(--gold)' }}>{result.partial}</div>
            <div className="stat-label">{t('partial')}</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: 'var(--danger)' }}>{result.no}</div>
            <div className="stat-label">{t('incorrect')}</div>
          </div>
        </div>
        {result.no > 0 && (
          <button className="btn btn-danger" style={{ marginBottom: 8 }} onClick={onRetry}>
            {t('reviewFailedOnly')}
          </button>
        )}
        <button className="btn btn-primary" style={{ marginBottom: 8 }} onClick={onReplayNew}>
          {t('newRandomCards')}
        </button>
        <button className="btn btn-secondary" style={{ marginBottom: 8 }} onClick={onReplaySame}>
          {t('repeatSame')}
        </button>
        <button className="btn btn-secondary" onClick={onHome}>{t('backToHome')}</button>
      </div>
    </>
  )
}
