import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadFiles, addVideoUrl, removeMedia, type Col } from '@/lib/media'

export function MediaBlock({ col, id }: { col: Col; id: string }) {
  const [rows, setRows] = useState<any[]>([]), [urls, setUrls] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false), [link, setLink] = useState(''), [err, setErr] = useState(''), [nonce, setNonce] = useState(0)

  const load = async () => {
    const { data } = await supabase.from('note_media').select('*').eq(col, id).order('created_at')
    const r = data ?? []; setRows(r)
    const paths = r.filter(m => m.path).map(m => m.path)
    if (paths.length) {
      const { data: s } = await supabase.storage.from('media').createSignedUrls(paths, 3600)
      setUrls(Object.fromEntries((s ?? []).map((x: any) => [x.path, x.signedUrl])))
    }
  }
  useEffect(() => { load() }, [id])

  const onFiles = async (files: File[]) => {
    setBusy(true); setErr('')
    try { await uploadFiles(files, col, id) } catch (x: any) { setErr(x.message) }
    setBusy(false); setNonce(n => n + 1); load()
  }

  return <div className="my-2">
    <div className="flex flex-wrap gap-3">
      {rows.map(m => <div key={m.id}>
        {m.kind === 'photo' && urls[m.path] && <a href={urls[m.path]} target="_blank"><img src={urls[m.path]} loading="lazy" className="max-h-56 rounded-md border" /></a>}
        {m.kind === 'video' && urls[m.path] && <video src={urls[m.path]} controls preload="metadata" className="max-h-56 rounded-md border" />}
        {m.kind === 'video_url' && <a href={m.url} target="_blank">Video: {m.url}</a>}
        <div><Button variant="ghost" size="sm" onClick={() => removeMedia(m).then(load)}>Elimina</Button></div>
      </div>)}
    </div>
    <div className="grid gap-2 max-w-md mt-2">
      <Input key={nonce} type="file" multiple accept="image/*,video/*" disabled={busy} onChange={e => onFiles([...(e.target.files ?? [])])} />
      <div className="flex gap-2"><Input placeholder="oppure link a un video" value={link} onChange={e => setLink(e.target.value)} />
        <Button variant="outline" size="sm" onClick={() => link && addVideoUrl(link, col, id).then(() => { setLink(''); load() })}>Aggiungi link</Button></div>
      <span className="m">{busy ? 'Caricamento…' : err}</span>
    </div>
  </div>
}