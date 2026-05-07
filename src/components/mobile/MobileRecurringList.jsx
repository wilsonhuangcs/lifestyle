import { useMemo, useState } from 'react';
import MobileAddRecurringModal from './MobileAddRecurringModal';

const COLORS = {
  green: '#22c55e',
  red:   '#ef4444',
};

const fmtCurrencyNoCents = (n) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtAmount = (n) => {
  const v = Math.abs(n);
  if (v >= 1000) return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return v.toFixed(2);
};

const ordinal = (n) => {
  const s = ['TH', 'ST', 'ND', 'RD'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatCadence = (r) => {
  const f = (r.frequency || 'monthly').toLowerCase();
  if (f === 'daily')    return 'DAILY';
  if (f === 'weekly')   return 'WEEKLY';
  if (f === 'biweekly') return 'EVERY 2 WEEKS';
  if (f === 'custom') {
    const dates = [...(r.customDates || [])].sort((a, b) => a - b);
    if (dates.length === 0) return 'CUSTOM';
    if (dates.length <= 3) return dates.map(ordinal).join(', ');
    return `${dates.length} DATES/MO`;
  }
  return 'MONTHLY';
};

const monthlyEquivalent = (r) => {
  const f = (r.frequency || 'monthly').toLowerCase();
  const a = Number(r.amount) || 0;
  if (f === 'daily')    return a * 30;
  if (f === 'weekly')   return a * 4.33;
  if (f === 'biweekly') return a * 2.17;
  if (f === 'custom')   return a * (r.customDates?.length || 1);
  return a;
};

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

function RecurringRow({ icon, name, cadence, amount, color, sign, last, D }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: last ? 'none' : `1px solid ${D.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `${color}1f`,
          display: 'grid', placeItems: 'center',
          color: color, fontSize: 14, fontWeight: 700,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            color: D.text, fontSize: 14, fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: D.mute, letterSpacing: '0.12em', marginTop: 3 }}>
            {cadence}
          </div>
        </div>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: sign === '+' ? COLORS.green : COLORS.red, fontWeight: 500 }}>
        {sign}${amount}
      </span>
    </div>
  );
}

export default function MobileRecurringList({
  expenseCategories = [],
  incomeCategories = [],
  recurringItems = [],
  onAddRecurring,
  darkMode = true,
}) {
  const [recView, setRecView] = useState('out');
  const [showAddRecurring, setShowAddRecurring] = useState(false);

  const D = darkMode ? {
    panel:     'rgba(255,255,255,0.04)',
    border:    'rgba(255,255,255,0.10)',
    text:      '#E8E8E8',
    dim:       'rgba(232,232,232,0.55)',
    mute:      'rgba(232,232,232,0.35)',
    segBg:     'rgba(0,0,0,0.25)',
    segActive: '#22221F',
  } : {
    panel:     'rgba(0,0,0,0.04)',
    border:    'rgba(0,0,0,0.09)',
    text:      '#1e2038',
    dim:       'rgba(30,32,56,0.55)',
    mute:      'rgba(30,32,56,0.35)',
    segBg:     'rgba(0,0,0,0.05)',
    segActive: '#FFFFFF',
  };

  const recExpenses = useMemo(() =>
    recurringItems.filter(r => r.type === 'expense' && r.active !== false),
    [recurringItems]
  );
  const recIncome = useMemo(() =>
    recurringItems.filter(r => r.type === 'income' && r.active !== false),
    [recurringItems]
  );

  const recExpenseMonthly = recExpenses.reduce((s, r) => s + monthlyEquivalent(r), 0);
  const recIncomeMonthly  = recIncome.reduce((s, r) => s + monthlyEquivalent(r), 0);

  const showingOut = recView === 'out';
  const recList = showingOut ? recExpenses : recIncome;

  const expCatMap = useMemo(() => new Map(expenseCategories.map(c => [c.id, c])), [expenseCategories]);
  const incCatMap = useMemo(() => new Map(incomeCategories.map(c => [c.id, c])), [incomeCategories]);

  return (
    <>
      <div style={{
        background: D.panel,
        borderRadius: 14,
        border: `1px solid ${D.border}`,
        padding: 14,
      }}>
        <Segmented
          value={recView}
          onChange={setRecView}
          options={[
            { value: 'out', label: 'Going out' },
            { value: 'in',  label: 'Coming in' },
          ]}
          D={D}
        />
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 8,
          padding: '16px 2px 6px',
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: D.mute, fontWeight: 600, letterSpacing: '0.18em' }}>
            TOTAL
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: showingOut ? COLORS.red : COLORS.green, letterSpacing: '-0.02em' }}>
            {showingOut ? '−' : '+'}{fmtCurrencyNoCents(showingOut ? recExpenseMonthly : recIncomeMonthly)}
          </span>
        </div>
        {recList.length === 0 ? (
          <div style={{ padding: '20px 4px', color: D.mute, fontSize: 12, textAlign: 'center' }}>
            No recurring {showingOut ? 'expenses' : 'income'} yet.
          </div>
        ) : (
          <div style={{ borderTop: `1px solid ${D.border}` }}>
            {recList.map((r, i) => {
              const cat = (r.type === 'expense' ? expCatMap : incCatMap).get(r.categoryId);
              const color = r.type === 'expense' ? COLORS.red : COLORS.green;
              const icon = cat?.icon || (r.description?.[0] ?? cat?.name?.[0] ?? '·').toString().toUpperCase();
              const name = r.description || cat?.name || 'Recurring';
              return (
                <RecurringRow
                  key={r.id}
                  icon={icon}
                  name={name}
                  cadence={formatCadence(r)}
                  amount={fmtAmount(r.amount)}
                  color={color}
                  sign={r.type === 'income' ? '+' : '−'}
                  last={i === recList.length - 1}
                  D={D}
                />
              );
            })}
          </div>
        )}
        <button onClick={() => setShowAddRecurring(true)} style={{
          width: '100%',
          marginTop: 12,
          padding: '11px 14px',
          border: `1px dashed ${D.border}`,
          borderRadius: 10,
          background: 'transparent',
          color: D.dim, fontSize: 12, fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          + Add recurring
        </button>
      </div>

      {showAddRecurring && (
        <MobileAddRecurringModal
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          onAdd={(payload) => {
            onAddRecurring?.(payload);
            setShowAddRecurring(false);
          }}
          onClose={() => setShowAddRecurring(false)}
          darkMode={darkMode}
        />
      )}
    </>
  );
}
