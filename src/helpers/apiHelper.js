/* global DELCOM_BASEURL */
// DELCOM_BASEURL didefinisikan pada vite.config.js (bagian `define`).
export const BASE_URL = DELCOM_BASEURL
export const TOKEN_KEY = 'delcom_access_token'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function putAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function buildUrl(path, query = {}) {
  const url = new URL(`${BASE_URL}${path}`)
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value)
    }
  })
  return url.toString()
}

/**
 * Wrapper fetch ke REST API Delcom.
 * - menyisipkan header Authorization: Bearer <token> bila token tersedia
 * - body FormData dikirim apa adanya, objek lain dikirim sebagai JSON
 * - melempar Error (dengan properti `status`) bila respons gagal
 */
export async function apiRequest(path, { method = 'GET', query, body } = {}) {
  const headers = { Accept: 'application/json' }
  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const options = { method, headers }
  if (body instanceof FormData) {
    options.body = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  const response = await fetch(buildUrl(path, query), options)
  const json = await response.json().catch(() => ({}))

  if (!response.ok || json.success === false) {
    const error = new Error(json.message || `Permintaan gagal (${response.status})`)
    error.status = response.status
    throw error
  }
  return json
}

export const apiGet = (path, query) => apiRequest(path, { query })
export const apiPost = (path, body) => apiRequest(path, { method: 'POST', body })
export const apiPut = (path, body) => apiRequest(path, { method: 'PUT', body })
export const apiDelete = (path, body) => apiRequest(path, { method: 'DELETE', body })
