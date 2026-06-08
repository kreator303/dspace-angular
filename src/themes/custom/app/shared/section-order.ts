/**
 * SINGLE SOURCE OF TRUTH for top-level section ordering + display-name cleaning.
 *
 * Both the home page (bhbta-sections-list) and the browse page (our community-
 * list override) import from here, so the manual order lives in exactly ONE
 * place — edit SECTION_ORDER to reorder sections everywhere at once.
 *
 * Why name-keyed (not handle/UUID): UUIDs differ per environment (dev/stage/
 * prod), handle suffixes depend on provisioning order, but the cleaned section
 * NAME is content — identical across environments and human-legible to reorder.
 *
 * The numeric "N. " prefix in the DSpace titles is NO LONGER the ordering
 * mechanism — this list is. cleanSectionName() strips that prefix for display;
 * it's a no-op once the prefixes are removed from the data, so this module is
 * forward-compatible with a future data rename.
 */

/** Desired top-to-bottom order, by cleaned (number-stripped) section name. */
export const SECTION_ORDER: string[] = [
  'Baba Hari Dass - Our Inspirational Guru',
  'Academic Programs and Class Recordings',
  'Public Class Recordings',
  'Retreat Presentations',
  'About the Satsang- Our Community of Truth Seekers',
  'Articles to Help You Use This Library Successfully',
];

/** Strip a leading "N. " ordering prefix from a section title for display. */
export function cleanSectionName(name: string): string {
  return name.replace(/^\s*\d+\.\s*/, '').trim();
}

/** Sort key: position in SECTION_ORDER; unlisted sections sort to the end. */
export function sectionOrderIndex(name: string): number {
  const i = SECTION_ORDER.indexOf(cleanSectionName(name));
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

/** Comparator for two objects carrying a `name`: manual order, then alpha. */
export function compareSections(
  a: { name: string },
  b: { name: string },
): number {
  const d = sectionOrderIndex(a.name) - sectionOrderIndex(b.name);
  return d !== 0 ? d : cleanSectionName(a.name).localeCompare(cleanSectionName(b.name));
}

/**
 * SINGLE SOURCE for reading a community/collection item count from the native
 * DSpace `archivedItemsCount` field. DSpace uses **-1 as the "count unavailable
 * / not yet computed" sentinel** (not null), and the stock list-element
 * templates hide the badge on it (`@if (archivedItemsCount >= 0)`). Mirror that:
 * return `null` for any negative or absent value so every caller/template hides
 * the count rather than rendering a literal "-1". `?? 0` is WRONG here — it only
 * coalesces null/undefined and lets the -1 sentinel through (s121 bug-class fix:
 * MC-1 — a fallback that diverges from the framework's display contract). Any
 * surface showing a count must read it through this guard.
 */
export function itemCount(dso: { archivedItemsCount?: number } | null | undefined): number | null {
  const n = dso?.archivedItemsCount;
  return typeof n === 'number' && n >= 0 ? n : null;
}
