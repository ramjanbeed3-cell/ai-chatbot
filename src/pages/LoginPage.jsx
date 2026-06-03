import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { handleLogin, loading, error, setError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'demo@chatbot.com', password: 'password123' })

  const onChange = (e) => { setError(null); setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  const onSubmit = async (e) => {
    e.preventDefault()
    const ok = await handleLogin(form.email, form.password)
    if (ok) navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="bot-icon">🤖</div>
          <h1>AI Support Chatbot</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-msg" style={{marginBottom:'1rem'}}>{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={onChange} required placeholder="••••••••" />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-link" style={{marginTop:'1.25rem'}}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
        <p style={{textAlign:'center',fontSize:'.75rem',color:'var(--text-muted)',marginTop:'.75rem'}}>
          Demo: demo@chatbot.com / password123
        </p>
      </div>
    </div>
  )
}
