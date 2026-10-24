// Daily-tutor plan engine: deterministic, numbers-first, no chat.
import { describe, test, expect } from 'bun:test';
import {
  createStore, motifMastery, focusMotif, dueReviews,
  progressSummary, planForDay, puzzleDoneToday, todayStr,
} from '../src/progress.js';

const CAT = {
  curated: [
    { id: 1, motif: 'Fork', title: 'A' },
    { id: 2, motif: 'Fork', title: 'B' },
    { id: 3, motif: 'Pin', title: 'C' },
    { id: 4, motif: 'Pin', title: 'D' },
    { id: 5, motif: 'Mate', title: 'E' },
    { id: 6, motif: 'Mate', title: 'F' },
    { id: 7, motif: 'Fork', title: 'G' },
  ],
  real: [],
  lessons: [{ id: 'iqp', title: 'IQP' }, { id: 'outposts', title: 'Outposts' }],
  classics: [{ white: 'A', black: 'B' }, { white: 'C', black: 'D' }],
};

const P = (over) => ({ kind: 'puzzle', date: '2026-10-24', set: 'curated', hint: false, attempts: 1, solved: true, ...over });

describe('store', () => {
  test('round-trips events through an injected storage', () => {
    const mem = {};
    const store = createStore({ getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } });
    expect(store.load()).toEqual([]);
    store.record(P({ id: 1 }));
    expect(store.load()).toHaveLength(1);
  });
});

describe('mastery', () => {
  test('clean solve 1, hinted solve 0.5, failure 0; last 10 only', () => {
    const evs = [
      P({ id: 1, motif: 'Fork', solved: true }),
      P({ id: 2, motif: 'Fork', solved: true, hint: true }),
      P({ id: 1, motif: 'Fork', solved: false }),
    ];
    const m = motifMastery(evs);
    expect(m.Fork.attempts).toBe(3);
    expect(m.Fork.cleanSolves).toBe(1);
    expect(m.Fork.mastery).toBeCloseTo((1 + 0.5 + 0) / 3);
  });

  test('focus is the weakest motif with >=3 attempts', () => {
    const evs = [
      P({ id: 1, motif: 'Fork', solved: true }),
      P({ id: 2, motif: 'Fork', solved: true }),
      P({ id: 1, motif: 'Fork', solved: true }),
      P({ id: 3, motif: 'Pin', solved: false }),
      P({ id: 4, motif: 'Pin', solved: false }),
      P({ id: 3, motif: 'Pin', solved: true }),
    ];
    expect(focusMotif(motifMastery(evs)).motif).toBe('Pin');
    expect(focusMotif(motifMastery([P({ id: 1, motif: 'Fork' })]))).toBeNull();
  });
});

describe('due reviews', () => {
  test('failed, hinted, and stale-clean puzzles come back, oldest first', () => {
    const evs = [
      P({ id: 1, motif: 'Fork', solved: false, date: '2026-10-20' }),
      P({ id: 3, motif: 'Pin', solved: true, hint: true, date: '2026-10-23' }),
      P({ id: 5, motif: 'Mate', solved: true, date: '2026-10-01' }), // stale (>14d)
      P({ id: 6, motif: 'Mate', solved: true, date: '2026-10-23' }), // fresh: not due
    ];
    const due = dueReviews(evs, CAT.curated.map((p) => ({ ...p, set: 'curated' })), '2026-10-24');
    expect(due.map((d) => d.puzzle.id)).toEqual([5, 1, 3]);
  });
});

describe('plan', () => {
  test('cold start mixes the catalog and explains why', () => {
    const plan = planForDay([], CAT, '2026-10-24');
    expect(plan.puzzles).toHaveLength(5);
    expect(plan.focus).toBeNull();
    expect(plan.study).toBeDefined();
  });

  test('same day + same events = same plan; new data changes it', () => {
    const evs = [
      P({ id: 3, motif: 'Pin', solved: false }),
      P({ id: 4, motif: 'Pin', solved: false }),
      P({ id: 3, motif: 'Pin', solved: true }),
      P({ id: 1, motif: 'Fork', solved: true }),
      P({ id: 2, motif: 'Fork', solved: true }),
      P({ id: 7, motif: 'Fork', solved: true }),
    ];
    const a = planForDay(evs, CAT, '2026-10-24');
    const b = planForDay(evs, CAT, '2026-10-24');
    expect(a).toEqual(b);
    expect(a.focus).toBe('Pin');
    // the failed pin puzzle is a due review and leads the plan
    expect(a.puzzles[0].id).toBe(4);
    const improved = planForDay([...evs, P({ id: 4, motif: 'Pin', solved: true, date: '2026-10-24' })], CAT, '2026-10-24');
    expect(improved.puzzles[0].id).not.toBe(4);
  });

  test('study alternates by day parity and avoids repeats', () => {
    // 2026-10-24 is day 297 (odd) -> classic; 2026-10-25 is day 298 (even) -> lesson
    const odd = planForDay([], CAT, '2026-10-24');
    expect(odd.study.type).toBe('classic');
    const even = planForDay([], CAT, '2026-10-25');
    expect(even.study.type).toBe('lesson');
    const studied = planForDay([{ kind: 'study', date: '2026-10-24', game: 1 }], CAT, '2026-10-24');
    expect(studied.study.type).toBe('classic');
    expect(studied.study.index).toBe(0);
  });

  test('puzzleDoneToday marks solved plan items', () => {
    const evs = [P({ id: 1, motif: 'Fork', date: '2026-10-24' })];
    expect(puzzleDoneToday(evs, '2026-10-24', { set: 'curated', id: 1 })).toBe(true);
    expect(puzzleDoneToday(evs, '2026-10-23', { set: 'curated', id: 1 })).toBe(false);
  });
});

describe('summary', () => {
  test('day streak counts back through active days only', () => {
    const evs = [
      P({ date: '2026-10-24' }),
      P({ date: '2026-10-23' }),
      P({ date: '2026-10-21' }), // gap breaks the streak
    ];
    expect(progressSummary(evs, '2026-10-24').dayStreak).toBe(2);
    expect(progressSummary(evs, '2026-10-25').dayStreak).toBe(2); // today empty: counts from yesterday
    const s = progressSummary([...evs, { kind: 'game', date: '2026-10-24', result: 'loss', blunders: 3 }], '2026-10-24');
    expect(s.games.loss).toBe(1);
    expect(s.blunders).toBe(3);
  });
});

describe('todayStr', () => {
  test('formats local dates', () => {
    expect(todayStr(new Date(2026, 9, 24))).toBe('2026-10-24');
  });
});
