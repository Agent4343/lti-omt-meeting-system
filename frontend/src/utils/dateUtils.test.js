import { calculateLTIAge } from './dateUtils';

const DAY = 86400000;
/** A date exactly `days` before now. */
const daysAgo = (days) => new Date(Date.now() - days * DAY).toISOString();
/** A date `days` in the future. */
const daysAhead = (days) => new Date(Date.now() + days * DAY).toISOString();

describe('calculateLTIAge', () => {
  describe('the six-month threshold', () => {
    // This threshold decides which LTIs appear on the Operations Manager
    // review list, so it is the single most consequential number in the app.
    // 183 days is the canonical definition; the review page used to compute
    // its own using 30-day months, which put the two pages three days apart.
    it('is not six months at 182 days', () => {
      expect(calculateLTIAge(daysAgo(182)).isSixMonthsPlus).toBe(false);
    });

    it('is six months at 183 days', () => {
      expect(calculateLTIAge(daysAgo(183)).isSixMonthsPlus).toBe(true);
    });

    it('stays true well beyond the threshold', () => {
      expect(calculateLTIAge(daysAgo(400)).isSixMonthsPlus).toBe(true);
      expect(calculateLTIAge(daysAgo(1200)).isSixMonthsPlus).toBe(true);
    });

    it('does not fire in the 180-182 day window that used to disagree', () => {
      [180, 181, 182].forEach(d => {
        expect(calculateLTIAge(daysAgo(d)).isSixMonthsPlus).toBe(false);
      });
    });
  });

  describe('planned start dates in the future', () => {
    // An isolation can be planned before it starts. Taking the absolute
    // difference made a not-yet-started isolation look aged, so one planned
    // to begin in seven months was reported as seven months old and landed on
    // the review list.
    it('reports a future start as not started, not as aged', () => {
      const r = calculateLTIAge(daysAhead(200));
      expect(r.isSixMonthsPlus).toBe(false);
      expect(r.days).toBe(0);
      expect(r.category).toBe('notstarted');
    });

    it('never flags a future start for six-month review', () => {
      [1, 30, 200, 900].forEach(d => {
        expect(calculateLTIAge(daysAhead(d)).isSixMonthsPlus).toBe(false);
      });
    });

    it('treats today as zero days, not as an error', () => {
      const r = calculateLTIAge(new Date().toISOString());
      expect(r.isSixMonthsPlus).toBe(false);
      expect(r.days).toBeLessThanOrEqual(1);
    });
  });

  describe('age reported in days', () => {
    it('counts whole days elapsed', () => {
      expect(calculateLTIAge(daysAgo(10)).days).toBe(10);
      expect(calculateLTIAge(daysAgo(365)).days).toBe(365);
    });
  });

  describe('display text', () => {
    it('uses days under a month', () => {
      expect(calculateLTIAge(daysAgo(5)).display).toBe('5 days');
      expect(calculateLTIAge(daysAgo(1)).display).toBe('1 day');
    });

    it('uses months between one month and a year', () => {
      expect(calculateLTIAge(daysAgo(60)).display).toBe('2 months');
    });

    it('uses years beyond a year', () => {
      expect(calculateLTIAge(daysAgo(400)).display).toMatch(/^1 year/);
      expect(calculateLTIAge(daysAgo(800)).display).toMatch(/^2 years/);
    });
  });

  describe('bad input', () => {
    it('handles a missing date', () => {
      const r = calculateLTIAge(undefined);
      expect(r.display).toBe('Unknown');
      expect(r.isSixMonthsPlus).toBe(false);
    });

    it('handles an unparseable date', () => {
      const r = calculateLTIAge('not a date');
      expect(r.display).toBe('Invalid Date');
      expect(r.isSixMonthsPlus).toBe(false);
    });

    it('handles an Excel serial number that was never converted', () => {
      // If the importer misses a date column the raw serial reaches here.
      // It must not silently become a plausible-looking age.
      const r = calculateLTIAge(45000);
      expect(r.isSixMonthsPlus).toBe(false);
      expect(r.display).toBe('Invalid Date');
    });
  });
});
