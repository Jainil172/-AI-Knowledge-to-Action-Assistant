import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.email || !form.password) {
            setError('Please fill in all fields.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Signup failed');
            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pwdStrength = form.password.length === 0 ? null
        : form.password.length < 6 ? 'weak'
            : form.password.length < 10 ? 'fair'
                : 'strong';

    const strengthColors = { weak: '#ef4444', fair: '#f59e0b', strong: '#16a34a' };
    const strengthLabels = { weak: 'Too short', fair: 'Fair', strong: 'Strong' };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-surface-raised)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'var(--color-primary)', marginBottom: '12px'
                    }}>
                        <Sparkles size={24} color="white" />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Create your account</h1>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        Start turning knowledge into action
                    </p>
                </div>

                <div className="card" style={{ padding: '28px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                                Full name
                            </label>
                            <input
                                id="signup-name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Your name"
                                className="input"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                                Email address
                            </label>
                            <input
                                id="signup-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="input"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="signup-password"
                                    name="password"
                                    type={showPwd ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="At least 6 characters"
                                    className="input"
                                    style={{ paddingRight: '42px' }}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(v => !v)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {pwdStrength && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                    <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: '#e2e8f0', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '2px',
                                            width: pwdStrength === 'weak' ? '33%' : pwdStrength === 'fair' ? '66%' : '100%',
                                            background: strengthColors[pwdStrength],
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: strengthColors[pwdStrength] }}>
                                        {strengthLabels[pwdStrength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '8px',
                                background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                                fontSize: '13px', color: 'var(--color-danger)',
                            }}>
                                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                                {error}
                            </div>
                        )}

                        <button
                            id="signup-submit"
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ marginTop: '4px', justifyContent: 'center', padding: '11px' }}
                        >
                            {loading ? (
                                <><div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Creating account...</>
                            ) : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
