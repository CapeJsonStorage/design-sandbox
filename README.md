# Design Sandbox

A unified web app for creative production workflows — Storyboard, Krea, and Higgsfield generation tools in one place. Runs entirely in the browser with no server required.

## Live App

**[https://capejsonstorage.github.io/design-sandbox/](https://capejsonstorage.github.io/design-sandbox/)**

---

## Tabs

| Tab | Tool | Description |
|-----|------|-------------|
| Storyboard | `storyboard-app.html` | Create, sketch, and export visual storyboards with shot metadata |
| Krea Generator | `docx_to_krea_v5.html` | Convert a `.docx` with red-font DESIGN blocks into a `.krea` project file |
| Higgsfield Generator | `higgsfield-generator.html` | Convert a `.docx` into a structured `.higgsfield.json` + visual node graph + CLI commands |

### DOCX Format (for Krea + Higgsfield tabs)

The `.docx` must contain DESIGN blocks marked in **red font** (`#FF0000`):

```
DESIGN:
Type: Still         ← or "Video"
Description: A couple on phones in bed back to back
Ref: https://www.pexels.com/photo/man-and-woman-8037093/
```

Context text (black font) immediately before each `DESIGN:` line is captured as a sticky note.

---

## Deploy to GitHub Pages

1. Create a new **public** repo (e.g. `design-sandbox`) on your GitHub account
2. Push all files:
   ```bash
   git init
   git add index.html storyboard-app.html docx_to_krea_v5.html higgsfield-generator.html README.md
   git commit -m "Initial Design Sandbox"
   git remote add origin https://github.com/YOUR_USERNAME/design-sandbox.git
   git push -u origin main
   ```
3. In the repo → **Settings → Pages → Source:** `main` branch, root `/` → Save
4. Wait ~60 seconds, then visit `https://YOUR_USERNAME.github.io/design-sandbox/`

---

## Switching GitHub Accounts

Only the remote URL needs to change — no code edits required:

```bash
git remote set-url origin https://github.com/NEW_ACCOUNT/design-sandbox.git
git push -u origin main
```

Then enable GitHub Pages on the new repo as described above.

---

## Higgsfield CLI Setup

The Higgsfield Generator exports a `.higgsfield.json` project file and a `_cli_commands.txt` file. To use them with the CLI:

```bash
npm install -g @higgsfield/cli
higgsfield auth login        # opens browser for 5-second auth
```

Then run the commands from the exported `_cli_commands.txt`, or integrate the `.higgsfield.json` with any MCP-compatible agent.

More info: [higgsfield.ai/cli](https://higgsfield.ai/cli)

---

## Cloud Storage (Supabase)

Projects saved from any tab are stored in Supabase so they persist across devices. All projects are shared globally — no login required.

### Project details

| Field | Value |
|---|---|
| Provider | [Supabase](https://supabase.com) (free tier) |
| Project name | Design Sandbox |
| Project URL | `https://kgvobjhwtajmgutardci.supabase.co` |
| Region | AWS us-west-1 (West US — North California) |
| Dashboard | [supabase.com/dashboard/project/kgvobjhwtajmgutardci](https://supabase.com/dashboard/project/kgvobjhwtajmgutardci) |

### Database table — `public.projects`

```sql
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,          -- always 'shared' (no per-device scoping)
  source      text not null,          -- 'storyboard' | 'krea' | 'higgsfield'
  file_type   text not null,          -- '.sboard' | '.krea' | '.higgsfield.json' | '.js'
  name        text not null,
  created_at  timestamptz not null default now(),
  size        bigint not null default 0,
  storage_key text not null           -- path in the storage bucket
);
create index on public.projects (device_id, created_at desc);

-- RLS (open access — app relies on anon key + obscurity)
alter table public.projects enable row level security;
create policy "anon full access" on public.projects
  for all using (true) with check (true);
```

### Storage bucket — `project-data`

Project blobs (JSON + embedded base64 images) are stored as plain-text files. Path format: `{uuid}`.

```sql
create policy "anon upload"   on storage.objects for insert to anon with check (bucket_id = 'project-data');
create policy "anon download" on storage.objects for select  to anon using  (bucket_id = 'project-data');
create policy "anon delete"   on storage.objects for delete  to anon using  (bucket_id = 'project-data');
```

### Client setup (in `index.html`)

```js
// CDN (no build step)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL  = 'https://kgvobjhwtajmgutardci.supabase.co';
const SUPABASE_ANON = '<anon key from Settings → API Keys → Legacy anon>';
const BUCKET        = 'project-data';
const _supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
```

### Migrating to a different service

The storage layer is contained entirely in four functions in `index.html` (lines ~207–255):

- `_dbSave(record)` — uploads blob to Storage, inserts metadata row
- `_dbGetAll()` — fetches all metadata rows (no blobs)
- `_dbGetData(storageKey)` — downloads a single blob on demand
- `_dbDelete(id)` — deletes metadata row + storage blob

To migrate: replace these four functions with equivalents for the new provider (Firebase, PocketBase, a custom API, etc.). The `postMessage` contract between iframes is unchanged.

---

## Local Development

Open any file directly in a browser — no build step, no server needed:

```
file:///path/to/claude/index.html
```

Or serve with any static server:

```bash
npx serve .
python -m http.server 8080
```
