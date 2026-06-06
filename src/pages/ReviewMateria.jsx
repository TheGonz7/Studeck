import { useState } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'

export default function ReviewMateria({ materia, onBack, showToast, onUpdate }) {
  const { t } = useLang()
  const [step, setStep] = useState('config')
  const [qty, setQty] = useState(10)
  const [diffFilter, setDiffFilter] = useState('all')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [celebration, setCelebration] = useState(null)

  function startReview() {
    let pool = [...(materia.tarjetas || [])]
    if (diffFilter !== 'all') pool = pool.filter(t => t.difficulty === diffFilter)
    if (pool.length === 0) { showToast(t('noCardsFilterReview')); return }
    pool = pool.sort(() => Math.random() - .5).slice(0, qty)
    setSession({ cards: pool, index: 0, results: [], yes: 0, partial: 0, no: 0 })
    setStep('review')
  }

  async function finishReview(finalSession) {
    const total = finalSession.cards.length
    const pct = Math.round((finalSession.yes / total) * 100)
    const history = [...(materia.review_history || []), pct]
    await supabase.from('materias').update({
      repasos: (materia.repasos || 0) + 1,
      last_review: new Date().toLocaleDateString(),
      review_history: history
    }).eq('id', materia.id)
    onUpdate()
    setResult({ yes: finalSession.yes, partial: finalSession.partial, no: finalSession.no, total, pct, history, cards: finalSession.cards, results: finalSession.results })
    setStep('result')
  }

  function handleEval(r) {
    const s = { ...session }
    if (r === 'yes') s.yes++
    else if (r === 'partial') s.partial++
    else s.no++
    s.results = [...s.results, r]
    s.index++
    if (s.index >= s.cards.length) finishReview(s)
    else setSession({ ...s })
  }

  async function markDominated() {
    await supabase.from('materias').update({ status: 'dominated' }).eq('id', materia.id)
    onUpdate()
    setCelebration({ icon: '⭐', title: t('masteredDeck'), sub: `"${materia.name}"` })
  }

  async function crownMateria() {
    if (!confirm(`${t('confirmKing')} "${materia.name}"?`)) return
    const today = new Date().toLocaleDateString()
    await supabase.from('materias').update({ status: 'crown', crown_date: today }).eq('id', materia.id)
    onUpdate()
    spawnConfetti()
    setCelebration({ icon: '👑', title: `${t('kingOf')} ${materia.name}!`, sub: `${t('dominatedThis')}\n${t('date')}: ${today}` })
    setTimeout(() => { setCelebration(null); onBack() }, 4000)
  }

  function spawnConfetti() {
    const colors = ['#2563eb','#fbbf24','#f97316','#ef4444','#22c55e']
    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        const el = document.createElement('div')
        el.className = 'confetti-piece'
        el.style.cssText = `left:${Math.random()*100}vw;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*.5}s;animation-duration:${1.5+Math.random()}s`
        document.body.appendChild(el)
        setTimeout(() => el.remove(), 3000)
      }, i * 30)
    }
  }

  // CONFIG SCREEN
  if (step === 'config') return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div className="topbar-title">{t('configReview')}</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="card">
          <div className="card-title">{t('howManyCards')}</div>
          {[
            { n: 10, label: '10 ' + t('cardsPlural'), sub: t('quickReview') },
            { n: 20, label: '20 ' + t('cardsPlural'), sub: t('normalReview') },
            { n: 50, label: '50 ' + t('cardsPlural'), sub: t('intenseReview') },
            { n: 9999, label: t('all'), sub: t('fullDeck') },
          ].map(opt => (
            <div key={opt.n} className="materia-card"
              style={{ borderColor: qty === opt.n ? 'var(--accent)' : undefined, marginBottom: 8, cursor: 'pointer' }}
              onClick={() => setQty(opt.n)}>
              <div style={{ flex: 1 }}>
                <div className="materia-name">{opt.label}</div>
                <div className="materia-meta">{opt.sub}</div>
              </div>
              {qty === opt.n && <span style={{ color: 'var(--accent)' }}>✓</span>}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">{t('filterByDiff')}</div>
          {[
            { id: 'all', label: t('all') },
            { id: 'hard', label: t('onlyHard') },
            { id: 'medium', label: t('onlyMedium') },
            { id: 'easy', label: t('onlyEasy') },
          ].map(opt => (
            <div key={opt.id} className="materia-card"
              style={{ borderColor: diffFilter === opt.id ? 'var(--accent)' : undefined, marginBottom: 8, cursor: 'pointer' }}
              onClick={() => setDiffFilter(opt.id)}>
              <div style={{ flex: 1 }}>
                <div className="materia-name">{opt.label}</div>
              </div>
              {diffFilter === opt.id && <span style={{ color: 'var(--accent)' }}>✓</span>}
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={startReview}>{t('startReview')}</button>
      </div>
    </>
  )

  // REVIEW SCREEN
  if (step === 'review' && session) {
    const card = session.cards[session.index]
    const total = session.cards.length
    const pct = Math.round((session.index / total) * 100)
    return <ReviewCard card={card} index={session.index} total={total} pct={pct} onEval={handleEval} onExit={() => { if (confirm(t('exitReview'))) onBack() }} title={materia.name} />
  }

  // RESULT SCREEN
  if (step === 'result' && result) {
    const last3 = result.history.slice(-3)
    const showDomination = materia.status === 'active' && last3.length >= 3 && last3.every(r => r >= 80)
    const showKing = materia.status === 'dominated'
    const failedCards = result.cards.filter((_, i) => result.results[i] !== 'yes')

    return (
      <>
        {celebration && (
          <div className="celebration">
            <div className="cel-icon">{celebration.icon}</div>
            <div className="cel-title">{celebration.title}</div>
            <div className="cel-sub">{celebration.sub}</div>
            <button className="btn btn-gold" style={{ maxWidth: 280 }} onClick={() => setCelebration(null)}>{t('great')}</button>
          </div>
        )}
        <div className="topbar">
          <div className="topbar-title">{t('result')}</div>
        </div>
        <div className="scroll">
          <div className="big-stat">
            <div className="big-num">{result.pct}%</div>
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

          {showDomination && (
            <div className="notice-box" style={{ marginBottom: 12 }}>
              <div className="notice-title">{t('dominatedTitle')}</div>
              <div className="notice-text">{t('dominatedText')}</div>
              <div className="btn-row">
                <button className="btn btn-gold btn-sm" onClick={markDominated}>{t('markDominated')}</button>
                <button className="btn btn-secondary btn-sm" onClick={onBack}>{t('keepReviewing')}</button>
              </div>
            </div>
          )}

          {showKing && (
            <div style={{ marginBottom: 12 }}>
              <button className="btn btn-gold" onClick={crownMateria}>{t('declareKing')}</button>
            </div>
          )}

          <div className="btn-row" style={{ marginBottom: 8 }}>
            {failedCards.length > 0 && (
              <button className="btn btn-danger" onClick={() => {
                setSession({ cards: failedCards, index: 0, results: [], yes: 0, partial: 0, no: 0 })
                setStep('review')
              }}>{t('reviewFailed')}</button>
            )}
            <button className="btn btn-primary" onClick={onBack}>← {t('backHome')}</button>
          </div>
          <button className="btn btn-secondary" onClick={() => { setStep('config'); setResult(null) }}>
            ↩ {t('configReview')}
          </button>
        </div>
      </>
    )
  }

  return null
}

function ReviewCard({ card, index, total, pct, onEval, onExit, title }) {
  const { t } = useLang()
  const [revealed, setRevealed] = useState(false)
  const [hintShown, setHintShown] = useState(false)

  function handleEval(r) { setRevealed(false); setHintShown(false); onEval(r) }

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onExit}>✕</button>
        <div className="topbar-title">{title}</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: pct + '%' }} />
          </div>
          <div className="progress-text">{index} / {total}</div>
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
            <button className="btn btn-primary" onClick={() => setRevealed(true)}>{t('revealAnswer')}</button>
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