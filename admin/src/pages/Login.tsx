import React, { useState } from 'react';
import { API_URL } from '../shared/api';

export function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const json = await res.json();
      onLogin(json.token);
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 360, marginTop: 32 }}>
      <h2>Sign in</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        <label>
          <div>Username</div>
          <input value={username} onChange={e => setUsername(e.target.value)} required />
        </label>
        <label>
          <div>Password</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </label>
        <button disabled={loading} type="submit">{loading ? 'Signing in...' : 'Sign in'}</button>
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
      </div>
      <p style={{ color: '#666', marginTop: 8 }}>Default: admin / ChangeMe!123 (set in server .env)</p>
    </form>
  );
}

