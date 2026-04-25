import { useParams, Link, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import posts from './posts/index.js'

export default function BlogPost() {
  const { slug } = useParams()
  const [postContent, setPostContent] = useState(null)
  const [loading, setLoading] = useState(true)

  const meta = posts.find(p => p.slug === slug)

  useEffect(() => {
    if (!meta) { setLoading(false); return }

    // Dynamic import the .md file as raw string
    import(`./posts/${slug}.md?raw`)
      .then(mod => {
        // Strip frontmatter (everything between --- and ---)
        const raw = mod.default
        const withoutFrontmatter = raw.replace(
          /^\s*---[\s\S]*?---\s*/, ''
        ).trim()
        setPostContent(withoutFrontmatter)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F9F7F4',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#9E8E7E',
      fontFamily: 'DM Sans, sans-serif', fontSize: 14,
    }}>Loading...</div>
  )

  if (!meta || !postContent) {
    return <Navigate to="/blog" replace />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9F7F4',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <Helmet>
        <title>{meta.title} | Sol</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical"
          href={`https://talktosol.online/blog/${slug}`} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url"
          content={`https://talktosol.online/blog/${slug}`} />
        <meta property="article:published_time" content={meta.date} />
      </Helmet>

      {/* Nav */}
      <nav style={{
        padding: '20px 48px',
        borderBottom: '1px solid rgba(232,227,221,0.6)',
        display: 'flex', alignItems: 'center',
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/blog" style={{
            fontSize: 14, color: '#6B6560', textDecoration: 'none',
          }}>← All posts</Link>
          <Link to="/auth" style={{
            padding: '9px 18px', borderRadius: 999,
            background: '#C96B2E', color: 'white',
            textDecoration: 'none', fontSize: 13, fontWeight: 500,
          }}>Start free →</Link>
        </div>
      </nav>

      {/* Article */}
      <article style={{
        maxWidth: 680, margin: '0 auto',
        padding: '60px 24px 80px',
      }}>
        {/* Meta */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 13, color: '#9E8E7E' }}>
            {new Date(meta.date).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </span>
          <span style={{ color: '#E8E3DD' }}>·</span>
          <span style={{ fontSize: 13, color: '#9E8E7E' }}>
            {meta.readTime} min read
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontWeight: 300,
          fontSize: 'clamp(28px, 5vw, 44px)',
          color: '#1A1714', marginBottom: 20,
          lineHeight: 1.1, letterSpacing: '-0.02em',
        }}>{meta.title}</h1>

        {/* Description */}
        <p style={{
          fontSize: 18, color: '#6B6560',
          lineHeight: 1.65, marginBottom: 40,
          borderBottom: '1px solid #E8E3DD',
          paddingBottom: 32,
        }}>{meta.description}</p>

        {/* Content — rendered from markdown */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({children}) => (
              <h2 style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 300,
                fontSize: 'clamp(20px, 3vw, 26px)',
                color: '#1A1714',
                marginTop: 40,
                marginBottom: 12,
                lineHeight: 1.25,
              }}>{children}</h2>
            ),
            h3: ({children}) => (
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                fontSize: 18,
                color: '#1A1714',
                marginTop: 28,
                marginBottom: 8,
              }}>{children}</h3>
            ),
            p: ({children}) => (
              <p style={{
                fontSize: 16,
                color: '#4A4541',
                lineHeight: 1.8,
                marginBottom: 18,
              }}>{children}</p>
            ),
            strong: ({children}) => (
              <strong style={{
                color: '#1A1714',
                fontWeight: 600,
              }}>{children}</strong>
            ),
            a: ({href, children}) => {
              const isInternal = href?.startsWith('/')
              return isInternal ? (
                <Link to={href} style={{
                  color: '#C96B2E',
                  textDecoration: 'underline',
                }}>{children}</Link>
              ) : (
                <a href={href} target="_blank" rel="noopener noreferrer"
                   style={{ color: '#C96B2E', textDecoration: 'underline' }}>
                  {children}
                </a>
              )
            },
            ul: ({children}) => (
              <ul style={{
                paddingLeft: 20,
                marginBottom: 18,
              }}>{children}</ul>
            ),
            li: ({children}) => (
              <li style={{
                fontSize: 16,
                color: '#4A4541',
                lineHeight: 1.8,
                marginBottom: 4,
              }}>{children}</li>
            ),
            blockquote: ({children}) => (
              <blockquote style={{
                borderLeft: '3px solid #C96B2E',
                paddingLeft: 16,
                marginLeft: 0,
                fontStyle: 'italic',
                color: '#6B6560',
              }}>{children}</blockquote>
            ),
            hr: () => (
              <hr style={{
                border: 'none',
                borderTop: '1px solid #E8E3DD',
                margin: '32px 0',
              }} />
            ),
          }}
        >
          {postContent}
        </ReactMarkdown>

        {/* Tags */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          marginTop: 48, paddingTop: 24,
          borderTop: '1px solid #E8E3DD',
        }}>
          {meta.tags.map(tag => (
            <span key={tag} style={{
              padding: '4px 12px', borderRadius: 999,
              background: 'rgba(201,107,46,0.07)',
              border: '1px solid rgba(201,107,46,0.15)',
              fontSize: 12, fontWeight: 600,
              color: '#C96B2E', textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>{tag}</span>
          ))}
        </div>
      </article>

      {/* CTA at bottom */}
      <div style={{
        background: 'rgba(201,107,46,0.05)',
        border: '1px solid rgba(201,107,46,0.15)',
        borderRadius: 20,
        maxWidth: 680, margin: '0 auto 80px',
        padding: '36px 32px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontStyle: 'italic',
          fontSize: 24, fontWeight: 300, color: '#1A1714',
          marginBottom: 10,
        }}>
          Reading about it helps.
        </div>
        <p style={{
          fontSize: 15, color: '#6B6560',
          marginBottom: 24, lineHeight: 1.6,
        }}>
          Sol is an AI therapist that listens without judgment,
          remembers everything, and is available right now.
          Free to start.
        </p>
        <Link to="/auth" style={{
          display: 'inline-block',
          padding: '14px 32px', borderRadius: 999,
          background: '#C96B2E', color: 'white',
          textDecoration: 'none', fontSize: 15, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(201,107,46,0.35)',
        }}>
          Talk to Sol for free →
        </Link>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(232,227,221,0.6)',
        padding: '24px 48px',
        display: 'flex', gap: 24, alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Link to="/blog" style={{
          fontSize: 13, color: '#9E8E7E', textDecoration: 'none',
        }}>Blog</Link>
        <Link to="/privacy" style={{
          fontSize: 13, color: '#9E8E7E', textDecoration: 'none',
        }}>Privacy</Link>
        <Link to="/terms" style={{
          fontSize: 13, color: '#9E8E7E', textDecoration: 'none',
        }}>Terms</Link>
        <span style={{ fontSize: 13, color: '#C8C3BD' }}>© 2026 Sol</span>
      </div>
    </div>
  )
}
