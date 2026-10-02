const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
export async function request(path, { token, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  } catch { throw new Error('Cannot reach the API. Check that the backend is running.') }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.error || 'The request failed. Please try again.')
    error.status = response.status
    throw error
  }
  if (data === null) throw new Error('The API returned an invalid response.')
  return data
}
