import JSZip from 'jszip'
import { supabase } from './supabase'
const T = ['islands','notes','note_media','species','species_facts','island_species','species_calendar','places']
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
  for (const i of d.islands) {
    const ns = d.notes.filter(n => n.island_id === i.id).sort((a, b) => a.on_date.localeCompare(b.on_date))
    z.file(`isole/${String(i.name).replace(/[\/\\]/g, '-')}.md`,
      `# ${i.name}\n\n${i.description ?? ''}\n\n${i.location_text ?? ''}\n\n` + ns.map(n => `## ${n.on_date}\n\n${n.body}\n`).join('\n'))
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(await z.generateAsync({ type: 'blob' }))
  a.download = `cycles-of-care-${new Date().toISOString().slice(0, 10)}.zip`; a.click()
}
