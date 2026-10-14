import { useState } from 'react'
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '1rem' }}>
          <HeartPulse size={36} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
          CareFlow HMS
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Hospital Management System frontend successfully initialized with React 19 and Vite.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span className="btn" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <Activity size={16} /> Backend: Spring Boot
          </span>
          <span className="btn" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <ShieldCheck size={16} /> Auth: JWT & RBAC
          </span>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setCount((c) => c + 1)}
          style={{ width: '100%' }}
        >
          Interactive Test: Clicked {count} times
        </button>
      </div>
    </div>
  )
}
