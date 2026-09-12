const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function getToken() {
  return localStorage.getItem("dcode_token")
}

export function setToken(token) {
  localStorage.setItem("dcode_token", token)
}

export function clearToken() {
  localStorage.removeItem("dcode_token")
}

export async function api(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearToken()
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(error.detail || "Request failed")
  }

  const json = await res.json()
  const camel = snakeToCamel(json)
  return camel.data !== undefined ? camel.data : camel
}

export const auth = {
  signup: (data) => api("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => api("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => api("/api/auth/me"),
}

export const users = {
  get: (id) => api(`/api/users/${id}`),
  update: (id, data) => api(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  search: (q) => api(`/api/users/search?q=${encodeURIComponent(q)}`),
}

export const problems = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/api/problems?${qs}`)
  },
  get: (id) => api(`/api/problems/${id}`),
}

export const execute = {
  run: (data) => api("/api/execute", { method: "POST", body: JSON.stringify({ ...data, mode: "run" }) }),
  submit: (data) => api("/api/execute", { method: "POST", body: JSON.stringify({ ...data, mode: "submit" }) }),
}

export const leaderboard = {
  global: () => api("/api/leaderboard"),
  weekly: () => api("/api/leaderboard/weekly"),
  friends: () => api("/api/leaderboard/friends"),
}

export const duels = {
  list: () => api("/api/duels"),
  create: (data) => api("/api/duels", { method: "POST", body: JSON.stringify(data) }),
}

export const friends = {
  list: () => api("/api/friends"),
  request: (id) => api(`/api/friends/${id}/request`, { method: "POST" }),
  accept: (id) => api(`/api/friends/${id}/accept`, { method: "POST" }),
  remove: (id) => api(`/api/friends/${id}`, { method: "DELETE" }),
}

export const puzzles = {
  daily: () => api("/api/puzzles/daily"),
  list: () => api("/api/puzzles"),
  attempt: (id, answer) => api(`/api/puzzles/${id}/attempt`, { method: "POST", body: JSON.stringify({ answer }) }),
}

export const achievements = {
  list: () => api("/api/achievements"),
}

export const activity = {
  list: () => api("/api/activity"),
}

export const submissions = {
  list: () => api("/api/execute"),
  solved: () => api("/api/execute/solved"),
}

function snakeToCamel(obj) {
  if (Array.isArray(obj)) return obj.map(snakeToCamel)
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        snakeToCamel(v),
      ]),
    )
  }
  return obj
}
