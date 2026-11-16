import { useEffect, useState } from 'react'
import { get, set } from 'idb-keyval'
import { supabase } from './supabase'

type R = Record<string, any>

export async function cached<T>(key: string, run: () => PromiseLike<{ data: T | null; error: any }>, strict = false): Promise<{ data: T | null }> {
  const k = 'c:' + key
  const hit = strict ? undefined : await get(k)
  try {
    const net = Promise.resolve(run()).then(r => { if (r.error) throw r.error; return r.data })
    const data = await (hit !== undefined
      ? Promise.race([net, new Promise<never>((_, ko) => setTimeout(() => ko(new Error('timeout')), 6000))])
      : net)
    set(k, data).catch(() => {})
    return { data }
  } catch (e) {
    if (hit !== undefined) return { data: hit as T }
    throw e
  }
}

export async function fetchRows(sel: string, table: string, col?: string, val?: string, order = 'created_at', strict = false): Promise<R[]> {
  const { data } = await cached<R[]>(`${table}|${sel}|${col ?? ''}|${val ?? ''}|${order}`, () => {
    let q: any = supabase.from(table).select(sel); if (col) q = q.eq(col, val!)
    return q.order(order)
  }, strict)
  return data ?? []
}

export async function warm() {
  const f = (sel: string, t: string, col?: string, val?: string, order = 'created_at') => fetchRows(sel, t, col, val, order, true)
  const [islands, species] = await Promise.all([
    f('*', 'islands', undefined, undefined, 'sort_order'),
    f('*', 'species', undefined, undefined, 'common_name'),
    f('id,name', 'islands', undefined, undefined, 'sort_order'),
    f('id,common_name,scientific_name', 'species', undefined, undefined, 'common_name'),
    f('id,common_name', 'species', undefined, undefined, 'common_name'),
    f('*,islands(name)', 'places'),
    cached('cal|all', () => supabase.from('species_calendar').select('*'), true),
  ])
  for (const i of islands) await Promise.all([
    f('*', 'islands', 'id', i.id),
    f('*', 'notes', 'island_id', i.id, 'on_date'),
    f('role,species(id,common_name,scientific_name)', 'island_species', 'island_id', i.id, 'role'),
  ])
  for (const s of species) await Promise.all([
    f('*', 'species', 'id', s.id),
    f('*', 'species_facts', 'species_id', s.id),
    f('*', 'species_calendar', 'species_id', s.id, 'month'),
    f('role,islands(id,name)', 'island_species', 'species_id', s.id, 'role'),
  ])
  localStorage.setItem('warm-at', new Date().toISOString())
}

export function useOnline() {
  const [o, setO] = useState(navigator.onLine)
  useEffect(() => {
    const a = () => setO(true), b = () => setO(false)
    addEventListener('online', a); addEventListener('offline', b)
    return () => { removeEventListener('online', a); removeEventListener('offline', b) }
  }, [])
  return o
}