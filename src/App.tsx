import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { exportZip } from './lib/export'
type R = Record<string, any>
const MESI = ['G','F','M','A','M','G','L','A','S','O','N','D']
const ATT = ['semina','trapianto','potatura','fioritura','raccolta','talea','divisione','innesto']

function useHash() {
  const [h, s] = useState(location.hash.slice(1) || '/')
  useEffect(() => { const f = () => s(location.hash.slice(1) || '/'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h
}
function useRows(sel: string, table: string, col?: string, val?: string, order = 'created_at') {
  const [r, s] = useState<R[]>([])
  const load = async () => {
    let q = supabase.from(table).select(sel); if (col) q = q.eq(col, val!)
    const { data } = await q.order(order); s((data as any) ?? [])
  }
  useEffect(() => { load() }, [table, col, val])
  return [r, load] as const
}
const ins = (t: string, v: R, done: () => void) => supabase.from(t).insert(v).then(done)

function Login() {
  const [e, setE] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('')
  return <form onSubmit={async ev => { ev.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email: e, password: p }); if (error) setErr(error.message) }}>
    <h1>Accedi</h1><input placeholder="email" value={e} onChange={x => setE(x.target.value)} /><br />
    <input type="password" placeholder="password" value={p} onChange={x => setP(x.target.value)} /><br />
    <button>Accedi</button> <span className="m">{err}</span></form>
}

function Islands() {
  const [r, load] = useRows('*', 'islands', undefined, undefined, 'sort_order'); const [n, setN] = useState('')
  return <><h1>Le mie isole</h1>
    {r.map(i => <p key={i.id}><a href={`#/isola/${i.id}`}>{i.name}</a> <span className="m">{i.location_text}</span></p>)}
    <form onSubmit={e => { e.preventDefault(); ins('islands', { name: n }, () => { setN(''); load() }) }}>
      <input placeholder="Nome nuova isola" value={n} onChange={e => setN(e.target.value)} /> <button>Aggiungi isola</button></form></>
}

function Island({ id }: { id: string }) {
  const [is, loadI] = useRows('*', 'islands', 'id', id); const i = is[0]
  const [notes, loadN] = useRows('*', 'notes', 'island_id', id, 'on_date')
  const [sp, loadS] = useRows('role,species(id,common_name,scientific_name)', 'island_species', 'island_id', id)
  const [all] = useRows('id,common_name,scientific_name', 'species', undefined, undefined, 'common_name')
  const [f, setF] = useState<R>({}); const [body, setBody] = useState(''); const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [add, setAdd] = useState(''), [role, setRole] = useState('')
  useEffect(() => { if (i) setF(i) }, [i?.id])
  if (!i) return null
  return <><a href="#/">← Isole</a><h1>{i.name}</h1>
    <h2>Info</h2>
    <input placeholder="Nome" value={f.name ?? ''} onChange={e => setF({ ...f, name: e.target.value })} /><br />
    <input placeholder="Località" value={f.location_text ?? ''} onChange={e => setF({ ...f, location_text: e.target.value })} /><br />
    <textarea placeholder="Descrizione" value={f.description ?? ''} onChange={e => setF({ ...f, description: e.target.value })} />
    <button onClick={() => supabase.from('islands').update({ name: f.name, location_text: f.location_text, description: f.description }).eq('id', id).then(loadI)}>Salva info</button>
    <span className="m"> Creata il {i.created_on}</span>
    <h2>Diario</h2>
    <input type="date" value={date} onChange={e => setDate(e.target.value)} /><textarea placeholder="Nuova nota" value={body} onChange={e => setBody(e.target.value)} />
    <button onClick={() => body && ins('notes', { island_id: id, body, on_date: date }, () => { setBody(''); loadN() })}>Aggiungi nota</button>
    {[...notes].reverse().map(n => <div key={n.id} className="my-3"><span className="m">{n.on_date}</span><p className="whitespace-pre-wrap">{n.body}</p></div>)}
    <h2>Specie</h2>
    {sp.map(x => <p key={x.species.id}><a href={`#/specie/${x.species.id}`}>{x.species.common_name}</a> <i className="m">{x.species.scientific_name}</i> · {x.role}</p>)}
    <select value={add} onChange={e => setAdd(e.target.value)}><option value="">Specie…</option>{all.map(s => <option key={s.id} value={s.id}>{s.common_name}</option>)}</select>
    <input placeholder="ruolo" value={role} onChange={e => setRole(e.target.value)} />
    <button onClick={() => add && ins('island_species', { island_id: id, species_id: add, role }, loadS)}>Aggiungi specie</button></>
}

function Species() {
  const [r, load] = useRows('*', 'species', undefined, undefined, 'common_name'); const [n, setN] = useState(''), [c, setC] = useState('')
  return <><h1>Archivio botanico</h1>
    {r.map(s => <p key={s.id}><a href={`#/specie/${s.id}`}>{s.common_name}</a> <i className="m">{s.scientific_name}</i></p>)}
    <form onSubmit={e => { e.preventDefault(); ins('species', { common_name: c, scientific_name: n }, () => { setN(''); setC(''); load() }) }}>
      <input placeholder="Nome comune" value={c} onChange={e => setC(e.target.value)} /> <input placeholder="Nome scientifico" value={n} onChange={e => setN(e.target.value)} /> <button>Aggiungi specie</button></form></>
}

function Plant({ id }: { id: string }) {
  const [ss] = useRows('*', 'species', 'id', id); const s = ss[0]
  const [facts, loadF] = useRows('*', 'species_facts', 'species_id', id)
  const [cal, loadC] = useRows('*', 'species_calendar', 'species_id', id, 'month')
  const [isl] = useRows('role,islands(id,name)', 'island_species', 'species_id', id, 'role')
  const [notes, setNotes] = useState(''), [t, setT] = useState(''), [b, setB] = useState('')
  useEffect(() => { if (s) setNotes(s.notes ?? '') }, [s?.id])
  if (!s) return null
  const has = (a: string, m: number) => cal.some(c => c.activity === a && c.month === m)
  const tog = async (a: string, m: number) => { has(a, m) ? await supabase.from('species_calendar').delete().match({ species_id: id, activity: a, month: m }) : await supabase.from('species_calendar').insert({ species_id: id, activity: a, month: m }); loadC() }
  return <><a href="#/specie">← Archivio</a><h1>{s.common_name} <i className="m text-base">{s.scientific_name}</i></h1>
    <h2>Isole</h2>{isl.map(x => <p key={x.islands.id}><a href={`#/isola/${x.islands.id}`}>{x.islands.name}</a> · {x.role}</p>)}
    <h2>Note generali</h2><textarea value={notes} onChange={e => setNotes(e.target.value)} />
    <button onClick={() => supabase.from('species').update({ notes }).eq('id', id).then(() => {})}>Salva note</button>
    <h2>Cose che scopro</h2>
    {facts.map(f => <div key={f.id} className="my-2"><b>{f.title}</b><p className="whitespace-pre-wrap">{f.body}</p></div>)}
    <input placeholder="Titolo" value={t} onChange={e => setT(e.target.value)} /><textarea placeholder="Testo" value={b} onChange={e => setB(e.target.value)} />
    <button onClick={() => t && ins('species_facts', { species_id: id, title: t, body: b }, () => { setT(''); setB(''); loadF() })}>Aggiungi</button>
    <h2>Calendario</h2><table><thead><tr><th></th>{MESI.map((m, i) => <th key={i}>{m}</th>)}</tr></thead>
      <tbody>{ATT.map(a => <tr key={a}><td>{a}</td>{MESI.map((_, i) => <td key={i}><button onClick={() => tog(a, i + 1)}>{has(a, i + 1) ? '●' : '·'}</button></td>)}</tr>)}</tbody></table></>
}

function Calendar() {
  const [sp] = useRows('id,common_name', 'species', undefined, undefined, 'common_name')
  const [cal] = useRows('*', 'species_calendar', undefined, undefined, 'month'); const [a, setA] = useState('raccolta')
  const rows = sp.filter(s => cal.some(c => c.species_id === s.id && c.activity === a))
  return <><h1>Calendario</h1><select value={a} onChange={e => setA(e.target.value)}>{ATT.map(x => <option key={x}>{x}</option>)}</select>
    <table className="mt-3"><thead><tr><th></th>{MESI.map((m, i) => <th key={i}>{m}</th>)}</tr></thead>
      <tbody>{rows.map(s => <tr key={s.id}><td><a href={`#/specie/${s.id}`}>{s.common_name}</a></td>
        {MESI.map((_, i) => <td key={i}>{cal.some(c => c.species_id === s.id && c.activity === a && c.month === i + 1) ? '●' : ''}</td>)}</tr>)}</tbody></table></>
}

function Places() {
  const [r, load] = useRows('*,islands(name)', 'places'); const [is] = useRows('id,name', 'islands', undefined, undefined, 'sort_order')
  const [f, setF] = useState<R>({ title: '', body: '', lat: '', lng: '', island_id: '' })
  const here = () => navigator.geolocation.getCurrentPosition(p => setF({ ...f, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }))
  return <><h1>Luoghi</h1>
    {r.map(p => <div key={p.id} className="my-2"><b>{p.title}</b> <span className="m">{p.islands?.name}</span> <a href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=16/${p.lat}/${p.lng}`} target="_blank">{p.lat}, {p.lng}</a><p className="whitespace-pre-wrap">{p.body}</p></div>)}
    <h2>Nuovo luogo</h2><input placeholder="Titolo" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
    <select value={f.island_id} onChange={e => setF({ ...f, island_id: e.target.value })}><option value="">Nessuna isola</option>{is.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select><br />
    <input placeholder="lat" value={f.lat} onChange={e => setF({ ...f, lat: e.target.value })} /> <input placeholder="lng" value={f.lng} onChange={e => setF({ ...f, lng: e.target.value })} /> <button onClick={here}>Usa la mia posizione</button>
    <textarea placeholder="Note" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
    <button onClick={() => f.title && f.lat && ins('places', { ...f, lat: +f.lat, lng: +f.lng, island_id: f.island_id || null }, () => { setF({ title: '', body: '', lat: '', lng: '', island_id: '' }); load() })}>Salva luogo</button></>
}

export default function App() {
  const h = useHash(); const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setOk(!!data.session)); const { data } = supabase.auth.onAuthStateChange((_, s) => setOk(!!s)); return () => data.subscription.unsubscribe() }, [])
  if (ok === null) return null
  const [, a, id] = h.split('/')
  return <div className="max-w-3xl mx-auto px-4 pb-16">{!ok ? <Login /> : <>
    <nav className="py-3 border-b border-neutral-300 flex gap-4"><a href="#/">Isole</a><a href="#/specie">Archivio</a><a href="#/calendario">Calendario</a><a href="#/luoghi">Luoghi</a>
      <span className="ml-auto flex gap-4"><a href="#/" onClick={e => { e.preventDefault(); exportZip() }}>Esporta tutto</a><a href="#/" onClick={() => supabase.auth.signOut()}>Esci</a></span></nav>
    {a === 'isola' ? <Island id={id} /> : a === 'specie' ? (id ? <Plant id={id} /> : <Species />) : a === 'calendario' ? <Calendar /> : a === 'luoghi' ? <Places /> : <Islands />}</>}</div>
}
