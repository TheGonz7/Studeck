import { useState } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'

const COLORS = ['#2563eb','#00d4aa','#f97316','#fbbf24','#ef4444','#00b4d8','#8b5cf6','#ec4899']

export default function Materias({ materia, onBack, onSave, onDelete, showToast, onUpdate, session, onReview }) {
  const { t } = useLang()
  const isNew = !materia
  const [view, setView] = useState(isNew ? 'form' : 'detail')
  const [name, setName] = useState(materia?.name || '')
  const [desc, setDesc] = useState(materia?.description || '')
  const [icon, setIcon] = useState(materia?.icon || '📚')
  const [color, setColor] = useState(materia?.color || '#2563eb')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [celebration, setCelebration] = useState(null)

  async function saveMateria() {
    if (!name.trim()) { showToast(t('nameRequired')); return }
    setSaving(true)
    if (isNew) {
      const { error } = await supabase.from('materias').insert({
        name: name.trim(), description: desc.trim(),
        icon, color, user_id: session?.user?.id,
        status: 'active', repasos: 0, review_history: []
      })
      if (error) showToast(t('saveError'))
      else onSave()
    } else {
      const { error } = await supabase.from('materias')
        .update({ name: name.trim(), description: desc.trim(), icon, color })
        .eq('id', materia.id)
      if (error) showToast(t('saveError'))
      else { onSave(); setView('detail') }
    }
    setSaving(false)
  }

  async function deleteMateria() {
    if (!confirm(t('confirmDeleteSubject'))) return
    await supabase.from('materias').delete().eq('id', materia.id)
    onDelete()
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
    const colors = ['#2563eb','#fbbf24','#f97316','#ef4444','#22c55e','#00b4d8']
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

  const tarjetas = materia?.tarjetas || []
  const filtered = filter === 'all' ? tarjetas : tarjetas.filter(t => t.difficulty === filter)
  const reviewHistory = materia?.review_history || []
  const last3 = reviewHistory.slice(-3)
  const showDomination = materia && materia.status === 'active' && last3.length >= 3 && last3.every(r => r >= 80)
  const showKing = materia?.status === 'dominated'

  const [showTarjetaForm, setShowTarjetaForm] = useState(false)
  const [editTarjeta, setEditTarjeta] = useState(null)

  if (view === 'form' || (isNew)) {
    return (
      <>
        <div className="topbar">
          <button className="icon-btn" onClick={onBack}>←</button>
          <div className="topbar-title">{isNew ? t('newSubjectTitle') : t('editSubject')}</div>
          <div style={{ width: 36 }} />
        </div>
        <div className="scroll">
          <div className="card">
            <div className="card-title">{t('info')}</div>
            <label>{t('subjectName')} *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('subjectNamePlaceholder')} />
            <label>{t('description')}</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('descriptionPlaceholder')} />
            <label>{t('icon')}</label>
            <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="📚" maxLength={2} />
            <label>{t('color')}</label>
            <div className="color-row">
              {COLORS.map(c => (
                <div key={c} className={`color-opt ${color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveMateria} disabled={saving}>
            {saving ? t('saving') : t('saveSubject') + ' →'}
          </button>
          {!isNew && (
            <button className="btn btn-danger" style={{ marginTop: 8 }} onClick={deleteMateria}>
              {t('deleteSubject')}
            </button>
          )}
        </div>
      </>
    )
  }

  if (showTarjetaForm || editTarjeta !== null) {
    return (
      <TarjetaForm
        materia={materia}
        tarjeta={editTarjeta}
        onBack={() => { setShowTarjetaForm(false); setEditTarjeta(null); onUpdate() }}
        showToast={showToast}
      />
    )
  }

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
        <button className="icon-btn" onClick={onBack}>←</button>
        <div>
          <div className="topbar-title">{materia.icon} {materia.name}</div>
          <div className="topbar-sub">{tarjetas.length} {tarjetas.length === 1 ? t('card') : t('cardsPlural')}</div>
        </div>
        <button className="icon-btn" onClick={() => setView('form')}>✏️</button>
      </div>

      <div className="scroll">
        {showDomination && (
          <div className="notice-box" style={{ marginBottom: 12 }}>
            <div className="notice-title">{t('dominatedTitle')}</div>
            <div className="notice-text">{t('dominatedText')}</div>
            <div className="btn-row">
              <button className="btn btn-gold btn-sm" onClick={markDominated}>{t('markDominated')}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => {}}>{t('keepReviewing')}</button>
            </div>
          </div>
        )}

        {showKing && (
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-gold" onClick={crownMateria}>{t('declareKing')}</button>
          </div>
        )}

        <button className="btn btn-primary" style={{ marginBottom: 12 }}
          onClick={() => onReview && onReview(materia)}>
          ▶ {t('reviewSubject')}
        </button>

        <div className="filter-row">
          {['all','easy','medium','hard'].map(f => (
            <div key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? t('all') : f === 'easy' ? '✅ ' + t('easy') : f === 'medium' ? '⚡ ' + t('medium') : '🔥 ' + t('hard')}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🃏</div>
            <p style={{ whiteSpace: 'pre-line' }}>{tarjetas.length === 0 ? t('noCards') : t('noCardsFilter')}</p>
          </div>
        ) : (
          filtered.map(tj => (
            <div key={tj.id} className="tarjeta-item">
              <div className="ti-body">
                <div className="ti-q">
                  {tj.pregunta}
                  <span className={`diff-badge ${tj.difficulty === 'easy' ? 'db-easy' : tj.difficulty === 'medium' ? 'db-medium' : 'db-hard'}`}>
                    {tj.difficulty === 'easy' ? t('easy') : tj.difficulty === 'medium' ? t('medium') : t('hard')}
                  </span>
                </div>
                <div className="ti-a">{tj.respuesta}</div>
                {tj.etiqueta && <span className="ti-tag">{tj.etiqueta}</span>}
              </div>
              <div className="ti-actions">
                <button className="ti-btn" onClick={() => setEditTarjeta(tj)}>✏️</button>
                <button className="ti-btn del" onClick={() => deleteTarjetaById(tj.id, onUpdate, showToast, t)}>🗑</button>
              </div>
            </div>
          ))
        )}

        <button className="btn btn-secondary" style={{ marginTop: 4 }}
          onClick={() => setShowTarjetaForm(true)}>
          ➕ {t('newCard')}
        </button>
      </div>
    </>
  )
}

async function deleteTarjetaById(id, onUpdate, showToast, t) {
  if (!confirm(t('confirmDeleteCard'))) return
  await supabase.from('tarjetas').delete().eq('id', id)
  showToast(t('cardDeleted'))
  onUpdate()
}

function TarjetaForm({ materia, tarjeta, onBack, showToast }) {
  const { t } = useLang()
  const isNew = !tarjeta
  const [pregunta, setPregunta] = useState(tarjeta?.pregunta || '')
  const [respuesta, setRespuesta] = useState(tarjeta?.respuesta || '')
  const [pista, setPista] = useState(tarjeta?.pista || '')
  const [nota, setNota] = useState(tarjeta?.nota || '')
  const [etiqueta, setEtiqueta] = useState(tarjeta?.etiqueta || '')
  const [diff, setDiff] = useState(tarjeta?.difficulty || null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!pregunta.trim() || !respuesta.trim()) { showToast(t('qaRequired')); return }
    if (!diff) { showToast(t('selectDiff')); return }
    setSaving(true)
    const data = { pregunta: pregunta.trim(), respuesta: respuesta.trim(), pista, nota, etiqueta, difficulty: diff, materia_id: materia.id, user_id: materia.user_id }
    if (isNew) {
      await supabase.from('tarjetas').insert(data)
    } else {
      await supabase.from('tarjetas').update(data).eq('id', tarjeta.id)
    }
    showToast(t('cardSaved'))
    setSaving(false)
    onBack()
  }

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div className="topbar-title">{isNew ? t('newCardTitle') : t('editCard')}</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="card">
          <div className="card-title">{t('content')}</div>
          <label>{t('question')} *</label>
          <textarea value={pregunta} onChange={e => setPregunta(e.target.value)} placeholder={t('questionPlaceholder')} />
          <label>{t('answer')} *</label>
          <textarea value={respuesta} onChange={e => setRespuesta(e.target.value)} placeholder={t('answerPlaceholder')} />
          <label>{t('hint')}</label>
          <input value={pista} onChange={e => setPista(e.target.value)} placeholder={t('hintPlaceholder')} />
          <label>{t('note')}</label>
          <input value={nota} onChange={e => setNota(e.target.value)} placeholder={t('notePlaceholder')} />
        </div>
        <div className="card">
          <div className="card-title">{t('classification')}</div>
          <label>{t('difficulty')} *</label>
          <div className="diff-selector">
            {['easy','medium','hard'].map(d => (
              <button key={d} className={`diff-btn ${diff === d ? `active-${d}` : ''}`} onClick={() => setDiff(d)}>
                {d === 'easy' ? '✅ ' + t('easy') : d === 'medium' ? '⚡ ' + t('medium') : '🔥 ' + t('hard')}
              </button>
            ))}
          </div>
          <label>{t('tag')}</label>
          <input value={etiqueta} onChange={e => setEtiqueta(e.target.value)} placeholder={t('tagPlaceholder')} />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? t('saving') : t('saveCard') + ' →'}
        </button>
        {!isNew && (
          <button className="btn btn-danger" style={{ marginTop: 8 }}
            onClick={() => deleteTarjetaById(tarjeta.id, onBack, showToast, t)}>
            {t('deleteCard')}
          </button>
        )}
      </div>
    </>
  )
}