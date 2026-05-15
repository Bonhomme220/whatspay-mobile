const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Storage ────────────────────────────────────────────────────────────────────
export const tokenStore = {
  get: (): string | null =>
    typeof localStorage !== "undefined" ? localStorage.getItem("wp_token") : null,
  set: (t: string) => localStorage.setItem("wp_token", t),
  clear: () => {
    localStorage.removeItem("wp_token");
    localStorage.removeItem("wp_user");
  },
};

export interface StoredUser {
  id: string; firstname: string; lastname: string; email: string; profil: string;
}
export const userStore = {
  get: (): StoredUser | null => {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem("wp_user");
    return raw ? JSON.parse(raw) : null;
  },
  set: (u: StoredUser) => localStorage.setItem("wp_user", JSON.stringify(u)),
};

// ── Core request ───────────────────────────────────────────────────────────────
async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const token = tokenStore.get();

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, ...err };
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export const auth = {
  login: async (email: string, password: string, _rememberMe = false, profil = "DIFFUSEUR") => {
    const data = await request<{ token: string; profil: string; user: StoredUser }>(
      "POST",
      `${BASE}/api/auth/login`,
      { email, password, profil }
    );
    tokenStore.set(data.token);
    userStore.set({ ...data.user, profil: data.profil });
    return data;
  },
  logout: async () => {
    try { await request<void>("POST", `${BASE}/api/auth/logout`); } catch {}
    tokenStore.clear();
  },
};

// ── API routes protégées ───────────────────────────────────────────────────────
export const api = {
  get:    <T>(path: string) => request<T>("GET",    `${BASE}/api${path}`),
  post:   <T>(path: string, body: unknown) => request<T>("POST",   `${BASE}/api${path}`, body),
  put:    <T>(path: string, body: unknown) => request<T>("PUT",    `${BASE}/api${path}`, body),
  patch:  <T>(path: string, body: unknown) => request<T>("PATCH",  `${BASE}/api${path}`, body),
  delete: <T>(path: string) => request<T>("DELETE", `${BASE}/api${path}`),
};
