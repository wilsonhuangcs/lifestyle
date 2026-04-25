import { useState } from 'react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(amount);

export default function BudgetHeader({
  mode, onSetMode,
  budget, onSetBudget,
  balance, onSetBalance,
  totalIncome, totalSpent,
  monthLabel, isCurrentMonth, onPrevMonth, onNextMonth,
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const isBudgetMode = mode === 'budget';

  const netSpent = totalSpent - totalIncome;
  const budgetRemaining = budget - netSpent;
  const currentBalance = balance - netSpent;

  const percentage = isBudgetMode && budget > 0
    ? Math.min((netSpent / budget) * 100, 100)
    : 0;

  const startEdit = () => {
    setInputValue(isBudgetMode ? budget.toString() : balance.toString());
    setEditing(true);
  };

  const handleSubmit = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val >= 0) {
      if (isBudgetMode && onSetBudget) onSetBudget(val);
      else if (onSetBalance) onSetBalance(val);
    }
    setEditing(false);
  };

  return (
    <div className="budget-page-header">
      {/* Title row */}
      <div className="budget-title-row">
        <div>
          <h1 className="budget-page-title">Budget</h1>
          <p className="budget-page-subtitle">Track your spending and income for {monthLabel}.</p>
        </div>
        <div className="budget-title-actions">
          <div className="header-month-nav">
            <button className="header-month-btn" onClick={onPrevMonth}>&larr;</button>
            <span className="header-month-label">{monthLabel}</span>
            <button className="header-month-btn" onClick={onNextMonth} disabled={isCurrentMonth}>&rarr;</button>
          </div>
          {onSetMode && (
            <div className="mode-toggle">
              <button className={`mode-btn ${isBudgetMode ? 'active' : ''}`} onClick={() => onSetMode('budget')}>Budget</button>
              <button className={`mode-btn ${!isBudgetMode ? 'active' : ''}`} onClick={() => onSetMode('tracker')}>Tracker</button>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="budget-stat-cards">
        {/* Card 1: Budget / Balance — featured */}
        <div className="budget-stat-card budget-stat-card--featured">
          <span className="budget-stat-card-label">{isBudgetMode ? 'Monthly Budget' : 'Starting Balance'}</span>
          {editing ? (
            <input
              className="budget-input"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          ) : (
            <span className="budget-stat-card-value clickable" onClick={startEdit}>
              {(isBudgetMode ? budget : balance) > 0 ? formatCurrency(isBudgetMode ? budget : balance) : 'Click to set'}
            </span>
          )}
          <span className="budget-stat-card-sub">Click to edit</span>
        </div>

        {/* Card 2: Income */}
        <div className="budget-stat-card">
          <span className="budget-stat-card-label">Income</span>
          <span className="budget-stat-card-value income-value">{formatCurrency(totalIncome)}</span>
          <span className="budget-stat-card-sub">This month</span>
        </div>

        {/* Card 3: Expenses */}
        <div className="budget-stat-card">
          <span className="budget-stat-card-label">Expenses</span>
          <span className="budget-stat-card-value expense-value">{formatCurrency(totalSpent)}</span>
          <span className="budget-stat-card-sub">{isBudgetMode ? `Net: ${formatCurrency(netSpent)}` : ''}</span>
        </div>

        {/* Card 4: Remaining / Balance */}
        <div className="budget-stat-card">
          <span className="budget-stat-card-label">{isBudgetMode ? 'Remaining' : 'Current Balance'}</span>
          <span className={`budget-stat-card-value ${
            (isBudgetMode ? budgetRemaining : currentBalance) < 0 ? 'over-budget' : 'under-budget'
          }`}>
            {(isBudgetMode ? budgetRemaining : currentBalance) < 0 && '-'}
            {formatCurrency(Math.abs(isBudgetMode ? budgetRemaining : currentBalance))}
          </span>
          <span className="budget-stat-card-sub">
            {(isBudgetMode ? budgetRemaining : currentBalance) >= 0 ? 'On track' : 'Over budget'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {isBudgetMode && budget > 0 && (
        <div className="overall-progress">
          <div className="progress-bar-track large">
            <div className="progress-bar-fill" style={{ width: `${percentage}%`, backgroundColor: percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#22c55e' }} />
          </div>
          <span className="progress-label">{percentage.toFixed(0)}% of {formatCurrency(budget)}</span>
        </div>
      )}
      {!isBudgetMode && balance > 0 && (
        <div className="overall-progress">
          <div className="progress-bar-track large">
            <div className="progress-bar-fill" style={{
              width: `${Math.min(Math.max((currentBalance / balance) * 100, 0), 100)}%`,
              backgroundColor: currentBalance / balance > 0.5 ? '#22c55e' : currentBalance / balance > 0.2 ? '#f59e0b' : '#ef4444',
            }} />
          </div>
          <span className="progress-label">{(balance > 0 ? (currentBalance / balance) * 100 : 0).toFixed(0)}% of starting balance</span>
        </div>
      )}
    </div>
  );
}
