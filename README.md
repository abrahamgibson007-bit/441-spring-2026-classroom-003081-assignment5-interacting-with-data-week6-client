# Week 6 Class Demo

This is a small **React** frontend for Week 6 class demos. It has three pages—**Auth**, **Parks**, and **Sightings**

- **Auth** — Email/password sign-in and sign-up via [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Parks** — Look up a park by id, lists all placeholder parks below.
- **Sightings** — Form that logs to the console, lists placeholder sightings below.

## Run locally

```bash
npm install
npm run dev
```

## Example placeholder data

These match `src/data/placeholders.ts` until you hook up a real API.

### Parks

A park is just a short id (the same id you type in the look-up box), a full name, and a state abbreviation.

Right now there is one park: Acadia National Park in Maine, id `ACAD`.

```ts
const parks = [{ ID: "ACAD", Name: "Acadia National Park", State: "ME" }];
```

To add another one—say Yellowstone in Wyoming with id `YELL`—add another entry to the list:

```ts
const parks = [
  { ID: "ACAD", Name: "Acadia National Park", State: "ME" },
  { ID: "YELL", Name: "Yellowstone National Park", State: "WY" },
];
```

On the Parks page, try id `ACAD` or `acad` (case does not matter) to see it match the first row.

---

### Sightings

A sighting is when and where something was seen: a date and time, which park (same kind of park id as above), and a species id your app or database uses. The number `id` is just a row id for React keys and later for a database.

There is one sample sighting: park `ACAD`, species `ACAD-1002`, on April 27, 2026 at 22:26:05 UTC (`+00` is UTC).

```ts
const sightings = [
  {
    id: 2,
    date_time: "2026-04-27 22:26:05+00",
    parkID: "ACAD",
    speciesID: "ACAD-1002",
  },
];
```

Another example would be a sighting at Yellowstone on New Year’s Day 2026, species `YELL-2001`, with a new row id `3`:

```ts
const sightings = [
  {
    id: 2,
    date_time: "2026-04-27 22:26:05+00",
    parkID: "ACAD",
    speciesID: "ACAD-1002",
  },
  {
    id: 3,
    date_time: "2026-01-01T12:00:00+00",
    parkID: "YELL",
    speciesID: "YELL-2001",
  },
];
```

Match whatever `date_time` format your backend expects; the sightings form logs values you can line up with this.

---

### Supabase (Auth)

The app reads your project URL and the public anon key from the environment so the browser can use Supabase Auth. Those are not secret like a database password; they still belong in `.env.local`, not in git.

Create `.env.local` in the project root. In the Supabase dashboard, open Project Settings → API and copy the project URL and anon/public key into the file:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # or the legacy anon JWT
```

Restart `npm run dev` after you change env vars.

---

Built with [Vite](https://vite.dev/) + [React](https://react.dev/) + [React Router](https://reactrouter.com/) + [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction).

---

## Security

This section covers how the client handles (or should handle) three common attack types, with references to the [OWASP Top 10 2025](https://owasp.org/Top10/2025/).

### Cross-Site Scripting (XSS)

XSS falls under **OWASP A05:2025 – Injection**. The attack works by injecting malicious script content into a page so the browser executes it in the context of the application, potentially stealing session tokens or performing actions on behalf of the user.

This codebase is largely protected from XSS by default because it is built with React. React's JSX compiler escapes all dynamic values before inserting them into the DOM. In every component — `ParksPage.tsx`, `ParkDetailPage.tsx`, and `SightingsPage.tsx` — data fetched from the API is rendered using JSX expressions like `{p.Name}` and `{s.Notes}`. React converts those to text nodes, not raw HTML, so even if the database contained `<script>alert(1)</script>` as a park name, it would appear as literal text on screen and never be executed.

The one place where this protection could be bypassed is if a developer ever uses `dangerouslySetInnerHTML` — React's explicit escape hatch for injecting raw HTML. This prop is not used anywhere in this codebase, and it should stay that way unless the content being rendered is explicitly sanitized with a library like `dompurify` first.

Image paths stored in the `ImagePath` column are rendered as `<img src={...}>` attributes in `ParkDetailPage.tsx` (the `imageUrl()` helper function, line ~17). A specially crafted path like `javascript:alert(1)` set as an `src` is generally ignored by modern browsers for `<img>` tags, but to be safe an additional check that the path is a plain filename (no protocol prefix) could be added before constructing the full Supabase Storage URL.

There is also no `Content-Security-Policy` header being set by Vite's dev server or any production server configuration in this repo. Adding a CSP that restricts `script-src` to `'self'` would be an important step before deploying to production, as it limits the damage any injected script can do even if another XSS vector is found.

### SQL Injection

SQL injection is also covered under **OWASP A05:2025 – Injection**. It works by embedding SQL syntax inside user input that gets concatenated into a raw query string.

SQL injection is not a meaningful attack surface for this client application because the client never constructs or sends SQL. All database reads go through `fetch()` calls to the Express REST API (`ParksPage.tsx` calls `${API_URL}/parks`, `ParkDetailPage.tsx` calls `${API_URL}/sightings?park=...`), and all database writes go through the Supabase JavaScript SDK in `SightingsPage.tsx` (`supabase.from('sightings').insert({...})`). In both paths, user input is passed as values in structured JSON or URL query parameters — never as fragments of a SQL string. The SQL parameterization happens entirely on the server side (see the API README for details).

The query parameters `since` and `before` in `ParkDetailPage.tsx` are passed to the API as ISO datetime strings. The API uses Supabase's `.gte()` and `.lte()` builder methods to apply them, which are parameterized. An attacker cannot break out of that context via the client.

### DDoS (Distributed Denial of Service)

DDoS is not a named category in OWASP Top 10 2025, but it relates to **OWASP A06:2025 – Insecure Design** — failing to design for availability — and **OWASP A02:2025 – Security Misconfiguration**, where missing infrastructure controls leave the app exposed.

The client itself is a static bundle of HTML, CSS, and JavaScript files. Once built (`npm run build`), there is no server-side processing happening in the client — requests for the static files are served directly by whatever host serves them (e.g. Netlify, Vercel, or a CDN). Static file hosts are inherently more resilient to DDoS than dynamic servers because there is no compute work per request and most CDN providers absorb volumetric attacks automatically.

The DDoS risk that does exist through the client is abuse of the form on `SightingsPage.tsx`. A script could POST many sightings rapidly, or the image upload to the `SightingsImages` Supabase Storage bucket could be abused to fill storage. Supabase's built-in rate limiting provides some protection on the auth side, but there is no rate limiting on the Storage upload path or the sightings insert path. Mitigation options include requiring authentication before allowing uploads (enforced via RLS policies in Supabase on the `SightingsImages` bucket and the `sightings` table), and adding a file size limit to the `<input type="file">` in `SightingsPage.tsx` before the upload call — currently `imageFile` is sent to `.upload()` with no size check.
