const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let detail = `API error ${response.status}`
    try {
      const body = await response.json()
      detail = body.detail || detail
      if (Array.isArray(body.detail)) detail = body.detail.map((item: { msg: string }) => item.msg).join(', ')
    } catch {
      // Keep fallback message.
    }
    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const fmtDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

export const fmtMoney = (value?: number | null) => {
  if (value == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}
