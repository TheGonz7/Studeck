import { supabase } from '../supabase'
import { useLang } from '../LangContext'

export default function Logros({ materias, onBack, onUpdate, showToast }) {
  const { t } = useLang()

  async function reactivate(m) {
    await supabase.from('materias').update({ status: 'active', crown_date: null }).eq('id', m.id)
    showToast(t('reactivated'))
    onUpdate()
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">{t('hallOfFame')}</div>
      </div>
      <div className="scroll">
        {materias.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👑</div>
            <p style={{ whiteSpace: 'pre-line' }}>{t('noCrowns')}</p>
          </div>
        ) : (
          materias.map(m => (
            <div key={m.id} className="crown-card">
              <div style={{ fontSize: '2rem' }}>👑</div>
              <div style={{ flex: 1 }}>
                <div className="crown-name">{m.name}</div>
                <div className="crown-meta">{t('kingSince')} {m.crown_date || '-'}</div>
                <div className="crown-meta">{(m.tarjetas || []).length} {t('cardsPlural')} · {m.repasos || 0} {t('reviews').toLowerCase()}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => reactivate(m)}>
                {t('reactivate')}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  )
}