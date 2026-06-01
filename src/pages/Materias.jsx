import { useState } from 'react'
import { supabase } from '../supabase'

const COLORS = ['#2563eb','#00d4aa','#f97316','#fbbf24','#ef4444','#00b4d8','#8b5cf6','#ec4899']

export default function Materias({ materia, onBack, onSave, onDelete, showToast, onUpdate, session, onReview }) {
  const isNew = !materia
  const [view, setView] = useState(isNew ? 'form' : 'detail')
  const [name, setName] = useState(materia?.name || '')
  const [desc, setDesc] = useState(materia?.description || '')
  const [icon, setIcon] = useState(materia?.icon || '📚')
  const [color, setColor] = useState(materia?.color || '#2563eb')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [celebration, setCelebration] = useState(null)

  // ── FORM ──────────────────────────────────────────
  async function saveMateria() {
    if (!name.trim()) { showToast('⚠️ El nombre es obligatorio'); return }
    setSaving(true)
    if (isNew) {
      const { error } = await supabase.from('materias').insert({
        name: name.trim(), description: desc.trim(),
        icon, color, user_id: session?.user?.id,
        status: 'active', repasos: 0, review_history: []
      })
      if (error) showToast('❌ Error al guardar')
      else onSave()
    } else {
      const { error } = await supabase.from('materias')
        .update({ name: name.trim(), description: desc.trim(), icon, color })
        .eq('id', materia.id)
      if (error) showToast('❌ Error al guardar')
      else { onSave(); setView('detail') }
    }
    setSaving(false)
  }

  async function deleteMateria() {
    if (!confirm(`¿Eliminar "${materia.name}" y todas sus tarjetas?`)) return
    await supabase.from('materias').delete().eq('id', materia.id)
    onDelete()
  }

  async function markDominated() {
    await supabase.from('materias').update({ status: 'dominated' }).eq('id', materia.id)
    onUpdate()
    setCelebration({ icon: '⭐', title: '¡Mazo dominado!', sub: `"${materia.name}" está marcado como dominado.\n¡Cuando estés listo, declárate Rey!` })
  }

  async function crownMateria() {
    if (!confirm(`¿Declararte Rey de "${materia.name}"?`)) return
    const today = new Date().toLocaleDateString('es-ES')
    await supabase.from('materias').update({ status: 'crown', crown_date: today }).eq('id', materia.id)
    onUpdate()
    spawnConfetti()
    setCelebration({ icon: '👑', title: `¡Rey de ${materia.name}!`, sub: `Has dominado completamente este mazo.\nFecha: ${today}` })
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

  // ── TARJETAS ──────────────────────────────────────
  const tarjetas = materia?.tarjetas || []
  const filtered = filter === 'all' ? tarjetas : tarjetas.filter(t => t.difficulty === filter)
  const reviewHistory = materia?.review_history || []
  const last3 = reviewHistory.slice(-3)
  const showDomination = materia && materia.status === 'active' && last3.length >= 3 && last3.every(r => r >= 80)
  const showKing = materia?.status === 'dominated'

  // ── NUEVA TARJETA STATE ───────────────────────────
  const [showTarjetaForm, setShowTarjetaForm] = useState(false)
  const [editTarjeta, setEditTarjeta] = useState(null)

  if (view === 'form' || (isNew)) {
    return (
      <>
        <div className="topbar">
          <button className="icon-btn" onClick={onBack}>←</button>
          <div className="topbar-title">{isNew ? 'Nueva materia' : 'Editar materia'}</div>
          <div style={{ width: 36 }} />
        </div>
        <div className="scroll">
          <div className="card">
            <div className="card-title">Información</div>
            <label>Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ej: Inglés, Ingeniería Civil..." />
            <label>Descripción (opcional)</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="ej: Vocabulario para el IELTS" />
            <label>Ícono (emoji)</label>
            <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="📚" maxLength={2} />
            <label>Color</label>
            <div className="color-row">
              {COLORS.map(c => (
                <div key={c} className={`color-opt ${color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveMateria} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar materia →'}
          </button>
          {!isNew && (
            <button className="btn btn-danger" style={{ marginTop: 8 }} onClick={deleteMateria}>
              Eliminar materia
            </button>
          )}
        </div>
      </>
    )
  }

  // ── DETAIL VIEW ───────────────────────────────────
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
          <button className="btn btn-gold" style={{ maxWidth: 280 }} onClick={() => setCelebration(null)}>¡Genial! 🎉</button>
        </div>
      )}

      <div className="topbar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div>
          <div className="topbar-title">{materia.icon} {materia.name}</div>
          <div className="topbar-sub">{tarjetas.length} tarjeta{tarjetas.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="icon-btn" onClick={() => setView('form')}>✏️</button>
      </div>

      <div className="scroll">
        {showDomination && (
          <div className="notice-box" style={{ marginBottom: 12 }}>
            <div className="notice-title">⭐ ¡Lograste dominar este mazo!</div>
            <div className="notice-text">Has completado 3 repasos con más del 80% de aciertos.</div>
            <div className="btn-row">
              <button className="btn btn-gold btn-sm" onClick={markDominated}>Marcar como dominado ⭐</button>
              <button className="btn btn-secondary btn-sm" onClick={() => {}}>Seguir repasando</button>
            </div>
          </div>
        )}

        {showKing && (
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-gold" onClick={crownMateria}>👑 ¿Declararte Rey de este mazo?</button>
          </div>
        )}

        <button className="btn btn-primary" style={{ marginBottom: 12 }}
          onClick={() => onReview && onReview(materia)}>
          ▶ Repasar esta materia
        </button>

        <div className="filter-row">
          {['all','easy','medium','hard'].map(f => (
            <div key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todas' : f === 'easy' ? '✅ Fácil' : f === 'medium' ? '⚡ Media' : '🔥 Difícil'}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🃏</div>
            <p>{tarjetas.length === 0 ? 'Aún no hay tarjetas.\n¡Agrega tu primera!' : 'No hay tarjetas con ese filtro.'}</p>
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="tarjeta-item">
              <div className="ti-body">
                <div className="ti-q">
                  {t.pregunta}
                  <span className={`diff-badge ${t.difficulty === 'easy' ? 'db-easy' : t.difficulty === 'medium' ? 'db-medium' : 'db-hard'}`}>
                    {t.difficulty === 'easy' ? 'Fácil' : t.difficulty === 'medium' ? 'Media' : 'Difícil'}
                  </span>
                </div>
                <div className="ti-a">{t.respuesta}</div>
                {t.etiqueta && <span className="ti-tag">{t.etiqueta}</span>}
              </div>
              <div className="ti-actions">
                <button className="ti-btn" onClick={() => setEditTarjeta(t)}>✏️</button>
                <button className="ti-btn del" onClick={() => deleteTarjetaById(t.id, onUpdate, showToast)}>🗑</button>
              </div>
            </div>
          ))
        )}

        <button className="btn btn-secondary" style={{ marginTop: 4 }}
          onClick={() => setShowTarjetaForm(true)}>
          ➕ Nueva tarjeta
        </button>
      </div>
    </>
  )
}

async function deleteTarjetaById(id, onUpdate, showToast) {
  if (!confirm('¿Eliminar esta tarjeta?')) return
  await supabase.from('tarjetas').delete().eq('id', id)
  showToast('🗑️ Tarjeta eliminada')
  onUpdate()
}

function TarjetaForm({ materia, tarjeta, onBack, showToast }) {
  const isNew = !tarjeta
  const [pregunta, setPregunta] = useState(tarjeta?.pregunta || '')
  const [respuesta, setRespuesta] = useState(tarjeta?.respuesta || '')
  const [pista, setPista] = useState(tarjeta?.pista || '')
  const [nota, setNota] = useState(tarjeta?.nota || '')
  const [etiqueta, setEtiqueta] = useState(tarjeta?.etiqueta || '')
  const [diff, setDiff] = useState(tarjeta?.difficulty || null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!pregunta.trim() || !respuesta.trim()) { showToast('⚠️ Pregunta y respuesta son obligatorias'); return }
    if (!diff) { showToast('⚠️ Selecciona una dificultad'); return }
    setSaving(true)
    const data = { pregunta: pregunta.trim(), respuesta: respuesta.trim(), pista, nota, etiqueta, difficulty: diff, materia_id: materia.id, user_id: materia.user_id }
    if (isNew) {
      await supabase.from('tarjetas').insert(data)
    } else {
      await supabase.from('tarjetas').update(data).eq('id', tarjeta.id)
    }
    showToast('✅ Tarjeta guardada')
    setSaving(false)
    onBack()
  }

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div className="topbar-title">{isNew ? 'Nueva tarjeta' : 'Editar tarjeta'}</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="scroll">
        <div className="card">
          <div className="card-title">Contenido</div>
          <label>Pregunta *</label>
          <textarea value={pregunta} onChange={e => setPregunta(e.target.value)} placeholder="ej: ¿De qué está compuesto el hormigón?" />
          <label>Respuesta *</label>
          <textarea value={respuesta} onChange={e => setRespuesta(e.target.value)} placeholder="ej: 60% piedra, 30% arena, 10% cemento" />
          <label>Pista (opcional)</label>
          <input value={pista} onChange={e => setPista(e.target.value)} placeholder="ej: Son 3 elementos" />
          <label>Nota adicional (opcional)</label>
          <input value={nota} onChange={e => setNota(e.target.value)} placeholder="ej: Ver página 34" />
        </div>
        <div className="card">
          <div className="card-title">Clasificación</div>
          <label>Dificultad *</label>
          <div className="diff-selector">
            {['easy','medium','hard'].map(d => (
              <button key={d} className={`diff-btn ${diff === d ? `active-${d}` : ''}`} onClick={() => setDiff(d)}>
                {d === 'easy' ? '✅ Fácil' : d === 'medium' ? '⚡ Media' : '🔥 Difícil'}
              </button>
            ))}
          </div>
          <label>Etiqueta / Unidad (opcional)</label>
          <input value={etiqueta} onChange={e => setEtiqueta(e.target.value)} placeholder="ej: Unidad 2, Examen parcial" />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar tarjeta →'}
        </button>
        {!isNew && (
          <button className="btn btn-danger" style={{ marginTop: 8 }}
            onClick={() => deleteTarjetaById(tarjeta.id, onBack, showToast)}>
            Eliminar tarjeta
          </button>
        )}
      </div>
    </>
  )
}
