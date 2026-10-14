/** @fileoverview Provides utility functions for exporting application data to the user's filesystem. */

/**
 * Serializes an anime array into formatted JSON and initiates a browser file download.
 *
 * Steps:
 * 1. Serialize the animes array to pretty-printed JSON.
 * 2. Encode the JSON content into a UTF-8 data URI string.
 * 3. Create a temporary HTML anchor element in the DOM.
 * 4. Set download filename and href attributes on the anchor.
 * 5. Programmatically trigger a click event to launch the browser download dialog.
 * 6. Remove the temporary anchor element from the DOM.
 *
 * @param {Array<Object>} animes - List of anime records to export.
 * @param {string} [filename='anime_list.json'] - Suggested target filename for the downloaded file.
 * @returns {boolean} True if download was initiated successfully.
 * @throws {Error} If DOM document or serialization fails.
 */
export function exportAnimeListToJSON(animes, filename = 'anime_list.json') {
  if (typeof document === 'undefined') {
    throw new Error('exportAnimeListToJSON requires a browser DOM environment');
  }

  const jsonString = JSON.stringify(animes || [], null, 2);
  const dataUri = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataUri);
  downloadAnchor.setAttribute('download', filename);

  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  return true;
}
