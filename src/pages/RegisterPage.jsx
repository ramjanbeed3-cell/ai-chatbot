import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { handleRegister, loading, error, setError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', password_confirmation:'' })

  const onChange = (e) => { setError(null); setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) { setError('Passwords do not match'); return }
    const ok = await handleRegister(form.name, form.email, form.password, form.password_confirmation)
    if (ok) navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="bot-icon">🤖</div>
          <h1>Create Account</h1>
          <p>Start chatting with AI today</p>
        </div>

        {error && <div className="error-msg" style={{marginBottom:'1rem'}}>{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input type="text" name="name" value={form.name} onChange={onChange} required placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={onChange} required placeholder="Min 8 characters" />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={onChange} required placeholder="Repeat password" />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-link" style={{marginTop:'1.25rem'}}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
