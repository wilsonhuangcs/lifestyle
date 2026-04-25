import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateId, mapRow, buildDbFields, detectPRs } from '../shared/utils';
import { prRowMap, prFieldMap } from '../data/gymFieldMaps';

export function usePRs(userId) {
  const [prs, setPrs] = useState([]);
  const [prMap, setPrMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const { data } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId);

      if (cancelled) return;

      const mapped = (data || []).map(row => ({
        ...mapRow(row, prRowMap),
        id: row.id,
        userId: row.user_id,
        value: row.value,
        reps: row.reps,
        weight: row.weight,
      }));

      const map = new Map();
      for (const pr of mapped) {
        map.set(`${pr.exerciseId}:${pr.prType}`, pr.value);
      }

      setPrs(mapped);
      setPrMap(map);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const checkIsPR = useCallback((exerciseId, prType, value) => {
    const key = `${exerciseId}:${prType}`;
    const current = prMap.get(key);
    return current === undefined ? true : value > current;
  }, [prMap]);

  const savePR = useCallback(async (exerciseId, prType, value, reps, weight, workoutId, achievedAt) => {
    const key = `${exerciseId}:${prType}`;
    const existing = prs.find(p => p.exerciseId === exerciseId && p.prType === prType);
    const recordId = existing ? existing.id : generateId();

    const newPR = {
      id: recordId,
      userId,
      exerciseId,
      prType,
      value,
      reps,
      weight,
      workoutId,
      achievedAt,
    };

    // Optimistic update
    setPrs(prev => {
      const idx = prev.findIndex(p => p.exerciseId === exerciseId && p.prType === prType);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newPR;
        return next;
      }
      return [...prev, newPR];
    });
    setPrMap(prev => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });

    const dbFields = buildDbFields(
      { exerciseId, prType, workoutId, achievedAt },
      prFieldMap
    );

    const { error: upsertError } = await supabase
      .from('personal_records')
      .upsert(
        {
          id: recordId,
          user_id: userId,
          value,
          reps,
          weight,
          ...dbFields,
        },
        { onConflict: 'user_id,exercise_id,pr_type' }
      );

    if (upsertError) {
      console.error('[usePRs] upsert personal_record failed:', upsertError.message);
      // Rollback optimistic update
      setPrs(prev => {
        if (existing) {
          return prev.map(p => p.id === recordId ? existing : p);
        }
        return prev.filter(p => p.id !== recordId);
      });
      setPrMap(prev => {
        const next = new Map(prev);
        if (existing) {
          next.set(key, existing.value);
        } else {
          next.delete(key);
        }
        return next;
      });
      return;
    }

    // Insert pr_history row
    const historyId = generateId();
    const historyDbFields = buildDbFields(
      { exerciseId, prType, workoutId, achievedAt },
      prFieldMap
    );

    const { error: historyError } = await supabase
      .from('pr_history')
      .insert({
        id: historyId,
        user_id: userId,
        value,
        reps,
        weight,
        ...historyDbFields,
      });

    if (historyError) {
      console.error('[usePRs] insert pr_history failed:', historyError.message);
    }
  }, [userId, prs]);

  const detectAndSaveWorkoutPRs = useCallback(async (workout, exerciseMap) => {
    if (!workout) return;
    const newPRs = detectPRs(workout, exerciseMap, prMap);
    for (const pr of newPRs) {
      await savePR(pr.exerciseId, pr.prType, pr.value, pr.reps, pr.weight, pr.workoutId, pr.achievedAt);
    }
  }, [prMap, savePR]);

  return {
    prs,
    prMap,
    loading,
    checkIsPR,
    savePR,
    detectAndSaveWorkoutPRs,
  };
}
