export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

const TOKEN_KEY = "lifeos_access_token"

export type ApiErrorBody = {
  detail?: string
  message?: string
}

export class ApiError extends Error {
  status: number
  body: ApiErrorBody | unknown

  constructor(status: number, body: ApiErrorBody | unknown) {
    const message =
      typeof body === "object" && body && "detail" in body
        ? String((body as ApiErrorBody).detail)
        : `Request failed with status ${status}`
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  auth?: boolean
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get("content-type")
  const body = contentType?.includes("application/json") ? await response.json() : await response.text()

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }

  return body as T
}

async function requestBlob(path: string, options: RequestOptions = {}) {
  const init = { ...options } as Omit<RequestOptions, "body" | "auth">
  delete (init as RequestOptions).body
  delete (init as RequestOptions).auth
  const token = getStoredToken()
  const headers = new Headers(options.headers)

  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new ApiError(response.status, { detail: body })
  }

  return response.blob()
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  full_name: string
  email: string
  password: string
  timezone: string
}

export type AuthResponse = {
  access_token: string
  token_type?: string
  user_id?: string
  full_name?: string
  email?: string
  timezone?: string
  user?: User
}

export type User = {
  id: string | number
  full_name?: string
  name?: string
  email: string
  timezone?: string
  role?: "user" | "admin" | string
}

async function login(payload: LoginPayload) {
  try {
    return await request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      const formData = new FormData()
      formData.set("username", payload.email)
      formData.set("password", payload.password)
      return request<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: formData,
        auth: false,
      })
    }

    throw error
  }
}

export const api = {
  auth: {
    login,
    register: (payload: RegisterPayload) =>
      request<AuthResponse>("/api/v1/auth/register", { method: "POST", body: payload, auth: false }),
    me: () => request<User>("/api/v1/users/me"),
    logout: () => request<void>("/api/v1/auth/logout", { method: "POST" }),
    forgotPassword: (email: string) =>
      request<void>("/api/v1/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
    resetPassword: (token: string, password: string) =>
      request<void>("/api/v1/auth/reset-password", { method: "POST", body: { token, password }, auth: false }),
    changePassword: (current_password: string, new_password: string) =>
      request<void>("/api/v1/auth/change-password", { method: "POST", body: { current_password, new_password } }),
  },
  users: {
    profile: () => request<User>("/api/v1/users/me"),
    updateProfile: (payload: Partial<User>) => request<User>("/api/v1/users/me", { method: "PATCH", body: payload }),
    sessions: () => request<unknown[]>("/api/v1/users/me/sessions"),
    settings: () => request<unknown>("/api/v1/users/me/settings"),
    updateSettings: (payload: unknown) => request<unknown>("/api/v1/users/me/settings", { method: "PATCH", body: payload }),
  },
  dashboard: {
    overview: () => request<unknown>("/api/v1/dashboard/overview"),
    trends: () => request<unknown>("/api/v1/dashboard/trends"),
    today: () => request<unknown>("/api/v1/dashboard/today"),
  },
  dailyState: {
    list: (query = "") => request<unknown[]>(`/api/v1/daily-state${query}`),
    today: () => request<unknown>("/api/v1/daily-state/today"),
    getByDate: (date: string) => request<unknown>(`/api/v1/daily-state/${date}`),
    create: (payload: unknown) => request<unknown>("/api/v1/daily-state/", { method: "POST", body: payload }),
    update: (date: string, payload: unknown) =>
      request<unknown>(`/api/v1/daily-state/${date}`, { method: "PATCH", body: payload }),
  },
  habits: {
    list: () => request<unknown[]>("/api/v1/habits/"),
    create: (payload: unknown) => request<unknown>("/api/v1/habits/", { method: "POST", body: payload }),
    update: (id: string | number, payload: unknown) =>
      request<unknown>(`/api/v1/habits/${id}`, { method: "PATCH", body: payload }),
    archive: (id: string | number) => request<void>(`/api/v1/habits/${id}`, { method: "DELETE" }),
    logs: (date: string) => request<unknown[]>(`/api/v1/habits/logs?entry_date=${encodeURIComponent(date)}`),
    analytics: () => request<unknown[]>("/api/v1/habits/analytics"),
    setLog: (id: string | number, date: string, status: boolean) =>
      request<unknown>(`/api/v1/habits/${id}/log/${date}`, {
        method: "PUT",
        body: { habit_id: id, date, status },
      }),
    log: (_id: string | number, payload: unknown) =>
      request<unknown>("/api/v1/habits/log", { method: "POST", body: payload }),
    complete: (id: string | number, payload: unknown = {}) =>
      request<unknown>("/api/v1/habits/log", {
        method: "POST",
        body: { habit_id: id, ...(typeof payload === "object" && payload ? payload : {}), status: true },
      }),
  },
  goals: {
    list: () => request<unknown[]>("/api/v1/goals"),
    create: (payload: unknown) => request<unknown>("/api/v1/goals", { method: "POST", body: payload }),
    update: (id: string | number, payload: unknown) => request<unknown>(`/api/v1/goals/${id}`, { method: "PATCH", body: payload }),
    delete: (id: string | number) => request<void>(`/api/v1/goals/${id}`, { method: "DELETE" }),
  },
  tasks: {
    list: () => request<unknown[]>("/api/v1/tasks"),
    create: (payload: unknown) => request<unknown>("/api/v1/tasks", { method: "POST", body: payload }),
    update: (id: string | number, payload: unknown) => request<unknown>(`/api/v1/tasks/${id}`, { method: "PATCH", body: payload }),
    complete: (id: string | number) => request<unknown>(`/api/v1/tasks/${id}/complete`, { method: "POST" }),
  },
  lifeAreas: {
    list: () => request<unknown[]>("/api/v1/life-areas/"),
    statuses: () => request<unknown[]>("/api/v1/life-areas/status"),
    createStatus: (payload: unknown) => request<unknown>("/api/v1/life-areas/status", { method: "POST", body: payload }),
  },
  distractions: {
    list: () => request<unknown[]>("/api/v1/distractions/"),
    logs: () => request<unknown[]>("/api/v1/distractions/log"),
    createLog: (payload: unknown) => request<unknown>("/api/v1/distractions/log", { method: "POST", body: payload }),
  },
  excuses: {
    list: () => request<unknown[]>("/api/v1/excuses/"),
    logs: () => request<unknown[]>("/api/v1/excuses/log"),
    createLog: (payload: unknown) => request<unknown>("/api/v1/excuses/log", { method: "POST", body: payload }),
  },
  productivity: {
    list: () => request<unknown[]>("/api/v1/productivity/"),
    create: (payload: unknown) => request<unknown>("/api/v1/productivity/", { method: "POST", body: payload }),
  },
  weeklySummary: {
    current: () => request<unknown>("/api/v1/weekly-summary/"),
    list: () => request<unknown[]>("/api/v1/weekly-summary/"),
    update: (id: string | number, payload: unknown) =>
      request<unknown>(`/api/v1/weekly-summary/${id}`, { method: "PATCH", body: payload }),
  },
  notifications: {
    list: () => request<unknown[]>("/api/v1/notifications"),
    markRead: (id: string | number) => request<unknown>(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),
    testReminder: () => request<unknown>("/api/v1/reminders/test", { method: "POST" }),
  },
  notes: {
    list: () => request<unknown[]>("/api/v1/notes"),
    create: (payload: unknown) => request<unknown>("/api/v1/notes", { method: "POST", body: payload }),
    search: (query: string) => request<unknown[]>(`/api/v1/notes/search?q=${encodeURIComponent(query)}`),
  },
  reports: {
    weekly: () => request<unknown>("/api/v1/reports/weekly"),
    monthly: () => request<unknown>("/api/v1/reports/monthly"),
    export: (format: "pdf" | "csv") => requestBlob(`/api/v1/reports/export?format=${format}`),
  },
  admin: {
    metrics: () => request<unknown>("/api/v1/admin/metrics"),
    users: () => request<unknown[]>("/api/v1/admin/users"),
    referenceData: () => request<unknown>("/api/v1/admin/reference-data"),
    auditLogs: () => request<unknown[]>("/api/v1/admin/audit-logs"),
  },
}
