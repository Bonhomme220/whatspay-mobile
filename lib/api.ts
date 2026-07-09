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

// Route d'accueil selon le rôle du compte connecté.
export const homeRouteForProfil = (profil?: string | null): string =>
  profil === "ANNONCEUR" ? "/annonceur/dashboard" : "/dashboard";

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
    // ── Token révoqué / compte désactivé → logout automatique ─────────────
    // window.location.replace est utilisé directement (pas d'event custom) :
    // le redirect depuis un event listener CustomEvent était silencieusement
    // ignoré dans certains contextes Next.js App Router.
    if (res.status === 401) {
      tokenStore.clear();
      if (typeof window !== "undefined") {
        // On lit la réponse d'abord pour pouvoir lire le message éventuel,
        // mais on redirige dans tous les cas sauf si on est déjà sur /login
        // (évite les boucles si la page de login elle-même fait un appel 401)
        const isOnLoginPage = window.location.pathname === "/login";
        if (!isOnLoginPage) {
          window.location.replace("/login");
        }
      }
    }
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, ...err };
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export const auth = {
  // profil optionnel : si omis, le backend détecte le rôle du compte (DIFFUSEUR / ANNONCEUR)
  // et le renvoie dans data.profil → routage par rôle côté client.
  login: async (email: string, password: string, _rememberMe = false, profil?: string) => {
    const data = await request<{ token: string; profil: string; user: StoredUser }>(
      "POST",
      `${BASE}/api/auth/login`,
      profil ? { email, password, profil } : { email, password }
    );
    tokenStore.set(data.token);
    userStore.set({ ...data.user, profil: data.profil });
    return data;
  },
  logout: async () => {
    try { await request<void>("POST", `${BASE}/api/auth/logout`); } catch {}
    tokenStore.clear();
  },
  // Stocke la session à partir d'une réponse contenant un token (login / register sans vérif).
  applySession: (data: { token: string; profil: string; user: StoredUser }) => {
    tokenStore.set(data.token);
    userStore.set({ ...data.user, profil: data.profil });
  },
};

// ── Requête multipart (FormData) — upload de fichiers ────────────────────────────
async function requestForm<T>(path: string, form: FormData): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      // Pas de Content-Type : le navigateur pose le boundary multipart lui-même.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  if (!res.ok) {
    if (res.status === 401) {
      tokenStore.clear();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, ...err };
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ── API routes protégées ───────────────────────────────────────────────────────
export const api = {
  get:    <T>(path: string) => request<T>("GET",    `${BASE}/api${path}`),
  post:   <T>(path: string, body: unknown) => request<T>("POST",   `${BASE}/api${path}`, body),
  put:    <T>(path: string, body: unknown) => request<T>("PUT",    `${BASE}/api${path}`, body),
  patch:  <T>(path: string, body: unknown) => request<T>("PATCH",  `${BASE}/api${path}`, body),
  delete: <T>(path: string) => request<T>("DELETE", `${BASE}/api${path}`),
  postForm: <T>(path: string, form: FormData) => requestForm<T>(path, form),
};
