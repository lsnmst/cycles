import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { cached, fetchRows, warm, useOnline, peek, rowsKey } from './lib/cache'
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
    const hit = await peek<R[]>(rowsKey(sel, table, col, val, order))
    if (hit) s(hit)
    try { s(await fetchRows(sel, table, col, val, order)) }
    catch (e: any) { console.error(`[${table}]`, e.message); if (!hit) s([]) }
  }
  useEffect(() => { load() }, [table, col, val])
  return [r, load] as const
}

const ins = async (t: string, v: R, done: () => void) => {
  if (!navigator.onLine) return alert('Sei offline: per ora le modifiche richiedono la connessione.')
  const { error } = await supabase.from(t).insert(v)
  if (error) { alert(error.code === '23505' ? 'Esiste già una voce con questo nome.' : error.message); return }
  done()
}

const REPO = 'https://github.com/lsnmst/cycles'
const SHOTS = [
  { src: 'screens/calendario.webp', cap: '' },
  { src: 'screens/isola.webp', cap: '' },
  { src: 'screens/luoghi.webp', cap: '' },
]

function Landing({ onRecovery }: { onRecovery: () => void }) {
  return (
    <div className="grid gap-8 py-6">
      <header className="grid gap-2 max-w-prose">
        <h1>Cycles of Care · diario</h1>
        <p>
          Un diario per prendersi cura: isole di coltivazione, specie, note con foto
          e un calendario che mostra mese per mese cosa c’è da fare.
        </p>
        <p className="m">
          È un progetto personale e l’accesso è riservato. Se ti piace l'idea, il codice è aperto:
          puoi <a href={REPO} target="_blank" rel="noreferrer">installarti la tua copia</a>,
          gratis e con i tuoi dati.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_20rem] items-start">
        <aside className="luogo order-first md:order-last md:sticky md:top-4">
          <Login onRecovery={onRecovery} />
        </aside>
        <section className="grid gap-6">
          {SHOTS.map(s => (
            <figure key={s.src} className="grid gap-1 m-0">
              <img
                src={import.meta.env.BASE_URL + s.src}
                alt={s.cap}
                loading="lazy"
                className="w-full border border-neutral-300"
                onError={e => { (e.currentTarget.closest('figure') as HTMLElement).style.display = 'none' }}
              />
              <figcaption className="text-sm m">{s.cap}</figcaption>
            </figure>
          ))}
        </section>
      </div>
    </div>
  )
}

function Login({ onRecovery }: { onRecovery: () => void }) {
  const [e, setE] = useState(''), [p, setP] = useState(''), [code, setCode] = useState('')
  const [step, setStep] = useState<'pw' | 'code'>('pw'), [mode, setMode] = useState<'email' | 'recovery'>('email')
  const [msg, setMsg] = useState('')
  const em = e.trim().toLowerCase()

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
    <h2>Accedi</h2>
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
  const [all, setAll] = useState<R[]>([]), [a, setA] = useState('tutte')
  useEffect(() => {
    peek<R[]>('cal|all').then(h => { if (h) setAll(h) })
    cached<R[]>('cal|all', () => supabase.from('species_calendar').select('*')).then(r => setAll(r.data ?? [])).catch(() => { })
  }, [])
  const ids = new Set(species.map(s => s.id))
  const cal = all.filter(c => ids.has(c.species_id))
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

function NoteItem({ n, onDelete, onSaved }: { n: R; onDelete: () => void; onSaved: () => void }) {
  const [edit, setEdit] = useState(false), [body, setBody] = useState(n.body), [date, setDate] = useState(n.on_date)
  const save = async () => {
    const { error } = await supabase.from('notes').update({ body, on_date: date }).eq('id', n.id)
    if (error) return alert(error.message)
    setEdit(false); onSaved()
  }
  return <div className="my-4 diario">
    {edit ? <div className="grid gap-2 max-w-xl">
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <Textarea value={body} onChange={e => setBody(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={save}>Salva</Button>
        <Button size="sm" variant="ghost" onClick={() => { setBody(n.body); setDate(n.on_date); setEdit(false) }}>Annulla</Button>
      </div>
    </div> : <>
      <span className="m">{n.on_date}</span>{' '}
      <Button variant="ghost" size="sm" onClick={() => setEdit(true)}>Modifica</Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>Elimina nota</Button>
      <p className="whitespace-pre-wrap">{n.body}</p>
    </>}
    <MediaBlock col="note_id" id={n.id} />
  </div>
}

function FactItem({ f, onDelete, onSaved }: { f: R; onDelete: () => void; onSaved: () => void }) {
  const [edit, setEdit] = useState(false), [title, setTitle] = useState(f.title), [body, setBody] = useState(f.body ?? '')
  const save = async () => {
    if (!title) return
    const { error } = await supabase.from('species_facts').update({ title, body }).eq('id', f.id)
    if (error) return alert(error.message)
    setEdit(false); onSaved()
  }
  return <div className="my-4 cosechescopro">
    {edit ? <div className="grid gap-2 max-w-xl">
      <Input value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea value={body} onChange={e => setBody(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={save}>Salva</Button>
        <Button size="sm" variant="ghost" onClick={() => { setTitle(f.title); setBody(f.body ?? ''); setEdit(false) }}>Annulla</Button>
      </div>
    </div> : <>
      <b>{f.title}</b>{' '}
      <Button variant="ghost" size="sm" onClick={() => setEdit(true)}>Modifica</Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>Elimina voce</Button>
      <p className="whitespace-pre-wrap">{f.body}</p>
    </>}
    <MediaBlock col="fact_id" id={f.id} />
  </div>
}

function PlaceItem({ p, onDelete, onSaved }: { p: R; onDelete: () => void; onSaved: () => void }) {
  const [edit, setEdit] = useState(false), [title, setTitle] = useState(p.title), [body, setBody] = useState(p.body ?? '')
  const save = async () => {
    if (!title) return
    const { error } = await supabase.from('places').update({ title, body }).eq('id', p.id)
    if (error) return alert(error.message)
    setEdit(false); onSaved()
  }
  return <div className="my-4 luogo">
    {edit ? <div className="grid gap-2 max-w-xl">
      <Input value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea value={body} onChange={e => setBody(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={save}>Salva</Button>
        <Button size="sm" variant="ghost" onClick={() => { setTitle(p.title); setBody(p.body ?? ''); setEdit(false) }}>Annulla</Button>
      </div>
    </div> : <>
      <b>{p.title}</b> <span className="m">{p.islands?.name}</span>{' '}
      <a href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=16/${p.lat}/${p.lng}`} target="_blank">{p.lat}, {p.lng}</a>{' '}
      <p className="whitespace-pre-wrap">{p.body}</p>
    </>}
    <MediaBlock col="place_id" id={p.id} />
    <Button variant="ghost" size="sm" onClick={() => setEdit(true)}>Modifica</Button>
    <Button variant="ghost" size="sm" onClick={onDelete}>Elimina luogo</Button>

  </div>
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
  const unlink = async (sid: string, name: string) => {
    if (!confirm(`Togliere «${name}» da quest'isola? Resta nell'archivio.`)) return
    const { error } = await supabase.from('island_species').delete().match({ island_id: id, species_id: sid })
    if (error) return alert(error.message)
    loadS()
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
    {[...notes].reverse().map(n => <NoteItem key={n.id} n={n} onDelete={() => delNote(n.id)} onSaved={loadN} />)}
    <h2 className="specie">Specie ({sp.length})</h2>
    {[...new Set(sp.map(x => x.role ?? 'senza ruolo'))].map(r => <div key={r} className="my-2">
      <div className="m">{r}</div>
      {sp.filter(x => (x.role ?? 'senza ruolo') === r).map(x => <div className="species" key={x.species.id}>
        <button className="m ml-1 text-xs hover:text-red-700" title="Togli dall'isola" onClick={() => unlink(x.species.id, x.species.common_name)}>×</button>
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
    <br /><br /><form className="flex flex-wrap gap-2 items-center mt-4" onSubmit={e => {
      e.preventDefault()
      const sci = n.trim(), com = c.trim()
      if (!sci) return alert('Il nome scientifico è obbligatorio.')
      ins('species', { common_name: com || sci, scientific_name: sci }, () => { setN(''); setC(''); load() })
    }}>
      <Input className="w-48" placeholder="Nome comune" value={c} onChange={e => setC(e.target.value)} />
      <Input className="w-56" placeholder="Nome scientifico (obbligatorio)" value={n} onChange={e => setN(e.target.value)} />
      <Button type="submit" variant="outline" size="sm">Aggiungi specie</Button>
    </form></>
}

function Plant({ id }: { id: string }) {
  const [ss, loadSp] = useRows('*', 'species', 'id', id); const s = ss[0]
  const [facts, loadF] = useRows('*', 'species_facts', 'species_id', id)
  const [cal, loadC] = useRows('*', 'species_calendar', 'species_id', id, 'month')
  const [isl] = useRows('role,islands(id,name)', 'island_species', 'species_id', id, 'role')
  const [notes, setNotes] = useState(''), [saved, setSaved] = useState(''), [msg, setMsg] = useState('')
  const [t, setT] = useState(''), [b, setB] = useState('')
  useEffect(() => {
    if (!s) return
    const incoming = s.notes ?? ''
    setNotes(cur => (cur === saved ? incoming : cur))
    setSaved(incoming)
  }, [s?.id, s?.notes])
  if (!s) return null
  const saveNotes = async () => {
    if (!navigator.onLine) return setMsg('Sei offline: le note non sono state salvate.')
    const { data, error } = await supabase.from('species').update({ notes }).eq('id', id).select('id')
    if (error) return setMsg(error.message)
    if (!data?.length) return setMsg('Nessuna riga aggiornata: controlla la sessione e le regole RLS.')
    setSaved(notes); setMsg('Salvato.'); loadSp()
  }
  const delFact = async (fid: string) => {
    if (!confirm('Eliminare questa voce?')) return
    await purgeMedia('fact_id', [fid])
    const { error } = await supabase.from('species_facts').delete().eq('id', fid)
    if (error) return alert(error.message)
    loadF()
  }
  const delSpecie = async () => {
    if (!confirm(`Eliminare «${s.common_name}» dall'archivio? Verrà tolta da tutte le isole e perderà note, scoperte e calendario.`)) return
    await purgeMedia('fact_id', facts.map(f => f.id))
    const { error } = await supabase.from('species').delete().eq('id', id)
    if (error) return alert(error.message)
    location.hash = '#/specie'
  }
  const has = (a: string, m: number) => cal.some(c => c.activity === a && c.month === m)
  const tog = async (a: string, m: number) => { has(a, m) ? await supabase.from('species_calendar').delete().match({ species_id: id, activity: a, month: m }) : await supabase.from('species_calendar').insert({ species_id: id, activity: a, month: m }); loadC() }
  return <><br /><a href="#/specie">← Archivio</a><h1>{s.common_name} <i className="m text-base">{s.scientific_name}</i></h1>
    <h2>Isole</h2>{isl.map(x => <p key={x.islands.id}><a href={`#/isola/${x.islands.id}`}>{x.islands.name}</a> · {x.role}</p>)}
    <h2>Note generali</h2>
    <Textarea value={notes} onChange={e => { setNotes(e.target.value); setMsg('') }} />
    <Button variant="outline" size="sm" onClick={saveNotes}>Salva note</Button>
    <span className="m text-sm"> {notes !== saved ? 'Modifiche non salvate' : msg}</span>
    <h2>Cose che scopro</h2>
    {facts.map(f => <FactItem key={f.id} f={f} onDelete={() => delFact(f.id)} onSaved={loadF} />)}
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
  return <>
    <h1>Luoghi</h1>
    <h2>Nuovo luogo</h2><Input placeholder="Titolo" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
    <NativeSelect value={f.island_id} onChange={e => setF({ ...f, island_id: e.target.value })}><option value="">Nessuna isola</option>{is.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</NativeSelect><br />
    <Input placeholder="lat" value={f.lat} onChange={e => setF({ ...f, lat: e.target.value })} /> <Input placeholder="lng" value={f.lng} onChange={e => setF({ ...f, lng: e.target.value })} /> <Button variant="outline" size="sm" onClick={here}>Usa la mia posizione</Button>
    <Textarea placeholder="Note" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
    <Button variant="outline" size="sm" onClick={() => f.title && f.lat && ins('places', { ...f, lat: +f.lat, lng: +f.lng, island_id: f.island_id || null }, () => { setF({ title: '', body: '', lat: '', lng: '', island_id: '' }); load() })}>Salva luogo</Button>
    {[...r]
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
      .map(p => <PlaceItem key={p.id} p={p} onDelete={() => delPlace(p.id)} onSaved={load} />)}
  </>
}

const startedAsRecovery = location.hash.includes('type=recovery')

function NewPassword({ done }: { done: () => void }) {
  const [p, setP] = useState(''), [p2, setP2] = useState(''), [show, setShow] = useState(false), [msg, setMsg] = useState('')
  const t = show ? 'text' : 'password'
  return <form className="grid gap-2 max-w-sm" onSubmit={async e => {
    e.preventDefault()
    if (p !== p2) return setMsg('Le due password non coincidono.')
    const { error } = await supabase.auth.updateUser({ password: p })
    if (error) return setMsg(error.message)
    done()
  }}>
    <h1>Nuova password</h1>
    <Input type={t} autoComplete="new-password" minLength={8} placeholder="nuova password (min. 8 caratteri)" value={p} onChange={e => setP(e.target.value)} />
    <Input type={t} autoComplete="new-password" placeholder="ripeti la password" value={p2} onChange={e => setP2(e.target.value)} />
    <label className="text-sm"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> Mostra password</label>
    <div><Button>Salva password</Button></div>
    <span className="text-sm text-red-700">{msg}</span>
  </form>
}

function OfflineBar() {
  const online = useOnline()
  const [busy, setBusy] = useState(false), [at, setAt] = useState(localStorage.getItem('warm-at'))
  const run = async () => {
    setBusy(true)
    try { await warm(); setAt(localStorage.getItem('warm-at')) } catch (e) { console.error(e) }
    setBusy(false)
  }
  useEffect(() => { if (online && (!at || Date.now() - +new Date(at) > 12 * 3600e3)) run() }, [online])
  const when = at ? new Date(at).toLocaleString('it-IT') : 'mai'
  return <div className="m text-sm py-1 cache">
    {online
      ? <>Dati salvati sul dispositivo: {when} <Button variant="ghost" size="sm" disabled={busy} onClick={run}>{busy ? 'Aggiornamento…' : 'Aggiorna ora'}</Button></>
      : <>Offline, sola lettura. Dati aggiornati: {when}</>}
  </div>
}

const hasStoredSession = () => Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token') && localStorage.getItem(k))

export default function App() {
  const h = useHash(); const [ok, setOk] = useState<boolean | null>(null)
  const [recovery, setRecovery] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setOk(!!data.session || (!navigator.onLine && !!hasStoredSession())))
    const { data } = supabase.auth.onAuthStateChange((_, s) => setOk(!!s || (!navigator.onLine && !!hasStoredSession())))
    return () => data.subscription.unsubscribe()
  }, [])
  if (ok === null) return null
  if (recovery) return <div className="max-w-3xl mx-auto px-4"><NewPassword done={() => setRecovery(false)} /></div>
  const [, a, id] = h.split('/')
  return <div className="max-w-3xl mx-auto px-4 pb-16">{!ok ? <Landing onRecovery={() => setRecovery(true)} /> : <>
    <nav className="py-3 border-b border-neutral-300 flex gap-4 mobnav"><a href="#/">Isole</a><a href="#/specie">Archivio</a><a href="#/calendario">Calendario</a><a href="#/luoghi">Luoghi</a>
      <span className="ml-auto flex gap-4"><a href="#/" onClick={e => { e.preventDefault(); exportZip() }}>Esporta tutto</a><a href="#/" onClick={() => supabase.auth.signOut()}>Esci</a></span></nav>
    <OfflineBar />
    {a === 'isola' ? <Island id={id} /> : a === 'specie' ? (id ? <Plant id={id} /> : <Species />) : a === 'calendario' ? <Calendar /> : a === 'luoghi' ? <Places /> : <Islands />}</>}</div>
}
