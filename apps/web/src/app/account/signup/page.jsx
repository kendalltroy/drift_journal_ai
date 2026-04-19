'use client';

import { signIn } from '@auth/create/react';
import { useState } from 'react';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/home';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials-signup', { name, email, password, redirect: false });
      if (result?.error) {
        setError('Could not create account. Email may already be in use.');
        setLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError('Could not create account. Email may already be in use.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 600 }}>Create account</h2>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 24 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: loading ? '#9ca3af' : '#111827', color: '#fff', fontSize: 14, fontWeight: 500, cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, textAlign: 'center', color: '#6b7280' }}>
          Already have an account?{' '}
          <a href={`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} style={{ color: '#111827', fontWeight: 500 }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
