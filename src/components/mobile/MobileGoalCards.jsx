import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { GoalForm } from '../GoalCards';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);

const PERIOD_LABEL = {
  daily:    'DAILY',
  weekly:   'WEEKLY',
  monthly:  'MONTHLY',
  yearly:   'YEARLY',
  'one-time': 'ONE-TIME',
};

const LONG_PRESS_MS = 350;
const LONG_PRESS_CANCEL_PX = 8;

function computeSavedAmount(g, expenses, income, month) {
  if (!g.categoryId) return g.savedAmount || 0;
  const txns = g.categoryType === 'income' ? income : expenses;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const filtered = txns.filter(t => {
    if (t.categoryId !== g.categoryId) return false;
    const d = t.date?.slice(0, 10);
    if (!d) return false;
    if (g.period === 'daily') return d === today;
    if (g.period === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return new Date(d + 'T00:00:00') >= weekStart;
    }
    if (g.period === 'monthly') return d.slice(0, 7) === (month || today.slice(0, 7));
    if (g.period === 'yearly') return d.slice(0, 4) === today.slice(0, 4);
    return true;
  });
  const fromTxns = filtered.reduce((s, t) => s + (t.amount || 0), 0);
  return g.goalType === 'limit' ? fromTxns : (g.savedAmount || 0) + fromTxns;
}

function MobileGoalCard({ goal, savedAmount, onEdit, onDelete, isDragging, onCardPointerDown, cardRef }) {
  const target = goal.targetAmount || 0;
  const isLimit = goal.goalType === 'limit';
  const pct = target > 0 ? Math.min(savedAmount / target, 1) : 0;
  const isOver = isLimit && savedAmount > target;
  const color = isOver
    ? '#ef4444'
    : isLimit
      ? '#22c55e'
      : '#3b82f6';

  const remaining = target - savedAmount;
  const overBy = savedAmount - target;

  return (
    <div
      ref={cardRef}
      className={`mgc-card ${isOver ? 'over' : ''} ${isDragging ? 'dragging' : ''}`}
      onPointerDown={onCardPointerDown}
    >
      <div className="mgc-card-top">
        <div className="mgc-card-top-left">
          <div
            className="mgc-icon-tile"
            style={{ background: `${color}20`, borderColor: `${color}40`, color }}
          >
            <span className="material-icons">{goal.icon || 'star'}</span>
          </div>
          <div className="mgc-card-meta">
            <span className="mgc-card-name">{goal.name}</span>
            <span className="mgc-card-period">{PERIOD_LABEL[goal.period] || 'ONE-TIME'}</span>
          </div>
        </div>
        <div className="mgc-card-top-right">
          {isOver && <span className="mgc-over-pill">OVER</span>}
          <button
            className="mgc-card-action"
            onClick={() => onEdit(goal)}
            aria-label="Edit goal"
          >
            <span className="material-icons">edit</span>
          </button>
          <button
            className="mgc-card-action"
            onClick={() => onDelete(goal.id)}
            aria-label="Delete goal"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      </div>

      <div className="mgc-amount-row">
        <span className="mgc-current">{fmt(savedAmount)}</span>
        <span className="mgc-target">/ {fmt(target)}</span>
      </div>

      <div className="mgc-bar-track">
        <div className="mgc-bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>

      <div className="mgc-card-footer">
        {Math.round(pct * 100)}% ·{' '}
        {isOver
          ? <span className="mgc-over-text">{fmt(overBy)} over</span>
          : <span>{fmt(Math.max(remaining, 0))} to go</span>}
      </div>
    </div>
  );
}

export default function MobileGoalCards({
  goals, onAddGoal, onUpdateGoal, onDeleteGoal,
  expenseCategories = [], incomeCategories = [],
  expenses = [], income = [], month,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [localOrder, setLocalOrder] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const cardRefs = useRef(new Map());
  const refCallbackCache = useRef(new Map());
  const localOrderRef = useRef(null);
  const orderedGoalsRef = useRef([]);

  const goalsWithSaved = useMemo(
    () => goals.map(g => ({ ...g, savedAmount: computeSavedAmount(g, expenses, income, month) })),
    [goals, expenses, income, month]
  );

  const orderedGoals = useMemo(() => {
    if (!localOrder) return goalsWithSaved;
    return localOrder.map(id => goalsWithSaved.find(g => g.id === id)).filter(Boolean);
  }, [localOrder, goalsWithSaved]);

  orderedGoalsRef.current = orderedGoals;

  // Sync localOrder when goals are added/removed (not on field updates)
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

  const handleSave = async (fields) => {
    await onAddGoal(fields);
    setShowForm(false);
  };

  const handleEditSave = async (fields) => {
    await onUpdateGoal(editingGoal.id, fields);
    setEditingGoal(null);
  };

  // Memoize ref callbacks per id so React doesn't re-run them every render
  // (an unstable ref callback was nulling out the cardRefs map mid-drag).
  const setCardRef = (id) => {
    if (!refCallbackCache.current.has(id)) {
      refCallbackCache.current.set(id, (el) => {
        if (el) cardRefs.current.set(id, el);
        else cardRefs.current.delete(id);
      });
    }
    return refCallbackCache.current.get(id);
  };

  const handleCardPointerDown = (e, goalId) => {
    // Don't initiate drag from the action buttons.
    if (e.target.closest('.mgc-card-action')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const cardEl = cardRefs.current.get(goalId);
    if (!cardEl) return;

    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    const startPointerY = e.clientY;
    let dragActive = false;
    let translateY = 0;
    let startCardTop = 0;
    let longPressTimer = null;

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    };

    const startDrag = () => {
      if (dragActive) return;
      dragActive = true;
      setDraggingId(goalId);
      startCardTop = cardEl.getBoundingClientRect().top;
      cardEl.style.transition = 'none';
      if (isTouch && navigator.vibrate) navigator.vibrate(15);
    };

    const onMove = (ev) => {
      if (!dragActive) {
        const dy = ev.clientY - startPointerY;
        if (isTouch) {
          // Touch: long-press still pending. Cancel if user scrolls past the threshold.
          if (Math.abs(dy) > LONG_PRESS_CANCEL_PX) cleanup();
          return;
        }
        // Mouse / pen with button: activate on any small movement.
        if (Math.abs(dy) < 4) return;
        startDrag();
      }

      ev.preventDefault();

      const rectTop = cardEl.getBoundingClientRect().top;
      const layoutTop = rectTop - translateY;
      const desiredTop = startCardTop + (ev.clientY - startPointerY);
      const next = desiredTop - layoutTop;
      if (Number.isFinite(next)) {
        translateY = next;
        cardEl.style.transform = `translateY(${translateY}px)`;
      }

      const cards = orderedGoalsRef.current;
      const draggingIdx = cards.findIndex(g => g.id === goalId);
      if (draggingIdx === -1) return;

      const draggingMid = desiredTop + cardEl.offsetHeight / 2;

      let targetIdx = draggingIdx;
      for (let i = 0; i < cards.length; i++) {
        if (i === draggingIdx) continue;
        const ref = cardRefs.current.get(cards[i].id);
        if (!ref) continue;
        const r = ref.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (i < draggingIdx && draggingMid < mid) { targetIdx = i; break; }
        if (i > draggingIdx && draggingMid > mid) targetIdx = i;
      }

      if (targetIdx !== draggingIdx) {
        setLocalOrder(prev => {
          const order = prev || cards.map(g => g.id);
          const fromIdx = order.indexOf(goalId);
          if (fromIdx === -1) return prev;
          const ord = [...order];
          const [dragged] = ord.splice(fromIdx, 1);
          ord.splice(targetIdx, 0, dragged);
          localOrderRef.current = ord;
          return ord;
        });
      }
    };

    const onUp = () => {
      if (dragActive) {
        cardEl.style.transition = '';
        cardEl.style.transform = '';
        setDraggingId(null);
        const finalOrder = localOrderRef.current;
        if (finalOrder) {
          finalOrder.forEach((id, i) => onUpdateGoal(id, { sortOrder: i }));
          localOrderRef.current = null;
        }
      }
      cleanup();
    };

    if (isTouch) {
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        startDrag();
      }, LONG_PRESS_MS);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <div className="mgc-root">
      {showForm && (
        <GoalForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
        />
      )}

      <div className="mgc-list">
        {orderedGoals.map(g => (
          <Fragment key={g.id}>
            <MobileGoalCard
              goal={g}
              savedAmount={g.savedAmount}
              onEdit={setEditingGoal}
              onDelete={onDeleteGoal}
              isDragging={draggingId === g.id}
              cardRef={setCardRef(g.id)}
              onCardPointerDown={(e) => handleCardPointerDown(e, g.id)}
            />
            {editingGoal?.id === g.id && (
              <GoalForm
                initial={editingGoal}
                onSave={handleEditSave}
                onCancel={() => setEditingGoal(null)}
                expenseCategories={expenseCategories}
                incomeCategories={incomeCategories}
              />
            )}
          </Fragment>
        ))}

        <button className="mgc-add-card" onClick={() => setShowForm(true)}>
          <div className="mgc-add-icon">
            <span className="material-icons">add</span>
          </div>
          <span className="mgc-add-label">Add Goal</span>
        </button>
      </div>
    </div>
  );
}
