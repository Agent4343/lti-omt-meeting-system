/**
 * Named localStorage keys and safe accessors.
 *
 * Two problems this addresses.
 *
 * First, every key was a bare string literal repeated across components. Two
 * pairs of similarly-named keys hold genuinely different things, and nothing
 * in the code said so:
 *
 *   LTI_MASTER_LIST vs MASTER_ISOLATIONS
 *   SAVED_PEOPLE    vs MEETING_PEOPLE
 *
 * Second, `JSON.parse(localStorage.getItem(k))` was called directly in
 * components, mostly unguarded. One malformed or truncated value throws during
 * render, and because the error boundary sits outside the router, a single bad
 * record used to take out every page until a manual reload.
 */

export const KEYS = {
  /** Meetings saved but not yet finalized. */
  SAVED_MEETINGS: 'savedMeetings',
  /** Finalized meetings - the archive shown on Past Meetings. */
  PAST_MEETINGS: 'pastMeetings',

  /**
   * The curated LTI master list, maintained on the LTI Master List page.
   * NOT the same as MASTER_ISOLATIONS below.
   */
  LTI_MASTER_LIST: 'ltiMasterList',
  /**
   * The isolation list uploaded for the *previous* meeting. Meeting setup
   * diffs a new upload against this to work out what was added and removed.
   * Only the setup page writes it.
   */
  MASTER_ISOLATIONS: 'masterIsolations',

  /** The meeting currently being run: date and attendees. */
  CURRENT_MEETING_INFO: 'currentMeetingInfo',
  /** Isolations uploaded for the current meeting. */
  CURRENT_MEETING_ISOLATIONS: 'currentMeetingIsolations',
  /** Questionnaire answers for the current meeting, keyed by isolation id. */
  CURRENT_MEETING_RESPONSES: 'currentMeetingResponses',
  /** Where the reviewer had got to, so a reload resumes in place. */
  CURRENT_MEETING_POSITION: 'currentMeetingPosition',

  /** Answers carried over from the last meeting, used to pre-fill. */
  PREVIOUS_MEETING_RESPONSES: 'previousMeetingResponses',

  /** The attendee roster. */
  SAVED_PEOPLE: 'savedPeople',
  /** Legacy roster key, migrated into SAVED_PEOPLE by AppContext on load. */
  MEETING_PEOPLE: 'meetingPeople',

  /** Diff output from the most recent isolation-list upload. */
  ADDED_ISOLATIONS: 'addedIsolations',
  REMOVED_ISOLATIONS: 'removedIsolations'
};

/**
 * Storage-full detection. The name and code vary by browser, and Firefox
 * reports 1014 under its own name.
 */
export const isQuotaError = (error) => {
  if (!error) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
};

/**
 * Read and parse a stored value.
 *
 * Never throws: a missing, malformed or truncated value yields the fallback,
 * because the callers are components rendering a page.
 *
 * @param {string} key one of KEYS
 * @param {*} fallback returned when the value is absent or unreadable
 */
export const readJSON = (key, fallback = null) => {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    // Storage can be unavailable entirely: private mode, blocked cookies.
    console.warn(`Could not access localStorage for "${key}":`, error.message);
    return fallback;
  }

  if (raw === null || raw === undefined || raw === '') return fallback;

  try {
    const parsed = JSON.parse(raw);
    // `null` is a legitimate stored value but almost never a useful one here.
    return parsed === null ? fallback : parsed;
  } catch (error) {
    console.warn(`Discarding unreadable value for "${key}":`, error.message);
    return fallback;
  }
};

/**
 * Serialize and store a value.
 *
 * @returns {{success: boolean, quotaExceeded?: boolean, error?: string}}
 *   Reported rather than thrown, so callers can tell the user their work was
 *   not saved instead of assuming it was.
 */
export const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { success: true };
  } catch (error) {
    const quotaExceeded = isQuotaError(error);
    console.error(`Could not write "${key}":`, error);
    return {
      success: false,
      quotaExceeded,
      error: quotaExceeded
        ? 'Browser storage is full. Export or delete older meetings to free ' +
          'space, then try again. Nothing was saved.'
        : error.message
    };
  }
};

/** Remove a key. Never throws. */
export const removeKey = (key) => {
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.warn(`Could not remove "${key}":`, error.message);
    return { success: false, error: error.message };
  }
};

/** Is localStorage usable at all? Private mode and blocked cookies say no. */
export const isStorageAvailable = () => {
  try {
    const probe = '__storage_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};
