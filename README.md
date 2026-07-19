# Rooted

> God provides the seed. You faithfully cultivate it.

A faith-based personal growth RPG: daily discipline damages a symbolic boss,
real savings restore a real-world goal (a GT-R), and a tree tracks your
spiritual foundation as a modifier on everything else.

## Status: complete MVP

Everything from the design spec is implemented and wired to a real database:

- ✅ **Auth** — Supabase magic link sign-in, with sign-out
- ✅ **Automatic onboarding** — first sign-in silently provisions a profile,
  all six stats at tier 1, Season 1 ("The Shadow of Laziness"), and the R35
  starter goal. No manual Supabase table editing required for a new user
  to start playing immediately.
- ✅ **Boss Arena** — daily task checklist fused with the fight. Tapping a
  task rolls the correct die for your current stat tier, applies the tree's
  global modifier, damages the real boss HP, and persists everything.
  Includes a roll animation and a fully illustrated wraith boss (SVG) whose
  armor cracks and chains visibly break as HP drops.
- ✅ **Real day counter** — computed from actual account creation date, not
  a placeholder.
- ✅ **Dice tier progression** — Seed → Rooted → Rising → Unshaken →
  Flourishing → Unbreakable, staircase thresholds exactly as specced.
- ✅ **Tree / Garden** — real rolling 7-day vitality calculation from actual
  completions (Faith/Wisdom/Strength/Character only, per spec), driving a
  live global dice modifier. Tree illustration visually dims/dulls at lower
  vitality tiers.
- ✅ **Season defeat flow** — when boss HP hits 0: a dissolve/reveal screen,
  a scripture tied to the season's theme, a reflection journal prompt
  ("What did God teach you this season?"), then auto-creates the next
  season using the weakest-stat assignment logic.
- ✅ **Evening reflection journal** — the four questions from the original
  spec, saved per day, editable if revisited same day.
- ✅ **Garage / R35 restoration** — real generated car illustrations (all 6
  stages, served as static files, not bloated base64) swap automatically
  based on real logged savings vs. target amount. Contribution logging
  writes to the database and updates the fund bar immediately.
- ✅ **Daily reminder toggle** — opt-in browser notification (see scope note
  below — this is foreground-only, not true background push).
- ✅ **Full visual design system** — the painterly scene backgrounds, ribbon
  banners, quest cards, HP/vitality/fund bars, and side-arrow navigation
  from the mockup phase are now real, reusable CSS — not a placeholder
  shell.

## Honest scope notes (things that look done but have a real limit)

- **Daily reminders are foreground-only.** The reminder toggle uses the
  browser Notification API, which only fires while the app is open in a
  tab or installed window. True background push (arrives even when the
  app is fully closed) needs a push subscription plus a server sending on
  a schedule — real backend infrastructure, not something a client-only
  PWA can do alone. Upgrading this later means adding a small scheduled
  function (e.g. a Supabase Edge Function on a cron) using the Web Push
  API. This is flagged in the code comment in
  `src/components/ReminderToggle.jsx`.
- **Stage 5 car image doesn't show the spoiler** that appears in Stage 6 —
  a continuity gap in the generated art noticed during design, not a code
  bug. Fixing it means regenerating that one image with the spoiler
  already mounted (unpainted/taped), and swapping the file in
  `public/car-stages/stage5.png`.
- **Onboarding is one-size-fits-all** — every new user gets the same
  Season 1 boss and the same R35 goal. Letting users customize their
  starter goal (different car, different target amount, different title)
  is a natural next step but wasn't part of the original spec.

## What's intentionally still open

- **Multiple concurrent goals** — deliberately out of scope for MVP per
  earlier design decision (one active R35 project only).
- **Bank integration** — contributions are manually logged by design (no
  Plaid/bank linking), consistent with the "real discipline, not
  automation" philosophy discussed during design.

## If you already deployed a previous version

Run `supabase/migration_add_celebrated_at.sql` in the Supabase SQL editor —
it adds one new column needed for the GTR completion celebration. New
projects running `schema.sql` fresh don't need this, it's already included.

## Setup

1. **Create a Supabase project** at supabase.com (free tier).
2. **Run the schema**: paste `supabase/schema.sql` into the Supabase SQL
   editor and run it. This creates every table, including `daily_reflections`.
3. **Get your API keys**: Project Settings → API → copy the Project URL
   and anon/public key.
4. **Create `.env.local`** (copy `.env.example` and fill in real values):
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. **Install and run locally** (optional — see deployment below for the
   easier path):
   ```
   npm install
   npm run dev
   ```
6. **Sign in** — enter your email, click the magic link sent to your inbox.
   Your profile, stats, Season 1, and starter goal are created
   automatically — no manual table editing needed. You'll land straight
   in the Boss Arena ready to tap your first task.

## Deploying as a real website (recommended over running locally)

1. Push this folder to a GitHub repository.
2. Go to vercel.com, sign in with GitHub, **Add New → Project**, select
   the repo. Vercel auto-detects the Vite build.
3. Add the two environment variables (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) in Vercel's project settings.
4. Deploy. You'll get a live URL you can open on your phone and add to
   your home screen (it's a configured PWA).
5. Every future `git push` automatically redeploys.

Both Supabase and Vercel are free at solo-user scale. Supabase's free tier
pauses projects after 7 days of total inactivity — not a concern with
daily use, but worth knowing if you step away for a while.

## Project structure

```
src/
  lib/
    supabase.js       — Supabase client
    gameLogic.js       — every formula from the spec: dice tiers, boss HP
                         scaling, tree modifier, season assignment,
                         restoration stages
    onboarding.js       — auto-provisions profile/stats/season/goal on
                          first sign-in
  components/
    BossCreature.jsx   — the wraith SVG, damage-state driven by hpPct
    ReminderToggle.jsx — opt-in foreground daily reminder
  screens/
    AuthScreen.jsx
    BossArena.jsx       — home screen, daily loop
    Garden.jsx           — tree + stat grid + journal entry point
    Garage.jsx            — R35 restoration + contribution logging
    ReflectionJournal.jsx — evening reflection overlay
    SeasonDefeatScreen.jsx — reveal → reflect → next season flow
  App.jsx               — auth gate + compass navigation
  index.css             — full visual design system
public/
  car-stages/            — the 6 real generated R35 restoration images
supabase/
  schema.sql             — full database schema with row-level security
```
