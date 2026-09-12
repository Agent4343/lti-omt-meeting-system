/**
 * LTI master-list import.
 *
 * Pure functions, deliberately free of React and XLSX so they can be tested
 * directly and reused by any import surface.
 *
 * Background: the previous importer keyed strictly on a lowercase `id`
 * property. A spreadsheet whose column was `ID` produced zero matches, which
 * the diff then read as "every existing item was deleted" - and it applied
 * that silently. These helpers resolve the ID column across the spellings
 * exports actually use, and refuse a file that does not look like an LTI list
 * at all.
 */

// Ordered by preference. The first header present in the row wins.
const ID_HEADERS = [
  'id',
  'ID',
  'Id',
  'LTI ID',
  'LTI Id',
  'LTI Number',
  'Isolation ID',
  'Isolation Id',
  'Isolation Number',
  'Certificate',
  'Isolation Certificate',
  'Tag',
  'Tag Number'
];

// Headers that suggest this really is an isolation/LTI export rather than an
// unrelated spreadsheet that happens to have an ID column.
const CORROBORATING_HEADERS = [
  'planned start date',
  'plannedstartdate',
  'start date',
  'risk level',
  'risklevel',
  'risk',
  'moc required',
  'mocrequired',
  'system/equipment',
  'systemequipment',
  'equipment',
  'system',
  'isolation',
  'description',
  'title'
];

// Columns that carry the human-readable summary of the isolation, in
// preference order. Resolved loosely, so 'DESCRIPTION' and 'Work  Description'
// both match.
const DESCRIPTION_HEADERS = [
  'description',
  'isolation description',
  'work description',
  'lti description',
  'title',
  'work title',
  'details'
];

/** Normalize a header for loose comparison. */
const norm = (h) => String(h).replace(/[\s_\r\n]+/g, ' ').trim().toLowerCase();

/**
 * First key of `obj` matching one of `candidates` (compared loosely) whose
 * value is non-empty. Returns the real key so the caller reads the original.
 */
const findKey = (obj, candidates) => {
  const keys = Object.keys(obj || {});
  for (const candidate of candidates) {
    const target = norm(candidate);
    for (const key of keys) {
      if (norm(key) === target && String(obj[key] ?? '').trim() !== '') return key;
    }
  }
  return null;
};

/**
 * Find which column holds the LTI identifier.
 * @param {Object[]} rows - rows as produced by XLSX.utils.sheet_to_json
 * @returns {string|null} the header name, or null if none matched
 */
export const resolveIdHeader = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  // Union the keys: exporters sometimes omit empty cells from the first row.
  const keys = new Set();
  rows.slice(0, 25).forEach(r => Object.keys(r || {}).forEach(k => keys.add(k)));

  // Exact match first, then a normalized match so 'LTI  Number' still resolves.
  for (const candidate of ID_HEADERS) {
    if (keys.has(candidate)) return candidate;
  }
  for (const candidate of ID_HEADERS) {
    const target = norm(candidate);
    for (const key of keys) {
      if (norm(key) === target) return key;
    }
  }
  return null;
};

/**
 * Decide whether a parsed sheet plausibly contains LTI data.
 * @returns {{ ok: boolean, reason?: string, idHeader?: string, headers: string[] }}
 */
export const inspectSheet = (rows) => {
  const headers = rows && rows.length ? Object.keys(rows[0]) : [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, reason: 'The sheet has no data rows.', headers };
  }

  const idHeader = resolveIdHeader(rows);
  if (!idHeader) {
    return {
      ok: false,
      reason:
        'No LTI identifier column found. Expected one of: ' +
        ID_HEADERS.slice(0, 6).join(', ') + '.',
      headers
    };
  }

  const normalized = headers.map(norm);
  const corroborating = CORROBORATING_HEADERS.filter(h =>
    normalized.some(k => k === h || k.includes(h))
  );

  if (corroborating.length === 0) {
    return {
      ok: false,
      idHeader,
      headers,
      reason:
        `Found an identifier column ("${idHeader}") but nothing else that looks ` +
        'like isolation data - no description, risk, equipment or date column. ' +
        'This may not be an LTI export.'
    };
  }

  return { ok: true, idHeader, headers };
};

// Date columns exporters commonly use. Excel hands these over as serial
// numbers, so they have to be converted or every downstream age calculation
// sees a five-digit number instead of a date.
const DATE_FIELDS = [
  'Planned Start Date',
  'plannedStartDate',
  'PlannedStartDate',
  'planned_start_date',
  'Start Date',
  'startDate',
  'Date Created',
  'dateCreated',
  'Planned End Date',
  'plannedEndDate'
];

/**
 * Convert an Excel cell to an ISO date string (YYYY-MM-DD).
 *
 * Excel counts days from 1900-01-01 and wrongly treats 1900 as a leap year,
 * which the -2 offset absorbs. The arithmetic is done in UTC deliberately:
 * building the epoch in local time and then calling toISOString() shifts the
 * result back a day for anyone east of UTC.
 *
 * Values that are not recognisably dates are returned untouched.
 */
export const convertExcelDate = (value) => {
  // Serial range covers roughly 1968-2036; outside it, a bare number is far
  // more likely to be an ordinary figure than a date.
  if (typeof value === 'number' && value > 25000 && value < 50000) {
    const ms = Date.UTC(1900, 0, 1) + (value - 2) * 86400000;
    return new Date(ms).toISOString().split('T')[0];
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(
      Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
    ).toISOString().split('T')[0];
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.split('T')[0];
  }

  return value;
};

/** Convert every known date column on a row, in place on a copy. */
export const normalizeDates = (item) => {
  const out = { ...item };
  DATE_FIELDS.forEach(field => {
    if (out[field] !== undefined) {
      out[field] = convertExcelDate(out[field]);
    }
  });
  return out;
};

/**
 * Add the fields the app reads, derived from whatever the spreadsheet called
 * them. Mutates and returns `item`.
 *
 * Applied to BOTH sides of an import comparison. A record stored by an earlier
 * version carries only the source column ('Description'), so comparing it
 * against a freshly normalized record would otherwise show a difference on
 * every row - the same false-change trap the 'ID' vs 'id' duplication caused.
 */
export const applyDerivedFields = (item) => {
  if (item['System/Equipment'] && !item.systemEquipment) {
    item.systemEquipment = item['System/Equipment'];
  }
  if (item.systemEquipment === undefined) {
    item.systemEquipment = '';
  }

  // The review card and the meeting summary read `description`. Without this
  // the reviewer sees nothing but an opaque isolation ID, and the summary
  // printed "No description" against every row.
  if (!item.description) {
    const source = findKey(item, DESCRIPTION_HEADERS);
    if (source) item.description = String(item[source]).trim();
  }
  if (item.description === undefined) {
    item.description = '';
  }

  return item;
};

/**
 * Normalize one uploaded row into the shape the app stores.
 * Existing values are preserved; only the derived fields are added.
 */
export const normalizeRow = (row, idHeader) => {
  const item = normalizeDates(row);
  const id = row[idHeader];

  item.id = id === undefined || id === null ? '' : String(id).trim();

  // Drop the source column once copied, otherwise the record carries the same
  // value under two keys ('ID' and 'id') and every row looks changed on the
  // next import.
  if (idHeader !== 'id') {
    delete item[idHeader];
  }

  applyDerivedFields(item);

  item.lastUpdated = new Date().toISOString().split('T')[0];
  return item;
};

/**
 * Field-wise comparison tolerant of spreadsheet noise.
 *
 * A plain JSON comparison is too strict here: key order varies, a cell can
 * arrive as 4 or "4", and a column absent from one side is equivalent to an
 * empty one. `lastUpdated` is stamped on every import so it never counts.
 */
export const sameContent = (a, b) => {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  keys.delete('lastUpdated');

  for (const key of keys) {
    const left = a?.[key];
    const right = b?.[key];
    const l = left === undefined || left === null ? '' : String(left).trim();
    const r = right === undefined || right === null ? '' : String(right).trim();
    if (l !== r) return false;
  }
  return true;
};

/**
 * Validate and normalize a parsed sheet, without diffing it against anything.
 *
 * Used by the meeting setup page, which compares the upload against the
 * previous meeting's list rather than the master list.
 *
 * @returns {{ ok: boolean, reason?: string, idHeader?: string, items?: Object[], skippedRows?: number }}
 */
export const parseSheet = (rows) => {
  const inspection = inspectSheet(rows);
  if (!inspection.ok) {
    return { ok: false, reason: inspection.reason, headers: inspection.headers };
  }

  const normalized = rows.map(r => normalizeRow(r, inspection.idHeader));
  const items = normalized.filter(i => i.id);

  if (items.length === 0) {
    return {
      ok: false,
      reason: `Column "${inspection.idHeader}" was found but every row is missing a value for it.`,
      headers: inspection.headers
    };
  }

  return {
    ok: true,
    idHeader: inspection.idHeader,
    headers: inspection.headers,
    items,
    skippedRows: normalized.length - items.length
  };
};

/**
 * Compare an uploaded list against the current master list.
 *
 * @param {Object[]} rows - parsed sheet rows
 * @param {Object[]} currentItems - the existing master list
 * @returns {Object} diff plus the normalized rows ready to store
 */
export const buildImportPlan = (rows, currentItems = []) => {
  const inspection = inspectSheet(rows);
  if (!inspection.ok) {
    return { ok: false, reason: inspection.reason, headers: inspection.headers };
  }

  const { idHeader } = inspection;
  const normalized = rows.map(r => normalizeRow(r, idHeader));

  const withoutId = normalized.filter(i => !i.id);
  const items = normalized.filter(i => i.id);

  if (items.length === 0) {
    return {
      ok: false,
      reason: `Column "${idHeader}" was found but every row is missing a value for it.`,
      headers: inspection.headers
    };
  }

  const currentById = new Map((currentItems || []).filter(i => i && i.id).map(i => [String(i.id), i]));
  const uploadedById = new Map(items.map(i => [String(i.id), i]));

  const added = items.filter(i => !currentById.has(String(i.id)));
  const removed = (currentItems || []).filter(i => i && i.id && !uploadedById.has(String(i.id)));
  const updated = items.filter(i => {
    const existing = currentById.get(String(i.id));
    if (!existing) return false;
    // Derive on the stored copy too, so an older record is compared on the
    // same terms rather than looking changed just because it predates a
    // derived field.
    return !sameContent(i, applyDerivedFields({ ...existing }));
  });

  const unchanged = items.length - added.length - updated.length;

  return {
    ok: true,
    idHeader,
    headers: inspection.headers,
    items,
    skippedRows: withoutId.length,
    added,
    removed,
    updated,
    unchanged,
    // A file that drops most of the list is usually the wrong file or the
    // wrong column, not a real mass closure. Surfaced for confirmation.
    removesMostOfList:
      currentById.size > 0 && removed.length / currentById.size >= 0.5
  };
};

export const __TESTING__ = { ID_HEADERS, CORROBORATING_HEADERS, DATE_FIELDS, norm };
