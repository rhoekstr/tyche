import { useEffect, useState } from 'react'
import type { Manifest, Pack } from '@/types/pack'

const MANIFEST_URL = `${import.meta.env.BASE_URL}data/manifest.json`

const packCache = new Map<string, Pack>()
let manifestCache: Manifest | null = null
let manifestPromise: Promise<Manifest> | null = null

function resolvePackUrl(path: string): string {
  if (path.startsWith('http')) return path
  const trimmed = path.startsWith('/') ? path.slice(1) : path
  return `${import.meta.env.BASE_URL}${trimmed}`
}

export async function fetchManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`manifest ${res.status}`)
        return res.json() as Promise<Manifest>
      })
      .then((m) => {
        manifestCache = m
        return m
      })
      .catch((err) => {
        manifestPromise = null
        throw err
      })
  }
  return manifestPromise
}

export async function fetchPack(id: string): Promise<Pack> {
  const cached = packCache.get(id)
  if (cached) return cached
  const manifest = await fetchManifest()
  const entry = manifest.packs.find((p) => p.id === id)
  if (!entry) throw new Error(`Unknown pack: ${id}`)
  const res = await fetch(resolvePackUrl(entry.path))
  if (!res.ok) throw new Error(`Failed to load pack ${id}: ${res.status}`)
  const pack = (await res.json()) as Pack
  packCache.set(id, pack)
  return pack
}

export function useManifest() {
  const [manifest, setManifest] = useState<Manifest | null>(manifestCache)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(!manifestCache)

  useEffect(() => {
    if (manifestCache) return
    let cancelled = false
    setLoading(true)
    fetchManifest()
      .then((m) => {
        if (!cancelled) setManifest(m)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { manifest, loading, error }
}

export function usePack(id: string | null | undefined) {
  const [pack, setPack] = useState<Pack | null>(() =>
    id ? (packCache.get(id) ?? null) : null,
  )
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(Boolean(id) && !pack)

  useEffect(() => {
    if (!id) {
      setPack(null)
      setLoading(false)
      return
    }
    const cached = packCache.get(id)
    if (cached) {
      setPack(cached)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchPack(id)
      .then((p) => {
        if (!cancelled) setPack(p)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return { pack, loading, error }
}

export function clearPackCache() {
  packCache.clear()
  manifestCache = null
  manifestPromise = null
}

export function invalidatePack(id: string): void {
  packCache.delete(id)
}

export function registerPack(pack: Pack): void {
  packCache.set(pack.id, pack)
}
