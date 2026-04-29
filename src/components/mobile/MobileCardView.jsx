import { useState, useRef, useEffect, useMemo } from 'react';

const BANKS = [
  { id: 'chase',        name: 'CHASE',            color: '#003087', font: "'Montserrat', sans-serif",       fontSize: '1.1rem'  },
  { id: 'bofa',         name: 'Bank of America',  color: '#012169', font: "'Merriweather', serif",          fontSize: '0.72rem' },
  { id: 'wells_fargo',  name: 'Wells Fargo',      color: '#B22222', font: "'Roboto Slab', serif",           fontSize: '0.82rem' },
  { id: 'capital_one',  name: 'Capital One',      color: '#004A97', font: "'DM Sans', sans-serif",          fontSize: '0.88rem' },
  { id: 'citi',         name: 'citi',             color: '#003B95', font: "'Barlow Condensed', sans-serif", fontSize: '1.3rem'  },
  { id: 'amex',         name: 'American Express', color: '#007BC1', font: "'EB Garamond', serif",           fontSize: '0.72rem' },
  { id: 'discover',     name: 'discover.',        color: '#231F20', font: "'Lato', sans-serif",             fontSize: '0.95rem' },
  { id: 'usbank',       name: 'U.S. Bank',        color: '#002244', font: "'IBM Plex Sans', sans-serif",    fontSize: '0.88rem' },
  { id: 'td',           name: 'TD',               color: '#1B6E3B', font: "'Oswald', sans-serif",           fontSize: '1.4rem'  },
  { id: 'pnc',          name: 'PNC',              color: '#F47920', font: "'IBM Plex Sans', sans-serif",    fontSize: '1.1rem'  },
  { id: 'navy_federal', name: 'Navy Federal',     color: '#003366', font: "'Raleway', sans-serif",          fontSize: '0.78rem' },
  { id: 'other',        name: 'Card',             color: '#4B5563', font: "'Inter', sans-serif",            fontSize: '1rem'    },
];

const NETWORKS = [
  { id: 'visa',       label: 'Visa'       },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'amex',       label: 'Amex'       },
  { id: 'discover',   label: 'Discover'   },
];

const BANK_MAP = Object.fromEntries(BANKS.map(b => [b.id, b]));
const EMPTY_FORM = { name: '', lastFour: '', cardType: 'visa', bank: 'chase' };

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function ChipIcon() {
  return (
    <svg className="card-chip" viewBox="0 0 44 34" fill="none">
      <defs>
        <linearGradient id="mcv-chip" x1="0" y1="0" x2="44" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4a843" />
          <stop offset="40%" stopColor="#f0d070" />
          <stop offset="100%" stopColor="#b89030" />
        </linearGradient>
      </defs>
      <rect width="44" height="34" rx="5" fill="url(#mcv-chip)" />
      <line x1="0" y1="12" x2="44" y2="12" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
      <line x1="0" y1="22" x2="44" y2="22" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
      <line x1="15" y1="0" x2="15" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
      <line x1="29" y1="0" x2="29" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
      <rect x="15" y="12" width="14" height="10" rx="2" fill="rgba(160,110,0,0.25)" />
      <rect x="1" y="1" width="42" height="8" rx="4" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}

export default function MobileCardView({ cards, expenses, expenseCategories, profile, onAddCard, onDeleteCard }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const carouselRef = useRef(null);
  const cardRefs = useRef([]);

  const holderName = profile?.firstName
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : null;

  const catMap = useMemo(() => new Map(expenseCategories.map(c => [c.id, c])), [expenseCategories]);

  const addCardIdx = cards.length; 
  const safeIdx = Math.min(selectedIdx, cards.length); 
  const isAddCardSelected = safeIdx === addCardIdx;
  const selectedCard = isAddCardSelected ? null : (cards[safeIdx] ?? null);

  const cardExpenses = useMemo(() => {
    if (!selectedCard) return [];
    return expenses
      .filter(e => e.cardId === selectedCard.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
  }, [expenses, selectedCard]);

  const cardTotal = useMemo(() => cardExpenses.reduce((s, e) => s + e.amount, 0), [cardExpenses]);

  // Detect which card (including the add-card slot) is centered in the carousel
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = cardRefs.current.indexOf(entry.target);
            if (idx !== -1) setSelectedIdx(idx);
          }
        });
      },
      { threshold: 0.5, root: carousel }
    );
    cardRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [cards]);

  const handleBankChange = (bankId) => {
    const net = bankId === 'amex' ? 'amex' : bankId === 'discover' ? 'discover' : form.cardType;
    setForm(f => ({ ...f, bank: bankId, cardType: net }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.lastFour.length !== 4) return;
    setSaving(true);
    const bank = BANK_MAP[form.bank] || BANK_MAP.other;
    await onAddCard({ name: form.name.trim(), lastFour: form.lastFour, cardType: form.cardType, bank: form.bank, color: bank.color });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  const scrollTo = (idx) => {
    setSelectedIdx(idx);
    cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div className="mcv-root">

      {/* Carousel — always shown, blank add-card slot at the end */}
      <>
        <div className="mcv-carousel" ref={carouselRef}>
          {cards.map((card, i) => {
            const bank = BANK_MAP[card.bank] || BANK_MAP.other;
            return (
              <div
                key={card.id}
                ref={el => { cardRefs.current[i] = el; }}
                className={`mcv-card-slide ${i === safeIdx ? 'selected' : ''}`}
                style={{ background: bank.color }}
                onClick={() => scrollTo(i)}
              >
                <div className="card-visual-shine" />
                <div className="card-visual-top">
                  <span className="card-visual-bank" style={{ fontFamily: bank.font, fontSize: bank.fontSize }}>
                    {bank.name}
                  </span>
                </div>
                <ChipIcon />
                <div className="card-visual-bottom">
                  <span className="card-visual-number">•••• •••• •••• {card.lastFour}</span>
                  <div className="card-visual-footer">
                    <span className="card-visual-card-name">{card.name}</span>
                    {holderName && <span className="card-visual-name">{holderName.toUpperCase()}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Blank add-card slot */}
          <div
            ref={el => { cardRefs.current[addCardIdx] = el; }}
            className={`mcv-card-slide mcv-card-add ${isAddCardSelected ? 'selected' : ''}`}
            onClick={() => setShowForm(true)}
          >
            <div className="mcv-card-add-tile">
              <span className="material-icons">add</span>
            </div>
            <span className="mcv-card-add-label">Add Card</span>
          </div>
        </div>

        {/* Dots — only for real cards */}
        {cards.length > 0 && (
          <div className="mcv-dots">
            {cards.map((_, i) => (
              <button key={i} className={`mcv-dot ${i === safeIdx ? 'active' : ''}`} onClick={() => scrollTo(i)} aria-label={`Card ${i + 1}`} />
            ))}
          </div>
        )}

        {/* Add card form — shown below carousel when add slot is active */}
        {showForm && (
          <form className="card-add-form mcv-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bank</label>
              <div className="select-wrapper">
                <select value={form.bank} onChange={e => handleBankChange(e.target.value)}>
                  {BANKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Card Name</label>
              <input className="form-input" placeholder="e.g. Chase Sapphire Reserve"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Last 4 Digits</label>
              <input className="form-input" placeholder="1234" maxLength={4} inputMode="numeric"
                value={form.lastFour} onChange={e => setForm(f => ({ ...f, lastFour: e.target.value.replace(/\D/g, '') }))} />
            </div>
            <div className="form-group">
              <label>Network</label>
              <div className="select-wrapper">
                <select value={form.cardType} onChange={e => setForm(f => ({ ...f, cardType: e.target.value }))}>
                  {NETWORKS.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
            </div>
            <div className="card-form-actions">
              <button type="submit" className="card-form-save" disabled={saving}>{saving ? 'Adding…' : 'Add Card'}</button>
              <button type="button" className="card-form-cancel" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</button>
            </div>
          </form>
        )}

          {/* Spending summary here */}
          {selectedCard && (
            <div className="mcv-spending-row">
              <div>
                <div className="mcv-spending-amount">{fmt(cardTotal)}</div>
                <div className="mcv-spending-label">spent this month</div>
              </div>
              <button className="mcv-remove-btn" onClick={() => { onDeleteCard(selectedCard.id); setSelectedIdx(0); }}>
                Remove card
              </button>
            </div>
          )}

          {/* Card transactions — only when a real card is selected */}
          {selectedCard && (
            <div className="mcv-txns">
              <h3 className="mcv-txns-title">Recent Transactions</h3>
              {cardExpenses.length === 0 ? (
                <p className="mcv-txns-empty">No transactions linked to this card.</p>
              ) : (
                <ul className="mcv-txn-list">
                  {cardExpenses.map(e => {
                    const cat = catMap.get(e.categoryId);
                    return (
                      <li key={e.id} className="mcv-txn-row">
                        <div className="mcv-txn-icon" style={{ background: `${cat?.color || '#7c5cfc'}22`, color: cat?.color || '#7c5cfc' }}>
                          {cat?.icon || (cat?.name?.[0] ?? 'T').toUpperCase()}
                        </div>
                        <div className="mcv-txn-details">
                          <span className="mcv-txn-desc">{e.description || cat?.name || 'Transaction'}</span>
                          <span className="mcv-txn-meta">{fmtDate(e.date)}{cat ? ` · ${cat.name}` : ''}</span>
                        </div>
                        <span className="mcv-txn-amount">-{fmt(e.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
      </>
    </div>
  );
}
