import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import DEFAULT_EXPENSE_CATEGORIES from '../data/categories';
import DEFAULT_INCOME_CATEGORIES from '../data/incomeCategories';

export function useCategoryManager(userId) {
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      // Check which default categories are missing by name+type
      const existingKeys = new Set(
        (data || []).map(r => `${r.type}:${r.name.toLowerCase()}`)
      );

      const uid = () => crypto.randomUUID();
      const missingRows = [];

      for (const c of DEFAULT_EXPENSE_CATEGORIES) {
        if (!existingKeys.has(`expense:${c.name.toLowerCase()}`)) {
          missingRows.push({
            id: uid(), user_id: userId, type: 'expense',
            name: c.name, color: c.color, icon: c.icon,
            sort_order: (data || []).filter(r => r.type === 'expense').length + missingRows.length,
          });
        }
      }
      for (const c of DEFAULT_INCOME_CATEGORIES) {
        if (!existingKeys.has(`income:${c.name.toLowerCase()}`)) {
          missingRows.push({
            id: uid(), user_id: userId, type: 'income',
            name: c.name, color: c.color, icon: c.icon,
            sort_order: (data || []).filter(r => r.type === 'income').length + missingRows.length,
          });
        }
      }

      if (missingRows.length > 0 && !cancelled) {
        await supabase.from('user_categories').insert(missingRows);
      }

      if (cancelled) return;

      // Reload all categories
      const { data: allData } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      setExpenseCategories(
        (allData || []).filter(c => c.type === 'expense').map(mapRow)
      );
      setIncomeCategories(
        (allData || []).filter(c => c.type === 'income').map(mapRow)
      );
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const addCategory = useCallback(async (type, { name, color, icon }) => {
    const list = type === 'expense' ? expenseCategories : incomeCategories;
    const duplicate = list.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return { error: `A category named "${name}" already exists.` };

    const id = crypto.randomUUID();
    const newCat = { id, name, color, icon: icon || '', sortOrder: list.length };

    if (type === 'expense') {
      setExpenseCategories(prev => [...prev, newCat]);
    } else {
      setIncomeCategories(prev => [...prev, newCat]);
    }

    await supabase.from('user_categories').insert({
      id,
      user_id: userId,
      type,
      name,
      color,
      icon: icon || '',
      sort_order: list.length,
    });

    return newCat;
  }, [userId, expenseCategories, incomeCategories]);

  const updateCategory = useCallback(async (id, fields) => {
    if (fields.name !== undefined) {
      const allCategories = [...expenseCategories, ...incomeCategories];
      const duplicate = allCategories.some(
        c => c.id !== id && c.name.toLowerCase() === fields.name.toLowerCase()
      );
      if (duplicate) return { error: `A category named "${fields.name}" already exists.` };
    }

    const update = (list) =>
      list.map(c => c.id === id ? { ...c, ...fields } : c);

    setExpenseCategories(update);
    setIncomeCategories(update);

    const dbFields = {};
    if (fields.name !== undefined) dbFields.name = fields.name;
    if (fields.color !== undefined) dbFields.color = fields.color;
    if (fields.icon !== undefined) dbFields.icon = fields.icon;

    await supabase.from('user_categories').update(dbFields).eq('id', id);
    return {};
  }, [expenseCategories, incomeCategories]);

  const deleteCategory = useCallback(async (id) => {
    setExpenseCategories(prev => prev.filter(c => c.id !== id));
    setIncomeCategories(prev => prev.filter(c => c.id !== id));
    await supabase.from('user_categories').delete().eq('id', id);
  }, []);

  return {
    expenseCategories,
    incomeCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    loading,
  };
}

function mapRow(r) {
  return { id: r.id, name: r.name, color: r.color, icon: r.icon, sortOrder: r.sort_order };
}

function mapDefault(c) {
  return { id: c.id, name: c.name, color: c.color, icon: c.icon, sortOrder: 0 };
}
