import JSZip from 'jszip'
import { supabase } from './supabase'
const T = ['islands', 'notes', 'note_media', 'species', 'species_facts', 'island_species', 'species_calendar', 'places']
const csv = (rows: any[]) => {
  if (!rows.length) return ''
  const k = Object.keys(rows[0]); const e = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [k.join(','), ...rows.map(r => k.map(c => e(r[c])).join(','))].join('\n')
}
export async function exportZip() {
  const z = new JSZip(); const d: Record<string, any[]> = {}
  for (const t of T) {
    const { data } = await supabase.from(t).select('*'); d[t] = data ?? []
    z.file(`json/${t}.json`, JSON.stringify(d[t], null, 2)); z.file(`csv/${t}.csv`, csv(d[t]))
  }
  for (const m of d.note_media) if (m.path) {
    const { data } = await supabase.storage.from('media').download(m.path)
    if (data) z.file(`media/${m.path}`, data)
  }
  const media = (col: string, id: string, up: string) => d.note_media.filter(m => m[col] === id).map(m =>
    m.kind === 'photo' ? `![](${up}media/${m.path})` : m.path ? `[video](${up}media/${m.path})` : `[video](${m.url})`).join('\n')
  for (const i of d.islands) {
    const ns = d.notes.filter(n => n.island_id === i.id).sort((a, b) => a.on_date.localeCompare(b.on_date))
    z.file(`isole/${String(i.name).replace(/[\/\\]/g, '-')}.md`,
      `# ${i.name}\n\n${i.description ?? ''}\n\n${i.location_text ?? ''}\n\n` +
      ns.map(n => `## ${n.on_date}\n\n${n.body}\n\n${media('note_id', n.id, '../')}\n`).join('\n'))
  }
  z.file('luoghi.md', d.places.map(p => `## ${p.title}\n\n${p.lat}, ${p.lng}\n\n${p.body ?? ''}\n\n${media('place_id', p.id, '')}\n`).join('\n'))
  z.file('specie.md', d.species.map(s => {
    const fs = d.species_facts.filter(f => f.species_id === s.id)
    return fs.length ? `## ${s.common_name} (${s.scientific_name})\n\n${s.notes ?? ''}\n\n` +
      fs.map(f => `### ${f.title}\n\n${f.body ?? ''}\n\n${media('fact_id', f.id, '')}\n`).join('\n') : ''
  }).filter(Boolean).join('\n'))
  const a = document.createElement('a')
  a.href = URL.createObjectURL(await z.generateAsync({ type: 'blob' }))
  a.download = `cycles-of-care-${new Date().toISOString().slice(0, 10)}.zip`; a.click()
}
