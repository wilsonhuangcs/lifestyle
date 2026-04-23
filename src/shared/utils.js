/**
 * LifestyleAIO Shared Utilities
 *
 * Common helper functions used across multiple features.
 * Import from '../shared' or '../shared/utils'.
 */

/**
 * Format a number as USD currency.
 * @param {number} amount
 * @returns {string} e.g., "$1,234.56"
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert a date string (YYYY-MM-DD) to an ISO string for storage.
 * Uses local noon to avoid day-boundary shifts across timezones.
 * @param {string} dateStr — e.g. "2026-04-14"
 * @returns {string} ISO string
 */
export function formatDateForStorage(dateStr) {
  return new Date(dateStr + 'T12:00:00').toISOString();
}

/**
 * Format an ISO date string for display.
 * @param {string} isoString
 * @param {object} [options] - Intl.DateTimeFormat options
 * @returns {string} e.g., "Mar 15, 2026"
 */
export function formatDate(isoString, options = {}) {
  const defaults = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(isoString).toLocaleDateString('en-US', { ...defaults, ...options });
}

/**
 * Format an ISO date string as a short date (no year).
 * @param {string} isoString
 * @returns {string} e.g., "Mar 15"
 */
export function formatDateShort(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Generate a unique client-side ID.
 * @returns {string} ~16 char alphanumeric string
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate a percentage, clamped between 0 and 100.
 */
export function percentage(value, total) {
  if (total <= 0) return 0;
  return clamp((value / total) * 100, 0, 100);
}

/**
 * Map a Supabase row from snake_case to camelCase using a key map.
 * @param {object} row - DB row
 * @param {object} keyMap - { snake_case: 'camelCase' }
 * @returns {object}
 */
export function mapRow(row, keyMap) {
  const result = {};
  for (const [dbKey, jsKey] of Object.entries(keyMap)) {
    if (row[dbKey] !== undefined) {
      result[jsKey] = row[dbKey];
    }
  }
  return result;
}

/**
 * Build a Supabase update object from camelCase fields.
 * @param {object} fields - camelCase fields
 * @param {object} keyMap - { camelCase: 'snake_case' }
 * @returns {object} snake_case object for Supabase
 */
export function buildDbFields(fields, keyMap) {
  const dbFields = {};
  for (const [jsKey, dbKey] of Object.entries(keyMap)) {
    if (fields[jsKey] !== undefined) {
      dbFields[dbKey] = fields[jsKey];
    }
  }
  return dbFields;
}

/**
 * Get the previous month string.
 * @param {string} month - "YYYY-MM"
 * @returns {string}
 */
export function getPrevMonth(month) {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

/**
 * Get start/end ISO strings for a month range query.
 * @param {string} month - "YYYY-MM"
 * @returns {{ start: string, end: string }}
 */
export function getMonthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const start = `${month}-01T00:00:00.000Z`;
  const end = new Date(y, m, 1).toISOString();
  return { start, end };
}

// ── PR Detection ─────────────────────────────────────────────────────────────

/**
 * Calculates estimated 1RM using the Epley formula.
 * Returns null if reps is 0 or falsy.
 */
export function epley1RM(weight, reps) {
  if (!weight || !reps) return null;
  return weight * (1 + reps / 30);
}

/**
 * Detects PRs from a single workout against existing PR values.
 *
 * @param {object} workout - workout object with nested exercises and sets
 * @param {object} exerciseMap - Map<exerciseId, exercise>
 * @param {object} currentPRs - Map<`${exerciseId}:${prType}`, currentValue>
 * @returns {Array} newPRs - array of { exerciseId, prType, value, reps, weight, workoutId, achievedAt }
 */
export function detectPRs(workout, exerciseMap, currentPRs) {
  const newPRs = [];
  const workoutDate = workout.date;

  for (const we of workout.exercises) {
    const exerciseId = we.exerciseId;
    if (!exerciseMap.has(exerciseId)) continue;

    // Collect completed non-warmup sets
    const validSets = we.sets.filter(
      s => s.completed && s.weight && s.reps && s.setType !== 'warmup' && !s.isWarmup
    );
    if (validSets.length === 0) continue;

    // max_weight: heaviest single set weight
    const maxWeightSet = validSets.reduce((best, s) =>
      Number(s.weight) > Number(best.weight) ? s : best
    , validSets[0]);
    const maxWeight = Number(maxWeightSet.weight);
    const prKey_weight = `${exerciseId}:max_weight`;
    if (maxWeight > (currentPRs.get(prKey_weight) || 0)) {
      newPRs.push({ exerciseId, prType: 'max_weight', value: maxWeight, reps: maxWeightSet.reps, weight: maxWeight, workoutId: workout.id, achievedAt: workoutDate });
    }

    // max_reps: most reps in a single set (at any weight)
    const maxRepsSet = validSets.reduce((best, s) =>
      Number(s.reps) > Number(best.reps) ? s : best
    , validSets[0]);
    const maxReps = Number(maxRepsSet.reps);
    const prKey_reps = `${exerciseId}:max_reps`;
    if (maxReps > (currentPRs.get(prKey_reps) || 0)) {
      newPRs.push({ exerciseId, prType: 'max_reps', value: maxReps, reps: maxReps, weight: maxRepsSet.weight, workoutId: workout.id, achievedAt: workoutDate });
    }

    // max_estimated_1rm: best Epley 1RM across all valid sets
    let best1RM = 0;
    let best1RMSet = null;
    for (const s of validSets) {
      const e1rm = epley1RM(Number(s.weight), Number(s.reps));
      if (e1rm && e1rm > best1RM) { best1RM = e1rm; best1RMSet = s; }
    }
    const prKey_1rm = `${exerciseId}:max_estimated_1rm`;
    if (best1RMSet && best1RM > (currentPRs.get(prKey_1rm) || 0)) {
      newPRs.push({ exerciseId, prType: 'max_estimated_1rm', value: Math.round(best1RM * 100) / 100, reps: best1RMSet.reps, weight: best1RMSet.weight, workoutId: workout.id, achievedAt: workoutDate });
    }

    // max_volume: highest weight × reps in a single set
    const maxVolumeSet = validSets.reduce((best, s) => {
      const vol = Number(s.weight) * Number(s.reps);
      const bestVol = Number(best.weight) * Number(best.reps);
      return vol > bestVol ? s : best;
    }, validSets[0]);
    const maxVolume = Number(maxVolumeSet.weight) * Number(maxVolumeSet.reps);
    const prKey_vol = `${exerciseId}:max_volume`;
    if (maxVolume > (currentPRs.get(prKey_vol) || 0)) {
      newPRs.push({ exerciseId, prType: 'max_volume', value: maxVolume, reps: maxVolumeSet.reps, weight: maxVolumeSet.weight, workoutId: workout.id, achievedAt: workoutDate });
    }
  }

  return newPRs;
}

// ── Workout Streak & Summary ──────────────────────────────────────────────────

/**
 * Calculates current and longest workout streaks from an array of workouts.
 * A streak is consecutive calendar days with at least one workout.
 * The current streak is active only if the last workout was today or yesterday.
 *
 * @param {Array} workouts - array of workout objects with a `date` string field
 * @returns {{ current: number, longest: number }}
 */
export function calculateStreak(workouts) {
  if (!workouts || workouts.length === 0) return { current: 0, longest: 0 };

  // Deduplicate and sort unique training days ascending
  const days = [...new Set(workouts.map(w => w.date.slice(0, 10)))].sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  // Longest streak
  let longest = 1;
  let runLen = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i]) - new Date(days[i - 1])) / 86400000;
    if (diff === 1) { runLen++; longest = Math.max(longest, runLen); }
    else runLen = 1;
  }

  // Current streak — only active if last workout was today or yesterday
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay = new Date(days[days.length - 1]); lastDay.setHours(0, 0, 0, 0);
  const daysSinceLast = (today - lastDay) / 86400000;

  let currentStreak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const diff = (new Date(days[i]) - new Date(days[i - 1])) / 86400000;
    if (diff === 1) currentStreak++;
    else break;
  }

  return { current: daysSinceLast <= 1 ? currentStreak : 0, longest };
}

/**
 * Calculates monthly summary stats from an array of workouts.
 *
 * @param {Array} workouts - array of workout objects with nested exercises and sets
 * @returns {{ count: number, totalVolume: number, totalTime: number, avgDuration: number }}
 */
export function calculateMonthlySummary(workouts) {
  if (!workouts || workouts.length === 0) {
    return { count: 0, totalVolume: 0, totalTime: 0, avgDuration: 0 };
  }

  let totalVolume = 0;
  for (const w of workouts) {
    for (const we of w.exercises || []) {
      for (const s of we.sets || []) {
        if (s.weight && s.reps) totalVolume += Number(s.weight) * Number(s.reps);
      }
    }
  }

  const timed = workouts.filter(w => w.durationMinutes > 0);
  const totalTime = timed.reduce((sum, w) => sum + w.durationMinutes, 0);
  const avgDuration = timed.length > 0 ? Math.round(totalTime / timed.length) : 0;

  return { count: workouts.length, totalVolume, totalTime, avgDuration };
}
