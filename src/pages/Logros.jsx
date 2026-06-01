import { supabase } from '../supabase'

export default function Logros({ materias, onBack, onUpdate, showToast }) {
  async function reactivate(m) {
    await supabase.from('materias').update({ status: 'active', crown_date: null }).eq('id', m.id)
    showToast('🔄 Materia reactivada')
    onUpdate()
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Salón de la Fama 🏆</div>
      </div>
      <div className="scroll">
        {materias.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👑</div>
            <p>Aún no tienes coronas.<br />Domina un mazo para<br />aparecer aquí.</p>
          </div>
        ) : (
          materias.map(m => (
            <div key={m.id} className="crown-card">
              <div style={{ fontSize: '2rem' }}>👑</div>
              <div style={{ flex: 1 }}>
                <div className="crown-name">{m.name}</div>
                <div className="crown-meta">Rey desde {m.crown_date || 'hoy'}</div>
                <div className="crown-meta">{(m.tarjetas || []).length} tarjetas · {m.repasos || 0} repasos</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => reactivate(m)}>
                Reactivar
              </button>
            </div>
          ))
        )}
      </div>
    </>
  )
}
