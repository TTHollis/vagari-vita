const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    // Moderation rejections return a structured detail object
    const detail = err.detail
    if (detail && typeof detail === 'object' && detail.message) {
      throw new Error(detail.message)
    }
    throw new Error(detail || 'Request failed')
  }
  return res.json()
}

// Local mode
export const getEvents = ({ city, state, zip_code, ...params } = {}) => {
  const q = new URLSearchParams()
  // Only include params that have actual values — never stringify
  // undefined/null/empty as "undefined" into the URL.
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v)
  }
  if (zip_code) q.set('zip_code', zip_code)
  if (city) q.set('city', city)
  if (state) q.set('state', state)
  return request(`/events?${q}`)
}

// Wander mode (internal route namespace stays /nomad)
export const getBriefing = (city) =>
  request(`/nomad/briefing?city=${encodeURIComponent(city)}`)

export const getTips = (city) =>
  request(`/nomad/tips?city=${encodeURIComponent(city)}`)

export const addTip = (tip) =>
  request('/nomad/tips', { method: 'POST', body: JSON.stringify(tip) })

export const upvoteTip = (id) =>
  request(`/nomad/tips/${id}/upvote`, { method: 'POST' })

export const reportTip = (id) =>
  request(`/nomad/tips/${id}/report`, { method: 'POST' })

// Admin — all require the X-Admin-Token header (shared secret)
const adminHeaders = (token) => ({ 'X-Admin-Token': token })

export const adminGetSummary = (token) =>
  request('/nomad/admin/summary', { headers: adminHeaders(token) })

export const adminGetTips = (token, status) =>
  request(`/nomad/admin/tips?status=${status}`, { headers: adminHeaders(token) })

export const adminRestoreTip = (token, id) =>
  request(`/nomad/admin/tips/${id}/restore`, { method: 'POST', headers: adminHeaders(token) })

export const adminDeleteTip = (token, id) =>
  request(`/nomad/admin/tips/${id}`, { method: 'DELETE', headers: adminHeaders(token) })
