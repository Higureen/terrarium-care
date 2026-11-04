import { reactive } from "vue";

const STORAGE_KEY = "terracare-session";

export const auth = reactive({
  user: null,
  accessToken: null,
  refreshToken: null,
});

let refreshPromise = null;
let restorePromise = null;

function saveSession() {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    })
  );
}

export function clearAuth() {
  auth.user = null;
  auth.accessToken = null;
  auth.refreshToken = null;

  sessionStorage.removeItem(STORAGE_KEY);
}

export async function login(email, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Nepavyko prisijungti.");
  }

  auth.user = data.user;
  auth.accessToken = data.accessToken;
  auth.refreshToken = data.refreshToken;

  saveSession();
}

async function refreshTokens() {
  const oldRefreshToken = auth.refreshToken;

  if (!oldRefreshToken) {
    clearAuth();
    return false;
  }

  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: oldRefreshToken,
    }),
  });

  if (auth.refreshToken !== oldRefreshToken) {
    return false;
  }

  if (response.status === 401 || response.status === 422) {
    clearAuth();
    return false;
  }

  if (!response.ok) {
    throw new Error("Nepavyko pratęsti sesijos. Bandykite dar kartą.");
  }

  const data = await response.json();

  if (auth.refreshToken !== oldRefreshToken) {
    return false;
  }

  auth.accessToken = data.accessToken;
  auth.refreshToken = data.refreshToken;

  saveSession();

  return true;
}

async function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const send = () => {
    const headers = new Headers(options.headers);

    if (auth.accessToken) {
      headers.set("Authorization", `Bearer ${auth.accessToken}`);
    } else {
      headers.delete("Authorization");
    }

    return fetch(`/api${path}`, {
      ...options,
      headers,
    });
  };

  const tokenUsed = auth.accessToken;
  let response = await send();

  if (response.status !== 401) {
    return response;
  }

  const alreadyRefreshed =
    auth.accessToken && auth.accessToken !== tokenUsed;

  if (alreadyRefreshed || (await refreshOnce())) {
    response = await send();
  }

  if (response.status === 401) {
    clearAuth();
  }

  return response;
}

async function restoreStoredSession() {
  let stored;

  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    clearAuth();
    return;
  }

  if (!stored) return;

  if (
    typeof stored.accessToken !== "string" ||
    !stored.accessToken ||
    typeof stored.refreshToken !== "string" ||
    !stored.refreshToken
  ) {
    clearAuth();
    return;
  }

  auth.accessToken = stored.accessToken;
  auth.refreshToken = stored.refreshToken;

  try {
    // nudotoja ir jo role gauname is backend
    const response = await apiFetch("/auth/me");

    if (response.status === 401) return;

    if (!response.ok) {
      throw new Error("Nepavyko patikrinti sesijos.");
    }

    auth.user = await response.json();
  } catch {
    // sutrikus rysiui issaugotu zetonu netrinam
    // si karta rodysime prisijungimo puslapi
    auth.user = null;
    auth.accessToken = null;
    auth.refreshToken = null;
  }
}

export async function restoreSession() {
  if (!restorePromise) {
    restorePromise = restoreStoredSession();
  }

  return restorePromise;
}

export async function logout() {
  const response = await apiFetch("/auth/logout", {
    method: "POST",
  });

  if (!response.ok && response.status !== 401) {
    throw new Error("Nepavyko atsijungti. Bandykite dar kartą.");
  }

  clearAuth();
}