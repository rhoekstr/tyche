# Tyche — Reference

A psychedelic randomizer for the small decisions you can't make. Pick a list, hit spin, get an answer. Named for the Greek goddess of fortune.

Live: <https://tyche.awrylabs.com>

---

## What it is

Tyche is a single-page web app that picks something random from a list. The "list" is the unit of value: every screen in the app is some flavor of *show me one of these things*. There are 27 official lists shipped with the app (cuisines, dishes, Disney rides, workouts, party games, scenarios, etc.) and you can build your own.

Five animation styles wrap the same underlying randomizer logic — slot machine, flipping coin, tumbling die, card flip, and a triangular RPS prism — so the visual matches the metaphor of the choice.

It's deployed as a static site to GitHub Pages with a custom domain. There's no backend, no account system, and no telemetry. All user data (custom lists, saved configs, preferences) lives in browser `localStorage`.

## Why "Tyche"

Τύχη — Tyche — was the Greek goddess of fortune, chance, and providence. Romans called her Fortuna. She's typically depicted with a rudder (steering fates), a cornucopia (abundance), and a wheel that turns up and down without warning. Cities adopted her as a patron, hoping she'd tilt outcomes their way. Naming a randomizer after her is on-the-nose in the best way.

The app was originally called **So Random!** — renamed to **Tyche** mid-2026 along with a domain move from `sorandom.awrylabs.com` to `tyche.awrylabs.com`.

---

## App surface

### Home (`/`)
Browse all official and custom lists, grouped by hierarchy (Food & Drink → Cuisines → World Cuisines, etc.). Includes a search box and a "Suggest a List" link to `coffee@awrylabs.com`.

### Pack page (`/pack/:id`)
Spin a single list. Components:
- Pack metadata (icon, title, description)
- Filter panel (collapsible, shown only if the list defines filters)
- Animation picker (override the default animation: slot / coin / dice / card / RPS)
- Animation stage (the 3D thing)
- Result label (full text + icon, shown for non-slot animations)
- Spin button
- "Remaining" indicator + Reshuffle (for lists with `replacement: false`)

### Utilities (sidebar)
Standalone randomizers without a pack picker:
- `/utility/slot` — pick any list and spin a slot reel
- `/utility/coin` — heads/tails 3D coin flip
- `/utility/dice` — d4–d1000 with selectable sides
- `/utility/rps` — rock/paper/scissors prism
- `/utility/card` — draw from a 52-card deck, with-or-without replacement toggle

### Custom Roll (`/multi`)
Combine up to 8 lists or utilities into one decision. Each slot has:
- Pack picker (groups Utilities at top, then all Lists)
- Animation override dropdown
- Filter editor (gear icon next to the picker; opens chip toggles for that list's filter dimensions)
- × remove

Save named configurations; export/import as JSON.

### New List (`/custom`)
Build a custom list. Two tabs:
- **Form Builder** — explicit fields for title, description, icon, optional filter dimensions (key, label, multi-select, comma-separated values), and per-item rows (value, icon, short label, plus filter-value chip toggles per dimension). Bulk-add textarea for fast value-only entry.
- **Import JSON** — paste a `Pack` JSON object that matches the schema below.

Saved lists appear at the bottom with Open / Export / Delete.

### Settings (`/settings`)
- Sound on/off (controls the procedural Web Audio tones)
- Animation speed: slow / normal / fast
- Reduced motion toggle
- "Your Lists" — link to manage, button to clear all
- Export All Data / Import Backup (preferences, custom lists, saved configs)

### About (`/about`)
Explanatory page covering what the app is, the goddess, how it works, privacy, and credits.

---

## Data model

```ts
type AnimationMode = 'slot' | 'coin' | 'dice' | 'card' | 'rps'
type PackSource = 'official' | 'custom'

interface Pack {
  id: string
  version: string
  meta: {
    title: string
    description: string
    icon: string                    // emoji shown in pack pickers
    defaultAnimation: AnimationMode // override per-pack
    tags: string[]
    hierarchy: { level1: string; level2: string; level3?: string }
    source: PackSource
    submittedBy?: string | null
  }
  filters?: {                       // optional schema
    [dimensionKey: string]: { label: string; multiSelect: boolean }
  }
  defaultFilters?: { [dim: string]: string[] } // currently ignored at runtime
  items: PackItem[]
  sampling?: { replacement: boolean; showRemaining?: boolean; exhaustedBehavior?: 'reshuffle' | 'warn' | 'block' }
}

interface PackItem {
  value: string             // primary display text
  icon?: string             // emoji shown on small faces
  shortLabel?: string       // alternative text when value is too long for a face
  filters?: { [dim: string]: string[] } // which filter values this item belongs to
}
```

### Lists on disk

- `public/data/manifest.json` — index of all official packs (id, path, meta).
- `public/data/packs/<id>.json` — one file per pack containing the full `Pack` object.

Adding a new official list = drop a JSON file in `public/data/packs/` and add a manifest entry. The manifest is fetched once on app load and cached.

### Custom lists

Created via `/custom`, stored under `localStorage["tyche:custom-packs"]` as an array of `Pack`. Custom lists are hot-injected into the pack cache via `registerPack(pack)` so the rest of the app treats them like any other list.

### Utility "synthetic" packs

Coin / Dice (d6) / Cards / RPS are exposed as fake packs in Custom Roll's slot picker. They live in `src/utils/utilityPacks.ts` and are registered with the same `registerPack` mechanism on first import. Their IDs use a `_utility:` prefix so they don't collide with real packs.

### Filters

Filters are an optional schema on a pack. Each dimension has a key (used in items), a label (shown in the UI), and a `multiSelect` flag. Items declare which filter values they belong to via `item.filters`.

The runtime treats **empty arrays as "no filter on this dimension — accept anything"**. Default state of any list is "all chips deselected, no filter applied, all items in the pool". The user opts in by selecting chips. This means `defaultFilters` is currently ignored at runtime (kept in the schema for forward-compat).

`filterItems(items, schema, active)` is the canonical filter function. AND across dimensions, OR across values within a dimension.

### Sampling

`sampling.replacement: true` — always pick from the full pool. Default for nearly every list.

`sampling.replacement: false` — draws are without replacement. The `useRandomizer` hook tracks drawn vs. remaining items per session. When the pool exhausts, `exhaustedBehavior` decides whether to silently reshuffle, surface a "warn" banner, or block further spins until the user clicks Reshuffle. `showRemaining: true` exposes a "X / N remaining" counter under the pack header.

---

## Animations

Every animation component conforms to the same interface:

```ts
interface AnimationProps {
  pool: PackItem[]
  result: PackItem | null
  spinId: number       // bumped on each spin to force re-trigger
  isSpinning: boolean
  onComplete: () => void
  durationMs?: number
}
```

`AnimationStage` switches on `mode` and renders the right one.

### Slot machine (`SlotMachine.tsx`)
A vertical reel of 24 padding items + the result. Direct CSS `translate3d` animation with cubic-bezier easing. On completion, fires a confetti burst (`ParticleBurst`) and reveals the result with a flash.

### Coin (`CoinAnimation.tsx`)
True two-sided 3D disc using `transform-style: preserve-3d` and `backface-visibility: hidden`. Rotates Y from 0° → 1440° (4 full turns) on `requestAnimationFrame`. While the rotation is in progress, on each 180° boundary into back-visible we randomize the front face's content. On the **last** odd-numbered phase before completion, the front is locked to `result` so when it rotates back into view at t=1, no swap-pop.

### Dice (`DiceAnimation.tsx`)
3D cube with six positioned faces (`rotateY ±90/180/0` and `rotateX ±90`, each `translateZ(half)`). Tumbles with `rotateX(720°) rotateY(1080°)` using different easing per axis. Per frame, computes each face's world-space normal Z and refreshes content of any face whose normal Z is below `-0.3` (definitely back-facing) at most every 100ms. Once the front face has been hidden at any point during the spin, every later refresh of front uses `result`, so the cube settles cleanly with no swap.

### Card (`CardAnimation.tsx`)
Like the coin but rectangular. Front face renders a card layout when items have a suit-style icon (rank in corners, big suit centered, red for ♥/♦), otherwise just centered text. Back face is a decorative gradient pattern. Same multi-flip + last-phase-lock pattern as the coin.

### RPS prism (`RPSAnimation.tsx`)
Triangular prism with three faces at 120° intervals (`rotateY(0/-120/-240) translateZ(apothem)` where apothem is `(width/2)/tan(60°)`). Rotates Y to a target offset of `120 × resultSlot` past 4 full turns. **Result placement**: at spin start a random face slot is chosen for the result, and three distinct random pool items fill all three faces (the result is intentionally NOT placed initially so the user can't see the answer ahead). When rotation makes the result-slot face back-facing (`cos(rot − 120·slot) < −0.3`), its content is swapped to `result`. The cube settles with the result on the camera-facing face, and the active face highlights with a neon-acid glow.

This pattern means RPS works on any-size pool: the original 3-item Rock/Paper/Scissors and a 36-item adjective list both land correctly with the result visible.

### ResultLabel
Below every non-slot animation, renders the full result text + icon when `result` is set and `isSpinning` is false. Used because some result strings (e.g., "Star Wars: Rise of the Resistance") don't fit on a coin or die face — the face shows the icon, the label confirms the text.

---

## Hooks

- **`usePacks`** — manifest fetch + per-pack fetch with module-level cache. `useManifest` returns the index, `usePack(id)` returns one pack. `registerPack(pack)` injects a pack into the cache (used for custom lists and utility synthetic packs).
- **`useRandomizer(pack, activeFilters)`** — pool, current result, `isSpinning`, spin / markSpinComplete / reshuffle, plus warning state for exhaustion.
- **`useMultiRandomizer(initialCount)`** — per-slot version. Each slot has its own pack, filters, animation override, draw state, result, and spin ID. `spin()` computes all results synchronously, then staggers each slot's stop time.
- **`useFilters(pack)`** — manages a `FilterValues` object for one pack. Per-dimension: setFilter, toggleValue, selectAll, clearAll. Cached per-pack across the session.
- **`usePreferences`** — `soundEnabled`, `animationSpeed`, `reducedMotion`. Synced across tabs via `storage` event. `durationFor(mode)` returns the speed-adjusted animation duration.
- **`useSound`** — procedural Web Audio tones. `playSpin()` (sawtooth blip), `playLand()` (major-third chord), `playTick()` (square click). All gated on `prefs.soundEnabled`. AudioContext is created lazily on first user gesture.

---

## Tech stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS 4** via `@tailwindcss/vite` (no postcss config; theme tokens in `src/index.css` under `@theme`)
- **react-router-dom 7** for client-side routing
- **vitest** for unit tests
- **gh-pages** for deploys (writes the build to the `gh-pages` branch)

Shipped JS is ~308 KB / 92 KB gzipped. CSS is ~46 KB / 8 KB gzipped.

## Project layout

```
src/
  App.tsx                              # routes
  main.tsx                             # entrypoint + StrictMode
  index.css                            # tailwind theme + global animations
  components/
    animations/
      AnimationStage.tsx               # mode → component switch
      AnimationPicker.tsx              # mode toggle pills
      SlotMachine.tsx
      CoinAnimation.tsx
      DiceAnimation.tsx
      CardAnimation.tsx
      RPSAnimation.tsx
      ParticleBurst.tsx
      ResultLabel.tsx
    browser/
      CustomPackBuilder.tsx            # the New List page
    layout/
      Shell.tsx                        # header + sidebar + main outlet
      UtilityStrip.tsx                 # desktop sidebar utility nav + mobile bottom bar
      Home.tsx                         # browse / search lists
      About.tsx                        # explanatory page
      Settings.tsx
    randomizer/
      Randomizer.tsx                   # /pack/:id
      MultiSlot.tsx                    # /multi (Custom Roll)
      FilterPanel.tsx                  # collapsible filters on a single pack
    utilities/
      SlotPicker.tsx                   # /utility/slot
      CoinFlip.tsx                     # /utility/coin
      DiceRoll.tsx                     # /utility/dice
      RPS.tsx                          # /utility/rps
      CardDraw.tsx                     # /utility/card
  hooks/
    usePacks.ts
    useRandomizer.ts
    useMultiRandomizer.ts
    useFilters.ts
    usePreferences.ts
    useSound.ts
  utils/
    randomize.ts                       # filterItems, drawWith*, shuffle, etc.
    randomize.test.ts
    storage.ts                         # localStorage wrapper with "tyche:" prefix
    faceText.ts                        # smart font sizing for small faces
    inferAnimation.ts                  # 2 → coin, 4/6/8/10/12/20 → dice, ≤52 → card, else slot
    utilityPacks.ts                    # synthetic Coin/Dice/Cards/RPS packs for Custom Roll
  types/
    pack.ts                            # Pack, PackItem, FilterSchema, AnimationMode, sampling
    config.ts                          # MultiSlotConfig, UserPreferences, ExportBundle
public/
  CNAME                                # tyche.awrylabs.com
  favicon.svg
  data/
    manifest.json
    packs/*.json
```

## Local development

```sh
npm install
npm run dev          # vite dev on port 5173 (or $PORT if set)
npm run build        # tsc -b && vite build
npm test             # vitest run
npm run lint         # eslint
npm run deploy       # build + cp 404.html + gh-pages -d dist
```

`vite.config.ts` honors the `PORT` env variable when set, useful when something else holds 5173.

### Deploying

```sh
npm run deploy
```

This script builds, copies `dist/index.html` to `dist/404.html` (so SPA routes survive a hard refresh on GitHub Pages), and pushes `dist/` to the `gh-pages` branch. GitHub Pages serves it on `tyche.awrylabs.com` (CNAME set via the file in `public/`). Fastly caches at the edge for 600s, so a deploy takes up to ~10 minutes to fully propagate.

---

## Adding a list

1. Create `public/data/packs/<id>.json` matching the `Pack` schema.
2. Add an entry to `public/data/manifest.json` with `id`, `path`, and a `meta` block matching the pack's metadata.
3. (Optional) For lists likely to be picked with coin/dice/card/RPS animations, add `icon` to every item. Add `shortLabel` only when the `value` is genuinely too long (>10 chars) to fit a face.
4. (Optional) Define `filters` if items have categorical attributes the user might want to narrow on.

The list shows up immediately after a refresh — no rebuild needed in dev, just a manifest re-fetch.

## Adding an animation

1. Create `src/components/animations/MyAnimation.tsx` matching the `AnimationProps` interface.
2. Extend the `AnimationMode` union in `src/types/pack.ts`.
3. Add the `mode` case in `AnimationStage.tsx`.
4. Add an emoji + label to `AnimationPicker`'s `MODES` array and to `MultiSlot`'s `ANIMATION_OPTIONS`.
5. Add a base duration in `usePreferences`'s `BASE_DURATIONS` map.
6. (Optional) If it has an item-count fit (like coin = 2, dice = 6), add it to `inferDefaultAnimation`.
7. (Optional) Wire `useSound.playSpin()` / `playLand()` if the animation owns its own spin trigger.

---

## Privacy & data

- No accounts, no logins, no telemetry, no analytics calls.
- All user state lives in `localStorage` under the `tyche:` prefix:
  - `tyche:preferences` — sound, speed, reduced motion
  - `tyche:custom-packs` — user-built lists
  - `tyche:multi-configs` — saved Custom Roll configurations
- Settings → Export All Data writes a JSON bundle of the above; Import Backup reads it back.
- The site is static — `index.html`, JS, CSS, and JSON pack files served from GitHub Pages via Fastly. No origin runtime.
