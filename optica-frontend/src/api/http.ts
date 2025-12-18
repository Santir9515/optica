const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function getOpticaId(): string | null {
  return localStorage.getItem("optica_id");
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const opticaId = getOpticaId();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (opticaId) {
    headers.set("X-Optica-Id", opticaId);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}
