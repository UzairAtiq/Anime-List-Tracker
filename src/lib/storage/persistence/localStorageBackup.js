/** @fileoverview Handles fallback binary base64 persistence for SQLite in window.localStorage. */

const LOCAL_STORAGE_KEY = 'anime_tracker_sqlite_b64';

/**
 * Loads and decodes base64-encoded SQLite database bytes from localStorage.
 *
 * Steps:
 * 1. Read base64 string from localStorage.
 * 2. If present, decode base64 using atob into a binary string.
 * 3. Convert characters into a typed Uint8Array buffer.
 * 4. Return the buffer, or null on error or absence.
 *
 * @returns {Uint8Array|null} Decoded database binary bytes or null.
 * @throws {never} Returns null on error.
 */
export function loadLocalStorageBytes() {
  try {
    const b64 = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!b64) return null;

    const binStr = atob(b64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('[LocalStorageBackup] Failed to load bytes:', err);
    return null;
  }
}

/**
 * Encodes and saves a binary SQLite database buffer into localStorage as a base64 string.
 *
 * Steps:
 * 1. Convert Uint8Array bytes into a binary character string.
 * 2. Encode binary string to base64 using btoa.
 * 3. Save encoded string under 'anime_tracker_sqlite_b64'.
 * 4. Return true on success or false on failure.
 *
 * @param {Uint8Array} bytes - Binary SQLite database bytes to encode and save.
 * @returns {boolean} True if successfully stored.
 * @throws {never} Returns false on error.
 */
export function persistLocalStorageBytes(bytes) {
  try {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, btoa(binary));
    return true;
  } catch (err) {
    console.warn('[LocalStorageBackup] Failed to persist bytes:', err);
    return false;
  }
}
