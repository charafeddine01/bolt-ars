import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../shared/api';
import { authHeader } from '../shared/auth';

type Product = {
  id: string;
  name: string;
  type: string;
  core: string;
  thickness: number;
  facing: string;
  rValue?: number;
  uValue?: number;
  fireClass?: string;
  color: string[];
  profile: string;
  image: string;
  description: string;
  features: string[];
  applications: string[];
  specifications: Record<string, string>;
  datasheet?: string;
  enabled?: boolean;
};

export function Products() {
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const json = await res.json();
      setList(json);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string) {
    await fetch(`${API_URL}/api/products/${id}/toggle`, { method: 'PATCH', headers: { ...authHeader() } });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this product?')) return;
    await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE', headers: { ...authHeader() } });
    await load();
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    payload['thickness'] = Number(payload['thickness'] || 0);
    payload['color'] = (payload['color'] as string)?.split(',').map(s => s.trim()).filter(Boolean);
    payload['features'] = (payload['features'] as string)?.split('|').map(s => s.trim()).filter(Boolean);
    payload['applications'] = (payload['applications'] as string)?.split('|').map(s => s.trim()).filter(Boolean);
    payload['specifications'] = {};
    await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(payload)
    });
    setCreating(false);
    (e.target as HTMLFormElement).reset();
    await load();
  }

  const sorted = useMemo(() => list.slice().sort((a, b) => a.name.localeCompare(b.name)), [list]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Products</h2>
        <button onClick={() => setCreating(v => !v)}>{creating ? 'Cancel' : 'Add Product'}</button>
      </div>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {creating && (
        <form onSubmit={create} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, border: '1px solid #ddd', padding: 12, margin: '12px 0' }}>
          <input placeholder="id" name="id" required />
          <input placeholder="name" name="name" required />
          <input placeholder="type (roof/wall/…)" name="type" required />
          <input placeholder="core (PIR/PUR/EPS/Rockwool)" name="core" required />
          <input placeholder="thickness (mm)" name="thickness" type="number" required />
          <input placeholder="facing" name="facing" required />
          <input placeholder="rValue" name="rValue" />
          <input placeholder="uValue" name="uValue" />
          <input placeholder="fireClass" name="fireClass" />
          <input placeholder="color (comma-separated)" name="color" />
          <input placeholder="profile" name="profile" required />
          <input placeholder="image (path)" name="image" required />
          <input placeholder="datasheet (path)" name="datasheet" />
          <input placeholder="features (separate with |)" name="features" />
          <input placeholder="applications (separate with |)" name="applications" />
          <textarea placeholder="description" name="description" style={{ gridColumn: '1 / -1' }} />
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit">Create</button>
          </div>
        </form>
      )}

      <table width="100%" cellPadding={6} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Core</th>
            <th>Thickness</th>
            <th>Enabled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.type}</td>
              <td>{p.core}</td>
              <td>{p.thickness}</td>
              <td>{p.enabled ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => toggle(p.id)}>{p.enabled ? 'Disable' : 'Enable'}</button>
                <button onClick={() => remove(p.id)} style={{ marginLeft: 8, color: 'crimson' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

