import { isIsolationComplete, summarizeCompletion } from './reviewCompleteness';

const answered = (over = {}) => ({
  riskLevel: 'Medium',
  mocRequired: 'No',
  actionRequired: 'Monitor',
  corrosionRisk: 'No',
  deadLegsRisk: 'No',
  automationLossRisk: 'No',
  ...over
});

describe('isIsolationComplete', () => {
  it('accepts a fully answered response', () => {
    expect(isIsolationComplete(answered())).toBe(true);
  });

  it('rejects a missing response', () => {
    expect(isIsolationComplete(undefined)).toBe(false);
    expect(isIsolationComplete(null)).toBe(false);
  });

  // 'N/A' is the default every field starts on, so it must not count as an answer.
  it.each([
    'riskLevel', 'mocRequired', 'actionRequired',
    'corrosionRisk', 'deadLegsRisk', 'automationLossRisk'
  ])('rejects when %s is left at N/A', (field) => {
    expect(isIsolationComplete(answered({ [field]: 'N/A' }))).toBe(false);
  });

  it('requires an MOC number once MOC is required', () => {
    expect(isIsolationComplete(answered({ mocRequired: 'Yes' }))).toBe(false);
    expect(isIsolationComplete(answered({ mocRequired: 'Yes', mocNumber: 'MOC-1' }))).toBe(true);
  });
});

describe('summarizeCompletion', () => {
  const isolations = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

  it('counts only the fully answered ones', () => {
    const r = summarizeCompletion(isolations, { a: answered(), b: answered() });
    expect(r).toEqual({ total: 4, complete: 2, incomplete: 2, percent: 50 });
  });

  // The defect this replaced: the summary reported 95% with nothing filled in.
  it('reports zero when nothing has been reviewed', () => {
    expect(summarizeCompletion(isolations, {}).percent).toBe(0);
    expect(summarizeCompletion(isolations, {}).complete).toBe(0);
  });

  it('does not count a partially answered isolation', () => {
    const r = summarizeCompletion(isolations, { a: answered({ deadLegsRisk: 'N/A' }) });
    expect(r.complete).toBe(0);
    expect(r.incomplete).toBe(4);
  });

  it('reaches 100 only when every isolation is done', () => {
    const all = Object.fromEntries(isolations.map(i => [i.id, answered()]));
    expect(summarizeCompletion(isolations, all).percent).toBe(100);
  });

  it('treats an empty meeting as nothing outstanding, not 0%', () => {
    expect(summarizeCompletion([], {})).toEqual({ total: 0, complete: 0, incomplete: 0, percent: 100 });
  });

  it('survives missing or malformed arguments', () => {
    expect(() => summarizeCompletion(null, null)).not.toThrow();
    expect(summarizeCompletion(null, null).total).toBe(0);
    expect(summarizeCompletion(isolations, 'nonsense').complete).toBe(0);
  });

  it('ignores responses for isolations not in the meeting', () => {
    const r = summarizeCompletion(isolations, { a: answered(), zzz: answered() });
    expect(r.complete).toBe(1);
  });
});
