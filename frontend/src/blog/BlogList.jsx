import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import posts from './posts/index.js'

export default function BlogList() {
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9F7F4',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <Helmet>
        <title>Sol Blog — Mental Health for College Students</title>
        <meta name="description"
          content="Real talk about anxiety, loneliness, relationships, and mental health — written for college students by people who get it." />
        <link rel="canonical" href="https://talktosol.online/blog" />
      </Helmet>

      {/* Nav */}
      <nav style={{
        padding: '20px 48px',
        borderBottom: '1px solid rgba(232,227,221,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(249,247,244,0.9)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link to="/" style={{
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
        </Link>
        <Link to="/auth" style={{
          padding: '9px 20px', borderRadius: 999,
          background: '#C96B2E', color: 'white',
          textDecoration: 'none', fontSize: 14, fontWeight: 500,
        }}>Start free →</Link>
      </nav>

      {/* Header */}
      <div style={{
        maxWidth: 760, margin: '0 auto',
        padding: '60px 24px 40px',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(201,107,46,0.08)',
          border: '1px solid rgba(201,107,46,0.2)',
          marginBottom: 20,
        }}>
          <span style={{ color: '#C96B2E', fontSize: 12 }}>✦</span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: '#C96B2E',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>Sol Blog</span>
        </div>

        <h1 style={{
          fontFamily: 'Fraunces, serif', fontWeight: 300,
          fontSize: 'clamp(32px, 6vw, 52px)',
          color: '#1A1714', marginBottom: 16, lineHeight: 1.1,
        }}>
          Real talk about<br />
          <em style={{ color: '#C96B2E' }}>how you're actually feeling.</em>
        </h1>
        <p style={{
          fontSize: 17, color: '#6B6560', lineHeight: 1.65,
          maxWidth: 480,
        }}>
          No toxic positivity. No "just meditate more."
          Just honest writing about the things college students
          actually go through.
        </p>
      </div>

      {/* Post list */}
      <div style={{
        maxWidth: 760, margin: '0 auto',
        padding: '0 24px 80px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {sorted.map(post => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              padding: '28px 28px',
              borderRadius: 20,
              background: 'rgba(255,252,248,0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(232,227,221,0.7)',
              transition: 'all 200ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow =
                '0 8px 32px rgba(201,107,46,0.1)'
              e.currentTarget.style.borderColor =
                'rgba(201,107,46,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor =
                'rgba(232,227,221,0.7)'
            }}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 12, marginBottom: 10,
              }}>
                <span style={{ fontSize: 12, color: '#9E8E7E' }}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </span>
                <span style={{ color: '#E8E3DD' }}>·</span>
                <span style={{ fontSize: 12, color: '#9E8E7E' }}>
                  {post.readTime} min read
                </span>
              </div>

              <h2 style={{
                fontFamily: 'Fraunces, serif', fontWeight: 300,
                fontSize: 'clamp(18px, 3vw, 24px)',
                color: '#1A1714', marginBottom: 10, lineHeight: 1.2,
              }}>{post.title}</h2>

              <p style={{
                fontSize: 14, color: '#6B6560',
                lineHeight: 1.65, marginBottom: 16,
              }}>{post.description}</p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {post.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '3px 10px', borderRadius: 999,
                    background: 'rgba(201,107,46,0.07)',
                    border: '1px solid rgba(201,107,46,0.15)',
                    fontSize: 11, fontWeight: 600,
                    color: '#C96B2E',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{
        borderTop: '1px solid rgba(232,227,221,0.6)',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: 16, color: '#6B6560',
          marginBottom: 20, lineHeight: 1.6,
        }}>
          Reading about it helps.<br />
          Talking about it helps more.
        </p>
        <Link to="/auth" style={{
          display: 'inline-block',
          padding: '14px 32px', borderRadius: 999,
          background: '#C96B2E', color: 'white',
          textDecoration: 'none', fontSize: 15, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(201,107,46,0.35)',
        }}>
          Talk to Sol — it's free →
        </Link>
      </div>
    </div>
  )
}
