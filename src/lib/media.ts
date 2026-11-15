import { supabase } from './supabase'
export type Col = 'note_id' | 'place_id'
const MAX_VIDEO = 50 * 1024 * 1024 // verifica il limite in Supabase → Storage → Settings

export async function resizeImage(file: File, max = 1600, q = 0.82): Promise<Blob> {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close()
    return new Promise((ok, ko) => c.toBlob(b => b ? ok(b) : ko(new Error('Immagine non convertibile')), 'image/jpeg', q))
}

export async function uploadFiles(files: File[], col: Col, id: string) {
    for (const f of files) {
        let body: Blob = f, ext = f.name.split('.').pop()?.toLowerCase() ?? 'bin', kind = 'video'
        if (f.type.startsWith('image/')) { body = await resizeImage(f); ext = 'jpg'; kind = 'photo' }
        else if (f.type.startsWith('video/')) { if (f.size > MAX_VIDEO) throw new Error(`${f.name}: video oltre 50 MB, usa un link`) }
        else throw new Error(`${f.name}: formato non supportato`)
        const path = `${col === 'note_id' ? 'notes' : 'places'}/${id}/${crypto.randomUUID()}.${ext}`
        const up = await supabase.storage.from('media').upload(path, body, { contentType: body.type })
        if (up.error) throw up.error
        const ro = await supabase.from('note_media').insert({ [col]: id, kind, path })
        if (ro.error) throw ro.error
    }
}

export const addVideoUrl = (url: string, col: Col, id: string) =>
    supabase.from('note_media').insert({ [col]: id, kind: 'video_url', url })

export async function removeMedia(m: { id: string; path?: string }) {
    if (m.path) await supabase.storage.from('media').remove([m.path])
    await supabase.from('note_media').delete().eq('id', m.id)
}

export async function purgeMedia(col: Col, ids: string[]) {
    if (!ids.length) return
    const { data } = await supabase.from('note_media').select('path').in(col, ids)
    const paths = (data ?? []).map((m: any) => m.path).filter(Boolean)
    if (paths.length) await supabase.storage.from('media').remove(paths)
}