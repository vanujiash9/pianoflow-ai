const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const GET_CACHE_TTL_MS = 30_000
const REQUEST_TIMEOUT_MS = 15_000

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
    else if (path.startsWith('/warranties')) invalidateGroups(['warranties', 'sales', 'customers', 'pianos', 'dashboard'])
    else if (path.startsWith('/services/') || path === '/services') invalidateGroups(['services', 'sales', 'customers', 'dashboard', 'warranties'])
    else if (path.startsWith('/leads')) invalidateGroups(['leads', 'customers', 'dashboard'])
    else if (path.startsWith('/ai/conversations') || path.startsWith('/ai/chat')) invalidateGroups(['ai'])
  }
}

function withTimeout(init?: RequestInit) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  return {
    init: {
      ...init,
      signal: controller.signal,
    },
    cancel() {
      window.clearTimeout(timeoutId)
    },
  }
}

async function parseError(response: Response) {
  let detail = `API error ${response.status}`
  try {
    const body = await response.json()
    detail = body.detail || detail
    if (Array.isArray(body.detail)) detail = body.detail.map((item: { msg: string }) => item.msg).join(', ')
  } catch {
    // Keep fallback message.
  }
  return new ApiError(response.status, detail)
}

function toTimeoutError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError(408, 'Yêu cầu quá thời gian chờ.')
  }
  return error
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase()
  const isGet = method === 'GET'

  if (isGet) {
    const key = cacheKey(path, init)
    const cached = getCache.get(key) as CacheEntry<T> | undefined
    const now = Date.now()
    if (cached && cached.expiresAt > now && cached.value !== undefined) {
      return cached.value
    }
  }

  const headers = new Headers(init?.headers)
  const isFormData = init?.body instanceof FormData

  if (!isFormData && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json')
  }

  if (isGet) {
    const key = cacheKey(path, init)
    const cached = getCache.get(key) as CacheEntry<T> | undefined
    const now = Date.now()

    if (cached && cached.expiresAt > now) {
      return cached.value !== undefined ? cached.value : cached.promise
    }

    const { init: timedInit, cancel } = withTimeout(init)
    const promise = fetch(`${API_URL}${path}`, {
      ...timedInit,
      method,
      credentials: 'include',
      headers,
    })
      .then(async (response) => {
        if (!response.ok) throw await parseError(response)
        return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
      })
      .catch((error) => {
        throw toTimeoutError(error)
      })
      .finally(() => {
        cancel()
      })

    getCache.set(key, { expiresAt: now + GET_CACHE_TTL_MS, timestamp: now, promise })
    registerKey(path, key)

    try {
      const value = await promise
      getCache.set(key, { expiresAt: now + GET_CACHE_TTL_MS, timestamp: now, promise, value })
      registerKey(path, key)
      return value
    } catch (error) {
      getCache.delete(key)
      throw error
    }
  }

  invalidateForRequest(path, method)

  const { init: timedInit, cancel } = withTimeout(init)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...timedInit,
      method,
      credentials: 'include',
      headers,
    })

    if (!response.ok) throw await parseError(response)
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  } catch (error) {
    throw toTimeoutError(error)
  } finally {
    cancel()
  }
}

export const fmtDate = (value?: string | null) => {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN').format(parsed)
}

export const fmtMoney = (value?: number | null) => {
  if (value == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}
