import { useLang } from '../LangContext'

export default function Privacidad({ onBack }) {
  const { lang } = useLang()

  const CONTACT = 'soporte@studeck.app' // ← cámbialo por tu correo real
  const updated = '1 de junio de 2026'

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 18px 60px' }}>
      {onBack && (
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={onBack}>
          ← {lang === 'es' ? 'Volver' : 'Back'}
        </button>
      )}

      {lang === 'es' ? (
        <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text2)' }}>
          <h1 style={{ fontFamily: 'Righteous, cursive', color: 'var(--text)', fontSize: '1.4rem', marginBottom: 6 }}>Política de Privacidad</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 20 }}>Última actualización: {updated}</p>

          <p style={{ marginBottom: 16 }}>En Studeck respetamos tu privacidad. Esta política explica qué información recopilamos, cómo la usamos y cuáles son tus derechos.</p>

          <Section title="1. Información que recopilamos">
            Cuando creas una cuenta y usas Studeck, recopilamos: tu nombre, tu correo electrónico, el avatar que eliges, y el contenido que creas (materias, tarjetas y estadísticas de tu estudio). Si inicias sesión con Google, recibimos tu nombre, correo y foto de perfil proporcionados por Google.
          </Section>

          <Section title="2. Cómo usamos tu información">
            Usamos tu información únicamente para: crear y mantener tu cuenta, guardar y sincronizar tu contenido de estudio entre dispositivos, y mejorar la aplicación. No vendemos ni compartimos tus datos personales con terceros con fines publicitarios.
          </Section>

          <Section title="3. Almacenamiento de datos">
            Tus datos se almacenan de forma segura mediante Supabase (nuestro proveedor de base de datos) y se sirven a través de Vercel (nuestro proveedor de alojamiento). Estos servicios aplican medidas de seguridad estándar de la industria.
          </Section>

          <Section title="4. Servicios de terceros">
            Studeck utiliza Google para el inicio de sesión, Supabase para la base de datos y autenticación, y Vercel para el alojamiento. Cada uno tiene su propia política de privacidad que rige el tratamiento de los datos que procesan.
          </Section>

          <Section title="5. Tus derechos">
            Puedes acceder, modificar o eliminar tu información en cualquier momento desde tu perfil dentro de la app. Si deseas eliminar tu cuenta por completo, puedes contactarnos al correo indicado abajo.
          </Section>

          <Section title="6. Datos de menores">
            Studeck no está dirigido a menores de 13 años. No recopilamos conscientemente información de niños menores de esa edad.
          </Section>

          <Section title="7. Cambios a esta política">
            Podemos actualizar esta política ocasionalmente. Publicaremos cualquier cambio en esta misma página con su fecha de actualización.
          </Section>

          <Section title="8. Contacto">
            Si tienes preguntas sobre esta política, escríbenos a: {CONTACT}
          </Section>
        </div>
      ) : (
        <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text2)' }}>
          <h1 style={{ fontFamily: 'Righteous, cursive', color: 'var(--text)', fontSize: '1.4rem', marginBottom: 6 }}>Privacy Policy</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 20 }}>Last updated: June 1, 2026</p>

          <p style={{ marginBottom: 16 }}>At Studeck we respect your privacy. This policy explains what information we collect, how we use it, and what your rights are.</p>

          <Section title="1. Information we collect">
            When you create an account and use Studeck, we collect: your name, your email, the avatar you choose, and the content you create (subjects, cards, and your study statistics). If you sign in with Google, we receive your name, email, and profile picture provided by Google.
          </Section>

          <Section title="2. How we use your information">
            We use your information only to: create and maintain your account, save and sync your study content across devices, and improve the app. We do not sell or share your personal data with third parties for advertising purposes.
          </Section>

          <Section title="3. Data storage">
            Your data is stored securely through Supabase (our database provider) and served through Vercel (our hosting provider). These services apply industry-standard security measures.
          </Section>

          <Section title="4. Third-party services">
            Studeck uses Google for sign-in, Supabase for database and authentication, and Vercel for hosting. Each has its own privacy policy governing the data they process.
          </Section>

          <Section title="5. Your rights">
            You can access, modify, or delete your information at any time from your profile within the app. If you wish to fully delete your account, you can contact us at the email below.
          </Section>

          <Section title="6. Children's data">
            Studeck is not directed at children under 13. We do not knowingly collect information from children under that age.
          </Section>

          <Section title="7. Changes to this policy">
            We may update this policy occasionally. We will post any changes on this page along with the updated date.
          </Section>

          <Section title="8. Contact">
            If you have questions about this policy, email us at: {CONTACT}
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 800, marginBottom: 4 }}>{title}</h2>
      <p>{children}</p>
    </div>
  )
}
