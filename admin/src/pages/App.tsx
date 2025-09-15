import React, { useMemo, useState } from 'react';
import { Login } from './Login';
import { Products } from './Products';
import { getToken, setToken, clearToken } from '../shared/auth';

export default function App() {
  const [tokenState, setTokenState] = useState<string | null>(getToken());
  const authed = useMemo(() => !!tokenState, [tokenState]);

  return (
    <div style={{ fontFamily: 'system-ui, Arial', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Panel</h1>
        {authed && (
          <button onClick={() => { clearToken(); setTokenState(null); }}>Log out</button>
        )}
      </header>
      <hr />
      {!authed ? (
        <Login onLogin={(t) => { setToken(t); setTokenState(t); }} />
      ) : (
        <Products />
      )}
    </div>
  );
}

