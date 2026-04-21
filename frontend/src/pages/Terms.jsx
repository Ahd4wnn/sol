export default function Terms() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9F7F4',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {/* Same nav as Privacy page */}
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
        }}>Terms of Service</h1>
        <p style={{
          fontSize: 14, color: '#9E8E7E', marginBottom: 48,
        }}>Last updated: April 2026</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By creating an account and using Sol, you agree to these Terms of Service. If you do not agree, please do not use Sol. We may update these terms from time to time — continued use constitutes acceptance.`,
          },
          {
            title: '2. What Sol Is (and Is Not)',
            body: `Sol is an AI-powered mental wellness support tool. It is designed to provide emotional support, help you process thoughts and feelings, and offer perspective.

Sol is NOT:
- A licensed therapist or mental health professional
- A crisis intervention service
- A replacement for professional medical or psychiatric care
- A diagnostic tool

If you are experiencing a mental health crisis, suicidal thoughts, or require immediate help, please contact a qualified professional or emergency services immediately.

Crisis resources:
iCall India: 9152987821
Vandrevala Foundation: 1860-2662-345 (24/7)`,
          },
          {
            title: '3. Eligibility',
            body: `You must be at least 13 years old to use Sol. If you are under 18, you represent that you have obtained parental or guardian consent. Sol is intended primarily for college students and young adults.`,
          },
          {
            title: '4. Account Responsibility',
            body: `You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your account with others. You are responsible for all activity that occurs under your account. Notify us immediately at hello@talktosol.online if you suspect unauthorised access.`,
          },
          {
            title: '5. Acceptable Use',
            body: `You agree not to:

- Use Sol for any illegal purpose
- Attempt to reverse engineer, scrape, or extract data from Sol
- Use Sol to harass, harm, or impersonate others
- Attempt to bypass subscription limits or authentication
- Use Sol to generate harmful, abusive, or illegal content
- Share your account credentials with others`,
          },
          {
            title: '6. Subscription and Payments',
            body: `Sol offers a free tier with limited messages and paid Pro plans (monthly and yearly). Payments are processed securely via Razorpay. All prices are displayed in USD.

Refunds: We offer refunds within 7 days of purchase if you are unsatisfied. Contact hello@talktosol.online with your order details.

Cancellations: You can cancel your subscription at any time from Settings → Profile. Cancellation takes effect at the end of your current billing period.`,
          },
          {
            title: '7. Your Content',
            body: `You retain ownership of everything you share with Sol — your messages, reflections, and responses. By using Sol, you grant us a limited licence to process and store this content solely for the purpose of providing the Sol service.

We do not claim ownership of your personal content and will not use it for advertising or share it with third parties.`,
          },
          {
            title: '8. Intellectual Property',
            body: `Sol's design, codebase, archetypes (Riley, Sage, Alex, Aura, Apex, Crest, Forge, Vale), brand identity, and all original content are the intellectual property of Sol. You may not reproduce, copy, or distribute any part of Sol without written permission.`,
          },
          {
            title: '9. Disclaimers',
            body: `Sol is provided "as is" without warranties of any kind. We do not guarantee that Sol will be available 100% of the time, that responses will be accurate or appropriate for your situation, or that Sol will meet your specific needs.

Mental health support provided by Sol is not a substitute for professional care. Always seek the advice of a qualified mental health professional for serious concerns.`,
          },
          {
            title: '10. Limitation of Liability',
            body: `To the fullest extent permitted by law, Sol and its creators are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability to you shall not exceed the amount you paid us in the 12 months prior to the claim.`,
          },
          {
            title: '11. Termination',
            body: `We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from within the app. Upon termination, your data will be deleted within 30 days.`,
          },
          {
            title: '12. Governing Law',
            body: `These terms are governed by the laws of India. Any disputes will be resolved in the courts of [your city], India.`,
          },
          {
            title: '13. Contact',
            body: `Questions about these terms? Email us at hello@talktosol.online. We aim to respond within 48 hours.`,
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
        <a href="/privacy" style={{ fontSize: 13, color: '#9E8E7E',
                                   textDecoration: 'none' }}>Privacy</a>
        <span style={{ fontSize: 13, color: '#C8C3BD' }}>
          © 2026 Sol
        </span>
      </div>
    </div>
  )
}
