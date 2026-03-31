import { Sidebar } from './Sidebar'
import { MobileTabs } from './MobileTabs'

export function AppShell({ children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--mesh-home)',
    }}>
      {/* Sidebar — hidden on mobile */}
      <div style={{ display: 'flex' }} className="sol-sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        overflowX: 'visible',
        paddingBottom: 100,  /* space for mobile tab bar */
      }}>
        {children}
      </main>

      {/* Mobile bottom tabs */}
      <MobileTabs />
    </div>
  )
}
