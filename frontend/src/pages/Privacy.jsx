export default function Privacy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9F7F4',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {/* Nav */}
      <nav style={{
        padding: '20px 48px',
        borderBottom: '1px solid rgba(232,227,221,0.6)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(249,247,244,0.9)',
        backdropFilter: 'blur(20px)',
      }}>
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#C96B2E', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: 'Fraunces, serif',
            fontStyle: 'italic', fontSize: 13,
          }}>S</div>
          <span style={{
            fontFamily: 'Fraunces, serif', fontStyle: 'italic',
            fontSize: 20, fontWeight: 300, color: '#1A1714',
          }}>Sol</span>
        </a>
      </nav>

      {/* Content */}
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '60px 24px 80px',
      }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 40,
          fontWeight: 300,
          color: '#1A1714',
          marginBottom: 8,
        }}>Privacy Policy</h1>
        <p style={{
          fontSize: 14, color: '#9E8E7E', marginBottom: 48,
        }}>Last updated: April 2026</p>

        {[
          {
            title: '1. Who We Are',
            body: `Sol is an AI-powered mental wellness application built for college students. We are committed to protecting your privacy and handling your data with transparency and care. If you have any questions about this policy, contact us at hello@talktosol.online.`,
          },
          {
            title: '2. What Data We Collect',
            body: `We collect the following information when you use Sol:

- Email address and password (used for authentication via Supabase Auth)
- Profile information you provide: name, preferred name, life goals, current situation
- Therapy session content: messages you send and receive within sessions
- Psychological intake responses from the onboarding questionnaire
- Memory notes automatically extracted from your sessions
- Mood ratings and session metadata
- Device information and usage analytics (anonymous)
- Push notification subscription tokens (if you opt in)`,
          },
          {
            title: '3. How We Use Your Data',
            body: `Your data is used exclusively to:

- Provide and improve the Sol therapy experience
- Personalise Sol's responses based on your profile and history
- Remember context across sessions so you never have to repeat yourself
- Send push notifications if you have opted in
- Analyse anonymous usage patterns to improve the product

We do not sell your data. We do not share your data with third parties for marketing purposes. We do not use your therapy conversations for advertising.`,
          },
          {
            title: '4. AI and Your Conversations',
            body: `Sol uses OpenAI's GPT-4o mini model to generate responses. Your messages are sent to OpenAI's API for processing. OpenAI does not use API data to train their models by default. Your conversations are stored securely in our database (Supabase/PostgreSQL) and are only accessible to you.

Sol is not a licensed medical provider. It is a supportive tool and should not replace professional mental health care. If you are in crisis, please contact a qualified professional.`,
          },
          {
            title: '5. Data Storage and Security',
            body: `Your data is stored on Supabase (PostgreSQL) with row-level security enabled — meaning your data is only accessible by your account. All data is encrypted in transit (HTTPS/TLS). We use industry-standard security practices.

Passwords are hashed using Supabase Auth (bcrypt). We never store plain-text passwords.`,
          },
          {
            title: '6. Your Rights',
            body: `You have the right to:

- Access all data we hold about you
- Export your session history and memories
- Delete your account and all associated data at any time (Settings → Profile → Delete Account)
- Opt out of push notifications at any time (Settings → Notifications)
- Request a copy of your data by emailing hello@talktosol.online`,
          },
          {
            title: '7. Data Retention',
            body: `We retain your data for as long as your account is active. When you delete your account, all your data — including sessions, messages, memories, and profile information — is permanently deleted within 30 days.`,
          },
          {
            title: '8. Cookies',
            body: `Sol uses minimal cookies required for authentication (session tokens). We do not use tracking cookies or advertising cookies.`,
          },
          {
            title: '9. Children',
            body: `Sol is not intended for users under 13 years of age. If you are under 18, please ensure you have parental or guardian consent before using Sol.`,
          },
          {
            title: '10. Changes to This Policy',
            body: `We may update this policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of Sol after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: '11. Contact',
            body: `For any privacy-related questions or requests:

Email: hello@talktosol.online
We aim to respond within 48 hours.`,
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 36 }}>
            <h2 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              color: '#1A1714',
              marginBottom: 12,
            }}>{section.title}</h2>
            <div style={{
              fontSize: 15,
              color: '#6B6560',
              lineHeight: 1.8,
              whiteSpace: 'pre-line',
            }}>{section.body}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(232,227,221,0.6)',
        padding: '24px 48px',
        display: 'flex',
        gap: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <a href="/" style={{ fontSize: 13, color: '#9E8E7E',
                            textDecoration: 'none' }}>Home</a>
        <a href="/terms" style={{ fontSize: 13, color: '#9E8E7E',
                                 textDecoration: 'none' }}>Terms</a>
        <span style={{ fontSize: 13, color: '#C8C3BD' }}>
          © 2026 Sol
        </span>
      </div>
    </div>
  )
}
