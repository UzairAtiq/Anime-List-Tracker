# Anime List Tracker 📺

Live: [animelist.uzairatiq.app](https://animelist.uzairatiq.app)

A retro terminal-styled web application to track your watched anime series, episode progress, and completion states.

Built with React 19, Tailwind CSS, Framer Motion, Pixel RetroUI, and an infallible 3-tier database architecture.

---

## 🏗️ 3-Tier Database Architecture

The application implements a cascading fallback storage strategy that guarantees zero data loss:

1. **Tier 1: Supabase (Cloud PostgreSQL)**
   - Connects to remote Supabase database with automatic 3s timeout protection.
2. **Tier 2: SQLite WebAssembly (Local Relational Database)**
   - Runs genuine SQLite in-browser via `sql.js` WebAssembly.
   - Automatically activates when cloud connection fails or is offline.
   - Persists binary database state to browser **IndexedDB** with **localStorage** base64 backup.
3. **Tier 3: Local JSON Store (Infallible Fallback)**
   - Operates on serialized JSON records stored in `localStorage` or in-memory.
   - Supports 1-click JSON file export (`anime_list.json`).

For full details on file responsibilities, dependency direction, and system flows, see the [Architecture Overview Document](docs/overview.md).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/UzairAtiq/Anime-List-Tracker.git
cd Anime-List-Tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 📖 Architecture & Documentation

- **[docs/overview.md](docs/overview.md)**: Full architecture breakdown, folder tree, function inventory, and dependency rules.
- **[supabase-setup.sql](supabase-setup.sql)**: SQL schema and Row-Level Security policies for Supabase deployment.
- **[.env.example](.env.example)**: Environment variables template for connecting your own Supabase project.
