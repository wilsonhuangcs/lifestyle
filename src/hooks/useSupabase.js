import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useMonth() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());

  const month = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  const isCurrentMonth =
    year === now.getFullYear() && monthIndex === now.getMonth();

  const goToPrevMonth = useCallback(() => {
    if (monthIndex === 0) {
      setYear(y => y - 1);
      setMonthIndex(11);
    } else {
      setMonthIndex(m => m - 1);
    }
  }, [monthIndex]);

  const goToNextMonth = useCallback(() => {
    if (isCurrentMonth) return;
    if (monthIndex === 11) {
      setYear(y => y + 1);
      setMonthIndex(0);
    } else {
      setMonthIndex(m => m + 1);
    }
  }, [monthIndex, isCurrentMonth]);

  const label = new Date(year, monthIndex).toLocaleDateString('en-US', {
    month: 'long',
  });

  return { month, label, isCurrentMonth, goToPrevMonth, goToNextMonth };
}

function getPrevMonth(month) {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

async function calcPrevMonthEndBalance(userId, prevMonth) {
  // Get previous month's budget row
  const { data: prevBudget } = await supabase
    .from('budget')
    .select('amount, balance, mode')
    .eq('user_id', userId)
    .eq('month', prevMonth)
    .single();

  if (!prevBudget) return { carryBalance: 0, prevBudgetAmount: 0, carryMode: 'budget' };

  const prevStart = `${prevMonth}-01T00:00:00.000Z`;
  const [py, pm] = prevMonth.split('-').map(Number);
  const prevEnd = new Date(py, pm, 1).toISOString();

  // Sum previous month's expenses and income
  const { data: expRows } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('date', prevStart)
    .lt('date', prevEnd);

  const { data: incRows } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', userId)
    .gte('date', prevStart)
    .lt('date', prevEnd);

  const totalExpenses = (expRows || []).reduce((s, r) => s + Number(r.amount), 0);
  const totalIncome = (incRows || []).reduce((s, r) => s + Number(r.amount), 0);

  // Balance carries forward: starting balance + income - expenses
  const carryBalance = Number(prevBudget.balance) + totalIncome - totalExpenses;
  // Budget resets to the same base amount
  const prevBudgetAmount = Number(prevBudget.amount);

  return { carryBalance, prevBudgetAmount, carryMode: prevBudget.mode };
}

export function useBudget(userId, month) {
  const [budget, setBudgetState] = useState(0);
  const [balance, setBalanceState] = useState(0);
  const [mode, setModeState] = useState('budget');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !month) return;
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const { data } = await supabase
        .from('budget')
        .select('amount, balance, mode')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      if (cancelled) return;
      if (data) {
        setBudgetState(data.amount);
        setBalanceState(data.balance);
        setModeState(data.mode);
      } else {
        const prev = getPrevMonth(month);
        const { carryBalance, prevBudgetAmount, carryMode } = await calcPrevMonthEndBalance(userId, prev);
        if (cancelled) return;
        setBudgetState(prevBudgetAmount);
        setBalanceState(carryBalance);
        setModeState(carryMode);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId, month]);

  const upsertBudget = useCallback(async (fields) => {
    await supabase
      .from('budget')
      .upsert(
        { user_id: userId, month, amount: budget, balance, mode, ...fields },
        { onConflict: 'user_id,month' }
      );
  }, [userId, month, budget, balance, mode]);

  const setBudget = useCallback(async (amount) => {
    setBudgetState(amount);
    await upsertBudget({ amount });
  }, [upsertBudget]);

  const setBalance = useCallback(async (newBalance) => {
    setBalanceState(newBalance);
    await upsertBudget({ balance: newBalance });
  }, [upsertBudget]);

  const setMode = useCallback(async (newMode) => {
    setModeState(newMode);
    await upsertBudget({ mode: newMode });
  }, [upsertBudget]);

  return { budget, setBudget, balance, setBalance, mode, setMode, loading };
}

function useMonthlyTransactions(table, userId, month) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const startDate = `${month}-01T00:00:00.000Z`;
  const [y, m] = month.split('-').map(Number);
  const endDate = new Date(y, m, 1).toISOString();

  useEffect(() => {
    if (!userId || !month) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setItems(data.map(r => ({
            id: r.id,
            categoryId: r.category_id,
            amount: r.amount,
            description: r.description,
            date: r.date,
            cardId: r.card_id ?? null,
          })));
        } else {
          setItems([]);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, month]);

  const addItem = useCallback(async ({ categoryId, amount, description, date: customDate, cardId }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const date = customDate || new Date().toISOString();
    const newItem = { id, categoryId, amount, description, date, cardId: cardId ?? null };

    setItems(prev => [newItem, ...prev]);

    await supabase.from(table).insert({
      id,
      category_id: categoryId,
      amount,
      description,
      date,
      user_id: userId,
      ...(cardId !== undefined ? { card_id: cardId ?? null } : {}),
    });
  }, [userId, table]);

  const updateItem = useCallback(async (id, fields) => {
    setItems(prev => prev.map(e => e.id === id ? { ...e, ...fields } : e));

    const dbFields = {};
    if (fields.categoryId !== undefined) dbFields.category_id = fields.categoryId;
    if (fields.amount !== undefined) dbFields.amount = fields.amount;
    if (fields.description !== undefined) dbFields.description = fields.description;
    if (fields.date !== undefined) dbFields.date = fields.date;
    if (fields.cardId !== undefined) dbFields.card_id = fields.cardId;

    await supabase.from(table).update(dbFields).eq('id', id);
  }, [table]);

  const deleteItem = useCallback(async (id) => {
    setItems(prev => prev.filter(e => e.id !== id));
    await supabase.from(table).delete().eq('id', id);
  }, [table]);

  return [items, addItem, updateItem, deleteItem, loading];
}

export function useExpenses(userId, month) {
  return useMonthlyTransactions('expenses', userId, month);
}

export function useIncome(userId, month) {
  return useMonthlyTransactions('income', userId, month);
}

function useAllTransactions(table, userId) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from(table)
      .select('id, category_id, amount, date')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!cancelled && data) {
          setItems(data.map(r => ({ id: r.id, categoryId: r.category_id, amount: r.amount, date: r.date })));
        }
      });
    return () => { cancelled = true; };
  }, [userId, table]);

  return items;
}

export function useAllExpenses(userId) { return useAllTransactions('expenses', userId); }
export function useAllIncome(userId) { return useAllTransactions('income', userId); }
