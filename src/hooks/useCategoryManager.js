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

    const load = async () => {
      const { data } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      // Check which default categories are missing by name+type
      const existingKeys = new Set(
        (data || []).map(r => `${r.type}:${r.name.toLowerCase()}`)
      );

      const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
      const missingRows = [];

      for (const c of DEFAULT_EXPENSE_CATEGORIES) {
        if (!existingKeys.has(`expense:${c.name.toLowerCase()}`)) {
          missingRows.push({
            id: uid(), user_id: userId, type: 'expense',
            name: c.name, color: c.color, icon: c.icon,
            sort_order: missingRows.length,
          });
        }
      }
      for (const c of DEFAULT_INCOME_CATEGORIES) {
        if (!existingKeys.has(`income:${c.name.toLowerCase()}`)) {
          missingRows.push({
            id: uid(), user_id: userId, type: 'income',
            name: c.name, color: c.color, icon: c.icon,
            sort_order: missingRows.length,
          });
        }
      }

      if (missingRows.length > 0) {
        await supabase.from('user_categories').insert(missingRows);
      }

      // Reload all categories
      const { data: allData } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      setExpenseCategories(
        (allData || []).filter(c => c.type === 'expense').map(mapRow)
      );
      setIncomeCategories(
        (allData || []).filter(c => c.type === 'income').map(mapRow)
      );
      setLoading(false);
    };

    load();
  }, [userId]);

  const addCategory = useCallback(async (type, { name, color, icon }) => {
    const list = type === 'expense' ? expenseCategories : incomeCategories;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
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
    const update = (list) =>
      list.map(c => c.id === id ? { ...c, ...fields } : c);

    setExpenseCategories(update);
    setIncomeCategories(update);

    const dbFields = {};
    if (fields.name !== undefined) dbFields.name = fields.name;
    if (fields.color !== undefined) dbFields.color = fields.color;
    if (fields.icon !== undefined) dbFields.icon = fields.icon;

    await supabase.from('user_categories').update(dbFields).eq('id', id);
  }, []);

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
