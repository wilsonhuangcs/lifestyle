import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateId, mapRow, buildDbFields } from '../shared/utils';
import { cardRowMap, cardFieldMap } from '../data/budgetFieldMaps';

export function useCards(userId) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const { data } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!cancelled) {
        setCards((data || []).map(r => mapRow(r, cardRowMap)));
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const addCard = useCallback(async (fields) => {
    const id = generateId();
    const newCard = { id, userId, createdAt: new Date().toISOString(), ...fields };
    setCards(prev => [...prev, newCard]);
    const dbFields = buildDbFields(fields, cardFieldMap);
    const { error } = await supabase.from('user_cards').insert({ id, user_id: userId, ...dbFields });
    if (error) {
      console.error('[useCards] insert failed:', error.message);
      setCards(prev => prev.filter(c => c.id !== id));
      return null;
    }
    return newCard;
  }, [userId]);

  const updateCard = useCallback(async (id, fields) => {
    let original;
    setCards(prev => {
      original = prev.find(c => c.id === id);
      return prev.map(c => c.id === id ? { ...c, ...fields } : c);
    });
    const dbFields = buildDbFields(fields, cardFieldMap);
    const { error } = await supabase.from('user_cards').update(dbFields).eq('id', id).eq('user_id', userId);
    if (error) {
      console.error('[useCards] update failed:', error.message);
      if (original) setCards(prev => prev.map(c => c.id === id ? original : c));
    }
  }, [userId]);

  const deleteCard = useCallback(async (id) => {
    let removed, removedIndex;
    setCards(prev => {
      removedIndex = prev.findIndex(c => c.id === id);
      removed = prev[removedIndex];
      return prev.filter(c => c.id !== id);
    });
    const { error } = await supabase.from('user_cards').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      console.error('[useCards] delete failed:', error.message);
      if (removed !== undefined) {
        setCards(prev => {
          const next = [...prev];
          next.splice(removedIndex, 0, removed);
          return next;
        });
      }
    }
  }, [userId]);

  return { cards, loading, addCard, updateCard, deleteCard };
}
