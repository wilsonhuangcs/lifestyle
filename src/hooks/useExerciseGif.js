/**
 * Fetches exercise demonstration images from the free-exercise-db GitHub repo.
 * https://github.com/yuhonas/free-exercise-db
 *
 * No API key required. The full exercises.json is fetched once and cached
 * in memory for the session. Individual exercise image URLs are cached in
 * sessionStorage so repeated opens are instant.
 */

import { useState, useEffect } from 'react';

const JSON_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// Module-level cache — survives re-renders, cleared on page reload
let dbCache   = null;
let dbPromise = null;

async function loadDb() {
  if (dbCache)   return dbCache;
  if (dbPromise) return dbPromise;
  dbPromise = fetch(JSON_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => { dbCache = data; return data; });
  return dbPromise;
}

/** Normalize a string: lowercase, strip punctuation, collapse spaces */
function norm(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Map our equipment labels → free-exercise-db equipment field values
const EQUIP_MAP = {
  barbell:    'barbell',
  dumbbells:  'dumbbell',
  cable:      'cable',
  machine:    'machine',
  bodyweight: 'body only',
  kettlebell: 'kettlebell',
};

// Equipment pairs that should never match each other
const EQUIP_EXCLUSIONS = {
  barbell:    ['machine', 'dumbbell', 'cable'],
  dumbbells:  ['machine', 'barbell'],
  machine:    ['barbell', 'dumbbell', 'body only'],
  bodyweight: ['barbell', 'dumbbell', 'machine', 'cable', 'kettlebell'],
  kettlebell: ['barbell', 'dumbbell', 'machine'],
};

/**
 * Find the best matching exercise in the DB.
 * @param {object[]} db
 * @param {string}   name       - our exercise name
 * @param {string}   [equipment] - our equipment label (e.g. "Barbell")
 */
function findBestMatch(db, name, equipment) {
  const target    = norm(name);
  const words     = target.split(' ').filter(w => w.length > 2);
  const dbEquip   = equipment ? EQUIP_MAP[equipment.toLowerCase()] : null;
  const excluded  = dbEquip ? (EQUIP_EXCLUSIONS[equipment.toLowerCase()] || []) : [];

  // 1. Exact normalized name match
  const exact = db.find(e => norm(e.name) === target);
  if (exact) return exact;

  // 2. All significant words present in DB exercise name
  let candidates = db.filter(e => {
    const en = norm(e.name);
    return words.every(w => en.includes(w));
  });

  if (!candidates.length) return null;

  // 3. Remove candidates with clearly wrong equipment (e.g. machine when we want barbell)
  const filtered = candidates.filter(e => !excluded.includes(e.equipment?.toLowerCase()));
  if (filtered.length) candidates = filtered;

  // 4. Prefer candidates whose equipment matches ours
  if (dbEquip) {
    const equipMatch = candidates.filter(e => e.equipment?.toLowerCase() === dbEquip);
    if (equipMatch.length) candidates = equipMatch;
  }

  // 5. Among remaining, prefer shortest name (most direct match)
  return candidates.sort((a, b) => a.name.length - b.name.length)[0];
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useExerciseGif(exerciseName, equipment) {
  const [images,    setImages]    = useState(null);
  const [matchName, setMatchName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!exerciseName) return;

    const cacheKey = `exdemo:${exerciseName.toLowerCase().trim()}:${(equipment || '').toLowerCase()}`;
    const cached   = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.images?.length) {
        setImages(parsed.images);
        setMatchName(parsed.matchName);
      } else {
        setError('not_found');
      }
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setImages(null);
    setError(null);

    loadDb()
      .then(db => {
        if (cancelled) return;
        const match = findBestMatch(db, exerciseName, equipment);
        if (!match || !match.images?.length) {
          setError('not_found');
          sessionStorage.setItem(cacheKey, JSON.stringify({ images: null }));
          return;
        }
        const urls = match.images.map(p => IMG_BASE + p);
        setImages(urls);
        setMatchName(match.name);
        sessionStorage.setItem(cacheKey, JSON.stringify({ images: urls, matchName: match.name }));
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'fetch_error');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [exerciseName, equipment]);

  return { images, matchName, isLoading, error };
}
