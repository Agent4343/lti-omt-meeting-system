import { KEYS, readJSON, writeJSON, removeKey, isQuotaError, isStorageAvailable } from './appStorage';

describe('KEYS', () => {
  it('keeps the two master lists distinct', () => {
    // These hold different things and conflating them would make meeting setup
    // diff against the wrong list.
    expect(KEYS.LTI_MASTER_LIST).not.toBe(KEYS.MASTER_ISOLATIONS);
    expect(KEYS.LTI_MASTER_LIST).toBe('ltiMasterList');
    expect(KEYS.MASTER_ISOLATIONS).toBe('masterIsolations');
  });

  it('keeps the two people lists distinct', () => {
    expect(KEYS.SAVED_PEOPLE).not.toBe(KEYS.MEETING_PEOPLE);
  });

  it('has no duplicate values', () => {
    const values = Object.values(KEYS);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('readJSON', () => {
  beforeEach(() => localStorage.clear());

  it('parses a stored value', () => {
    localStorage.setItem(KEYS.PAST_MEETINGS, JSON.stringify([{ id: 'a' }]));
    expect(readJSON(KEYS.PAST_MEETINGS, [])).toEqual([{ id: 'a' }]);
  });

  it('returns the fallback when the key is absent', () => {
    expect(readJSON(KEYS.PAST_MEETINGS, [])).toEqual([]);
    expect(readJSON(KEYS.CURRENT_MEETING_INFO, null)).toBeNull();
  });

  // This is the crash shape that used to take out the whole app: a component
  // called JSON.parse directly during render.
  it('returns the fallback for malformed JSON instead of throwing', () => {
    localStorage.setItem(KEYS.PAST_MEETINGS, '{"id": "a", trunca');
    expect(() => readJSON(KEYS.PAST_MEETINGS, [])).not.toThrow();
    expect(readJSON(KEYS.PAST_MEETINGS, [])).toEqual([]);
  });

  it('returns the fallback for an empty string', () => {
    localStorage.setItem(KEYS.PAST_MEETINGS, '');
    expect(readJSON(KEYS.PAST_MEETINGS, [])).toEqual([]);
  });

  it('returns the fallback for a stored null', () => {
    localStorage.setItem(KEYS.CURRENT_MEETING_INFO, 'null');
    expect(readJSON(KEYS.CURRENT_MEETING_INFO, 'fallback')).toBe('fallback');
  });

  it('preserves falsy values that are not null', () => {
    localStorage.setItem(KEYS.PAST_MEETINGS, JSON.stringify(0));
    expect(readJSON(KEYS.PAST_MEETINGS, 'fallback')).toBe(0);
    localStorage.setItem(KEYS.PAST_MEETINGS, JSON.stringify(false));
    expect(readJSON(KEYS.PAST_MEETINGS, 'fallback')).toBe(false);
  });

  it('survives localStorage being unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new Error('SecurityError: storage is disabled'); }
    });
    try {
      expect(readJSON(KEYS.PAST_MEETINGS, [])).toEqual([]);
    } finally {
      Object.defineProperty(window, 'localStorage', original);
    }
  });
});

describe('writeJSON', () => {
  beforeEach(() => localStorage.clear());

  it('stores a value and reports success', () => {
    expect(writeJSON(KEYS.PAST_MEETINGS, [{ id: 'a' }])).toEqual({ success: true });
    expect(readJSON(KEYS.PAST_MEETINGS, [])).toEqual([{ id: 'a' }]);
  });

  it('reports failure rather than throwing when the store is full', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const e = new Error('exceeded the quota');
      e.name = 'QuotaExceededError';
      e.code = 22;
      throw e;
    });
    try {
      const r = writeJSON(KEYS.PAST_MEETINGS, [{ id: 'a' }]);
      expect(r.success).toBe(false);
      expect(r.quotaExceeded).toBe(true);
      expect(r.error).toMatch(/storage is full/i);
      expect(r.error).toMatch(/nothing was saved/i);
    } finally {
      spy.mockRestore();
    }
  });

  it('reports a non-quota failure without claiming the store is full', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('something else went wrong');
    });
    try {
      const r = writeJSON(KEYS.PAST_MEETINGS, [{ id: 'a' }]);
      expect(r.success).toBe(false);
      expect(r.quotaExceeded).toBe(false);
      expect(r.error).toBe('something else went wrong');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('isQuotaError', () => {
  const quota = (props) => Object.assign(new Error('x'), props);

  it('recognises the storage-full signal across browsers', () => {
    expect(isQuotaError(quota({ name: 'QuotaExceededError' }))).toBe(true);
    expect(isQuotaError(quota({ name: 'NS_ERROR_DOM_QUOTA_REACHED' }))).toBe(true);
    expect(isQuotaError(quota({ code: 22 }))).toBe(true);
    expect(isQuotaError(quota({ code: 1014 }))).toBe(true);
  });

  it('does not mistake other errors for a full store', () => {
    expect(isQuotaError(new Error('network'))).toBe(false);
    expect(isQuotaError(null)).toBe(false);
    expect(isQuotaError(undefined)).toBe(false);
  });
});

describe('removeKey and isStorageAvailable', () => {
  it('removes a key', () => {
    localStorage.setItem(KEYS.PAST_MEETINGS, '[]');
    expect(removeKey(KEYS.PAST_MEETINGS)).toEqual({ success: true });
    expect(localStorage.getItem(KEYS.PAST_MEETINGS)).toBeNull();
  });

  it('reports storage as available in a normal browser', () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it('leaves no probe key behind', () => {
    localStorage.clear();
    isStorageAvailable();
    expect(localStorage.length).toBe(0);
  });
});
