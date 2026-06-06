import { useState } from 'react'
import { supabase } from '../supabase'
import { useLang } from '../LangContext'

const AVATARS = ['🦉','🧠','🚀','📚','🎓','💡','⭐','🔥','🐝','🦊','🐢','🦁','🌟','✏️','🎯','🏆']

export default function Perfil({ session, onBack, onUpdate, showToast }) {
  const { t, lang, changeLang } = useLang()
  const meta = session.user.user_metadata || {}
  const [name, setName] = useState(meta.name || '')
  const [avatar, setAvatar] = useState(meta.avatar || '🦉')
  const [saving, setSaving] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [newPass, setNewPass] = useState('')

  const email = session.user.email
  const provider = session.user.app_metadata?.provider || 'email'

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { name: name.trim(), avatar }
    })
    if (error) showToast(t('saveError'))
    else { showToast(t('profileUpdated')); onUpdate && onUpdate() }
    setSaving(false)
  }

  async function changePassword() {
    if (newPass.length < 6) { showToast('⚠️ ' + t('min6')); return }
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) showToast('❌ ' + error.message)
    else { showToast(t('passwordChanged')); setNewPass(''); setChangingPass(false) }
  }

  async function doLogout() {
    if (!confirm(t('confirmLogout'))) return
    await supabase.auth.signOut()
  }

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div className="topbar-title">{t('myProfile')}</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="scroll">
        {/* Avatar grande actual */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: '4rem', width: 110, height: 110, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--card)', border: '2px solid var(--accent)',
            borderRadius: '50%'
          }}>
            {avatar}
          </div>
        </div>

        {/* Selector de avatares */}
        <div className="card">
          <div className="card-title">{t('chooseAvatar')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
            {AVATARS.map(a => (
              <div key={a} onClick={() => setAvatar(a)}
                style={{
                  fontSize: '1.5rem', aspectRatio: '1', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: avatar === a ? 'var(--accent)' : 'var(--bg)',
                  border: `1px solid ${avatar === a ? 'var(--accent)' : 'var(--border2)'}`,
                  borderRadius: 10, cursor: 'pointer'
                }}>
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* Datos */}
        <div className="card">
          <div className="card-title">{t('yourData')}</div>
          <label>{t('name')}</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('yourName')} />
          <label>{t('email')}</label>
          <input value={email} disabled style={{ opacity: 0.6 }} />
          <label>{t('linkedWith')}</label>
          <input value={provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : t('emailAccount')} disabled style={{ opacity: 0.6 }} />
        </div>

        {/* Selector de idioma */}
        <div className="card">
          <div className="card-title">{t('language')}</div>
          <div className="btn-row">
            <button
              className={lang === 'es' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => changeLang('es')}>
              🇪🇸 Español
            </button>
            <button
              className={lang === 'en' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => changeLang('en')}>
              🇬🇧 English
            </button>
          </div>
        </div>

        <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
          {saving ? t('saving') : t('saveChanges') + ' →'}
        </button>

        {/* Cambiar contraseña — solo si es cuenta de correo */}
        {provider === 'email' && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title">{t('security')}</div>
            {!changingPass ? (
              <button className="btn btn-secondary" onClick={() => setChangingPass(true)}>
                {t('changePassword')}
              </button>
            ) : (
              <>
                <label>{t('newPassword')}</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder={t('min6')} />
                <div className="btn-row">
                  <button className="btn btn-primary" onClick={changePassword}>{t('save')}</button>
                  <button className="btn btn-secondary" onClick={() => { setChangingPass(false); setNewPass('') }}>{t('cancel')}</button>
                </div>
              </>
            )}
          </div>
        )}

        <button className="btn btn-danger" style={{ marginTop: 12 }} onClick={doLogout}>
          {t('logout')}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/privacidad"
            style={{ fontSize: '0.75rem', color: 'var(--text3)', textDecoration: 'underline' }}>
            {t('privacyPolicy')}
          </a>
        </div>
      </div>
    </>
  )
}