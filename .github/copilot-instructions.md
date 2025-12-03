<!-- Short, actionable guide for AI coding agents working on this repo -->
# Copilot / AI Agent Instructions

This project is a small client-side calendar web app (no build step). Below are concise, project-specific notes to get productive fast.

**Big Picture**
- **Frontend-only app**: vanilla ES modules under `js/` (no bundler). Entry is `index.html` which imports modules in this exact order: `js/core/db.js`, `js/core/auth.js`, `js/ui/*.js`, then `js/app.js`.
- **Backend service**: Supabase is used as the data store and auth provider. Credentials are in `js/core/auth.js` / `js/core/db.js` (anon key + URL).
- **Data flow**: UI modules call `js/core/db.js` (which calls Supabase). `db.js` caches month data (see `monthCache`) and invalidates it on writes. Events propagate via `window.dispatchEvent(new CustomEvent(...))`.

**Important files & roles**
- `index.html`: DOM, modal structure and module import order — do not change script order without verifying startup sequence.
- `js/app.js`: app bootstrap, global event listeners for `task-updated` and `work-updated`, exposes global helpers on `window` (e.g. `openDayDetails`).
- `js/core/auth.js`: Supabase auth helpers and `loadOrCreateProfile()` — called on login/register.
- `js/core/db.js`: central data access layer. Implements `getMonthData()`, caching, CRUD for `tasks` and `work_entries`, and helpers like `calcTotalHours()`.
- `js/ui/*.js`: UI modules (calendar, modals, reports, export, theme). They call `core` helpers and emit `task-updated` / `work-updated` events.
- `css/styles.css`: theme variables and UI tokens (dark/light via `body.dark`).

**Cross-component communication patterns**
- Global CustomEvents: listen for `task-updated` and `work-updated` (detail is an ISO `YYYY-MM` or `YYYY-MM-DD`). Handler in `js/app.js` re-renders the calendar and refreshes day modal.
- `window`-exposed helpers: UI modules rely on `window.openDayDetails`, `window.openWorkModal`, `window.openTaskModal`, `window.openExportModal` being available (set in `js/app.js`).
- Modal control uses native `<dialog>` APIs (`showModal()`, `close()`), and DOM nodes are referenced by `id` (e.g. `dayModal`, `taskModal`).

**Data formats and conventions**
- Dates: ISO `YYYY-MM-DD` strings (used everywhere). Times are `HH:MM` strings. Validate length (5 chars) before use.
- Supabase inserts expect `user_id` for RLS; `db.insertTask()` and `insertWork()` add `user_id` from session. Keep this behaviour when refactoring.
- `db.js` caches monthly payloads by key `YYYY-MM` — call `invalidateCache(dateISO)` after writes.

**Developer workflows**
- No build tools. Serve the `calendar_work` folder as static files. Quick ways:
  - `python3 -m http.server 8000` (then open `http://localhost:8000/`)
  - or `npx serve .` if Node is available.
- Use browser DevTools console to follow dense logging fingerprints: logs include tags like `[SESSION]`, `[DB]`, `[TASK]`, `[WORK]`, `[theme]`, `[export]` — use them to trace behavior.
- To reproduce auth/data issues, check network requests to the Supabase URL in `js/core/auth.js`.

**Patterns to follow when editing**
- Preserve module import order in `index.html`. `db` and `auth` must load before `ui` modules and `app.js`.
- When adding DB writes, ensure cache invalidation is called (see `invalidateCache`). After successful writes, dispatch `task-updated` or `work-updated` with the affected date.
- Maintain `user_id` inclusion for writes (RLS). Use `supabase.auth.getUser()` in `db.js` when creating payloads.
- Keep UI interactions id-based (use the existing `id` values in `index.html`) unless you update all callers.

**Security & secrets**
- Supabase anon key is present in repo — treat as sensitive. Avoid committing new secrets. When rotating keys, update `js/core/auth.js` and `js/core/db.js` together.

**Quick examples**
- Re-render calendar for a changed date:
  - `window.dispatchEvent(new CustomEvent('task-updated', { detail: '2025-12-03' }))`
- Open add-task modal from console:
  - `window.openTaskModal(null, '2025-12-03')`

If any section is vague or you want the instructions in a different language/style, tell me which parts to expand or adjust.
