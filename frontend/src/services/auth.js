import { reactive } from 'vue'

export const auth = reactive({
  user: null,
  accessToken: null,
  refreshToken: null,
})

let refreshPromise = null

export function clearAuth() {
  auth.user = null
  auth.accessToken = null
  auth.refreshToken = null
}

export async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Nepavyko prisijungti.')
  }

  auth.user = data.user
  auth.accessToken = data.accessToken
  auth.refreshToken = data.refreshToken
}

async function refreshTokens() {
  const oldRefreshToken = auth.refreshToken

  if (!oldRefreshToken) {
    clearAuth()
    return false
  }

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken: oldRefreshToken,
    }),
  })

  // neperrasome sesijos, jei ji pasikeite uzklausos metu
  if (auth.refreshToken !== oldRefreshToken) {
    return false
  }

  if (response.status === 401 || response.status === 422) {
    clearAuth()
    return false
  }

  if (!response.ok) {
    throw new Error('Nepavyko pratęsti sesijos. Bandykite dar kartą.')
  }

  const data = await response.json()

  if (auth.refreshToken !== oldRefreshToken) {
    return false
  }

  auth.accessToken = data.accessToken
  auth.refreshToken = data.refreshToken

  return true
}

async function refreshOnce() {
  // kelios uzklausos dalijasi vienu zetono atnaujinimu
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function apiFetch(path, options = {}) {
  const send = () => {
    const headers = new Headers(options.headers)

    if (auth.accessToken) {
      headers.set('Authorization', `Bearer ${auth.accessToken}`)
    } else {
      headers.delete('Authorization')
    }

    return fetch(`/api${path}`, {
      ...options,
      headers,
    })
  }

  const tokenUsed = auth.accessToken
  let response = await send()

  if (response.status !== 401) {
    return response
  }

  // kita uzklausa jau galejo atnaujinti prieigos zetona
  const alreadyRefreshed =
    auth.accessToken && auth.accessToken !== tokenUsed

  if (alreadyRefreshed || await refreshOnce()) {
    response = await send()
  }

  if (response.status === 401) {
    clearAuth()
  }

  return response
}

export async function logout() {
  const response = await apiFetch('/auth/logout', {
    method: 'POST',
  })

  if (!response.ok && response.status !== 401) {
    throw new Error('Nepavyko atsijungti. Bandykite dar kartą.')
  }

  clearAuth()
}