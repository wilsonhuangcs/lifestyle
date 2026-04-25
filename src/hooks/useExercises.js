import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateId, mapRow, buildDbFields } from '../shared/utils';
import EXERCISE_LIBRARY from '../data/exerciseLibrary';
import { exerciseRowMap, exerciseFieldMap } from '../data/gymFieldMaps';

export function useExercises(userId) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // Fetch exercises: user's own + all default (is_custom = false)
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.eq.${userId},is_custom.eq.false`)
        .order('name', { ascending: true });

      if (cancelled) return;

      // Seed default exercises if missing; patch stale rows missing muscle_group
      const existingMap = new Map(
        (data || []).map(r => [r.name.toLowerCase(), r])
      );

      const missingRows = [];
      const staleIds    = [];

      for (const ex of EXERCISE_LIBRARY) {
        const existing = existingMap.get(ex.name.toLowerCase());
        if (!existing) {
          missingRows.push({
            id: ex.id,
            user_id: userId,
            name: ex.name,
            muscle_group: ex.muscleGroup,
            equipment: ex.equipment,
            is_custom: false,
            secondary_muscles: ex.secondaryMuscles || [],
            movement_type: ex.movementType || null,
            instructions: ex.instructions || null,
          });
        } else if (!existing.muscle_group || existing.muscle_group !== ex.muscleGroup) {
          // Row exists but has null or outdated muscle_group (e.g. old generic 'back'/'shoulders')
          staleIds.push(existing.id);
          await supabase.from('exercises').update({
            muscle_group:      ex.muscleGroup,
            secondary_muscles: ex.secondaryMuscles || [],
            movement_type:     ex.movementType || null,
            instructions:      ex.instructions || null,
          }).eq('id', existing.id);
        }
      }

      if (cancelled) return;

      if (missingRows.length > 0) {
        await supabase.from('exercises').insert(missingRows);
        if (cancelled) return;
      }

      // Reload all exercises after potential seeding
      const { data: allData } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.eq.${userId},is_custom.eq.false`)
        .order('name', { ascending: true });

      if (!cancelled) {
        setExercises((allData || []).map(r => mapRow(r, exerciseRowMap)));
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const addExercise = useCallback(async (fields) => {
    const id = generateId();
    const newExercise = { id, ...fields, isCustom: true, userId };

    setExercises(prev => [...prev, newExercise]);

    const dbFields = buildDbFields(fields, exerciseFieldMap);
    const { error } = await supabase.from('exercises').insert({
      id,
      user_id: userId,
      is_custom: true,
      ...dbFields,
    });
    if (error) {
      console.error('[useExercises] insert failed:', error.message);
      setExercises(prev => prev.filter(e => e.id !== id));
      return null;
    }

    return newExercise;
  }, [userId]);

  const updateExercise = useCallback(async (id, fields) => {
    let original;
    setExercises(prev => {
      original = prev.find(e => e.id === id);
      return prev.map(e => e.id === id ? { ...e, ...fields } : e);
    });

    const dbFields = buildDbFields(fields, exerciseFieldMap);
    const { error } = await supabase
      .from('exercises')
      .update(dbFields)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[useExercises] update failed:', error.message);
      if (original) setExercises(prev => prev.map(e => e.id === id ? original : e));
    }
  }, [userId]);

  const deleteExercise = useCallback(async (id) => {
    let removed;
    let removedIndex;
    setExercises(prev => {
      removedIndex = prev.findIndex(e => e.id === id);
      removed = prev[removedIndex];
      return prev.filter(e => e.id !== id);
    });

    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[useExercises] delete failed:', error.message);
      if (removed !== undefined) {
        setExercises(prev => {
          const next = [...prev];
          next.splice(removedIndex, 0, removed);
          return next;
        });
      }
    }
  }, [userId]);

  return { exercises, loading, addExercise, updateExercise, deleteExercise };
}
