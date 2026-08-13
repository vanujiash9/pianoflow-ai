const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const GET_CACHE_TTL_MS = 30_000

type CacheEntry<T> = {
  expiresAt: number
  timestamp: number
  promise: Promise<T>
  value?: T
}

const getCache = new Map<string, CacheEntry<unknown>>()
const cacheGroups = new Map<string, Set<string>>()

const CACHE_GROUPS = [
  ['dashboard', ['/dashboard']],
  ['customers', ['/customers']],
  ['pianos', ['/pianos']],
  ['sales', ['/sales']],
  ['warranties', ['/warranties']],
  ['services', ['/services']],
  ['leads', ['/leads']],
  ['ai', ['/ai']],
] as const

type CacheGroup = (typeof CACHE_GROUPS)[number][0]

type CachedResponse<T> = {
  data: T
  timestamp: number
}

export function getCachedResponse<T>(path: string): CachedResponse<T> | null {
  const cached = getCache.get(`GET ${path}`) as CacheEntry<T> | undefined
  if (!cached?.value) return null
  return {
    data: cached.value,
    timestamp: cached.timestamp,
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function cacheKey(path: string, init?: RequestInit) {
  return `${init?.method || 'GET'} ${path}`
}

function registerKey(path: string, key: string) {
  for (const [group, prefixes] of CACHE_GROUPS) {
    if (prefixes.some((prefix) => path.startsWith(prefix))) {
      const keys = cacheGroups.get(group) ?? new Set<string>()
      keys.add(key)
      cacheGroups.set(group, keys)
    }
  }
}

function invalidateGroups(groups: readonly CacheGroup[]) {
  for (const group of groups) {
    const keys = cacheGroups.get(group)
    if (!keys) continue
    for (const key of keys) {
      getCache.delete(key)
    }
    cacheGroups.delete(group)
  }
}

export function invalidateCacheGroups(groups: readonly CacheGroup[]) {
  invalidateGroups(groups)
}

export function invalidateCachedPath(path: string) {
  const key = `GET ${path}`
  const cached = getCache.get(key)
  if (!cached) return
  getCache.delete(key)
  for (const [group, keys] of cacheGroups) {
    if (keys.delete(key) && keys.size === 0) {
      cacheGroups.delete(group)
    }
  }
}

export function getCachedPaths() {
  return Array.from(getCache.keys())
}

export function getCachedGroupMap() {
  return new Map(cacheGroups)
}

export type { CacheGroup }

export { getCache }

function invalidateForRequest(path: string, method: string) {
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    if (path.startsWith('/customers')) invalidateGroups(['customers', 'dashboard', 'sales'])
    else if (path.startsWith('/pianos')) invalidateGroups(['pianos', 'sales', 'services', 'dashboard'])
    else if (path.startsWith('/sales')) invalidateGroups(['sales', 'warranties', 'pianos', 'customers', 'dashboard'])
    else if (path.startsWith('/warranties')) invalidateGroups(['warranties', 'dashboard'])
    else if (path.startsWith('/services')) invalidateGroups(['services', 'dashboard'])
    else if (path.startsWith('/leads')) invalidateGroups(['leads', 'customers', 'dashboard'])
    else if (path.startsWith('/ai/conversations') || path.startsWith('/ai/chat')) invalidateGroups(['ai'])
  }
}

function registerGet(path: string, key: string) {
  registerKey(path, key)
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isGet = (init?.method || 'GET').toUpperCase() === 'GET'
  if (isGet) {
    const key = cacheKey(path, init)
    const cached = getCache.get(key) as CacheEntry<T> | undefined
    const now = Date.now()
    if (cached && cached.expiresAt > now && cached.value !== undefined) {
      return cached.value
    }
  }

  const method = (init?.method || 'GET').toUpperCase()
  const headers = new Headers(init?.headers)
  const isFormData = init?.body instanceof FormData

  if (!isFormData && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json')
  }

  if (method === 'GET') {
    const key = cacheKey(path, init)
    const cached = getCache.get(key) as CacheEntry<T> | undefined
    const now = Date.now()

    if (cached && cached.expiresAt > now) {
      return cached.value !== undefined ? cached.value : cached.promise
    }

    const promise = fetch(`${API_URL}${path}`, {
      ...init,
      method,
      headers,
    }).then(async (response) => {
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

      return response.status === 204 ? (undefined as T) : (await response.json()) as T
    })

    getCache.set(key, { expiresAt: now + GET_CACHE_TTL_MS, timestamp: now, promise })
    registerGet(path, key)

    try {
      const value = await promise
      getCache.set(key, { expiresAt: now + GET_CACHE_TTL_MS, timestamp: now, promise, value })
      registerGet(path, key)
      return value
    } catch (error) {
      getCache.delete(key)
      throw error
    }
  }

  invalidateForRequest(path, method)

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    method,
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
