import { SharePointDocumentStorage } from './sharepoint-document-storage';

/**
 * The merge decides what survives when the browser's copy and SharePoint's
 * copy of the meeting list differ. Getting it wrong loses meetings silently,
 * which is how the original defect went unnoticed: it keyed on
 * `date || timestamp`, so two meetings held on the same day collapsed into
 * one, and every meeting with neither field collapsed under the key
 * `undefined`.
 */
describe('_mergeMeetings', () => {
  let svc;

  beforeEach(() => {
    svc = new SharePointDocumentStorage();
  });

  const m = (id, extra = {}) => ({ id, date: '2026-03-04', ...extra });

  it('keeps both copies of a meeting only once', () => {
    const local = [m('a'), m('b')];
    const remote = [m('a'), m('c')];
    const merged = svc._mergeMeetings(local, remote);
    expect(merged.map(x => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('prefers the first list on a conflict', () => {
    const local = [{ id: 'a', note: 'local wins' }];
    const remote = [{ id: 'a', note: 'remote loses' }];
    expect(svc._mergeMeetings(local, remote)[0].note).toBe('local wins');
  });

  // The original bug: same date, different meetings.
  it('keeps two different meetings held on the same date', () => {
    const local = [
      { id: 'morning', date: '2026-03-04' },
      { id: 'afternoon', date: '2026-03-04' }
    ];
    const merged = svc._mergeMeetings(local, []);
    expect(merged).toHaveLength(2);
  });

  // The other half of the original bug.
  it('keeps every meeting that has no id, timestamp or date', () => {
    const keyless = [{ attendees: ['A'] }, { attendees: ['B'] }, { attendees: ['C'] }];
    const merged = svc._mergeMeetings(keyless, []);
    expect(merged).toHaveLength(3);
  });

  it('falls back to timestamp, then date, for records without an id', () => {
    const local = [
      { timestamp: '2026-03-04T09:00:00Z' },
      { timestamp: '2026-03-04T14:00:00Z' }
    ];
    expect(svc._mergeMeetings(local, [])).toHaveLength(2);

    const byDate = [{ date: '2026-01-01' }, { date: '2026-01-02' }];
    expect(svc._mergeMeetings(byDate, [])).toHaveLength(2);

    // Same timestamp really is the same meeting.
    const dupe = [{ timestamp: 'T' }, { timestamp: 'T' }];
    expect(svc._mergeMeetings(dupe, [])).toHaveLength(1);
  });

  it('handles empty and missing lists without throwing', () => {
    expect(svc._mergeMeetings([], [])).toEqual([]);
    expect(svc._mergeMeetings(null, null)).toEqual([]);
    expect(svc._mergeMeetings(undefined, [m('a')]).map(x => x.id)).toEqual(['a']);
  });

  it('does not mutate either input list', () => {
    const local = [m('a')];
    const remote = [m('b')];
    svc._mergeMeetings(local, remote);
    expect(local).toHaveLength(1);
    expect(remote).toHaveLength(1);
  });
});

/**
 * readCollection is what stands between an unreachable SharePoint and the
 * browser's copy of the data. The getters it replaced coerced "file absent"
 * and "request failed" into the same empty array, so a failed read overwrote
 * good local data with nothing.
 */
describe('readCollection', () => {
  let svc;

  beforeEach(() => {
    svc = new SharePointDocumentStorage();
  });

  it('reports a successful read of real data', async () => {
    svc.readFile = async () => [{ id: 'a' }];
    const r = await svc.readCollection('meetings.json');
    expect(r).toMatchObject({ ok: true, missing: false });
    expect(r.data).toEqual([{ id: 'a' }]);
  });

  it('distinguishes a file that does not exist yet', async () => {
    svc.readFile = async () => null;          // 404 from readFile
    const r = await svc.readCollection('meetings.json');
    expect(r.ok).toBe(true);
    expect(r.missing).toBe(true);
  });

  it('reports a failed read as not ok, so callers keep their local copy', async () => {
    svc.readFile = async () => { throw new Error('500 Internal Server Error'); };
    const r = await svc.readCollection('meetings.json');
    expect(r.ok).toBe(false);
    expect(r.missing).toBe(false);
  });

  it('does not confuse a genuinely empty collection with a failure', async () => {
    svc.readFile = async () => [];
    const r = await svc.readCollection('meetings.json');
    expect(r.ok).toBe(true);
    expect(r.missing).toBe(false);
    expect(r.data).toEqual([]);
  });

  it('uses the supplied empty value for object collections', async () => {
    svc.readFile = async () => null;
    const r = await svc.readCollection('current-responses.json', {});
    expect(r.data).toEqual({});
  });
});
