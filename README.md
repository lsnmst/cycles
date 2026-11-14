# Cycles of Care · diario
1. Supabase: crea il progetto, disattiva le registrazioni (Auth → Providers → Email → "Allow new users to sign up" off), crea il tuo utente da Auth → Users.
2. SQL Editor: sostituisci TUA@EMAIL in supabase/schema.sql ed eseguilo, poi supabase/seed.sql.
3. Locale: `cp .env.example .env` (URL e anon key da Project Settings → API), `npm install`, `npm run dev`.
4. GitHub Pages: repo pubblico, Settings → Pages → Source: GitHub Actions; aggiungi i secrets VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
5. "Esporta tutto" scarica uno zip con json/, csv/ e un .md per isola.
