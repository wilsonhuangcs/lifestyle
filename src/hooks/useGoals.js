import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateId, mapRow, buildDbFields } from '../shared/utils';
import { goalRowMap, goalFieldMap } from '../data/budgetFieldMaps';

export function useGoals(userId) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const { data } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (!cancelled) {
        setGoals((data || []).map(r => mapRow(r, goalRowMap)));
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const addGoal = useCallback(async (fields) => {
    const id = generateId();
    const newGoal = { id, userId, savedAmount: 0, createdAt: new Date().toISOString(), ...fields };
    setGoals(prev => [...prev, newGoal]);
    const dbFields = buildDbFields(fields, goalFieldMap);
    const { error } = await supabase.from('user_goals').insert({ id, user_id: userId, ...dbFields });
    if (error) {
      console.error('[useGoals] insert failed:', error.message);
      setGoals(prev => prev.filter(g => g.id !== id));
      return null;
    }
    return newGoal;
  }, [userId]);

  const updateGoal = useCallback(async (id, fields) => {
    let original;
    setGoals(prev => {
      original = prev.find(g => g.id === id);
      return prev.map(g => g.id === id ? { ...g, ...fields } : g);
    });
    const dbFields = buildDbFields(fields, goalFieldMap);
    const { error } = await supabase.from('user_goals').update(dbFields).eq('id', id).eq('user_id', userId);
    if (error) {
      console.error('[useGoals] update failed:', error.message);
      if (original) setGoals(prev => prev.map(g => g.id === id ? original : g));
    }
  }, [userId]);

  const deleteGoal = useCallback(async (id) => {
    let removed, removedIndex;
    setGoals(prev => {
      removedIndex = prev.findIndex(g => g.id === id);
      removed = prev[removedIndex];
      return prev.filter(g => g.id !== id);
    });
    const { error } = await supabase.from('user_goals').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      console.error('[useGoals] delete failed:', error.message);
      if (removed !== undefined) {
        setGoals(prev => {
          const next = [...prev];
          next.splice(removedIndex, 0, removed);
          return next;
        });
      }
    }
  }, [userId]);

  return { goals, loading, addGoal, updateGoal, deleteGoal };
}
