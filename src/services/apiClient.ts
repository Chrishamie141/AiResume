import { authService } from './authService';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await authService.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(await buildAuthHeaders()),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await buildAuthHeaders()),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload as T;
}
