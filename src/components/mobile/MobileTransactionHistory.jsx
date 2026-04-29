import { useMemo, useState } from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);

const fmtMonthDay = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

const PERIODS = [
  { id: 'day',   label: 'Day'   },
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
];

const TYPE_FILTERS = [
  { id: 'all',     label: 'All'      },
  { id: 'expense', label: 'Expenses' },
  { id: 'income',  label: 'Income'   },
];

function groupByDate(items) {
  const today = startOfDay(new Date()).getTime();
  const yesterday = today - 86400000;
  const map = new Map();
  for (const item of items) {
    const d = startOfDay(new Date(item.date)).getTime();
    let label;
    if (d === today)         label = `Today · ${fmtMonthDay(item.date)}`;
    else if (d === yesterday) label = `Yesterday · ${fmtMonthDay(item.date)}`;
    else                      label = fmtMonthDay(item.date);
    if (!map.has(label)) map.set(label, { sortKey: d, items: [] });
    map.get(label).items.push(item);
  }
  return [...map.entries()]
    .sort((a, b) => b[1].sortKey - a[1].sortKey)
    .map(([label, group]) => ({ label, items: group.items }));
}

export default function MobileTransactionHistory({
  expenses, income,
  expenseCategories, incomeCategories,
  onDeleteExpense, onDeleteIncome,
}) {
  const [period, setPeriod] = useState('day');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const catMap = useMemo(() => new Map(expenseCategories.map(c => [c.id, c])), [expenseCategories]);
  const incCatMap = useMemo(() => new Map(incomeCategories.map(c => [c.id, c])), [incomeCategories]);

  const inPeriod = (dateStr) => {
    const d = startOfDay(new Date(dateStr));
    const now = startOfDay(new Date());
    if (period === 'day') return d.getTime() === now.getTime();
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      return d >= weekAgo;
    }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const allItems = useMemo(() => {
    const exp = typeFilter !== 'income'  ? expenses.filter(e => inPeriod(e.date)).map(e => ({ ...e, type: 'expense' })) : [];
    const inc = typeFilter !== 'expense' ? income.filter(e => inPeriod(e.date)).map(i => ({ ...i, type: 'income' }))  : [];
    const combined = [...exp, ...inc].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!searchQuery.trim()) return combined;
    const q = searchQuery.toLowerCase();
    return combined.filter(item => {
      const cat = item.type === 'income' ? incCatMap.get(item.categoryId) : catMap.get(item.categoryId);
      return (item.description || '').toLowerCase().includes(q) ||
             (cat?.name || '').toLowerCase().includes(q);
    });
  }, [expenses, income, period, typeFilter, searchQuery, catMap, incCatMap]);

  const groups = useMemo(() => groupByDate(allItems), [allItems]);

  return (
    <div className="mth-root">
      {/* Search */}
      <div className="mth-search">
        <span className="material-icons mth-search-icon">search</span>
        <input
          className="mth-search-field"
          placeholder="Search…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Type filter — All / Expenses / Income */}
      <div className="mth-segmented">
        {TYPE_FILTERS.map(t => (
          <button
            key={t.id}
            className={`mth-segmented-btn ${typeFilter === t.id ? 'active' : ''}`}
            onClick={() => setTypeFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period chips */}
      <div className="mth-chip-row">
        {PERIODS.map(p => (
          <button
            key={p.id}
            className={`mth-chip ${period === p.id ? 'active' : ''}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Grouped list */}
      {groups.length === 0 ? (
        <p className="mth-empty">No transactions for this period.</p>
      ) : (
        <div className="mth-groups">
          {groups.map(group => (
            <div key={group.label} className="mth-group">
              <div className="mth-group-label">{group.label.toUpperCase()}</div>
              <div className="mth-group-card">
                {group.items.map((item, i) => {
                  const isIncome = item.type === 'income';
                  const cat = isIncome ? incCatMap.get(item.categoryId) : catMap.get(item.categoryId);
                  const color = cat?.color || (isIncome ? '#22c55e' : '#ef4444');
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`mth-row ${i < group.items.length - 1 ? 'has-border' : ''}`}
                    >
                      <div
                        className="mth-row-icon"
                        style={{ background: `${color}26`, borderColor: `${color}40` }}
                      >
                        {cat?.icon ? (
                          <span className="material-icons" style={{ color, fontSize: 16 }}>{cat.icon}</span>
                        ) : (
                          <span className="mth-row-dot" style={{ background: color }} />
                        )}
                      </div>
                      <div className="mth-row-text">
                        <span className="mth-row-name">
                          {item.description || cat?.name || (isIncome ? 'Income' : 'Expense')}
                        </span>
                        <span className="mth-row-cat">{cat?.name || '—'}</span>
                      </div>
                      <button
                        className={`mth-row-amount ${isIncome ? 'pos' : ''}`}
                        onClick={() => isIncome ? onDeleteIncome?.(item.id) : onDeleteExpense?.(item.id)}
                        title="Delete"
                      >
                        {isIncome ? '+' : '−'}{fmt(Math.abs(item.amount))}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
