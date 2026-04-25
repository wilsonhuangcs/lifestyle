import { useMemo, useState } from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function GoalsStrip({ goals, expenses, income, month }) {
  const goalsWithProgress = useMemo(() => goals.map(g => {
    if (!g.categoryId) return { ...g, computed: g.savedAmount || 0 };
    const txns = g.categoryType === 'income' ? income : expenses;
    const today = new Date().toISOString().slice(0, 10);
    const filtered = txns.filter(t => {
      if (t.categoryId !== g.categoryId) return false;
      const d = t.date?.slice(0, 10);
      if (!d) return false;
      if (g.period === 'daily') return d === today;
      if (g.period === 'weekly') {
        const now = new Date();
        const txDate = new Date(d + 'T00:00:00');
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return txDate >= weekStart;
      }
      if (g.period === 'monthly') return d.slice(0, 7) === (month || today.slice(0, 7));
      if (g.period === 'yearly') return d.slice(0, 4) === today.slice(0, 4);
      return true;
    });
    const fromTxns = filtered.reduce((s, t) => s + (t.amount || 0), 0);
    return { ...g, computed: (g.savedAmount || 0) + fromTxns };
  }), [goals, expenses, income, month]);

  if (goalsWithProgress.length === 0) {
    return (
      <div className="mov-goals-empty">
        <span className="material-icons" style={{ fontSize: 22, opacity: 0.3 }}>flag</span>
        <span>No goals yet</span>
      </div>
    );
  }

  return (
    <div className="mov-goals-strip">
      {goalsWithProgress.map(g => {
        const pct = g.targetAmount > 0 ? Math.min((g.computed / g.targetAmount) * 100, 100) : 0;
        return (
          <div key={g.id} className="mov-goal-chip">
            <span className="material-icons mov-goal-icon">{g.icon || 'star'}</span>
            <span className="mov-goal-name">{g.name}</span>
            <div className="mov-goal-bar-track">
              <div
                className="mov-goal-bar-fill"
                style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : '#7c5cfc' }}
              />
            </div>
            <span className="mov-goal-pct">{Math.round(pct)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MobileOverview({
  mode, budget, balance, totalSpent, totalIncome,
  expenses, income, expenseCategories, incomeCategories,
  month, onGoToTransactions,
  goals, onSetBudget, onSetBalance,
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const isBudget = mode === 'budget';
  const netSpent = totalSpent - totalIncome;
  const heroValue = isBudget ? budget - netSpent : balance - netSpent;
  const heroLabel = isBudget ? 'Remaining Budget' : 'Current Balance';
  const heroSub = isBudget && budget > 0
    ? `of ${fmt(budget)} budget`
    : null;

  const startEdit = () => {
    setInputVal(isBudget ? (budget || '') : (balance || ''));
    setEditing(true);
  };

  const commitEdit = () => {
    const val = parseFloat(inputVal);
    if (!isNaN(val) && val >= 0) {
      if (isBudget) onSetBudget?.(val);
      else onSetBalance?.(val);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  };

  const catMap = useMemo(() => new Map(expenseCategories.map(c => [c.id, c])), [expenseCategories]);
  const incCatMap = useMemo(() => new Map(incomeCategories.map(c => [c.id, c])), [incomeCategories]);

  const recentIncome = useMemo(() =>
    [...income].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    [income]
  );
  const recentExpenses = useMemo(() =>
    [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    [expenses]
  );

  return (
    <div className="mov-root">
      {/* Hero — balance + goals */}
      <div className="mov-hero">
        <span className="mov-hero-label">{heroLabel}</span>
        <span className={`mov-hero-amount ${heroValue < 0 ? 'mov-hero-negative' : ''}`}>
          {heroValue < 0 ? '-' : ''}{fmt(Math.abs(heroValue))}
        </span>
        {editing ? (
          <div className="mov-hero-edit-row">
            <input
              className="mov-hero-input"
              type="number"
              min="0"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button className="mov-hero-confirm-btn" onClick={commitEdit}>
              <span className="material-icons">check</span>
            </button>
          </div>
        ) : heroSub ? (
          <span className="mov-hero-sub mov-hero-sub-tap" onClick={startEdit}>{heroSub}</span>
        ) : (
          <span className="mov-hero-set-prompt" onClick={startEdit}>
            {isBudget ? 'Set your monthly budget' : 'Set your starting balance'}
          </span>
        )}
        <GoalsStrip goals={goals || []} expenses={expenses} income={income} month={month} />
      </div>

      {/* Income / Expense summary */}
      <div className="mov-summary-card card">
        <div className="mov-summary-half">
          <span className="mov-summary-label">Income</span>
          <span className="mov-summary-income">{fmt(totalIncome)}</span>
          <button className="mov-summary-add" onClick={onGoToTransactions}>+ Add Income</button>
        </div>
        <div className="mov-summary-divider" />
        <div className="mov-summary-half">
          <span className="mov-summary-label">Expense</span>
          <span className="mov-summary-expense">{fmt(totalSpent)}</span>
          <button className="mov-summary-add" onClick={onGoToTransactions}>+ Add Expense</button>
        </div>
      </div>

      {/* Recent income */}
      {recentIncome.length > 0 && (
        <div className="mov-section">
          <div className="mov-section-header">
            <h3 className="mov-section-title">Income</h3>
            <button className="mov-see-all" onClick={onGoToTransactions}>See all</button>
          </div>
          <ul className="mov-txn-list card">
            {recentIncome.map(item => {
              const cat = incCatMap.get(item.categoryId);
              return (
                <li key={item.id} className="mov-txn-row">
                  <div className="mov-txn-icon" style={{ background: `${cat?.color || '#22c55e'}22`, color: cat?.color || '#22c55e' }}>
                    {cat?.icon || (cat?.name?.[0] ?? 'I').toUpperCase()}
                  </div>
                  <div className="mov-txn-details">
                    <span className="mov-txn-desc">{item.description || cat?.name || 'Income'}</span>
                    <span className="mov-txn-meta">{fmtDate(item.date)}</span>
                  </div>
                  <span className="mov-income-amount">+{fmt(item.amount)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Recent expenses */}
      {recentExpenses.length > 0 && (
        <div className="mov-section">
          <div className="mov-section-header">
            <h3 className="mov-section-title">Spend</h3>
            <button className="mov-see-all" onClick={onGoToTransactions}>See all</button>
          </div>
          <ul className="mov-txn-list card">
            {recentExpenses.map(item => {
              const cat = catMap.get(item.categoryId);
              return (
                <li key={item.id} className="mov-txn-row">
                  <div className="mov-txn-icon" style={{ background: `${cat?.color || '#ef4444'}22`, color: cat?.color || '#ef4444' }}>
                    {cat?.icon || (cat?.name?.[0] ?? 'S').toUpperCase()}
                  </div>
                  <div className="mov-txn-details">
                    <span className="mov-txn-desc">{item.description || cat?.name || 'Expense'}</span>
                    <span className="mov-txn-meta">{fmtDate(item.date)}</span>
                  </div>
                  <span className="mov-expense-amount">-{fmt(item.amount)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {recentIncome.length === 0 && recentExpenses.length === 0 && (
        <div className="mov-empty">
          <span className="material-icons" style={{ fontSize: 40, opacity: 0.25 }}>receipt_long</span>
          <p>No transactions yet this month.</p>
          <button className="btn-add" onClick={onGoToTransactions}>+ Add Transaction</button>
        </div>
      )}
    </div>
  );
}
