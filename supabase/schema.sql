create or replace function is_owner() returns boolean language sql stable as
$$ select auth.jwt()->>'email' = 'MIA@EMAI:NET' $$;

create table islands(id uuid primary key default gen_random_uuid(), sort_order int, name text not null, description text, location_text text, lat double precision, lng double precision, created_on date default current_date, created_at timestamptz default now());
create table notes(id uuid primary key default gen_random_uuid(), island_id uuid references islands on delete cascade, on_date date default current_date, body text not null default '', created_at timestamptz default now());
create table note_media(id uuid primary key default gen_random_uuid(), note_id uuid references notes on delete cascade, kind text check (kind in ('photo','video_url')), path text, url text, caption text, position int default 0);
create table species(id uuid primary key default gen_random_uuid(), common_name text, scientific_name text unique not null, notes text, created_at timestamptz default now());
create table species_facts(id uuid primary key default gen_random_uuid(), species_id uuid references species on delete cascade, title text not null, body text, created_at timestamptz default now());
create table island_species(island_id uuid references islands on delete cascade, species_id uuid references species on delete cascade, role text, primary key(island_id, species_id));
create table species_calendar(species_id uuid references species on delete cascade, activity text check (activity in ('semina','trapianto','potatura','fioritura','raccolta','talea','divisione','innesto')), month int check (month between 1 and 12), primary key(species_id, activity, month));
create table places(id uuid primary key default gen_random_uuid(), island_id uuid references islands on delete set null, title text not null, body text, lat double precision not null, lng double precision not null, created_at timestamptz default now());

do $$ declare t text; begin
  foreach t in array array['islands','notes','note_media','species','species_facts','island_species','species_calendar','places'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy owner_all on %I for all using (is_owner()) with check (is_owner())', t);
  end loop; end $$;

insert into storage.buckets(id,name,public) values('media','media',false);
create policy media_owner on storage.objects for all using (bucket_id='media' and is_owner()) with check (bucket_id='media' and is_owner());

create table if not exists public.heartbeat (
  id int primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);
alter table public.heartbeat enable row level security;  -- nessuna policy: dall'API la tabella è invisibile

create or replace function public.ping()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  insert into public.heartbeat (id, pinged_at) values (1, now())
  on conflict (id) do update set pinged_at = excluded.pinged_at
  returning pinged_at;
$$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon;