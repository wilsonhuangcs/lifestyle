import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateId, mapRow, buildDbFields } from '../shared/utils';
import { muscleRecoveryRowMap, muscleRecoveryFieldMap } from '../data/gymFieldMaps';

const MUSCLE_GROUPS = [
  'chest',
  'trapezius', 'upper_back', 'lower_back',
  'front_deltoids', 'rear_deltoids',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors',
  'cardio', 'full_body',
];

const DEFAULT_RECOVERY_HOURS = {
  chest:          48,
  trapezius:      48,
  upper_back:     48,
  lower_back:     48,
  front_deltoids: 48,
  rear_deltoids:  48,
  biceps:         48,
  triceps:        48,
  forearms:       24,
  abs:            24,
  obliques:       24,
  quadriceps:     72,
  hamstrings:     72,
  glutes:         72,
  calves:         48,
  adductors:      48,
  abductors:      48,
  cardio:         24,
  full_body:      72,
};

export function useRecovery(userId) {
  const [recoveryRows, setRecoveryRows] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_RECOVERY_HOURS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // Fetch recovery settings
      const { data: settingsData } = await supabase
        .from('recovery_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (cancelled) return;

      if (settingsData?.settings) {
        setSettings({ ...DEFAULT_RECOVERY_HOURS, ...settingsData.settings });
      }

      // Fetch recent muscle_recovery rows (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      const { data: recoveryData } = await supabase
        .from('muscle_recovery')
        .select('*')
        .eq('user_id', userId)
        .gte('trained_at', sevenDaysAgoISO)
        .order('trained_at', { ascending: false });

      if (!cancelled) {
        setRecoveryRows((recoveryData || []).map(r => mapRow(r, muscleRecoveryRowMap)));
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // Compute recovery status from rows + settings
  const recoveryStatus = (() => {
    const now = new Date();
    const status = {};

    for (const muscle of MUSCLE_GROUPS) {
      // Find the most recent training row for this muscle
      const row = recoveryRows.find(r => r.muscleGroup === muscle);
      if (!row) {
        status[muscle] = 'untrained';
        continue;
      }

      const recoveredAt = new Date(row.recoveredAt);
      const trainedAt = new Date(row.trainedAt);
      const totalWindow = recoveredAt - trainedAt; // ms

      if (recoveredAt <= now) {
        status[muscle] = 'recovered';
      } else {
        const remaining = recoveredAt - now;
        const fractionRemaining = remaining / totalWindow;
        // fatigued = more than 50% of window remaining; recovering = 50% or less
        status[muscle] = fractionRemaining > 0.5 ? 'fatigued' : 'recovering';
      }
    }

    return status;
  })();

  const updateSettings = useCallback(async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    const { error } = await supabase
      .from('recovery_settings')
      .upsert(
        { user_id: userId, settings: merged, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[useRecovery] updateSettings failed:', error.message);
      setSettings(settings);
    }
  }, [userId, settings]);

  const logRecovery = useCallback(async (muscleGroup, workoutId, trainedAt) => {
    const recoveryHours = settings[muscleGroup] ?? DEFAULT_RECOVERY_HOURS[muscleGroup] ?? 48;
    const trainedDate = new Date(trainedAt);
    const recoveredAt = new Date(trainedDate.getTime() + recoveryHours * 60 * 60 * 1000);

    const newRow = {
      muscleGroup,
      workoutId,
      trainedAt: trainedDate.toISOString(),
      recoveryHours,
      recoveredAt: recoveredAt.toISOString(),
    };

    // Optimistic update — prepend to front (most recent first)
    const optimisticRow = { ...newRow, id: generateId() };
    setRecoveryRows(prev => [optimisticRow, ...prev.filter(r => r.muscleGroup !== muscleGroup)]);

    const dbFields = buildDbFields(newRow, muscleRecoveryFieldMap);
    const { data, error } = await supabase
      .from('muscle_recovery')
      .insert({
        id: optimisticRow.id,
        user_id: userId,
        recovered_at: recoveredAt.toISOString(),
        ...dbFields,
      })
      .select()
      .single();

    if (error) {
      console.error('[useRecovery] logRecovery failed:', error.message);
      setRecoveryRows(prev => prev.filter(r => r.id !== optimisticRow.id));
      return null;
    }

    const inserted = mapRow(data, muscleRecoveryRowMap);
    setRecoveryRows(prev => prev.map(r => r.id === optimisticRow.id ? inserted : r));
    return inserted;
  }, [userId, settings]);

  return {
    recoveryStatus,
    recoveryRows,
    settings,
    updateSettings,
    logRecovery,
    loading,
  };
}
