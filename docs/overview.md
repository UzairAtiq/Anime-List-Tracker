# Architecture Overview: Anime List Tracker

This document describes the architectural layout, component responsibilities, dependency direction rules, and operational workflows for the Anime List Tracker application.

---

## 1. Directory Tree & File Responsibilities

```
src/
├── assets/
│   └── react.svg                                 # React framework branding icon
├── config/
│   └── themes.config.js                          # Pure retro color palette dictionary
├── constants/
│   └── emojis.js                                 # Curated emoji collection and random badge generator
├── context/
│   └── ThemeContext.jsx                          # Theme state management and CSS custom variable injection
├── hooks/
│   ├── useAnimeFilter.js                         # Search query state and case-insensitive anime filtering
│   ├── useAnimeSync.js                           # State bridge between UI and StorageManager engine
│   ├── useDeleteConfirm.js                       # 2-step deletion confirmation state with 3s auto-reset
│   └── useNotification.js                        # Toast notification queue with auto-dismiss timers
├── lib/
│   ├── exportUtils.js                            # Client-side JSON file serialization and download trigger
│   ├── supabaseClient.js                         # Supabase SDK client instance and env resolution
│   ├── utils.js                                  # Class name merger combining clsx and tailwind-merge
│   ├── validators.js                             # Form input validation and data sanitization
│   └── storage/
│       ├── adapters/
│       │   ├── jsonAdapter.js                    # Tier 3: Local JSON storage adapter (localStorage/memory)
│       │   ├── sqliteAdapter.js                  # Tier 2: In-browser SQLite WebAssembly adapter (sql.js)
│       │   └── supabaseAdapter.js                # Tier 1: Cloud Supabase PostgreSQL adapter with timeout
│       ├── persistence/
│       │   ├── indexedDbStorage.js               # Low-level IndexedDB Uint8Array binary database storage
│       │   └── localStorageBackup.js             # Low-level localStorage base64 binary database backup
│       └── storageManager.js                     # Multi-tier orchestrator and fallback cascade coordinator
├── components/
│   ├── anime/
│   │   ├── AnimeCard.jsx                         # Single anime card layout container
│   │   ├── AnimeCardActions.jsx                  # Card action controls (complete, edit, delete confirm)
│   │   ├── AnimeCardProgress.jsx                 # Retro bracket progress bar UI
│   │   ├── AnimeEmptyState.jsx                   # Placeholder view displayed when anime collection is empty
│   │   ├── AnimeFormFields.jsx                   # Form inputs, custom checkbox, error alerts, action buttons
│   │   ├── AnimeFormModal.jsx                    # Modal popup wrapper and trigger button for add/edit
│   │   ├── AnimeList.jsx                         # Anime list container with search bar and animations
│   │   ├── AnimeNoMatchState.jsx                 # Placeholder view displayed when search query has 0 matches
│   │   └── AnimeSearchBar.jsx                    # Search input bar and results count indicator
│   ├── feedback/
│   │   ├── LoadingScreen.jsx                     # Fullscreen retro animated loading overlay
│   │   ├── NotificationToast.jsx                 # Animated top toast notification overlay
│   │   └── SyncIndicator.jsx                     # Floating bottom-right syncing indicator badge
│   ├── layout/
│   │   ├── Footer.jsx                            # Terminal bottom footer with tech stack labels
│   │   ├── Header.jsx                            # Terminal header with title, theme picker, and tier bar
│   │   └── StorageTierBar.jsx                    # Live database tier status bar and JSON export button
│   └── theme/
│       └── ThemeSwitcher.jsx                     # Theme picker button group
├── App.jsx                                       # Root page composition (zero business logic)
├── index.css                                     # Global styling, fonts, and CSS custom property defaults
└── main.jsx                                      # Application entry point mounting React root
```

---

## 2. Component & Function Inventory

| Function / Component | File | Single Purpose |
|---|---|---|
| `themes` | `src/config/themes.config.js` | Palette definitions for the retro terminal |
| `emojiList`, `getRandomEmoji` | `src/constants/emojis.js` | Curated emoji set and random badge picker |
| `ThemeProvider`, `useTheme`, `getTheme`, `getDefaultTheme` | `src/context/ThemeContext.jsx` | Theme state, CSS variable injection, and storage sync |
| `useAnimeFilter` | `src/hooks/useAnimeFilter.js` | Search input state and anime list filtering |
| `useAnimeSync` | `src/hooks/useAnimeSync.js` | React hook bridging UI to StorageManager operations |
| `useDeleteConfirm` | `src/hooks/useDeleteConfirm.js` | Two-step delete confirmation state with timer |
| `useNotification` | `src/hooks/useNotification.js` | Toast notification queue with auto-dismiss |
| `exportAnimeListToJSON` | `src/lib/exportUtils.js` | Formats and triggers browser download of JSON file |
| `supabase`, `supabaseUrl`, `supabaseAnonKey` | `src/lib/supabaseClient.js` | Configures and instantiates Supabase client |
| `cn` | `src/lib/utils.js` | Merges class names and resolves Tailwind conflicts |
| `validateAnimeForm`, `sanitizeAnimeInput` | `src/lib/validators.js` | Pure validation and sanitization of form submissions |
| `openIndexedDB`, `loadIndexedDbBytes`, `persistIndexedDbBytes` | `src/lib/storage/persistence/indexedDbStorage.js` | Low-level IndexedDB binary byte persistence |
| `loadLocalStorageBytes`, `persistLocalStorageBytes` | `src/lib/storage/persistence/localStorageBackup.js` | Low-level localStorage base64 binary persistence |
| `supabaseAdapter` | `src/lib/storage/adapters/supabaseAdapter.js` | Tier 1: Supabase remote PostgreSQL database queries |
| `sqliteAdapter` | `src/lib/storage/adapters/sqliteAdapter.js` | Tier 2: In-browser SQLite WASM queries and schema |
| `jsonAdapter` | `src/lib/storage/adapters/jsonAdapter.js` | Tier 3: Local JSON storage in localStorage/memory |
| `storageManager` | `src/lib/storage/storageManager.js` | Multi-tier orchestrator and fallback cascade |
| `NotificationToast` | `src/components/feedback/NotificationToast.jsx` | Animated notification banner display |
| `LoadingScreen` | `src/components/feedback/LoadingScreen.jsx` | Fullscreen retro loading overlay |
| `SyncIndicator` | `src/components/feedback/SyncIndicator.jsx` | Floating syncing status badge |
| `Header` | `src/components/layout/Header.jsx` | Terminal header with title and theme switcher |
| `StorageTierBar` | `src/components/layout/StorageTierBar.jsx` | Storage tier status indicator and export trigger |
| `Footer` | `src/components/layout/Footer.jsx` | Terminal footer with tech stack description |
| `ThemeSwitcher` | `src/components/theme/ThemeSwitcher.jsx` | Theme selection button group |
| `AnimeCard` | `src/components/anime/AnimeCard.jsx` | Individual anime card layout presentation |
| `AnimeCardProgress` | `src/components/anime/AnimeCardProgress.jsx` | Retro bracket progress bar display |
| `AnimeCardActions` | `src/components/anime/AnimeCardActions.jsx` | Card action buttons (complete, edit, delete) |
| `AnimeList` | `src/components/anime/AnimeList.jsx` | List view container orchestrating search and cards |
| `AnimeSearchBar` | `src/components/anime/AnimeSearchBar.jsx` | Search input bar and result counter |
| `AnimeEmptyState` | `src/components/anime/AnimeEmptyState.jsx` | Empty collection placeholder display |
| `AnimeNoMatchState` | `src/components/anime/AnimeNoMatchState.jsx` | Zero search match placeholder display |
| `AnimeFormModal` | `src/components/anime/AnimeFormModal.jsx` | Modal dialog wrapper and add trigger button |
| `AnimeFormFields` | `src/components/anime/AnimeFormFields.jsx` | Form inputs, errors, and submit button |
| `App` | `src/App.jsx` | Top-level terminal composition |
| `main` | `src/main.jsx` | DOM root mount |

---

## 3. Dependency Rules

Strict acyclic layered architecture is enforced:

```
Layer 5 (Entry):
  main.jsx ➔ App.jsx

Layer 4 (Views & Layout):
  App.jsx ➔ components/layout/*, components/feedback/*, components/anime/*, components/theme/*
  components/anime/AnimeFormModal.jsx ➔ components/anime/AnimeFormFields.jsx
  components/anime/AnimeList.jsx ➔ AnimeCard.jsx, AnimeSearchBar.jsx, AnimeEmptyState.jsx, AnimeNoMatchState.jsx
  components/anime/AnimeCard.jsx ➔ AnimeCardProgress.jsx, AnimeCardActions.jsx

Layer 3 (Custom Hooks & State Bridge):
  components/ ➔ hooks/ (useNotification, useAnimeSync, useAnimeFilter, useDeleteConfirm)
  components/ ➔ context/ (useTheme)
  hooks/useAnimeSync.js ➔ lib/storage/storageManager.js

Layer 2 (Services & Adapters):
  lib/storage/storageManager.js ➔ lib/storage/adapters/*
  lib/storage/adapters/sqliteAdapter.js ➔ lib/storage/persistence/*
  lib/storage/adapters/supabaseAdapter.js ➔ lib/supabaseClient.js
  lib/validators.js (pure functions)
  lib/exportUtils.js (pure browser download helper)

Layer 1 (Config, Constants & Utilities):
  config/themes.config.js
  constants/emojis.js
  lib/utils.js
```

### Prohibited Directions:
1. **Lower layers never import higher layers** (e.g. `storageManager` never imports React hooks or components).
2. **Components never import storage adapters directly** (all database access routes strictly through `useAnimeSync` / `storageManager`).
3. **Persistence helpers never import adapters or components**.

---

## 4. Main Process Flows

### Flow A: Adding an Anime
1. User clicks "➕ Add Anime" in `AnimeFormModal`.
2. User submits `AnimeFormFields`.
3. `AnimeFormModal` validates input via `validateAnimeForm`.
4. `AnimeFormModal` sanitizes payload via `sanitizeAnimeInput` and calls `onAdd`.
5. `App.handleAddAnime` assigns a random emoji from `constants/emojis.js` and calls `useAnimeSync.addAnime`.
6. `useAnimeSync` invokes `storageManager.addAnime`.
7. `storageManager` attempts Tier 1 (Supabase); if unreachable, falls back to Tier 2 (SQLite WASM); if unavailable, falls back to Tier 3 (JSON).
8. `useAnimeSync` applies optimistic state update to React state.
9. `App` displays a success toast via `useNotification.showNotification`.

### Flow B: Database Fallback Cascade
1. `storageManager.getAnimes()` tests Tier 1 (Supabase) with a 3000ms timeout race.
2. If network fails or host is unreachable, Supabase status is marked failed.
3. Execution automatically cascades to Tier 2 (SQLite WASM via `sql.js`).
4. SQLite runs `SELECT * FROM animes` against IndexedDB binary state.
5. If SQLite succeeds, status becomes active and a background sync mirrors data to JSON fallback.
6. If SQLite ever fails, execution cascades to Tier 3 (`localStorage` JSON store).

### Flow C: Theme Switching
1. User clicks a theme button in `ThemeSwitcher`.
2. Component calls `changeTheme(themeKey)` from `ThemeContext`.
3. `ThemeContext` updates currentTheme state.
4. `useEffect` injects CSS custom properties (`--theme-bg`, `--theme-text`, `--theme-border`) to `document.documentElement.style`.
5. Active key is saved to `localStorage.setItem('retroTheme', key)`.

---

## 5. Rules for Adding New Code

1. **New UI Component:**
   - If it is layout-related, place in `src/components/layout/`.
   - If it is user feedback (dialog, spinner, toast), place in `src/components/feedback/`.
   - If it is domain-specific to anime, place in `src/components/anime/`.
2. **New Business / Validation Logic:**
   - Place pure functions in `src/lib/validators.js` or a new file in `src/lib/`.
3. **New State or Lifecycle Logic:**
   - Extract into a custom hook under `src/hooks/use<Feature>.js`.
4. **New Storage Backend:**
   - Implement the storage adapter interface in `src/lib/storage/adapters/<name>Adapter.js`.
   - Register the adapter in `src/lib/storage/storageManager.js`.
5. **Docstrings Requirement:**
   - Every file must have a 1-line `@fileoverview`.
   - Every function/class/component must have JSDoc with purpose, numbered steps, parameters, returns, and errors.
