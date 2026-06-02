import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
} from '@ngx-translate/core';

/**
 * Facet-label i18n keys: `search.filters.filter.<name>.<head|label|placeholder>`,
 * where <name> is the Discovery filter name (e.g. `technique`, `dateCreated`).
 * `<name>` is dot-free so range-filter sub-keys (`.min.label`, `.max.label`)
 * don't match — those get DSpace's own mapped text and aren't derived here.
 */
const FILTER_LABEL_KEY =
  /^search\.filters\.filter\.([^.]+)\.(head|label|placeholder)$/;

/**
 * Range-filter min/max keys: `search.filters.filter.<name>.<min|max>.<label|placeholder>`.
 * Name-independent — DSpace labels every range filter's bounds the same way —
 * so these map to fixed short text, NOT the humanized filter name. Short text
 * also prevents the long raw keys from overlapping in the two-column min/max
 * layout (a Safari-specific overflow).
 */
const FILTER_RANGE_KEY =
  /^search\.filters\.filter\.[^.]+\.(min|max)\.(label|placeholder)$/;
const RANGE_TEXT: Record<string, string> = {
  'min.label': 'Start', // mirrors DSpace's mapped range facets (e.g. dateIssued)
  'max.label': 'End',
  'min.placeholder': 'Minimum',
  'max.placeholder': 'Maximum',
};

/**
 * Derive a human-readable facet label from a Discovery filter name — no
 * hand-maintained i18n map. Split camelCase humps and `_`/`-` separators into
 * words, then Title-case each. e.g. `technique` -> "Technique",
 * `dateCreated` -> "Date Created".
 */
export function humanizeFilterName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Class to handle missing translations for the ngx-translate library
 */
export class MissingTranslationHelper implements MissingTranslationHandler {
  /**
   * Called when there is no translation for a specific key.
   * - An explicit `default` interpolation param wins (original DSpace behavior).
   * - A facet key with no i18n entry is derived from the filter name, so new
   *   Discovery facets read correctly without a per-facet i18n entry, matching
   *   DSpace's own convention for the mapped facets:
   *     .head        -> "Technique"        (also drives the collapse aria-label)
   *     .placeholder -> "Technique"        (the in-facet search box hint)
   *     .label       -> "Search Technique" (the search box's accessible label)
   * - Everything else falls back to the raw key, as before.
   * @param params
   */
  handle(params: MissingTranslationHandlerParams) {
    const provided =
      params.interpolateParams && (params.interpolateParams as any).default;
    if (provided) {
      return provided;
    }
    const range = FILTER_RANGE_KEY.exec(params.key);
    if (range) {
      return RANGE_TEXT[`${range[1]}.${range[2]}`];
    }
    const match = FILTER_LABEL_KEY.exec(params.key);
    if (match) {
      const label = humanizeFilterName(match[1]);
      return match[2] === 'label' ? `Search ${label}` : label;
    }
    return params.key;
  }
}
