import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, info) {
    console.error('[Sol ErrorBoundary]', error, info)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif',
          background: '#F9F7F4',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: 48 }}>☀️</div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300 }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6B6560', marginBottom: 24 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <pre style={{ 
            background: '#fff', 
            padding: 16, 
            borderRadius: 12,
            fontSize: 12,
            color: '#C0392B',
            maxWidth: 600,
            overflow: 'auto',
            textAlign: 'left'
          }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{
              marginTop: 24,
              background: '#C96B2E',
              color: 'white',
              border: 'none',
              borderRadius: 999,
              padding: '12px 24px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
