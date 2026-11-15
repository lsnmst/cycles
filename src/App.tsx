import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { exportZip } from './lib/export'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/native-select'
import { MediaBlock } from '@/components/MediaBlock'
import { uploadFiles, purgeMedia } from '@/lib/media'

type R = Record<string, any>
const MESI = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D']
const ATT = ['semina', 'trapianto', 'potatura', 'fioritura', 'raccolta', 'talea', 'divisione', 'innesto']
const COL: R = {
  semina: '#d2fb85', trapianto: '#82ffff', potatura: '#c9b6ff', fioritura: '#fca0d8',
  raccolta: '#F4FF52', talea: '#ffc27a', divisione: '#e0c9a6', innesto: '#ff9b9b',
}

function useHash() {
  const [h, s] = useState(location.hash.slice(1) || '/')
  useEffect(() => { const f = () => s(location.hash.slice(1) || '/'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h
}
function useRows(sel: string, table: string, col?: string, val?: string, order = 'created_at') {
  const [r, s] = useState<R[]>([])
  const load = async () => {
    let q = supabase.from(table).select(sel); if (col) q = q.eq(col, val!)
    const { data, error } = await q.order(order)
    if (error) console.error(`[${table}]`, error.message)
    s((data as any) ?? [])
  }
  useEffect(() => { load() }, [table, col, val])
  return [r, load] as const
}
const ins = (t: string, v: R, done: () => void) => supabase.from(t).insert(v).then(done)

function Login({ onRecovery }: { onRecovery: () => void }) {
  const [e, setE] = useState(''), [p, setP] = useState(''), [code, setCode] = useState('')
  const [step, setStep] = useState<'pw' | 'code'>('pw'), [mode, setMode] = useState<'email' | 'recovery'>('email')
  const [msg, setMsg] = useState('')

  const send = async (m: 'email' | 'recovery') => {
    if (!e) return setMsg('Inserisci prima l’email.')
    setMsg('')
    const { error } = m === 'email'
      ? await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: false } })
      : await supabase.auth.resetPasswordForEmail(e)
    if (error) return setMsg(error.message)
    setMode(m); setStep('code'); setMsg('Codice inviato. Controlla la posta, anche lo spam.')
  }
  const verify = async () => {
    const { error } = await supabase.auth.verifyOtp({ email: e, token: code.trim(), type: mode })
    if (error) return setMsg(error.message)
    if (mode === 'recovery') onRecovery()
  }
  const login = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p })
    if (error) setMsg(error.message)
  }
  return <div className="grid gap-2 max-w-sm">
    <h1>Accedi</h1>
    <Input placeholder="email" value={e} onChange={x => setE(x.target.value)} disabled={step === 'code'} />
    {step === 'pw' ? <form className="grid gap-2" onSubmit={login}>
      <Input type="password" placeholder="password" value={p} onChange={x => setP(x.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline">Accedi</Button>
        <Button type="button" variant="outline" onClick={() => send('email')}>Entra con un codice via email</Button>
        <Button type="button" variant="ghost" onClick={() => send('recovery')}>Password dimenticata</Button>
      </div>
    </form> : <div className="grid gap-2">
      <Input placeholder="codice ricevuto per email" inputMode="numeric" value={code} onChange={x => setCode(x.target.value)} />
      <div className="flex gap-2">
        <Button onClick={verify}>Verifica codice</Button>
        <Button variant="ghost" onClick={() => { setStep('pw'); setCode(''); setMsg('') }}>Indietro</Button>
      </div>
    </div>}
    <span className="text-sm text-red-700">{msg}</span>
  </div>
}

function Islands() {
  const [r, load] = useRows('*', 'islands', undefined, undefined, 'sort_order'); const [n, setN] = useState('')
  return <><h1>Le mie isole</h1>
    {r.map(i => <p key={i.id}><a href={`#/isola/${i.id}`}>{i.name}</a> <span className="m">{i.location_text}</span></p>)}
    <br /><br /><form onSubmit={e => { e.preventDefault(); ins('islands', { name: n }, () => { setN(''); load() }) }}>
      <Input placeholder="Nome nuova isola" value={n} onChange={e => setN(e.target.value)} /> <Button variant="outline" size="sm">Aggiungi isola</Button></form></>
}

function CalendarView({ species }: { species: R[] }) {
  const ids = species.map(s => s.id).join()
  const [cal, setCal] = useState<R[]>([]), [a, setA] = useState('tutte')
  useEffect(() => {
    if (!ids) { setCal([]); return }
    supabase.from('species_calendar').select('*').in('species_id', ids.split(',')).then(({ data }) => setCal(data ?? []))
  }, [ids])
  const acts = (sid: string, m: number) =>
    ATT.filter(x => (a === 'tutte' || x === a) && cal.some(c => c.species_id === sid && c.month === m && c.activity === x))
  const rows = [...species].sort((x, y) => (x.common_name ?? '').localeCompare(y.common_name ?? ''))
    .filter(s => MESI.some((_, i) => acts(s.id, i + 1).length))
  const now = new Date().getMonth()
  return <>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
      <NativeSelect value={a} onChange={e => setA(e.target.value)}>
        <option value="tutte">Tutte le attività</option>
        {ATT.map(x => <option key={x} value={x}>{x}</option>)}
      </NativeSelect>
      {a === 'tutte'
        ? <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {ATT.map(x => <span key={x} className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm border border-black/10" style={{ background: COL[x] }} />{x}</span>)}
        </div>
        : <span className="inline-flex items-center gap-1 text-sm">
          <span className="inline-block h-3 w-3 rounded-sm border border-black/10" style={{ background: COL[a] }} />{a}</span>}
    </div>
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-x-0.5 border-spacing-y-1">
        <thead><tr><th />{MESI.map((m, i) => <th key={i} style={{ width: 28, padding: 0 }} className={'text-center ' + (i === now ? 'font-bold underline' : '')}>{m}</th>)}</tr></thead>
        <tbody>{rows.map(s => <tr key={s.id}>
          <td className="pr-3 whitespace-nowrap"><a href={`#/specie/${s.id}`}>{s.common_name}</a></td>
          {MESI.map((_, i) => {
            const x = acts(s.id, i + 1)
            return <td key={i} title={x.join(', ')} style={{ padding: 0 }}>
              <div className="flex flex-col h-5 overflow-hidden rounded-sm bg-neutral-100">
                {x.map(k => <div key={k} className="flex-1" style={{ background: COL[k] }} />)}
              </div>
            </td>
          })}
        </tr>)}</tbody>
      </table>
    </div>
    {!rows.length && <p className="m">Nessuna attività registrata.</p>}
  </>
}

function Calendar() {
  const [sp] = useRows('id,common_name', 'species', undefined, undefined, 'common_name')
  return <><h1>Calendario</h1><CalendarView species={sp} /></>
}

function Island({ id }: { id: string }) {
  const [is, loadI] = useRows('*', 'islands', 'id', id); const i = is[0]
  const [notes, loadN] = useRows('*', 'notes', 'island_id', id, 'on_date')
  const [spRaw, loadS] = useRows('role,species(id,common_name,scientific_name)', 'island_species', 'island_id', id, 'role')
  const sp = [...spRaw].sort((a, b) => (a.role ?? '').localeCompare(b.role ?? '') || (a.species.common_name ?? '').localeCompare(b.species.common_name ?? ''))
  const [all] = useRows('id,common_name,scientific_name', 'species', undefined, undefined, 'common_name')
  const [f, setF] = useState<R>({}); const [body, setBody] = useState(''); const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [add, setAdd] = useState(''), [role, setRole] = useState('')
  const [files, setFiles] = useState<File[]>([]), [nonce, setNonce] = useState(0)
  const saveNote = async () => {
    if (!body && !files.length) return
    const { data, error } = await supabase.from('notes').insert({ island_id: id, body, on_date: date }).select('id').single()
    if (error) return alert(error.message)
    try { await uploadFiles(files, 'note_id', data.id) } catch (x: any) { alert(x.message) }
    setBody(''); setFiles([]); setNonce(n => n + 1); loadN()
  }
  useEffect(() => { if (i) setF(i) }, [i?.id])
  if (!i) return null
  const delIsland = async () => {
    if (!confirm(`Eliminare l'isola «${i.name}», le sue note e i media? I luoghi collegati restano, senza isola.`)) return
    await purgeMedia('note_id', notes.map(n => n.id))
    const { error } = await supabase.from('islands').delete().eq('id', id)
    if (error) return alert(error.message)
    location.hash = '#/'
  }
  const delNote = async (nid: string) => {
    if (!confirm('Eliminare questa nota e i suoi media?')) return
    await purgeMedia('note_id', [nid])
    await supabase.from('notes').delete().eq('id', nid); loadN()
  }
  return <><br /><a href="#/">← Isole</a><h1>{i.name}</h1>
    <h2 className="info">Info</h2>
    <div className="info"><Input placeholder="Nome" value={f.name ?? ''} onChange={e => setF({ ...f, name: e.target.value })} /><br />
      <Input placeholder="Località" value={f.location_text ?? ''} onChange={e => setF({ ...f, location_text: e.target.value })} /><br />
      <Textarea placeholder="Descrizione" value={f.description ?? ''} onChange={e => setF({ ...f, description: e.target.value })} />
      <Button variant="outline" size="sm" onClick={() => supabase.from('islands').update({ name: f.name, location_text: f.location_text, description: f.description }).eq('id', id).then(loadI)}>Salva info</Button>
      <span className="m"> Creata il {i.created_on}</span></div>
    <h2 className="diario">Diario</h2>
    <div className="grid gap-2 max-w-xl">
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <Textarea placeholder="Testo nota qui" value={body} onChange={e => setBody(e.target.value)} />
      <Input key={nonce} type="file" multiple accept="image/*,video/*" onChange={e => setFiles([...(e.target.files ?? [])])} />
      <div><Button variant="outline" size="sm" onClick={saveNote}>Aggiungi nota</Button></div>
    </div>
    {[...notes].reverse().map(n => <div key={n.id} className="my-4 diario">
      <span className="m">{n.on_date}</span>
      <p className="whitespace-pre-wrap">{n.body}</p>
      <MediaBlock col="note_id" id={n.id} />
      <Button variant="outline" size="sm" onClick={() => delNote(n.id)}>🗑️</Button>
    </div>)}
    <h2 className="specie">Specie ({sp.length})</h2>
    {[...new Set(sp.map(x => x.role ?? 'senza ruolo'))].map(r => <div key={r} className="my-2">
      <div className="m">{r}</div>
      {sp.filter(x => (x.role ?? 'senza ruolo') === r).map(x => <div className="species" key={x.species.id}>
        <a href={`#/specie/${x.species.id}`}>{x.species.common_name}</a> <i className="m">{x.species.scientific_name}</i>
      </div>)}
    </div>)}
    <div className="flex gap-2 items-center mt-2 max-w-xl">
      <NativeSelect value={add} onChange={e => setAdd(e.target.value)}><option value="">Specie…</option>{all.map(s => <option key={s.id} value={s.id}>{s.common_name}</option>)}</NativeSelect>
      <Input placeholder="ruolo" value={role} onChange={e => setRole(e.target.value)} />
      <Button variant="outline" size="sm" onClick={() => add && ins('island_species', { island_id: id, species_id: add, role }, loadS)}>Aggiungi specie</Button>
    </div><br /><br /><h2>Calendario</h2>
    <CalendarView species={sp.map(x => x.species)} />
    <br /><br /><h2>Elimina isola</h2>
    <Button variant="outline" size="sm" onClick={delIsland}>🗑️</Button></>
}

function Species() {
  const [r, load] = useRows('*', 'species', undefined, undefined, 'common_name'); const [n, setN] = useState(''), [c, setC] = useState('')
  return <><h1>Archivio botanico</h1>
    {r.map(s => <p key={s.id}><a href={`#/specie/${s.id}`}>{s.common_name}</a> <i className="m">{s.scientific_name}</i></p>)}
    <br /><br /><form onSubmit={e => { e.preventDefault(); ins('species', { common_name: c, scientific_name: n }, () => { setN(''); setC(''); load() }) }}>
      <Input placeholder="Nome comune" value={c} onChange={e => setC(e.target.value)} /> <Input placeholder="Nome scientifico" value={n} onChange={e => setN(e.target.value)} /> <Button variant="outline" size="sm">Aggiungi specie</Button></form></>
}

function Plant({ id }: { id: string }) {
  const [ss] = useRows('*', 'species', 'id', id); const s = ss[0]
  const [facts, loadF] = useRows('*', 'species_facts', 'species_id', id)
  const [cal, loadC] = useRows('*', 'species_calendar', 'species_id', id, 'month')
  const [isl] = useRows('role,islands(id,name)', 'island_species', 'species_id', id, 'role')
  const [notes, setNotes] = useState(''), [t, setT] = useState(''), [b, setB] = useState('')
  useEffect(() => { if (s) setNotes(s.notes ?? '') }, [s?.id])
  if (!s) return null
  const delFact = async (fid: string) => {
    if (!confirm('Eliminare questa voce?')) return
    const { error } = await supabase.from('species_facts').delete().eq('id', fid)
    if (error) return alert(error.message)
    loadF()
  }
  const delSpecie = async () => {
    if (!confirm(`Eliminare «${s.common_name}» dall'archivio? Verrà tolta da tutte le isole e perderà note, scoperte e calendario.`)) return
    const { error } = await supabase.from('species').delete().eq('id', id)
    if (error) return alert(error.message)
    location.hash = '#/specie'
  }
  const has = (a: string, m: number) => cal.some(c => c.activity === a && c.month === m)
  const tog = async (a: string, m: number) => { has(a, m) ? await supabase.from('species_calendar').delete().match({ species_id: id, activity: a, month: m }) : await supabase.from('species_calendar').insert({ species_id: id, activity: a, month: m }); loadC() }
  return <><br /><a href="#/specie">← Archivio</a><h1>{s.common_name} <i className="m text-base">{s.scientific_name}</i></h1>
    <h2>Isole</h2>{isl.map(x => <p key={x.islands.id}><a href={`#/isola/${x.islands.id}`}>{x.islands.name}</a> · {x.role}</p>)}
    <h2>Note generali</h2><Textarea value={notes} onChange={e => setNotes(e.target.value)} />
    <Button variant="outline" size="sm" onClick={() => supabase.from('species').update({ notes }).eq('id', id).then(() => { })}>Salva note</Button>
    <h2>Cose che scopro</h2>
    {facts.map(f => <div key={f.id} className="my-2 cosechescopro">
      <b>{f.title}</b> <Button variant="ghost" size="sm" onClick={() => delFact(f.id)}>🗑️</Button>
      <p className="whitespace-pre-wrap">{f.body}</p>
    </div>)}
    <Input placeholder="Titolo" value={t} onChange={e => setT(e.target.value)} /><Textarea placeholder="Testo" value={b} onChange={e => setB(e.target.value)} />
    <Button variant="outline" size="sm" onClick={() => t && ins('species_facts', { species_id: id, title: t, body: b }, () => { setT(''); setB(''); loadF() })}>Aggiungi</Button>
    <h2>Calendario</h2><table><thead><tr><th></th>{MESI.map((m, i) => <th key={i}>{m}</th>)}</tr></thead>
      <tbody>{ATT.map(a => <tr key={a}><td>{a}</td>{MESI.map((_, i) => <td key={i}><Button variant={has(a, i + 1) ? 'default' : 'ghost'} size="sm" className="h-6 w-6 p-0" onClick={() => tog(a, i + 1)}>{has(a, i + 1) ? '●' : '·'}</Button></td>)}</tr>)}</tbody></table>
    <h2>Elimina specie</h2>
    <Button variant="outline" size="sm" onClick={delSpecie}>🗑️</Button></>
}


function Places() {
  const [r, load] = useRows('*,islands(name)', 'places'); const [is] = useRows('id,name', 'islands', undefined, undefined, 'sort_order')
  const [f, setF] = useState<R>({ title: '', body: '', lat: '', lng: '', island_id: '' })
  const here = () => navigator.geolocation.getCurrentPosition(p => setF({ ...f, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }))
  const delPlace = async (pid: string) => {
    if (!confirm('Eliminare questo luogo e i suoi media?')) return
    await purgeMedia('place_id', [pid])
    await supabase.from('places').delete().eq('id', pid); load()
  }
  return <><h1>Luoghi</h1>
    {r.map(p => <div key={p.id} className="my-4 luogo">
      <a href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=16/${p.lat}/${p.lng}`} target="_blank">{p.lat}, {p.lng}</a><br />
      <b>{p.title}</b>
      <span className="m">{p.islands?.name}</span>{' '}
      <p className="whitespace-pre-wrap">{p.body}</p>
      <MediaBlock col="place_id" id={p.id} />
      <Button variant="outline" size="sm" onClick={() => delPlace(p.id)}>🗑️</Button><br />
    </div>)}
    <h2>Nuovo luogo</h2><Input placeholder="Titolo" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
    <NativeSelect value={f.island_id} onChange={e => setF({ ...f, island_id: e.target.value })}><option value="">Nessuna isola</option>{is.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</NativeSelect><br />
    <Input placeholder="lat" value={f.lat} onChange={e => setF({ ...f, lat: e.target.value })} /> <Input placeholder="lng" value={f.lng} onChange={e => setF({ ...f, lng: e.target.value })} /> <Button variant="outline" size="sm" onClick={here}>Usa la mia posizione</Button>
    <Textarea placeholder="Note" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
    <Button variant="outline" size="sm" onClick={() => f.title && f.lat && ins('places', { ...f, lat: +f.lat, lng: +f.lng, island_id: f.island_id || null }, () => { setF({ title: '', body: '', lat: '', lng: '', island_id: '' }); load() })}>Salva luogo</Button></>
}

const startedAsRecovery = location.hash.includes('type=recovery')

function NewPassword({ done }: { done: () => void }) {
  const [p, setP] = useState(''), [err, setErr] = useState('')
  return <form className="grid gap-2 max-w-sm" onSubmit={async e => {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: p })
    if (error) return setErr(error.message)
    await supabase.auth.signOut({ scope: 'global' })
    location.hash = '#/'; done()
  }}>
    <h1>Nuova password</h1>
    <Input type="password" minLength={8} placeholder="nuova password (min. 8 caratteri)" value={p} onChange={e => setP(e.target.value)} />
    <div><Button>Salva password</Button></div>
    <span className="text-sm text-red-700">{err}</span>
  </form>
}

export default function App() {
  const h = useHash(); const [ok, setOk] = useState<boolean | null>(null)
  const [recovery, setRecovery] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setOk(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((_, s) => setOk(!!s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (ok === null) return null
  if (recovery) return <div className="max-w-3xl mx-auto px-4"><NewPassword done={() => setRecovery(false)} /></div>
  const [, a, id] = h.split('/')
  return <div className="max-w-3xl mx-auto px-4 pb-16">{!ok ? <Login onRecovery={() => setRecovery(true)} /> : <>
    <nav className="py-3 border-b border-neutral-300 flex gap-4 mobnav"><a href="#/">Isole</a><a href="#/specie">Archivio</a><a href="#/calendario">Calendario</a><a href="#/luoghi">Luoghi</a>
      <span className="ml-auto flex gap-4"><a href="#/" onClick={e => { e.preventDefault(); exportZip() }}>Esporta tutto</a><a href="#/" onClick={() => supabase.auth.signOut()}>Esci</a></span></nav>
    {a === 'isola' ? <Island id={id} /> : a === 'specie' ? (id ? <Plant id={id} /> : <Species />) : a === 'calendario' ? <Calendar /> : a === 'luoghi' ? <Places /> : <Islands />}</>}</div>
}
