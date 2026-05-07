import { useState } from 'react';

const FREQUENCIES = [
  { id: 'daily',    label: 'Daily' },
  { id: 'weekly',   label: 'Weekly' },
  { id: 'biweekly', label: 'Biweekly' },
  { id: 'monthly',  label: 'Monthly' },
  { id: 'custom',   label: 'Custom' },
];

export default function MobileAddRecurringModal({
  expenseCategories = [],
  incomeCategories = [],
  onAdd,
  onClose,
  darkMode,
}) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(() => expenseCategories[0]?.id || '');
  const [frequency, setFrequency] = useState('monthly');
  const [customDates, setCustomDates] = useState([]);
  const [amountFocused, setAmountFocused] = useState(true);
  const [noteFocused, setNoteFocused] = useState(false);

  const isIncome = type === 'income';
  const categories = isIncome ? incomeCategories : expenseCategories;

  const D = darkMode ? {
    sheet:      '#141413',
    panel:      'rgba(255,255,255,0.06)',
    panelHi:    'rgba(255,255,255,0.11)',
    border:     'rgba(255,255,255,0.10)',
    text:       '#E8E8E8',
    dim:        'rgba(232,232,232,0.55)',
    mute:       'rgba(232,232,232,0.28)',
    grab:       'rgba(255,255,255,0.16)',
    saveBg:     '#E8E8E8',
    saveColor:  '#121211',
  } : {
    sheet:      '#FFFFFF',
    panel:      'rgba(0,0,0,0.05)',
    panelHi:    'rgba(0,0,0,0.09)',
    border:     'rgba(0,0,0,0.09)',
    text:       '#1e2038',
    dim:        'rgba(30,32,56,0.55)',
    mute:       'rgba(30,32,56,0.35)',
    grab:       'rgba(0,0,0,0.14)',
    saveBg:     '#1e2038',
    saveColor:  '#F5F4F0',
  };

  const green = '#22c55e';
  const red   = '#ef4444';
  const amountColor = amount ? (isIncome ? green : D.text) : D.mute;

  const handleTypeChange = (t) => {
    setType(t);
    const cats = t === 'income' ? incomeCategories : expenseCategories;
    setCategoryId(cats[0]?.id || '');
  };

  const toggleDay = (day) => {
    setCustomDates(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const canSave = (() => {
    const a = parseFloat(amount);
    if (!categoryId || !a || a <= 0) return false;
    if (frequency === 'custom' && customDates.length === 0) return false;
    return true;
  })();

  const handleSave = () => {
    if (!canSave) return;
    const a = parseFloat(amount);
    const selectedCat = categories.find(c => c.id === categoryId);
    onAdd({
      type,
      categoryId,
      amount: a,
      description: description.trim() || selectedCat?.name || '',
      frequency,
      customDates: frequency === 'custom' ? customDates : [],
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Scrim */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'relative',
        background: D.sheet,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.35)',
        border: `1px solid ${D.border}`,
        borderBottom: 'none',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'mobileSheetIn 260ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        <style>{`
          @keyframes mobileSheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes matmCaretBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        `}</style>

        {/* Grabber */}
        <div style={{ padding: '8px 0 3px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 5, borderRadius: 999, background: D.grab }} />
        </div>

        {/* Header */}
        <div style={{ padding: '4px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            color: D.dim, fontSize: 15, fontWeight: 500, padding: 0, fontFamily: 'inherit',
          }}>
            Cancel
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: D.text, letterSpacing: '-0.01em' }}>
            New Recurring
          </div>
          <button onClick={handleSave} disabled={!canSave} style={{
            background: D.saveBg, color: D.saveColor,
            border: 0, cursor: canSave ? 'pointer' : 'not-allowed',
            opacity: canSave ? 1 : 0.45,
            padding: '7px 16px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>
            Save
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '0 20px', flex: 1 }}>

          {/* Type toggle */}
          <div style={{
            display: 'flex', padding: 3, gap: 2, marginBottom: 12,
            background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 14,
          }}>
            {[{ id: 'expense', label: 'Expense', color: red }, { id: 'income', label: 'Income', color: green }].map(o => {
              const active = o.id === type;
              return (
                <button key={o.id} onClick={() => handleTypeChange(o.id)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, border: 0, cursor: 'pointer',
                  background: active ? D.panelHi : 'transparent',
                  color: active ? o.color : D.dim,
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  fontFamily: 'inherit',
                  boxShadow: active ? `0 0 0 1px ${o.color}33` : 'none',
                  transition: 'background 120ms',
                }}>
                  {o.label}
                </button>
              );
            })}
          </div>

          {/* Amount */}
          <div style={{ textAlign: 'center', marginBottom: 2 }}>
            <label style={{ position: 'relative', display: 'inline-block', cursor: 'text' }}>
              <span style={{
                position: 'absolute',
                right: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                marginRight: 2,
                fontSize: 22, fontWeight: 600, color: D.dim,
                fontFamily: 'inherit',
                whiteSpace: 'pre',
              }}>
                {isIncome ? '+' : '−'}$
              </span>
              {amountFocused && !amount && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 2,
                  height: '0.72em',
                  fontSize: 44,
                  background: D.text,
                  borderRadius: 1,
                  animation: 'matmCaretBlink 1s steps(1) infinite',
                }} />
              )}
              <span style={{
                color: amountColor,
                fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em',
                fontFamily: 'inherit',
                whiteSpace: 'pre',
              }}>
                {amount || '0'}
              </span>
              {amountFocused && amount && (
                <span style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 2,
                  height: '0.72em',
                  fontSize: 44,
                  background: D.text,
                  borderRadius: 1,
                  animation: 'matmCaretBlink 1s steps(1) infinite',
                }} />
              )}
              <input
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                inputMode="decimal"
                autoFocus
                autoComplete="off"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  opacity: 0,
                  border: 0, outline: 'none', padding: 0, margin: 0,
                  background: 'transparent',
                  fontSize: 44, fontFamily: 'inherit',
                  caretColor: 'transparent',
                }}
              />
            </label>
          </div>
          <div style={{ textAlign: 'center', color: D.mute, fontSize: 10, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>
            USD
          </div>

          {/* Description */}
          <div style={{
            background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 14,
            padding: '9px 14px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', color: D.mute, marginBottom: 6, fontWeight: 600 }}>
              DESCRIPTION
            </div>
            <label style={{ position: 'relative', display: 'block', cursor: 'text' }}>
              {noteFocused && !description && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 1.5,
                  height: '0.9em',
                  fontSize: 15,
                  background: D.text,
                  borderRadius: 1,
                  animation: 'matmCaretBlink 1s steps(1) infinite',
                }} />
              )}
              <span style={{
                display: 'inline',
                color: description ? D.text : D.mute,
                fontSize: 15, fontWeight: 500,
                fontFamily: 'inherit',
                whiteSpace: 'pre',
              }}>
                {description || (isIncome ? 'e.g. Salary' : 'e.g. Rent')}
              </span>
              {noteFocused && description && (
                <span style={{
                  display: 'inline-block',
                  width: 1.5,
                  height: '0.9em',
                  fontSize: 15,
                  background: D.text,
                  borderRadius: 1,
                  verticalAlign: 'middle',
                  marginLeft: 2,
                  marginBottom: 2,
                  animation: 'matmCaretBlink 1s steps(1) infinite',
                }} />
              )}
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
                autoComplete="off"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  opacity: 0,
                  border: 0, outline: 'none', padding: 0, margin: 0,
                  background: 'transparent',
                  fontSize: 15, fontFamily: 'inherit',
                  caretColor: 'transparent',
                }}
              />
            </label>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.14em', color: D.mute, marginBottom: 4, fontWeight: 600, paddingLeft: 2 }}>
                CATEGORY
              </div>
              <div className="modal-cat-scroll" style={{
                overflowX: 'auto',
                paddingBottom: 4,
                WebkitOverflowScrolling: 'touch',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateRows: 'repeat(2, auto)',
                  gridAutoFlow: 'column',
                  gridAutoColumns: 'calc((100vw - 56px) / 3)',
                  gap: 6,
                  width: 'max-content',
                }}>
                  {categories.map(c => {
                    const active = c.id === categoryId;
                    const color = c.color || '#888888';
                    return (
                      <button key={c.id} onClick={() => setCategoryId(c.id)} style={{
                        background: active ? `${color}1F` : 'transparent',
                        border: `1px solid ${active ? `${color}55` : D.border}`,
                        borderRadius: 12, padding: '8px 6px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        cursor: 'pointer', transition: 'background 100ms',
                        fontFamily: 'inherit',
                      }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 7,
                          background: `${color}22`, border: `1px solid ${color}44`,
                          display: 'grid', placeItems: 'center',
                        }}>
                          <span className="material-icons" style={{ fontSize: 14, color }}>{c.icon || 'label'}</span>
                        </div>
                        <span style={{
                          fontSize: 10, color: active ? D.text : D.dim,
                          fontWeight: active ? 600 : 500,
                          textAlign: 'center', lineHeight: 1.2,
                          maxWidth: '100%', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Frequency */}
          <div style={{
            background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 14,
            padding: '10px 12px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', color: D.mute, marginBottom: 8, fontWeight: 600 }}>
              FREQUENCY
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FREQUENCIES.map(f => {
                const active = frequency === f.id;
                return (
                  <button key={f.id} onClick={() => setFrequency(f.id)} style={{
                    flex: '1 1 0', minWidth: 60,
                    padding: '8px 6px',
                    borderRadius: 10, border: `1px solid ${active ? D.text : D.border}`,
                    background: active ? D.panelHi : 'transparent',
                    color: active ? D.text : D.dim,
                    fontSize: 12, fontWeight: active ? 600 : 500,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>
                    {f.label}
                  </button>
                );
              })}
            </div>

            {frequency === 'custom' && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.14em', color: D.mute, marginBottom: 6, fontWeight: 600 }}>
                  DATES OF THE MONTH
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                    const selected = customDates.includes(day);
                    const short = day >= 29;
                    return (
                      <button key={day} onClick={() => toggleDay(day)} style={{
                        aspectRatio: '1',
                        border: `1px solid ${selected ? D.text : D.border}`,
                        background: selected ? D.text : 'transparent',
                        color: selected ? D.sheet : (short ? D.mute : D.text),
                        borderRadius: 8,
                        fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }} title={short ? 'May not occur in all months' : undefined}>
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, color: D.mute, marginTop: 6 }}>
                  Days 29–31 will be skipped in shorter months.
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
