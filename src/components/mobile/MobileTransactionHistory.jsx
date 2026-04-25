import { useState, useMemo, useRef, useCallback } from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = ((pts[i - 1].x + pts[i].x) / 2).toFixed(1);
    d += ` C ${cpx} ${pts[i - 1].y.toFixed(1)}, ${cpx} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

function DualLineChart({ expenses, income, period }) {
  const W = 300, H = 110, PX = 8, PY = 12;
  const [activeIdx, setActiveIdx] = useState(null);
  const svgRef = useRef(null);

  const buckets = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const currentHour = now.getHours();

    if (period === 'day') {
      return Array.from({ length: currentHour + 1 }, (_, h) => {
        const label = `${h}:00`;
        const exp = expenses.filter(e => {
          const d = new Date(e.date);
          return d.toISOString().slice(0, 10) === todayStr && d.getHours() === h;
        }).reduce((s, e) => s + e.amount, 0);
        const inc = income.filter(e => {
          const d = new Date(e.date);
          return d.toISOString().slice(0, 10) === todayStr && d.getHours() === h;
        }).reduce((s, e) => s + e.amount, 0);
        return { label, exp, inc };
      });
    }

    if (period === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const exp = expenses.filter(e => e.date?.slice(0, 10) === dateStr).reduce((s, e) => s + e.amount, 0);
        const inc = income.filter(e => e.date?.slice(0, 10) === dateStr).reduce((s, e) => s + e.amount, 0);
        return { label, exp, inc };
      });
    }

    const year = now.getFullYear(), mon = now.getMonth();
    const today = now.getDate();
    return Array.from({ length: today }, (_, i) => {
      const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const label = String(i + 1);
      const exp = expenses.filter(e => e.date?.slice(0, 10) === dateStr).reduce((s, e) => s + e.amount, 0);
      const inc = income.filter(e => e.date?.slice(0, 10) === dateStr).reduce((s, e) => s + e.amount, 0);
      return { label, exp, inc };
    });
  }, [expenses, income, period]);

  const maxVal = Math.max(...buckets.map(b => Math.max(b.exp, b.inc)), 1);
  const toX = (i) => PX + (i / Math.max(buckets.length - 1, 1)) * (W - PX * 2);
  const toY = (v) => PY + (1 - v / maxVal) * (H - PY * 2);

  const expPts = buckets.map((b, i) => ({ x: toX(i), y: toY(b.exp) }));
  const incPts = buckets.map((b, i) => ({ x: toX(i), y: toY(b.inc) }));

  const expPath = smoothPath(expPts);
  const incPath = smoothPath(incPts);

  const expArea = expPts.length > 1 ? `${expPath} L ${expPts[expPts.length-1].x.toFixed(1)} ${H} L ${expPts[0].x.toFixed(1)} ${H} Z` : '';
  const incArea = incPts.length > 1 ? `${incPath} L ${incPts[incPts.length-1].x.toFixed(1)} ${H} L ${incPts[0].x.toFixed(1)} ${H} Z` : '';

  const handleMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const relX = ((clientX - rect.left) / rect.width) * W;
    let nearest = 0, minDist = Infinity;
    expPts.forEach((pt, i) => {
      const d = Math.abs(pt.x - relX);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    setActiveIdx(nearest);
  }, [expPts]);

  const handleEnd = useCallback(() => setActiveIdx(null), []);

  const activeBucket = activeIdx !== null ? buckets[activeIdx] : null;
  const activeExpPt  = activeIdx !== null ? expPts[activeIdx] : null;
  const activeIncPt  = activeIdx !== null ? incPts[activeIdx] : null;

  // Clamp tooltip so it stays within the SVG horizontally
  const tooltipX = activeExpPt
    ? Math.min(Math.max(activeExpPt.x, 50), W - 50)
    : 0;

  return (
    <div className="mth-chart-interactive">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mth-line-svg"
        onMouseMove={handleMove}
        onMouseLeave={handleEnd}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{ touchAction: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mth-exp-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mth-inc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {expArea && <path d={expArea} fill="url(#mth-exp-grad)" />}
        {incArea && <path d={incArea} fill="url(#mth-inc-grad)" />}
        {expPts.length > 1 && <path d={expPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
        {incPts.length > 1 && <path d={incPath} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

        {activeExpPt && (
          <>
            <line x1={activeExpPt.x} y1={PY} x2={activeExpPt.x} y2={H}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={activeExpPt.x} cy={activeExpPt.y} r="4" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
            {activeIncPt && <circle cx={activeIncPt.x} cy={activeIncPt.y} r="4" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />}

            {/* Tooltip rendered inside SVG using foreignObject */}
            <foreignObject
              x={tooltipX - 52}
              y={Math.min(activeExpPt.y, activeIncPt?.y ?? activeExpPt.y) - 58}
              width="104"
              height="52"
              style={{ overflow: 'visible' }}
            >
              <div className="mth-svg-tooltip">
                <span className="mth-svg-tooltip-label">{activeBucket.label}</span>
                <span className="mth-svg-tooltip-exp">▼ {fmt(activeBucket.exp)}</span>
                <span className="mth-svg-tooltip-inc">▲ {fmt(activeBucket.inc)}</span>
              </div>
            </foreignObject>
          </>
        )}
      </svg>
    </div>
  );
}

const PERIODS = [
  { id: 'month', label: 'Month' },
  { id: 'week',  label: 'Week'  },
  { id: 'day',   label: 'Day'   },
];

const TYPE_FILTERS = [
  { id: 'both',    label: 'All'      },
  { id: 'expense', label: 'Expenses' },
  { id: 'income',  label: 'Income'   },
];

export default function MobileTransactionHistory({
  expenses, income,
  expenseCategories, incomeCategories,
  onDeleteExpense, onDeleteIncome,
  onExportPDF,
}) {
  const [period, setPeriod] = useState('month');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [typeFilter, setTypeFilter] = useState('both');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const catMap = useMemo(() => new Map(expenseCategories.map(c => [c.id, c])), [expenseCategories]);
  const incomeCatMap = useMemo(() => new Map(incomeCategories.map(c => [c.id, c])), [incomeCategories]);

  const todayStr = new Date().toISOString().split('T')[0];
  const weekAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; }, []);

  const inPeriod = (dateStr) => {
    if (period === 'day')  return dateStr.startsWith(todayStr);
    if (period === 'week') return new Date(dateStr) >= weekAgo;
    return true;
  };

  const filteredExpenses = useMemo(() => expenses.filter(e => inPeriod(e.date)), [expenses, period]);
  const filteredIncome   = useMemo(() => income.filter(e => inPeriod(e.date)),   [income,    period]);
  const totalSpent = useMemo(() => filteredExpenses.reduce((s, e) => s + e.amount, 0), [filteredExpenses]);

  const allItems = useMemo(() => {
    const exp = typeFilter !== 'income'  ? filteredExpenses.map(e => ({ ...e, type: 'expense' })) : [];
    const inc = typeFilter !== 'expense' ? filteredIncome.map(i  => ({ ...i, type: 'income'  })) : [];
    const combined = [...exp, ...inc].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!searchQuery.trim()) return combined;
    const q = searchQuery.toLowerCase();
    return combined.filter(item => {
      const cat = item.type === 'income' ? incomeCatMap.get(item.categoryId) : catMap.get(item.categoryId);
      return (item.description || '').toLowerCase().includes(q) || (cat?.name || '').toLowerCase().includes(q);
    });
  }, [filteredExpenses, filteredIncome, typeFilter, searchQuery, catMap, incomeCatMap]);

  const currentPeriodLabel = PERIODS.find(p => p.id === period)?.label;

  return (
    <div className="mth-root">

      {/* Top bar: period dropdown + search (centered) */}
      <div className="mth-topbar">
        <div className="mth-period-dropdown-wrap">
          <button className="mth-period-dropdown" onClick={() => setShowPeriodMenu(v => !v)}>
            <span>{currentPeriodLabel}</span>
            <span className="material-icons">expand_more</span>
          </button>
          {showPeriodMenu && (
            <div className="mth-period-menu">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  className={`mth-period-menu-item ${period === p.id ? 'active' : ''}`}
                  onClick={() => { setPeriod(p.id); setShowPeriodMenu(false); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="mth-icon-btn" onClick={() => { setShowSearch(v => !v); setSearchQuery(''); }}>
          <span className="material-icons">{showSearch ? 'close' : 'search'}</span>
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <input
          className="mth-search-input"
          placeholder="Search transactions…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          autoFocus
        />
      )}

      {/* Total spending centered */}
      <div className="mth-total-center">
        <span className="mth-total-label">Total Spending</span>
        <span className="mth-total-amount">{fmt(totalSpent)}</span>
      </div>

      {/* Dual line chart */}
      <div className="mth-chart-wrap">
        <DualLineChart expenses={filteredExpenses} income={filteredIncome} period={period} />
        <div className="mth-chart-legend">
          <span className="mth-legend-dot" style={{ background: '#ef4444' }} />
          <span className="mth-legend-text">Expenses</span>
          <span className="mth-legend-dot" style={{ background: '#22c55e' }} />
          <span className="mth-legend-text">Income</span>
        </div>
      </div>

      {/* Type filter */}
      <div className="mth-type-row">
        {TYPE_FILTERS.map(t => (
          <button key={t.id} className={`mth-period-btn ${typeFilter === t.id ? 'active' : ''}`}
            onClick={() => setTypeFilter(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {allItems.length === 0 ? (
        <p className="mth-empty">No transactions for this period.</p>
      ) : (
        <ul className="mth-txn-list">
          {allItems.map(item => {
            const isIncome = item.type === 'income';
            const cat = isIncome ? incomeCatMap.get(item.categoryId) : catMap.get(item.categoryId);
            return (
              <li key={`${item.type}-${item.id}`} className="mth-txn-row">
                <div className="mth-txn-icon" style={{ background: `${cat?.color || '#7c5cfc'}22`, color: cat?.color || '#7c5cfc' }}>
                  {cat?.icon || (cat?.name?.[0] ?? 'T').toUpperCase()}
                </div>
                <div className="mth-txn-details">
                  <span className="mth-txn-desc">{item.description || cat?.name || 'Transaction'}</span>
                  <span className="mth-txn-meta">{cat?.name ?? ''}{cat ? ' · ' : ''}{fmtDate(item.date)}</span>
                </div>
                <div className="mth-txn-right">
                  <span className={`mth-txn-amount ${isIncome ? 'mth-income' : ''}`}>
                    {isIncome ? '+' : '-'}{fmt(item.amount)}
                  </span>
                  <button className="btn-delete"
                    onClick={() => isIncome ? onDeleteIncome?.(item.id) : onDeleteExpense?.(item.id)}
                    title="Delete">&times;</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
