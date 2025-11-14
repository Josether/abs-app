// src/lib/api.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

function getAuthHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("abs_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiGet<T>(path: string, withAuth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (withAuth) {
    Object.assign(headers, getAuthHeader());
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `GET ${path} failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function apiPost<TReq, TRes>(
  path: string,
  body: TReq,
  withAuth = true,
): Promise<TRes> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (withAuth) {
    Object.assign(headers, getAuthHeader());
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `POST ${path} failed (${res.status})`);
  }

  return res.json() as Promise<TRes>;
}

export async function apiPut<TReq, TRes>(path: string, body: TReq, withAuth = true): Promise<TRes> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (withAuth) Object.assign(headers, getAuthHeader());

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `PUT ${path} failed (${res.status})`);
  }

  return res.json() as Promise<TRes>;
}

export async function apiDelete(path: string, withAuth = true): Promise<void> {
  const headers: Record<string, string> = {};
  if (withAuth) Object.assign(headers, getAuthHeader());

  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `DELETE ${path} failed (${res.status})`);
  }
}

// Download helpers
export async function apiGetBlob(path: string, withAuth = true): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (withAuth) Object.assign(headers, getAuthHeader());

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `GET ${path} failed (${res.status})`);
  }

  return res.blob();
}

export async function apiGetText(path: string, withAuth = true): Promise<string> {
  const headers: Record<string, string> = {};
  if (withAuth) Object.assign(headers, getAuthHeader());

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `GET ${path} failed (${res.status})`);
  }

  return res.text();
}
