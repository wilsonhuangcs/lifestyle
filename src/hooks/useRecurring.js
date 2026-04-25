import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'custom'];

function getExpectedDates(frequency, month, customDates = []) {
  const [y, m] = month.split('-').map(Number);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
  const daysInMonth = new Date(y, m, 0).getDate();
  const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;
  const dates = [];

  if (frequency === 'monthly') {
    dates.push(new Date(y, m - 1, 1));
  } else if (frequency === 'biweekly') {
    dates.push(new Date(y, m - 1, 1));
    if (lastDay >= 15) dates.push(new Date(y, m - 1, 15));
  } else if (frequency === 'weekly') {
    for (let d = 1; d <= lastDay; d += 7) {
      dates.push(new Date(y, m - 1, d));
    }
  } else if (frequency === 'daily') {
    for (let d = 1; d <= lastDay; d++) {
      dates.push(new Date(y, m - 1, d));
    }
  } else if (frequency === 'custom') {
    for (const d of customDates) {
      if (d <= lastDay && d <= daysInMonth) {
        dates.push(new Date(y, m - 1, d));
      }
    }
  }

  return dates.map(d => d.toISOString().split('T')[0]);
}

export { FREQUENCIES };

export function useRecurring(userId, month, addExpense, addIncome) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const applyingRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('recurring')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setItems(data.map(r => ({
            id: r.id,
            type: r.type,
            categoryId: r.category_id,
            amount: r.amount,
            description: r.description,
            frequency: r.frequency,
            customDates: r.custom_dates || [],
            active: r.active,
          })));
        }
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    setApplied(false);
    applyingRef.current = false;
  }, [month]);

  useEffect(() => {
    if (!userId || !month || loading || items.length === 0 || applied || applyingRef.current) return;

    applyingRef.current = true;

    const applyRecurring = async () => {
      try {
        const activeItems = items.filter(i => i.active);
        if (activeItems.length === 0) {
          setApplied(true);
          return;
        }

        const monthStart = `${month}-01`;
        const [y, m] = month.split('-').map(Number);
        const monthEnd = new Date(y, m, 0).toISOString().split('T')[0];

        const { data: logs } = await supabase
          .from('recurring_log')
          .select('recurring_id, applied_date')
          .gte('applied_date', monthStart)
          .lte('applied_date', monthEnd)
          .in('recurring_id', activeItems.map(i => i.id));

        const appliedSet = new Set((logs || []).map(l => `${l.recurring_id}:${l.applied_date}`));

        const toApply = [];
        for (const item of activeItems) {
          const expectedDates = getExpectedDates(item.frequency, month, item.customDates);
          for (const date of expectedDates) {
            if (!appliedSet.has(`${item.id}:${date}`)) {
              toApply.push({ item, date });
            }
          }
        }

        if (toApply.length === 0) {
          setApplied(true);
          return;
        }

        // Log first to prevent duplicates from concurrent runs
        await supabase.from('recurring_log').insert(
          toApply.map(({ item, date }) => ({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            recurring_id: item.id,
            applied_date: date,
          }))
        );

        for (const { item } of toApply) {
          if (item.type === 'expense') {
            await addExpense({ categoryId: item.categoryId, amount: item.amount, description: item.description });
          } else {
            await addIncome({ categoryId: item.categoryId, amount: item.amount, description: item.description });
          }
        }

        setApplied(true);
      } finally {
        applyingRef.current = false;
      }
    };

    applyRecurring();
  }, [userId, month, loading, items, applied, addExpense, addIncome]);

  const addRecurring = useCallback(async ({ type, categoryId, amount, description, frequency, customDates }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const dates = customDates || [];
    const newItem = { id, type, categoryId, amount, description, frequency, customDates: dates, active: true };
    setItems(prev => [...prev, newItem]);
    setApplied(false);

    await supabase.from('recurring').insert({
      id,
      user_id: userId,
      type,
      category_id: categoryId,
      amount,
      description,
      frequency,
      custom_dates: dates,
      active: true,
    });

    return newItem;
  }, [userId]);

  const pendingToggles = useRef(new Set());
  const toggleRecurring = useCallback(async (id) => {
    if (pendingToggles.current.has(id)) return;
    pendingToggles.current.add(id);
    const item = items.find(i => i.id === id);
    if (item) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
      await supabase.from('recurring').update({ active: !item.active }).eq('id', id);
    }
    pendingToggles.current.delete(id);
  }, [items]);

  const updateRecurring = useCallback(async (id, fields) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i));

    const dbFields = {};
    if (fields.categoryId !== undefined) dbFields.category_id = fields.categoryId;
    if (fields.amount !== undefined) dbFields.amount = fields.amount;
    if (fields.description !== undefined) dbFields.description = fields.description;
    if (fields.frequency !== undefined) dbFields.frequency = fields.frequency;
    if (fields.customDates !== undefined) dbFields.custom_dates = fields.customDates;
    if (fields.type !== undefined) dbFields.type = fields.type;

    await supabase.from('recurring').update(dbFields).eq('id', id);
  }, []);

  const deleteRecurring = useCallback(async (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('recurring').delete().eq('id', id);
  }, []);

  return { items, loading, addRecurring, updateRecurring, toggleRecurring, deleteRecurring };
}
