// chess-tutor daily-tutor agent: observation store + deterministic learning
// plans. No chat, no LLM, no network: the agent watches what the user DOES
// (puzzle attempts, lesson exercises, games vs the engine, classic games
// studied) and turns it into today's plan. ESM — shared by tests and the
// browser app.
//
// Event shapes (all carry a local YYYY-MM-DD `date`):
//   {kind:'puzzle', date, set:'curated'|'real', id, motif, solved, hint, attempts}
//     one event per puzzle engagement that ends in a solve, or in Next with
//     at least one wrong attempt (skips with zero attempts leave no event)
//   {kind:'exercise', date, lessonId, solved:true}
//   {kind:'game', date, result:'win'|'loss'|'draw', plies, userMoves, blunders}
//   {kind:'study', date, game}  (a classic game stepped through to the end)
//
// Mastery: per motif, over the last 10 puzzle events; a clean solve counts
// 1, a hinted solve 0.5, a failure 0. Focus is the weakest motif with >=3
// attempts. Due reviews are puzzles whose latest outcome is a failure, a
// hinted solve, or a clean solve older than 14 days.

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayOfYear(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = Date.UTC(y, 0, 1);
  const day = Date.UTC(y, m - 1, d);
  return Math.floor((day - start) / 86400000) + 1;
}

// Parse a YYYY-MM-DD string as a LOCAL date. `new Date(str)` parses it as
// UTC midnight, which shifts the day in western timezones and breaks
// streak/cutoff math — the bug this helper exists to prevent.
export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function createStore(storage) {
  const KEY = 'chess-tutor-progress';
  return {
    load() {
      try {
        const raw = storage.getItem(KEY);
        const evs = raw ? JSON.parse(raw) : [];
        return Array.isArray(evs) ? evs : [];
      } catch { return []; }
    },
    record(ev) {
      const evs = this.load();
      evs.push(ev);
      // cap: keep the most recent 2000 events
      const kept = evs.slice(-2000);
      try { storage.setItem(KEY, JSON.stringify(kept)); } catch {}
      return kept;
    },
  };
}

// ---- mastery ----

export function motifMastery(events) {
  const byMotif = {};
  for (const ev of events) {
    if (ev.kind !== 'puzzle') continue;
    (byMotif[ev.motif] ||= []).push(ev);
  }
  const out = {};
  for (const [motif, evs] of Object.entries(byMotif)) {
    const recent = evs.slice(-10);
    let score = 0;
    for (const ev of recent) score += ev.solved ? (ev.hint ? 0.5 : 1) : 0;
    const solved = evs.filter((e) => e.solved && !e.hint).length;
    out[motif] = {
      attempts: evs.length,
      cleanSolves: solved,
      mastery: recent.length ? score / recent.length : 0,
      lastDate: evs[evs.length - 1].date,
    };
  }
  return out;
}

export function focusMotif(mastery) {
  let best = null;
  for (const [motif, st] of Object.entries(mastery)) {
    if (st.attempts < 3) continue;
    if (!best
      || st.mastery < best.mastery
      || (st.mastery === best.mastery && st.attempts > best.attempts)
      || (st.mastery === best.mastery && st.attempts === best.attempts && motif < best.motif)) {
      best = { motif, ...st };
    }
  }
  return best;
}

// ---- due reviews ----

function latestOutcomeByPuzzle(events) {
  const map = new Map(); // `${set}:${id}` -> {ev, idx}
  events.forEach((ev, idx) => {
    if (ev.kind !== 'puzzle') return;
    map.set(`${ev.set}:${ev.id}`, { ev, idx });
  });
  return map;
}

export function dueReviews(events, catalog, today) {
  const latest = latestOutcomeByPuzzle(events);
  const due = [];
  const cutoff = parseDate(today);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = todayStr(cutoff);
  for (const p of catalog) {
    const hit = latest.get(`${p.set}:${p.id}`);
    if (!hit) continue; // unseen puzzles are not reviews
    const ev = hit.ev;
    if (!ev.solved || ev.hint) due.push({ puzzle: p, reason: ev.solved ? 'hinted' : 'failed', date: ev.date });
    else if (ev.date <= cutoffStr) due.push({ puzzle: p, reason: 'stale', date: ev.date });
  }
  due.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.puzzle.id - b.puzzle.id));
  return due;
}

// ---- progress summary ----

export function progressSummary(events, today) {
  const puzzles = events.filter((e) => e.kind === 'puzzle');
  const solved = puzzles.filter((e) => e.solved);
  const games = events.filter((e) => e.kind === 'game');
  const studied = new Set(events.filter((e) => e.kind === 'study').map((e) => e.game)).size;
  // day streak: consecutive days with any puzzle/game/exercise activity,
  // counting back from today (or yesterday if today is still empty)
  const activeDays = new Set(events.filter((e) => e.kind !== 'study').map((e) => e.date));
  let streak = 0;
  const cursor = parseDate(today);
  if (!activeDays.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(todayStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    puzzlesAttempted: puzzles.length,
    puzzlesSolved: solved.length,
    games: {
      win: games.filter((g) => g.result === 'win').length,
      loss: games.filter((g) => g.result === 'loss').length,
      draw: games.filter((g) => g.result === 'draw').length,
    },
    blunders: games.reduce((a, g) => a + (g.blunders || 0), 0),
    studied,
    dayStreak: streak,
  };
}

// ---- daily plan ----

export function planForDay(events, catalogs, date) {
  const mastery = motifMastery(events);
  const focus = focusMotif(mastery);
  const catalog = [
    ...catalogs.curated.map((p) => ({ ...p, set: 'curated' })),
    ...catalogs.real.map((p) => ({ ...p, set: 'real' })),
  ];
  const picked = [];
  const pick = (p) => {
    if (!p || picked.some((x) => x.set === p.set && x.id === p.id)) return;
    picked.push(p);
  };

  // 1. due reviews from the focus motif first, then any motif
  const due = dueReviews(events, catalog, date);
  for (const d of due) {
    if (picked.length >= 3) break;
    if (!focus || d.puzzle.motif === focus.motif) pick(d.puzzle);
  }
  if (picked.length < 3) {
    for (const d of due) {
      if (picked.length >= 3) break;
      pick(d.puzzle);
    }
  }
  // 2. fill focus slots with unseen focus-motif puzzles, lowest id first
  if (focus) {
    const seen = new Set(events.filter((e) => e.kind === 'puzzle').map((e) => `${e.set}:${e.id}`));
    for (const p of catalog) {
      if (picked.length >= 3) break;
      if (p.motif === focus.motif && !seen.has(`${p.set}:${p.id}`)) pick(p);
    }
  }
  // 3. mixed slots: weakest motifs first, then unseen, lowest id first
  const motifOrder = Object.entries(mastery)
    .sort((a, b) => a[1].mastery - b[1].mastery || a[0].localeCompare(b[0]))
    .map(([m]) => m);
  const seen = new Set(events.filter((e) => e.kind === 'puzzle').map((e) => `${e.set}:${e.id}`));
  for (const motif of motifOrder) {
    if (picked.length >= 5) break;
    for (const p of catalog) {
      if (picked.length >= 5) break;
      if (p.motif === motif && !seen.has(`${p.set}:${p.id}`)) pick(p);
    }
  }
  // 4. cold start / still short: first puzzles in catalog order
  for (const p of catalog) {
    if (picked.length >= 5) break;
    pick(p);
  }

  // study item: alternate by day parity; lessons rotate, classics avoid repeats
  const doy = dayOfYear(date);
  let study;
  if (doy % 2 === 0 && catalogs.lessons.length) {
    study = { type: 'lesson', index: doy % catalogs.lessons.length, lesson: catalogs.lessons[doy % catalogs.lessons.length] };
  } else if (catalogs.classics.length) {
    const studied = new Set(events.filter((e) => e.kind === 'study').map((e) => e.game));
    let idx = doy % catalogs.classics.length;
    for (let i = 0; i < catalogs.classics.length; i++) {
      const cand = (doy + i) % catalogs.classics.length;
      if (!studied.has(cand)) { idx = cand; break; }
    }
    study = { type: 'classic', index: idx, game: catalogs.classics[idx] };
  } else if (catalogs.lessons.length) {
    study = { type: 'lesson', index: doy % catalogs.lessons.length, lesson: catalogs.lessons[doy % catalogs.lessons.length] };
  }

  // why line: honest, numbers-first, never a verdict
  let why;
  if (!focus) {
    why = 'No pattern yet — today mixes the catalog so the plan can learn your game.';
  } else {
    const st = mastery[focus.motif];
    why = `${focus.motif}: ${st.cleanSolves} clean solves in ${st.attempts} tries — today's focus, with reviews first.`;
  }
  const recentGames = events.filter((e) => e.kind === 'game').slice(-3);
  if (recentGames.length >= 2) {
    const bl = recentGames.reduce((a, g) => a + (g.blunders || 0), 0);
    if (bl >= 4) why += ` Your last ${recentGames.length} games leaked ${bl} tactics — these puzzles target that.`;
  }

  return {
    date,
    focus: focus ? focus.motif : null,
    focusStats: focus,
    puzzles: picked.map((p) => ({
      set: p.set,
      id: p.id,
      title: p.title,
      motif: p.motif,
      index: (p.set === 'real' ? catalogs.real : catalogs.curated).findIndex((x) => x.id === p.id),
    })),
    study,
    why,
    mastery,
  };
}

export function puzzleDoneToday(events, date, ref) {
  return events.some((e) => e.kind === 'puzzle' && e.date === date
    && e.set === ref.set && e.id === ref.id && e.solved);
}
