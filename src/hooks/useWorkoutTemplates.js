import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateId, mapRow, buildDbFields } from '../shared/utils';
import {
  workoutTemplateRowMap, workoutTemplateFieldMap,
  templateExerciseRowMap, templateExerciseFieldMap,
} from '../data/gymFieldMaps';

export function useWorkoutTemplates(userId) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const { data: templateRows } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (!templateRows || templateRows.length === 0) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      const templateIds = templateRows.map(t => t.id);

      const { data: teRows } = await supabase
        .from('template_exercises')
        .select('*')
        .in('template_id', templateIds)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      const teByTemplateId = {};
      for (const te of (teRows || [])) {
        const tId = te.template_id;
        if (!teByTemplateId[tId]) teByTemplateId[tId] = [];
        teByTemplateId[tId].push(mapRow(te, templateExerciseRowMap));
      }

      const nested = templateRows.map(t => ({
        ...mapRow(t, workoutTemplateRowMap),
        exercises: teByTemplateId[t.id] || [],
      }));

      setTemplates(nested);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const addTemplate = useCallback(async (fields) => {
    const id = generateId();
    const now = new Date().toISOString();
    const newTemplate = {
      id,
      ...fields,
      userId,
      exercises: fields.exercises || [],
      createdAt: now,
      updatedAt: now,
    };

    setTemplates(prev => [newTemplate, ...prev]);

    const dbFields = buildDbFields(fields, workoutTemplateFieldMap);
    const { error } = await supabase.from('workout_templates').insert({
      id,
      user_id: userId,
      ...dbFields,
    });
    if (error) {
      console.error('[useWorkoutTemplates] insert template failed:', error.message);
      setTemplates(prev => prev.filter(t => t.id !== id));
      return null;
    }

    // Insert template exercises if provided
    const exerciseRows = (fields.exercises || []).map((ex, idx) => ({
      id: generateId(),
      template_id: id,
      exercise_id: ex.exerciseId,
      sort_order: idx,
      target_sets: ex.targetSets || null,
      target_reps: ex.targetReps || null,
      target_weight: ex.targetWeight || null,
      user_id: userId,
    }));

    if (exerciseRows.length > 0) {
      const { error: teError } = await supabase.from('template_exercises').insert(exerciseRows);
      if (teError) console.error('[useWorkoutTemplates] insert template_exercises failed:', teError.message);
    }

    return newTemplate;
  }, [userId]);

  const updateTemplate = useCallback(async (id, fields) => {
    let original;
    setTemplates(prev => {
      original = prev.find(t => t.id === id);
      return prev.map(t => t.id === id ? { ...t, ...fields, updatedAt: new Date().toISOString() } : t);
    });

    const dbFields = buildDbFields(fields, workoutTemplateFieldMap);
    dbFields.updated_at = new Date().toISOString();
    const { error } = await supabase.from('workout_templates').update(dbFields).eq('id', id);
    if (error) {
      console.error('[useWorkoutTemplates] update template failed:', error.message);
      if (original) setTemplates(prev => prev.map(t => t.id === id ? original : t));
    }
  }, []);

  const deleteTemplate = useCallback(async (id) => {
    let removed;
    setTemplates(prev => {
      removed = prev.find(t => t.id === id);
      return prev.filter(t => t.id !== id);
    });

    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[useWorkoutTemplates] delete template failed:', error.message);
      if (removed) setTemplates(prev => [removed, ...prev]);
    }
  }, [userId]);

  const createWorkoutFromTemplate = useCallback(async (templateId, addWorkout, addExerciseToWorkout, addSet) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      console.error('[useWorkoutTemplates] template not found:', templateId);
      return null;
    }

    const workout = await addWorkout({
      date: new Date().toISOString(),
      durationMinutes: null,
      notes: '',
      templateId,
    });

    if (!workout) return null;

    for (const te of template.exercises) {
      const workoutExerciseId = await addExerciseToWorkout(workout.id, te.exerciseId);
      if (!workoutExerciseId) continue;

      const numSets = te.targetSets || 1;
      for (let i = 0; i < numSets; i++) {
        await addSet(workoutExerciseId, {
          reps: te.targetReps || null,
          weight: te.targetWeight || null,
          rpe: null,
          isWarmup: false,
          completed: false,
        });
      }
    }

    return workout;
  }, [templates]);

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    createWorkoutFromTemplate,
  };
}
