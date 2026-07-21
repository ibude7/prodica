import type { IdentifiedEntity } from '../domain/types'

const DB_NAME = 'prodica-history'
const STORE = 'scans'
const DB_VERSION = 1
const MAX_ENTRIES = 100

export type ScanHistoryEntry = {
  id: string
  savedAt: number
  entity: IdentifiedEntity
  /** Small data URL thumbnail for the grid */
  thumbDataUrl?: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('savedAt', 'savedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    let req: IDBRequest<T> | void
    try {
      req = fn(store)
    } catch (e) {
      reject(e)
      return
    }
    tx.oncomplete = () => {
      resolve(req ? req.result : undefined)
      db.close()
    }
    tx.onerror = () => {
      reject(tx.error ?? new Error('IndexedDB tx failed'))
      db.close()
    }
    if (req) {
      req.onerror = () => reject(req.error)
    }
  })
}

async function makeThumb(entity: IdentifiedEntity): Promise<string | undefined> {
  const src = entity.capturedPhoto || entity.images[0]?.thumbUrl || entity.images[0]?.url
  if (!src) return undefined
  if (src.startsWith('data:')) return src.slice(0, 200_000)

  try {
    const img = await loadImage(src)
    const size = 160
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const scale = Math.max(size / img.width, size / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return undefined
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('thumb load failed'))
    img.src = src
  })
}

export async function addScanToHistory(
  entity: IdentifiedEntity,
): Promise<ScanHistoryEntry> {
  const thumbDataUrl = await makeThumb(entity)
  // Strip large object URLs from stored entity — keep thumb separately
  const storedEntity: IdentifiedEntity = {
    ...entity,
    capturedPhoto: entity.capturedPhoto?.startsWith('data:')
      ? entity.capturedPhoto
      : undefined,
    images: entity.images.map((img) => ({
      ...img,
      // Keep remote URLs; drop blob: URLs
      url: img.url.startsWith('blob:') ? img.thumbUrl || img.url : img.url,
    })),
  }

  const entry: ScanHistoryEntry = {
    id: `${entity.id}-${Date.now()}`,
    savedAt: Date.now(),
    entity: storedEntity,
    thumbDataUrl,
  }

  await withStore('readwrite', (store) => store.put(entry))
  await trimHistory()
  return entry
}

async function trimHistory(): Promise<void> {
  const all = await listScanHistory()
  if (all.length <= MAX_ENTRIES) return
  const drop = all.slice(MAX_ENTRIES)
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    for (const d of drop) store.delete(d.id)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      reject(tx.error)
      db.close()
    }
  })
}

export async function listScanHistory(): Promise<ScanHistoryEntry[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.getAll()
    req.onsuccess = () => {
      const rows = (req.result as ScanHistoryEntry[]).sort(
        (a, b) => b.savedAt - a.savedAt,
      )
      resolve(rows)
      db.close()
    }
    req.onerror = () => {
      reject(req.error)
      db.close()
    }
  })
}

export async function getScanHistoryEntry(
  id: string,
): Promise<ScanHistoryEntry | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.get(id)
    req.onsuccess = () => {
      resolve((req.result as ScanHistoryEntry | undefined) ?? null)
      db.close()
    }
    req.onerror = () => {
      reject(req.error)
      db.close()
    }
  })
}

export async function clearScanHistory(): Promise<void> {
  await withStore('readwrite', (store) => store.clear())
}

export async function deleteScanHistoryEntry(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}
