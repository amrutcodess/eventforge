/**
 * Conflict-free agenda selection — weighted interval scheduling, solved exactly.
 *
 * Why this is not an LLM's job: the one thing an agenda must guarantee is that nothing
 * overlaps, and a language model cannot guarantee a constraint. It also cannot be trusted to
 * return session ids that exist, and a hallucinated id would be a data-integrity bug the
 * moment the agenda is saved to `Registration.attendeeSelections`.
 *
 * So the shape is: **the algorithm decides the schedule, the model only writes the prose
 * around it.** `features/agenda.js` asks the LLM for the rationale sentence and nothing else.
 *
 * Why dynamic programming rather than greedy-by-finish-time: greedy maximises the *number*
 * of non-overlapping sessions, so it will happily prefer five 15-minute fillers over one
 * keynote plus two follow-ups. The DP maximises total relevance-weighted value subject to
 * non-overlap, which is what an attendee actually wants out of a schedule.
 *
 * The overlap predicate is the same `start < otherEnd && end > otherStart` test the room
 * conflict detector uses in `routes/sessions.js`, so "conflict" means one thing in this
 * codebase. The one deliberate difference: that detector keys on `roomName`, because a room
 * cannot host two talks. This ignores room entirely, because an attendee's constraint is
 * their own presence — two talks at once in different rooms is exactly the problem here.
 */

const speakerNames = (s) =>
  (s.speakerIds || [])
    .map((sp) => (typeof sp === 'object' && sp ? sp.name : null))
    .filter(Boolean);

const speakerTopics = (s) =>
  (s.speakerIds || [])
    .flatMap((sp) => (typeof sp === 'object' && sp?.topicTags ? sp.topicTags : []))
    .join(' ');

/** Share of the attendee's interests this session matches, in [0, 1]. */
export const interestScore = (session, interests = []) => {
  const terms = interests.map((i) => String(i).toLowerCase().trim()).filter((t) => t.length >= 2);
  if (!terms.length) return 0;

  const haystack = [
    session.title,
    session.track,
    session.summary,
    session.description,
    speakerNames(session).join(' '),
    speakerTopics(session)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const hits = terms.filter((t) => haystack.includes(t)).length;
  return hits / terms.length;
};

/**
 * @param {Array}  sessions   Lean sessions, speakers populated.
 * @param {Array}  interests  Free-text interests.
 * @param {object} [opts]
 * @param {number} [opts.minGapMinutes] Buffer to leave between back-to-back sessions.
 * @returns {{picked:Array, stats:object}}
 */
export function buildConflictFreeAgenda(sessions = [], interests = [], { minGapMinutes = 0 } = {}) {
  // Normalise, and drop malformed rows. A session with a missing or inverted time range
  // would otherwise corrupt the binary search below rather than merely being excluded.
  const items = sessions
    .filter((s) => s.startTime && s.endTime && new Date(s.endTime) > new Date(s.startTime))
    .map((s) => ({
      session: s,
      start: new Date(s.startTime).getTime(),
      end: new Date(s.endTime).getTime() + minGapMinutes * 60_000,
      // Base weight of 1 guarantees a sensible agenda even with no interests at all
      // (it degrades to "schedule as much as possible"), while the +2·score biases toward
      // relevant picks. Strictly positive, which the DP requires.
      weight: 1 + 2 * interestScore(s, interests)
    }))
    .sort((a, b) => a.end - b.end); // classic DP ordering: by finish time

  const n = items.length;
  if (n === 0) {
    return { picked: [], stats: { candidates: 0, selected: 0, skippedConflicts: 0, totalMinutes: 0 } };
  }

  const ends = items.map((i) => i.end);

  // p[i] = index of the latest item that finishes at or before items[i] starts.
  const p = items.map((item, i) => {
    let lo = 0;
    let hi = i - 1;
    let best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid] <= item.start) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return best;
  });

  // OPT[i] = best total weight achievable using items[0 .. i-1].
  const OPT = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    const take = items[i - 1].weight + OPT[p[i - 1] + 1];
    OPT[i] = Math.max(OPT[i - 1], take);
  }

  const picked = [];
  for (let i = n; i > 0; ) {
    const take = items[i - 1].weight + OPT[p[i - 1] + 1];
    if (take > OPT[i - 1]) {
      picked.push(items[i - 1].session);
      i = p[i - 1] + 1;
    } else {
      i -= 1;
    }
  }
  picked.reverse(); // chronological

  const totalMinutes = picked.reduce((sum, s) => {
    return sum + Math.round((new Date(s.endTime) - new Date(s.startTime)) / 60_000);
  }, 0);

  return {
    picked,
    stats: {
      candidates: n,
      selected: picked.length,
      skippedConflicts: n - picked.length,
      totalMinutes
    }
  };
}

/** Rooms whose capacity is small enough that a seat is worth showing up early for. */
export const seatsFillFast = (session, allSessions) => {
  const capacities = allSessions.map((s) => s.capacity).filter((c) => Number.isFinite(c));
  if (!capacities.length || !Number.isFinite(session.capacity)) return false;
  const sorted = [...capacities].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return session.capacity < median;
};
