import { useMemo, useState } from 'react';

const COLORS = {
  green:  '#22c55e',
  red:    '#ef4444',
  purple: '#a855f7',
  teal:   '#14b8a6',
  blue:   '#3b82f6',
  orange: '#f97316',
};

const fmtCurrencyNoCents = (n) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtAmount = (n) => {
  const v = Math.abs(n);
  if (v >= 1000) return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return v.toFixed(2);
};

function SimpleDonut({ size, stroke, segments, gap = 2, trackColor }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = segments.reduce((a, b) => a + b.value, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / sum) * c;
        const offset = -acc;
        acc += len;
        const visibleLen = Math.max(0, len - gap);
        const dash = `${visibleLen} ${c - visibleLen}`;
        return (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={dash}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}

function PairedDonuts({ incomeSegs, expenseSegs, incomeTotal, expenseTotal, D }) {
  const Block = ({ segs, label, total, accent }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{ position: 'relative', width: 130, height: 130 }}>
        <SimpleDonut size={130} stroke={13} segments={segs} trackColor={D.ringTrack} />
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center',
        }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: D.mute, letterSpacing: '0.16em' }}>
              {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: accent, letterSpacing: '-0.02em', marginTop: 3, whiteSpace: 'nowrap' }}>
              {total}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
      <Block segs={incomeSegs}  label="INCOME"   total={incomeTotal}  accent={COLORS.green} />
      <Block segs={expenseSegs} label="EXPENSES" total={expenseTotal} accent={COLORS.red} />
    </div>
  );
}

function StackedBars({ income, expenses, incomeTotal, expenseTotal, D }) {
  const sumI = income.reduce((a, b) => a + b.amount, 0);
  const sumE = expenses.reduce((a, b) => a + b.amount, 0);
  const max = Math.max(sumI, sumE) || 1;

  const Bar = ({ data, sum, label, total, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: color }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: D.dim, letterSpacing: '0.16em' }}>
            {label}
          </span>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: D.text, letterSpacing: '-0.02em' }}>
          {total}
        </span>
      </div>
      <div style={{
        display: 'flex', height: 24, borderRadius: 8, overflow: 'hidden',
        background: D.barTrack,
        width: `${(sum / max) * 100}%`,
        minWidth: 8,
      }}>
        {data.map((s, i) => (
          <div key={s.id} style={{
            flex: s.amount,
            background: s.color,
            marginRight: i < data.length - 1 ? 2 : 0,
          }} />
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Bar data={expenses} sum={sumE} label="EXPENSES" total={expenseTotal} color={COLORS.red} />
      <Bar data={income}   sum={sumI} label="INCOME"   total={incomeTotal}  color={COLORS.green} />
    </div>
  );
}

function CatRow({ name, amount, pct, color, sign, last, D }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: last ? 'none' : `1px solid ${D.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: D.text, fontSize: 14, fontWeight: 500 }}>{name}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: D.mute, letterSpacing: '0.06em' }}>
            {pct}% of total
          </span>
        </div>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: sign === '+' ? COLORS.green : COLORS.red, fontWeight: 500 }}>
        {sign}${amount}
      </span>
    </div>
  );
}

function Segmented({ options, value, onChange, D }) {
  return (
    <div style={{
      display: 'flex', padding: 3, gap: 2,
      background: D.segBg,
      border: `1px solid ${D.border}`,
      borderRadius: 10,
    }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            flex: 1, padding: '8px 0', borderRadius: 7, border: 0,
            background: active ? D.segActive : 'transparent',
            color: active ? D.text : D.dim,
            fontSize: 12, fontWeight: active ? 600 : 500,
            cursor: 'pointer', letterSpacing: '0.01em',
            fontFamily: 'inherit',
          }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ children, D }) {
  return (
    <div style={{ padding: '0 4px 10px', color: D.text, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
      {children}
    </div>
  );
}

export default function MobileAnalytics({
  expenseCategories = [],
  incomeCategories = [],
  spendingByCategory,
  incomeByCategory,
  totalSpent = 0,
  totalIncome = 0,
  monthLabel = '',
  darkMode = true,
}) {
  const [catView, setCatView] = useState('expenses');
  const [chartStyle, setChartStyle] = useState('bars');

  const D = darkMode ? {
    panel:      'rgba(255,255,255,0.04)',
    border:     'rgba(255,255,255,0.10)',
    text:       '#E8E8E8',
    dim:        'rgba(232,232,232,0.55)',
    mute:       'rgba(232,232,232,0.35)',
    heroFrom:   '#1A1A18',
    heroTo:     '#0F0F0E',
    segBg:      'rgba(0,0,0,0.25)',
    segActive:  '#22221F',
    chipBg:     'rgba(0,0,0,0.30)',
    chipActive: '#22221F',
    ringTrack:  'rgba(255,255,255,0.05)',
    barTrack:   'rgba(255,255,255,0.04)',
  } : {
    panel:      'rgba(0,0,0,0.04)',
    border:     'rgba(0,0,0,0.09)',
    text:       '#1e2038',
    dim:        'rgba(30,32,56,0.55)',
    mute:       'rgba(30,32,56,0.35)',
    heroFrom:   '#FAFAFA',
    heroTo:     '#EFEFEF',
    segBg:      'rgba(0,0,0,0.05)',
    segActive:  '#FFFFFF',
    chipBg:     'rgba(0,0,0,0.05)',
    chipActive: '#FFFFFF',
    ringTrack:  'rgba(0,0,0,0.05)',
    barTrack:   'rgba(0,0,0,0.05)',
  };

  const expenseBreakdown = useMemo(() =>
    expenseCategories
      .map(c => ({ id: c.id, name: c.name, amount: spendingByCategory?.get(c.id) || 0, color: c.color || '#888' }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(c => ({ ...c, pct: totalSpent > 0 ? Math.round((c.amount / totalSpent) * 100) : 0 })),
    [expenseCategories, spendingByCategory, totalSpent]
  );

  const incomeBreakdown = useMemo(() =>
    incomeCategories
      .map(c => ({ id: c.id, name: c.name, amount: incomeByCategory?.get(c.id) || 0, color: c.color || '#888' }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(c => ({ ...c, pct: totalIncome > 0 ? Math.round((c.amount / totalIncome) * 100) : 0 })),
    [incomeCategories, incomeByCategory, totalIncome]
  );

  const showingExpenses = catView === 'expenses';
  const catList  = showingExpenses ? expenseBreakdown : incomeBreakdown;
  const catTotal = showingExpenses ? totalSpent : totalIncome;
  const catLabel = showingExpenses ? 'EXPENSES' : 'INCOME';
  const catColor = showingExpenses ? COLORS.red : COLORS.green;
  const catSign  = showingExpenses ? '−' : '+';

  const netValue = totalIncome - totalSpent;
  const monthShort = (monthLabel || '').toUpperCase();

  const expenseSegs = expenseBreakdown.map(s => ({ value: s.amount, color: s.color }));
  const incomeSegs = incomeBreakdown.map(s => ({ value: s.amount, color: s.color }));
  const incomeTotalStr = fmtCurrencyNoCents(totalIncome);
  const expenseTotalStr = fmtCurrencyNoCents(totalSpent);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '0 2px' }}>

      {/* Hero summary card */}
      <div style={{
        background: `linear-gradient(165deg, ${D.heroFrom} 0%, ${D.heroTo} 100%)`,
        borderRadius: 18,
        border: `1px solid ${D.border}`,
        padding: '18px 18px 18px',
      }}>
        {/* Header: net cashflow + chart-style picker */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: D.mute, letterSpacing: '0.18em' }}>
              NET CASHFLOW{monthShort ? ` · ${monthShort}` : ''}
            </div>
            <div style={{
              fontSize: 30, fontWeight: 700,
              color: netValue >= 0 ? COLORS.green : COLORS.red,
              letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 4,
            }}>
              {netValue >= 0 ? '+' : '−'}{fmtCurrencyNoCents(netValue)}
            </div>
          </div>
          <div style={{
            display: 'flex', padding: 3, gap: 2,
            background: D.chipBg,
            border: `1px solid ${D.border}`,
            borderRadius: 9,
          }}>
            {[
              { v: 'bars',  glyph: '▭', label: 'Bars' },
              { v: 'donut', glyph: '◐', label: 'Pair' },
            ].map(o => {
              const active = chartStyle === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setChartStyle(o.v)}
                  aria-label={o.label}
                  title={o.label}
                  style={{
                    width: 26, height: 22, borderRadius: 6, border: 0,
                    background: active ? D.chipActive : 'transparent',
                    color: active ? D.text : D.mute,
                    cursor: 'pointer', fontSize: 12, lineHeight: 1,
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  {o.glyph}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart body — fixed height so container size stays consistent */}
        <div style={{ minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {chartStyle === 'bars' && (
            <StackedBars
              income={incomeBreakdown}
              expenses={expenseBreakdown}
              incomeTotal={incomeTotalStr}
              expenseTotal={expenseTotalStr}
              D={D}
            />
          )}
          {chartStyle === 'donut' && (
            <PairedDonuts
              incomeSegs={incomeSegs}
              expenseSegs={expenseSegs}
              incomeTotal={incomeTotalStr}
              expenseTotal={expenseTotalStr}
              D={D}
            />
          )}
        </div>
      </div>

      {/* By Category card */}
      <div>
        <SectionTitle D={D}>By category</SectionTitle>
        <div style={{
          background: D.panel,
          borderRadius: 14,
          border: `1px solid ${D.border}`,
          padding: 14,
        }}>
          <Segmented
            value={catView}
            onChange={setCatView}
            options={[
              { value: 'expenses', label: 'Spending' },
              { value: 'income',   label: 'Income' },
            ]}
            D={D}
          />
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            padding: '16px 2px 6px',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: D.mute, letterSpacing: '0.18em' }}>
              {catLabel} · {catList.length} {catList.length === 1 ? 'CATEGORY' : 'CATEGORIES'}
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: catColor, letterSpacing: '-0.02em' }}>
              {fmtCurrencyNoCents(catTotal)}
            </span>
          </div>
          {catList.length === 0 ? (
            <div style={{ padding: '20px 4px', color: D.mute, fontSize: 12, textAlign: 'center' }}>
              No {showingExpenses ? 'spending' : 'income'} this period.
            </div>
          ) : (
            <div style={{ borderTop: `1px solid ${D.border}` }}>
              {catList.map((c, i) => (
                <CatRow
                  key={c.id}
                  name={c.name}
                  amount={fmtAmount(c.amount)}
                  pct={c.pct}
                  color={c.color}
                  sign={catSign}
                  last={i === catList.length - 1}
                  D={D}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
