import { useState } from 'react';
import DatePicker from '../DatePicker';
import { formatDateForStorage } from '../../shared/utils';

export default function MobileAddTransactionModal({
  expenseCategories = [],
  incomeCategories = [],
  cards = [],
  onAddExpense,
  onAddIncome,
  onClose,
  darkMode,
}) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState(() => expenseCategories[0]?.id || '');
  const [cardId, setCardId] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountFocused, setAmountFocused] = useState(true);
  const [noteFocused, setNoteFocused] = useState(false);

  const isIncome = type === 'income';
  const categories = isIncome ? incomeCategories : expenseCategories;

  const handleTypeChange = (t) => {
    setType(t);
    const cats = t === 'income' ? incomeCategories : expenseCategories;
    setCategoryId(cats[0]?.id || '');
    setCardId(null);
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const selectedCat = categories.find(c => c.id === categoryId);
    const payload = {
      categoryId: categoryId || null,
      amount: amt,
      description: note.trim() || selectedCat?.name || '',
      date: formatDateForStorage(date),
    };
    if (isIncome) onAddIncome(payload);
    else onAddExpense({ ...payload, cardId: cardId || undefined });
    onClose();
  };

  const D = darkMode ? {
    sheet:      '#141413',
    panel:      'rgba(255,255,255,0.06)',
    panelSolid: '#232322',
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
    panelSolid: '#F2F2F2',
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
            New Transaction
          </div>
          <button onClick={handleSave} style={{
            background: D.saveBg, color: D.saveColor,
            border: 0, cursor: 'pointer',
            padding: '7px 16px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>
            Save
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '0 20px', flex: 1 }}>

          {/* Expense / Income toggle */}
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

          {/* Merchant */}
          <div style={{
            background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 14,
            padding: '9px 14px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', color: D.mute, marginBottom: 6, fontWeight: 600 }}>
              MERCHANT
            </div>
            <label style={{ position: 'relative', display: 'block', cursor: 'text' }}>
              {noteFocused && !note && (
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
                color: note ? D.text : D.mute,
                fontSize: 15, fontWeight: 500,
                fontFamily: 'inherit',
                whiteSpace: 'pre',
              }}>
                {note || (isIncome ? 'e.g. Paycheck' : 'e.g. Whole Foods')}
              </span>
              {noteFocused && note && (
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
                value={note}
                onChange={e => setNote(e.target.value)}
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

          {/* Category grid — 2 rows, horizontal scroll, 3 visible at a time */}
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

          {/* Card selector */}
          {!isIncome && cards.length > 0 && (
            <div style={{
              background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 14,
              marginBottom: 8, overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 16px 6px', fontSize: 9, letterSpacing: '0.14em', color: D.mute, fontWeight: 600 }}>
                ACCOUNT
              </div>
              <div className="modal-cat-scroll" style={{ display: 'flex', padding: '0 8px 8px', gap: 6, overflowX: 'auto' }}>
                <button onClick={() => setCardId(null)} style={{
                  background: cardId === null ? D.panelHi : 'transparent',
                  border: `1px solid ${cardId === null ? D.border : 'transparent'}`,
                  borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                  color: cardId === null ? D.text : D.dim,
                  fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit',
                }}>
                  Bank
                </button>
                {cards.map(card => {
                  const active = cardId === card.id;
                  return (
                    <button key={card.id} onClick={() => setCardId(card.id)} style={{
                      background: active ? D.panelHi : 'transparent',
                      border: `1px solid ${active ? D.border : 'transparent'}`,
                      borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      whiteSpace: 'nowrap', fontFamily: 'inherit',
                    }}>
                      <span style={{
                        width: 22, height: 14, borderRadius: 3, flexShrink: 0,
                        background: 'linear-gradient(135deg,#3B82F6,#1E40AF)',
                        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.2)',
                      }} />
                      <span style={{ color: active ? D.text : D.dim, fontSize: 12, fontWeight: 500 }}>
                        {card.name}
                      </span>
                      {card.lastFour && (
                        <span style={{ color: D.mute, fontSize: 10 }}>··{card.lastFour}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date */}
          <div style={{
            background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 14,
          }}>
            <DatePicker
              value={date}
              onChange={setDate}
              forceUp
              mobile
              renderTrigger={() => {
                const d = new Date(date + 'T12:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dCompare = new Date(d); dCompare.setHours(0, 0, 0, 0);
                const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                let label;
                if (+dCompare === +today) label = 'Today';
                else if (+dCompare === +yesterday) label = 'Yesterday';
                else if (+dCompare === +tomorrow) label = 'Tomorrow';
                else label = d.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      border: `1px solid ${D.border}`,
                      display: 'grid', placeItems: 'center',
                      flexShrink: 0,
                    }}>
                      <span className="material-icons" style={{ fontSize: 18, color: D.dim }}>schedule</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.14em', color: D.mute, fontWeight: 600, marginBottom: 2 }}>
                        DATE
                      </div>
                      <div style={{ fontSize: 15, color: D.text, fontWeight: 600 }}>
                        {label} <span style={{ color: D.dim, fontWeight: 500 }}>· {monthDay}</span>
                      </div>
                    </div>
                    <span className="material-icons" style={{ fontSize: 20, color: D.dim, flexShrink: 0 }}>chevron_right</span>
                  </div>
                );
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
