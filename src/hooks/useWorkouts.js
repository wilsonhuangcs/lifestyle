import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateId, mapRow, buildDbFields, getMonthRange } from '../shared/utils';
import {
  workoutRowMap, workoutFieldMap,
  workoutExerciseRowMap, workoutExerciseFieldMap,
  workoutSetRowMap, workoutSetFieldMap,
} from '../data/gymFieldMaps';

// Pass month=null to fetch all workouts (no date filter)
export function useWorkouts(userId, month) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      // Build query — month=null means all-time
      let query = supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (month) {
        const { start, end } = getMonthRange(month);
        query = query.gte('date', start).lt('date', end);
      }

      const { data: workoutRows } = await query;

      if (cancelled) return;

      if (!workoutRows || workoutRows.length === 0) {
        setWorkouts([]);
        setLoading(false);
        return;
      }

      const workoutIds = workoutRows.map(w => w.id);

      // Fetch all workout_exercises for these workouts
      const { data: weRows } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_id', workoutIds)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      const weIds = (weRows || []).map(we => we.id);

      // Fetch all workout_sets for these workout_exercises
      let setRows = [];
      if (weIds.length > 0) {
        const { data: sRows } = await supabase
          .from('workout_sets')
          .select('*')
          .in('workout_exercise_id', weIds)
          .order('set_number', { ascending: true });
        setRows = sRows || [];
      }

      if (cancelled) return;

      // Group sets by workout_exercise_id
      const setsByWeId = {};
      for (const s of setRows) {
        const weId = s.workout_exercise_id;
        if (!setsByWeId[weId]) setsByWeId[weId] = [];
        setsByWeId[weId].push(mapRow(s, workoutSetRowMap));
      }

      // Group workout_exercises by workout_id, attach sets
      const weByWorkoutId = {};
      for (const we of (weRows || [])) {
        const wId = we.workout_id;
        if (!weByWorkoutId[wId]) weByWorkoutId[wId] = [];
        weByWorkoutId[wId].push({
          ...mapRow(we, workoutExerciseRowMap),
          sets: setsByWeId[we.id] || [],
        });
      }

      // Build final workouts array
      const nested = workoutRows.map(w => ({
        ...mapRow(w, workoutRowMap),
        exercises: weByWorkoutId[w.id] || [],
      }));

      setWorkouts(nested);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId, month]);

  // --- Workout CRUD ---

  const addWorkout = useCallback(async (fields) => {
    const id = generateId();
    const newWorkout = { id, ...fields, userId, isCompleted: false, exercises: [] };

    setWorkouts(prev => [newWorkout, ...prev]);

    const dbFields = buildDbFields(fields, workoutFieldMap);
    const { error } = await supabase.from('workouts').insert({
      id,
      user_id: userId,
      is_completed: false,
      ...dbFields,
    });
    if (error) {
      console.error('[useWorkouts] insert workout failed:', error.message);
      setWorkouts(prev => prev.filter(w => w.id !== id));
      return null;
    }

    return newWorkout;
  }, [userId]);

  const updateWorkout = useCallback(async (id, fields) => {
    let original;
    setWorkouts(prev => {
      original = prev.find(w => w.id === id);
      return prev.map(w => w.id === id ? { ...w, ...fields } : w);
    });

    const dbFields = buildDbFields(fields, workoutFieldMap);
    const { error } = await supabase.from('workouts').update(dbFields).eq('id', id);
    if (error) {
      console.error('[useWorkouts] update workout failed:', error.message);
      if (original) setWorkouts(prev => prev.map(w => w.id === id ? original : w));
    }
  }, []);

  const deleteWorkout = useCallback(async (id) => {
    let removed;
    setWorkouts(prev => {
      removed = prev.find(w => w.id === id);
      return prev.filter(w => w.id !== id);
    });

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[useWorkouts] delete workout failed:', error.message);
      if (removed) setWorkouts(prev => [removed, ...prev]);
    }
  }, [userId]);

  const completeWorkout = useCallback(async (id, durationMinutes) => {
    let original;
    setWorkouts(prev => {
      original = prev.find(w => w.id === id);
      return prev.map(w => w.id === id ? { ...w, isCompleted: true, durationMinutes } : w);
    });

    const { error } = await supabase.from('workouts').update({
      is_completed: true,
      duration_minutes: durationMinutes,
    }).eq('id', id);
    if (error) {
      console.error('[useWorkouts] complete workout failed:', error.message);
      if (original) setWorkouts(prev => prev.map(w => w.id === id ? original : w));
    }
  }, []);

  // --- Workout Exercise CRUD ---

  const addExerciseToWorkout = useCallback(async (workoutId, exerciseId) => {
    const id = generateId();
    let sortOrder = 0;

    setWorkouts(prev => prev.map(w => {
      if (w.id !== workoutId) return w;
      sortOrder = w.exercises.length; // capture correct value from live state
      const newWe = { id, workoutId, exerciseId, sortOrder, notes: '', restTimerSeconds: 90, sets: [] };
      return { ...w, exercises: [...w.exercises, newWe] };
    }));

    const { error } = await supabase.from('workout_exercises').insert({
      id,
      workout_id: workoutId,
      exercise_id: exerciseId,
      sort_order: sortOrder,
      rest_timer_seconds: 90,
      user_id: userId,
    });
    if (error) {
      console.error('[useWorkouts] insert workout_exercise failed:', error.message);
      setWorkouts(prev => prev.map(w => ({
        ...w,
        exercises: w.exercises.filter(we => we.id !== id),
      })));
      return null;
    }

    return id;
  }, [userId]);

  const removeExerciseFromWorkout = useCallback(async (workoutExerciseId) => {
    let removedWe;
    let removedFromWorkoutId;
    setWorkouts(prev => prev.map(w => {
      const idx = w.exercises.findIndex(we => we.id === workoutExerciseId);
      if (idx === -1) return w;
      removedWe = w.exercises[idx];
      removedFromWorkoutId = w.id;
      return { ...w, exercises: w.exercises.filter(we => we.id !== workoutExerciseId) };
    }));

    const { error } = await supabase.from('workout_exercises').delete().eq('id', workoutExerciseId);
    if (error) {
      console.error('[useWorkouts] delete workout_exercise failed:', error.message);
      if (removedWe) {
        setWorkouts(prev => prev.map(w =>
          w.id === removedFromWorkoutId
            ? { ...w, exercises: [...w.exercises, removedWe] }
            : w
        ));
      }
    }
  }, []);

  const updateWorkoutExercise = useCallback(async (weId, fields) => {
    let original;
    setWorkouts(prev => prev.map(w => ({
      ...w,
      exercises: w.exercises.map(we => {
        if (we.id !== weId) return we;
        original = we;
        return { ...we, ...fields };
      }),
    })));

    const dbFields = buildDbFields(fields, workoutExerciseFieldMap);
    const { error } = await supabase.from('workout_exercises').update(dbFields).eq('id', weId);
    if (error) {
      console.error('[useWorkouts] update workout_exercise failed:', error.message);
      if (original) {
        setWorkouts(prev => prev.map(w => ({
          ...w,
          exercises: w.exercises.map(we => we.id === weId ? original : we),
        })));
      }
    }
  }, []);

  // --- Set CRUD ---

  const addSet = useCallback(async (workoutExerciseId, fields) => {
    const id = generateId();
    let setNumber = 1;

    setWorkouts(prev => prev.map(w => ({
      ...w,
      exercises: w.exercises.map(we => {
        if (we.id !== workoutExerciseId) return we;
        setNumber = we.sets.length + 1; // capture correct value from live state
        const newSet = { id, workoutExerciseId, setNumber, reps: null, weight: null, rpe: null, isWarmup: false, completed: true, setType: 'normal', ...fields };
        return { ...we, sets: [...we.sets, newSet] };
      }),
    })));

    const dbFields = buildDbFields(fields, workoutSetFieldMap);
    // set_type comes through dbFields from buildDbFields; default to 'normal' if not present
    if (!dbFields.set_type) dbFields.set_type = 'normal';
    const { error } = await supabase.from('workout_sets').insert({
      id,
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
      user_id: userId,
      ...dbFields,
    });
    if (error) {
      console.error('[useWorkouts] insert set failed:', error.message);
      setWorkouts(prev => prev.map(w => ({
        ...w,
        exercises: w.exercises.map(we => ({
          ...we,
          sets: we.sets.filter(s => s.id !== id),
        })),
      })));
      return null;
    }

    return id;
  }, [userId]);

  const updateSet = useCallback(async (setId, fields) => {
    let original;
    setWorkouts(prev => prev.map(w => ({
      ...w,
      exercises: w.exercises.map(we => ({
        ...we,
        sets: we.sets.map(s => {
          if (s.id !== setId) return s;
          original = s;
          return { ...s, ...fields };
        }),
      })),
    })));

    const dbFields = buildDbFields(fields, workoutSetFieldMap);
    const { error } = await supabase.from('workout_sets').update(dbFields).eq('id', setId);
    if (error) {
      console.error('[useWorkouts] update set failed:', error.message);
      if (original) {
        setWorkouts(prev => prev.map(w => ({
          ...w,
          exercises: w.exercises.map(we => ({
            ...we,
            sets: we.sets.map(s => s.id === setId ? original : s),
          })),
        })));
      }
    }
  }, []);

  const deleteSet = useCallback(async (setId) => {
    let removed;
    let removedFromWeId;
    setWorkouts(prev => prev.map(w => ({
      ...w,
      exercises: w.exercises.map(we => {
        const idx = we.sets.findIndex(s => s.id === setId);
        if (idx === -1) return we;
        removed = we.sets[idx];
        removedFromWeId = we.id;
        return { ...we, sets: we.sets.filter(s => s.id !== setId) };
      }),
    })));

    const { error } = await supabase.from('workout_sets').delete().eq('id', setId);
    if (error) {
      console.error('[useWorkouts] delete set failed:', error.message);
      if (removed) {
        setWorkouts(prev => prev.map(w => ({
          ...w,
          exercises: w.exercises.map(we =>
            we.id === removedFromWeId
              ? { ...we, sets: [...we.sets, removed] }
              : we
          ),
        })));
      }
    }
  }, []);

  return {
    workouts,
    loading,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    completeWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    updateWorkoutExercise,
    addSet,
    updateSet,
    deleteSet,
  };
}
