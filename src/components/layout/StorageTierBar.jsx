/** @fileoverview Renders the active database tier status indicator and export JSON trigger button. */

/**
 * Storage tier status bar displaying live health and active status of Supabase, SQLite, and JSON tiers.
 *
 * Steps:
 * 1. Extract activeTier and tierStatuses from storageState.
 * 2. Render status pill for Tier 1 (Supabase) indicating active or failed state.
 * 3. Render status pill for Tier 2 (SQLite WASM) indicating active or standby state.
 * 4. Render status pill for Tier 3 (JSON) indicating active or backup state.
 * 5. Render "Export JSON" button triggering onExportJSON callback.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.storageState - StorageManager state snapshot.
 * @param {Object} props.theme - Active UI theme object.
 * @param {Function} props.onExportJSON - Callback to export database records as a JSON file.
 * @returns {JSX.Element} Storage tier status bar.
 */
export default function StorageTierBar({ storageState, theme, onExportJSON }) {
  const { activeTier, tierStatuses } = storageState || {
    activeTier: 'sqlite',
    tierStatuses: { supabase: {}, sqlite: {}, json: {} },
  };

  return (
    <div
      className="pt-2 pb-1 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
      style={{ color: theme.textColor }}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-black uppercase tracking-wider text-[11px] opacity-75">DB Tier:</span>

        {/* Tier 1: Supabase */}
        <span
          className="px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase transition-all"
          style={{
            borderColor: theme.borderColor,
            backgroundColor: activeTier === 'supabase' ? theme.textColor : 'transparent',
            color: activeTier === 'supabase' ? theme.bg : theme.textColor,
            opacity: tierStatuses.supabase?.status === 'failed' ? 0.45 : 1,
            textDecoration: tierStatuses.supabase?.status === 'failed' ? 'line-through' : 'none',
          }}
          title={tierStatuses.supabase?.error || 'Tier 1: Supabase Cloud Database'}
        >
          1. Supabase {activeTier === 'supabase' ? '● ACTIVE' : (tierStatuses.supabase?.status === 'failed' ? '✗' : '')}
        </span>

        <span className="opacity-50">➔</span>

        {/* Tier 2: SQLite */}
        <span
          className="px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase transition-all"
          style={{
            borderColor: theme.borderColor,
            backgroundColor: activeTier === 'sqlite' ? theme.textColor : 'transparent',
            color: activeTier === 'sqlite' ? theme.bg : theme.textColor,
            opacity: tierStatuses.sqlite?.status === 'failed' ? 0.45 : 1,
            textDecoration: tierStatuses.sqlite?.status === 'failed' ? 'line-through' : 'none',
          }}
          title="Tier 2: SQLite WebAssembly (In-browser Relational DB with IndexedDB persistence)"
        >
          2. SQLite (WASM) {activeTier === 'sqlite' ? '● ACTIVE' : ''}
        </span>

        <span className="opacity-50">➔</span>

        {/* Tier 3: JSON */}
        <span
          className="px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase transition-all"
          style={{
            borderColor: theme.borderColor,
            backgroundColor: activeTier === 'json' ? theme.textColor : 'transparent',
            color: activeTier === 'json' ? theme.bg : theme.textColor,
          }}
          title="Tier 3: Local JSON File / Store"
        >
          3. JSON {activeTier === 'json' ? '● ACTIVE' : 'STANDBY'}
        </span>
      </div>

      <button
        type="button"
        onClick={onExportJSON}
        className="px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase hover:opacity-80 transition-opacity flex items-center gap-1"
        style={{
          borderColor: theme.borderColor,
          color: theme.textColor,
        }}
        title="Export database as JSON file"
      >
        <span>💾</span> Export JSON
      </button>
    </div>
  );
}
