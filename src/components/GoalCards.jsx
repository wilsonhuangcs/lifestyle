import { useState, useRef, useEffect, useMemo } from 'react';

function FittedText({ text, className, maxSize = 17, minSize = 9 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = maxSize;
    el.style.fontSize = size + 'px';
    while (el.scrollWidth > el.offsetWidth && size > minSize) {
      size -= 0.5;
      el.style.fontSize = size + 'px';
    }
  });

  return <span ref={ref} className={className} style={{ whiteSpace: 'nowrap', display: 'block' }}>{text}</span>;
}

const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);

const PERIODS = [
  { value: 'daily',    label: 'Daily' },
  { value: 'weekly',   label: 'Weekly' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'yearly',   label: 'Yearly' },
  { value: 'one-time', label: 'One-time' },
];

const ICON_OPTIONS = [
  'flight', 'home', 'directions_car', 'laptop', 'sports_esports',
  'phone_iphone', 'tv', 'camera_alt', 'headphones', 'watch',
  'shopping_bag', 'restaurant', 'fitness_center', 'beach_access',
  'school', 'medical_services', 'pets', 'music_note', 'celebration',
  'card_giftcard', 'savings', 'star', 'favorite', 'build',
  'brush', 'directions_bike', 'hiking', 'kayaking', 'wedding',
];

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="icon-picker">
      <button type="button" className="icon-picker-trigger" onClick={() => setOpen(v => !v)} title="Pick icon">
        <span className="material-icons">{value || 'star'}</span>
      </button>
      {open && (
        <div className="icon-picker-grid">
          {ICON_OPTIONS.map(icon => (
            <button
              key={icon}
              type="button"
              className={`icon-picker-option ${value === icon ? 'selected' : ''}`}
              onClick={() => { onChange(icon); setOpen(false); }}
              title={icon.replace(/_/g, ' ')}
            >
              <span className="material-icons">{icon}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const GOAL_TYPES = [
  { value: 'savings', label: 'Savings',       icon: 'savings',       desc: 'Save up towards a target' },
  { value: 'limit',   label: 'Spending Limit', icon: 'money_off',     desc: 'Stay under a spending cap' },
];

export function GoalForm({ onSave, onCancel, initial, expenseCategories = [], incomeCategories = [] }) {
  const [goalType, setGoalType] = useState(initial?.goalType || 'savings');
  const [name, setName] = useState(initial?.name || '');
  const [target, setTarget] = useState(initial?.targetAmount?.toString() || '');
  const [saved, setSaved] = useState(initial?.savedAmount > 0 ? initial.savedAmount.toString() : '');
  const [period, setPeriod] = useState(initial?.period || 'one-time');
  const [icon, setIcon] = useState(initial?.icon || 'star');
  const [categoryType, setCategoryType] = useState(initial?.categoryType || 'expense');
  const [categoryId, setCategoryId] = useState(initial?.categoryId || '');

  const isLimit = goalType === 'limit';
  const categoryOptions = categoryType === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(target);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    const savedAmt = parseFloat(saved);
    onSave({
      goalType,
      name: name.trim(),
      targetAmount: amt,
      savedAmount: !isNaN(savedAmt) && savedAmt > 0 ? savedAmt : 0,
      period,
      icon,
      categoryId: categoryId || null,
      categoryType: categoryId ? categoryType : null,
    });
  };

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      {/* Goal type toggle */}
      <div className="goal-type-toggle">
        {GOAL_TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            className={`goal-type-btn ${goalType === t.value ? 'active' : ''}`}
            onClick={() => setGoalType(t.value)}
          >
            <span className="material-icons">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="goal-form-row">
        <IconPicker value={icon} onChange={setIcon} />
        <input
          className="goal-form-input"
          placeholder={isLimit ? 'Goal name (e.g. Eating Out)' : 'Goal name (e.g. PS5)'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="goal-form-period-row">
        {PERIODS.map(p => (
          <button
            key={p.value}
            type="button"
            className={`goal-period-btn ${period === p.value ? 'active' : ''}`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <input
        className="goal-form-input"
        type="number"
        placeholder={isLimit ? 'Spending limit' : 'Target amount'}
        min="0.01"
        step="0.01"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />

      <div className="goal-form-category-section">
        <span className="goal-form-category-label">Link to category (optional)</span>
        <div className="goal-form-cat-type-row">
          {['expense', 'income'].map(t => (
            <button
              key={t}
              type="button"
              className={`goal-period-btn ${categoryType === t ? 'active' : ''}`}
              onClick={() => { setCategoryType(t); setCategoryId(''); }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="goal-form-input goal-form-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">— No category —</option>
          {categoryOptions.map(c => (
            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
          ))}
        </select>
      </div>

      {!isLimit && (
        <input
          className="goal-form-input"
          type="number"
          placeholder="Amount saved so far (optional)"
          min="0"
          step="0.01"
          value={saved}
          onChange={(e) => setSaved(e.target.value)}
        />
      )}
      <div className="goal-form-actions">
        <button type="submit" className="goal-form-save">Save</button>
        <button type="button" className="goal-form-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function GoalCard({ goal, onEdit, onDelete, isDragging, isDragOver, onDragStart, onDragEnter, onDragEnd }) {
  const isLimit = goal.goalType === 'limit';
  const spent = goal.savedAmount || 0;
  const target = goal.targetAmount || 0;
  const pct = target > 0 ? Math.min((spent / target) * 100, 100) : 0;
  const periodLabel = PERIODS.find(p => p.value === (goal.period || 'one-time'))?.label || '';

  const isOver = isLimit && spent > target;
  const isUnder = isLimit && target > 0 && spent <= target;
  const isAchieved = !isLimit && pct >= 100;
  const isInProgress = !isLimit && pct > 0 && pct < 100;

  const cardClass = [
    'goal-card',
    isDragging ? 'goal-card--dragging' : '',
    isDragOver ? 'goal-card--drag-over' : '',
    isOver     ? 'goal-card--over-limit'  : '',
    (isUnder || isAchieved) ? 'goal-card--success' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={e => e.preventDefault()}
      onDragEnd={onDragEnd}
    >
      <div className="goal-card-actions">
        <button className="goal-card-action-btn" onClick={() => onEdit(goal)} title="Edit">
          <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
        </button>
        <button className="goal-card-action-btn goal-card-delete-btn" onClick={() => onDelete(goal.id)} title="Delete">
          <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
        </button>
      </div>

      {/* Status badge */}
      {(isLimit || isAchieved || isInProgress) && (
        <div className={`goal-card-status-badge ${isOver ? 'over' : isInProgress ? 'progress' : 'under'}`}>
          <span className="material-icons">
            {isOver ? 'warning' : isAchieved ? 'emoji_events' : isInProgress ? 'trending_up' : 'check_circle'}
          </span>
          {isOver ? 'Over limit' : isAchieved ? 'Achieved!' : isInProgress ? 'In Progress' : 'On track'}
        </div>
      )}

      {/* Faded base icon */}
      <span className="material-icons goal-card-icon-bg">{goal.icon || 'star'}</span>

      {/* Filled icon — green fill for savings, red fill for limit goals */}
      {spent > 0 && (
        <span
          className="material-icons goal-card-icon-fill"
          style={{
            clipPath: `inset(${100 - pct}% 0 0 0)`,
            color: isLimit ? (isOver ? '#ef4444' : '#22c55e') : undefined,
          }}
        >
          {goal.icon || 'star'}
        </span>
      )}

      <FittedText text={goal.name} className="goal-card-name" />

      <div className="goal-card-period-badge">{periodLabel}</div>

      <div className="goal-card-budget-section">
        <span className="goal-card-budget-label">{isLimit ? 'LIMIT' : 'GOAL'}</span>
        <FittedText text={formatCurrency(target)} className="goal-card-budget-amount" maxSize={22} minSize={10} />
      </div>

      <div className="goal-card-hover-overlay">
        {isLimit ? (
          <>
            <span className="goal-card-hover-label">{isOver ? 'Over by' : 'Spent'}</span>
            <span className="goal-card-hover-amount" style={{ color: isOver ? '#ef4444' : '#22c55e' }}>
              {isOver ? formatCurrency(spent - target) : formatCurrency(spent)}
            </span>
            <span className="goal-card-hover-pct">
              {isOver
                ? `${formatCurrency(spent - target)} over limit`
                : `${formatCurrency(target - spent)} remaining`}
            </span>
          </>
        ) : (
          <>
            <span className="goal-card-hover-label">Currently Saved</span>
            <span className="goal-card-hover-amount">{formatCurrency(spent)}</span>
            <span className="goal-card-hover-pct">{pct >= 100 ? 'Woohoo! Goal achieved!' : `${Math.round(pct)}% of goal`}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoalCards({ goals, onAddGoal, onUpdateGoal, onDeleteGoal, expenseCategories = [], incomeCategories = [], expenses = [], income = [], allExpenses = [], allIncome = [], userId, month }) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const titleKey = `goalsTitle:${userId}`;
  const [title, setTitle] = useState(() => localStorage.getItem(titleKey) || 'My Goals');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(() => localStorage.getItem(titleKey) || 'My Goals');
  const [localOrder, setLocalOrder] = useState(null); // null = use goals prop order
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const dragId = useRef(null);
  const localOrderRef = useRef(null);

  // For savings goals, merge all-time data with current month's live data (dedup by id)
  const mergedExpenses = useMemo(() => {
    const map = new Map(allExpenses.map(t => [t.id, t]));
    expenses.forEach(t => map.set(t.id, t));
    return [...map.values()];
  }, [allExpenses, expenses]);

  const mergedIncome = useMemo(() => {
    const map = new Map(allIncome.map(t => [t.id, t]));
    income.forEach(t => map.set(t.id, t));
    return [...map.values()];
  }, [allIncome, income]);

  // Compute savedAmount from linked category transactions, scoped to the goal's period
  const goalsWithComputed = useMemo(() => goals.map(g => {
    if (!g.categoryId) return g;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (g.goalType === 'limit') {
      // Limit goals: current month only
      const txns = g.categoryType === 'income' ? income : expenses;
      const fromTransactions = txns
        .filter(t => t.categoryId === g.categoryId)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      return { ...g, savedAmount: fromTransactions };
    }

    // Savings goals: all-time transactions merged with current month's live data
    const txns = g.categoryType === 'income' ? mergedIncome : mergedExpenses;
    const filtered = txns.filter(t => {
      if (t.categoryId !== g.categoryId) return false;
      const d = t.date?.slice(0, 10);
      if (!d) return false;
      if (g.period === 'daily') return d === today;
      if (g.period === 'weekly') {
        const txDate = new Date(d + 'T00:00:00');
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        return txDate >= weekStart;
      }
      if (g.period === 'monthly') return d.slice(0, 7) === (month || today.slice(0, 7));
      if (g.period === 'yearly') return d.slice(0, 4) === today.slice(0, 4);
      return true;
    });
    const fromTransactions = filtered.reduce((sum, t) => sum + (t.amount || 0), 0);
    return { ...g, savedAmount: (g.savedAmount || 0) + fromTransactions };
  }), [goals, expenses, income, mergedExpenses, mergedIncome, month]);

  // Apply local drag-reorder on top of computed goals
  const orderedGoals = useMemo(() => {
    if (!localOrder) return goalsWithComputed;
    return localOrder.map(id => goalsWithComputed.find(g => g.id === id)).filter(Boolean);
  }, [localOrder, goalsWithComputed]);

  // Sync localOrder only when goals are added or deleted (not on field updates)
  const goalIds = goals.map(g => g.id).join(',');
  useEffect(() => {
    setLocalOrder(prev => {
      if (!prev) return goals.map(g => g.id);
      const newIds = goals.map(g => g.id);
      const kept = prev.filter(id => newIds.includes(id));
      const added = newIds.filter(id => !prev.includes(id));
      return [...kept, ...added];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalIds]);

  const handleDragStart = (id) => {
    dragId.current = id;
    setDraggingId(id);
  };

  const handleDragEnter = (overId) => {
    setDragOverId(overId);
    if (!dragId.current || dragId.current === overId) return;
    const fromId = dragId.current;
    setLocalOrder(prev => {
      const order = prev ? [...prev] : goals.map(g => g.id);
      const fromIndex = order.indexOf(fromId);
      const toIndex = order.indexOf(overId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...order];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, fromId);
      localOrderRef.current = next;
      return next;
    });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
    dragId.current = null;
    const finalOrder = localOrderRef.current;
    if (finalOrder) {
      finalOrder.forEach((id, i) => onUpdateGoal(id, { sortOrder: i }));
    }
  };

  const handleSave = async (fields) => {
    await onAddGoal(fields);
    setShowForm(false);
  };

  const handleEditSave = async (fields) => {
    await onUpdateGoal(editingGoal.id, fields);
    setEditingGoal(null);
  };

  const handleTitleSubmit = () => {
    const t = titleDraft.trim();
    if (t) { setTitle(t); localStorage.setItem(titleKey, t); }
    setEditingTitle(false);
  };

  return (
    <div className="card goal-cards-section">
      <div className="goal-cards-header">
        {editingTitle ? (
          <input
            className="goal-title-input"
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={e => { if (e.key === 'Enter') handleTitleSubmit(); if (e.key === 'Escape') setEditingTitle(false); }}
            autoFocus
          />
        ) : (
          <h2 className="goal-title-editable" onClick={() => { setTitleDraft(title); setEditingTitle(true); }} title="Click to rename">{title}</h2>
        )}
        <button className="goal-add-goal-btn" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {showForm && (
        <GoalForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
        />
      )}

      {editingGoal && (
        <div className="goal-edit-overlay">
          <GoalForm
            initial={editingGoal}
            onSave={handleEditSave}
            onCancel={() => setEditingGoal(null)}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
          />
        </div>
      )}

      {orderedGoals.length === 0 && !showForm ? (
        <p className="goal-empty">No goals yet. Add something you're saving for!</p>
      ) : (
        <div className="goal-cards-grid">
          {orderedGoals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={setEditingGoal}
              onDelete={onDeleteGoal}
              isDragging={draggingId === g.id}
              isDragOver={dragOverId === g.id && draggingId !== g.id}
              onDragStart={() => handleDragStart(g.id)}
              onDragEnter={() => handleDragEnter(g.id)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
