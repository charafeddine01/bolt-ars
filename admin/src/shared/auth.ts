const KEY = 'admin_token';

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setToken(t: string) {
  localStorage.setItem(KEY, t);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

export function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

