import { useMemo, useState, useRef } from 'react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(amount);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const lsKey = (userId) => `sc_daily_budget_override:${userId}`;

function getDayColor(net, dailyBudget, isFuture, hasActivity) {
  if (isFuture || !hasActivity) return null;
  if (net <= 0) return 'under'; // income >= expenses → surplus, always green
  if (dailyBudget <= 0) return 'under';
  if (net < dailyBudget) return 'under';
  if (net === dailyBudget) return null;
  return 'over';
}

export default function SpendingCalendar({ expenses, income = [], effectiveBudget, month, expenseCategories, userId }) {
  const [tooltip, setTooltip] = useState(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [override, setOverride] = useState(() => {
    const saved = localStorage.getItem(lsKey(userId));
    return saved !== null ? parseFloat(saved) : null;
  });
  const budgetInputRef = useRef(null);

  const catMap = useMemo(
    () => new Map(expenseCategories.map(c => [c.id, c])),
    [expenseCategories]
  );

  const { year, mon, daysInMonth, startDow, autoDailyBudget, dailyTotals, today } = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    const dow = new Date(y, m - 1, 1).getDay();
    const db = effectiveBudget > 0 ? effectiveBudget / dim : 0;

    const totals = new Map(); // day -> { spent, earned, net, expenseItems[], incomeItems[] }
    for (const e of expenses) {
      const day = new Date(e.date).getDate();
      if (!totals.has(day)) totals.set(day, { spent: 0, earned: 0, net: 0, expenseItems: [], incomeItems: [] });
      const entry = totals.get(day);
      entry.spent += e.amount;
      entry.expenseItems.push(e);
    }
    for (const i of income) {
      const day = new Date(i.date).getDate();
      if (!totals.has(day)) totals.set(day, { spent: 0, earned: 0, net: 0, expenseItems: [], incomeItems: [] });
      const entry = totals.get(day);
      entry.earned += i.amount;
      entry.incomeItems.push(i);
    }
    for (const entry of totals.values()) {
      entry.net = entry.spent - entry.earned;
    }

    const now = new Date();
    const t = now.getFullYear() === y && now.getMonth() + 1 === m ? now.getDate() : null;

    return { year: y, mon: m, daysInMonth: dim, startDow: dow, autoDailyBudget: db, dailyTotals: totals, today: t };
  }, [expenses, income, effectiveBudget, month]);

  const dailyBudget = override !== null ? override : autoDailyBudget;
  const isOverridden = override !== null;

  const startBudgetEdit = () => {
    setBudgetInput(dailyBudget > 0 ? dailyBudget.toFixed(2) : '');
    setEditingBudget(true);
    setTimeout(() => budgetInputRef.current?.select(), 0);
  };

  const commitBudgetEdit = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      setOverride(val);
      localStorage.setItem(lsKey(userId), val.toString());
    }
    setEditingBudget(false);
  };

  const resetToAuto = () => {
    setOverride(null);
    localStorage.removeItem(lsKey(userId));
    setEditingBudget(false);
  };

  // Build grid cells: nulls for leading blanks, then day numbers
  const cells = useMemo(() => {
    const arr = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [startDow, daysInMonth]);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === mon;

  const handleMouseEnter = (e, day) => {
    if (!day) return;
    const parentRect = e.currentTarget.closest('.spending-calendar').getBoundingClientRect();
    const tooltipWidth = 220;
    const rawX = e.clientX - parentRect.left + 12;
    const clampedX = Math.max(tooltipWidth / 2, Math.min(rawX, parentRect.width - tooltipWidth / 2));
    const y = e.clientY - parentRect.top - 12;
    setTooltip({ day, x: clampedX, y });
  };

  const tooltipData = tooltip ? {
    date: new Date(year, mon - 1, tooltip.day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    spent: dailyTotals.get(tooltip.day)?.spent || 0,
    earned: dailyTotals.get(tooltip.day)?.earned || 0,
    net: dailyTotals.get(tooltip.day)?.net || 0,
    expenseItems: dailyTotals.get(tooltip.day)?.expenseItems || [],
    incomeItems: dailyTotals.get(tooltip.day)?.incomeItems || [],
  } : null;

  return (
    <div className="spending-calendar">
      <h2>Spending Calendar</h2>
      <div className="sc-legend">
        <span className="sc-legend-item"><span className="sc-dot under" />Under</span>
        <span className="sc-legend-item"><span className="sc-dot neutral" />No spend / On budget</span>
        <span className="sc-legend-item"><span className="sc-dot over" />Over</span>
        <div className="sc-daily-budget-control">
          <span className="sc-legend-label">Daily Budget:</span>
          {editingBudget ? (
            <div className="sc-budget-edit">
              <input
                ref={budgetInputRef}
                className="sc-budget-input"
                type="number"
                min="0.01"
                step="any"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={commitBudgetEdit}
                onKeyDown={(e) => { if (e.key === 'Enter') commitBudgetEdit(); if (e.key === 'Escape') setEditingBudget(false); }}
                autoFocus
              />
              {isOverridden && (
                <button className="sc-budget-reset" onClick={resetToAuto} title="Reset to auto">Auto</button>
              )}
            </div>
          ) : (
            <button className="sc-budget-value" onClick={startBudgetEdit} title="Click to set daily budget">
              {dailyBudget > 0 ? formatCurrency(dailyBudget) : 'Set budget'}
              <span className="material-icons">edit</span>
            </button>
          )}
        </div>
      </div>
      <div className="sc-grid-header">
        {DAYS.map(d => <span key={d} className="sc-day-name">{d}</span>)}
      </div>
      {dailyTotals.size === 0 && (
        <p className="sc-empty">No spending recorded this month yet.</p>
      )}
      <div className="sc-grid" onMouseLeave={() => setTooltip(null)}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`blank-${idx}`} className="sc-cell sc-cell--blank" />;
          const isFuture = isCurrentMonth && day > now.getDate();
          const data = dailyTotals.get(day);
          const colorClass = getDayColor(data?.net ?? 0, dailyBudget, isFuture, !!data);
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`sc-cell ${colorClass ? `sc-cell--${colorClass}` : 'sc-cell--empty'} ${isToday ? 'sc-cell--today' : ''} ${isFuture ? 'sc-cell--future' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, day)}
            >
              <span className="sc-day-num">{day}</span>
              {data && !isFuture && (
                <span className={`sc-day-amount ${data.net < 0 ? 'sc-day-amount--gain' : ''}`}>
                  {data.net < 0 ? '+' : data.net > 0 ? '−' : ''}{formatCurrency(Math.abs(data.net))}
                </span>
              )}
            </div>
          );
        })}

        {tooltip && tooltipData && (
          <div
            className="sc-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="sc-tooltip-date">{tooltipData.date}</div>
            {tooltipData.expenseItems.length === 0 && tooltipData.incomeItems.length === 0 ? (
              <div className="sc-tooltip-empty">No activity</div>
            ) : (
              <>
                {tooltipData.expenseItems.map(item => {
                  const cat = catMap.get(item.categoryId);
                  return (
                    <div key={item.id} className="sc-tooltip-row">
                      <span className="sc-tooltip-cat">
                        <span className="sc-tooltip-dot" style={{ backgroundColor: cat?.color }} />
                        {item.description || cat?.name}
                      </span>
                      <span className="sc-tooltip-amt">−{formatCurrency(item.amount)}</span>
                    </div>
                  );
                })}
                {tooltipData.incomeItems.map(item => {
                  const cat = catMap.get(item.categoryId);
                  return (
                    <div key={item.id} className="sc-tooltip-row">
                      <span className="sc-tooltip-cat">
                        <span className="sc-tooltip-dot" style={{ backgroundColor: cat?.color ?? '#22c55e' }} />
                        {item.description || cat?.name}
                      </span>
                      <span className="sc-tooltip-amt sc-tooltip-amt--income">+{formatCurrency(item.amount)}</span>
                    </div>
                  );
                })}
                {tooltipData.earned > 0 && (
                  <div className="sc-tooltip-offset">
                    <span>{formatCurrency(tooltipData.spent)} spent − {formatCurrency(tooltipData.earned)} income</span>
                    <span style={tooltipData.net <= 0 ? { color: 'var(--color-success)' } : undefined}>
                      {tooltipData.net <= 0
                        ? `+${formatCurrency(Math.abs(tooltipData.net))} surplus`
                        : formatCurrency(tooltipData.net)}
                    </span>
                  </div>
                )}
                {tooltipData.earned === 0 && (
                  <div className="sc-tooltip-total">
                    <span>Total</span>
                    <span>{formatCurrency(tooltipData.spent)}</span>
                  </div>
                )}
                {dailyBudget > 0 && (() => {
                  const diff = tooltipData.net - dailyBudget;
                  const isOver = diff > 0;
                  return (
                    <div className={`sc-tooltip-budget ${isOver ? 'sc-tooltip-budget--over' : 'sc-tooltip-budget--under'}`}>
                      {isOver
                        ? `${formatCurrency(diff)} over budget`
                        : diff === 0
                          ? 'Exactly on budget'
                          : `${formatCurrency(Math.abs(diff))} under budget`}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
