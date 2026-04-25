import { useState, useMemo } from 'react';

const BANKS = [
  { id: 'chase',        name: 'CHASE',            color: '#003087', font: "'Montserrat', sans-serif",        fontSize: '1.1rem' },
  { id: 'bofa',         name: 'Bank of America',  color: '#012169', font: "'Merriweather', serif",           fontSize: '0.72rem' },
  { id: 'wells_fargo',  name: 'Wells Fargo',      color: '#B22222', font: "'Roboto Slab', serif",            fontSize: '0.82rem' },
  { id: 'capital_one',  name: 'Capital One',      color: '#004A97', font: "'DM Sans', sans-serif",           fontSize: '0.88rem' },
  { id: 'citi',         name: 'citi',             color: '#003B95', font: "'Barlow Condensed', sans-serif",  fontSize: '1.3rem'  },
  { id: 'amex',         name: 'American Express', color: '#007BC1', font: "'EB Garamond', serif",            fontSize: '0.72rem' },
  { id: 'discover',     name: 'discover.',        color: '#231F20', font: "'Lato', sans-serif",              fontSize: '0.95rem' },
  { id: 'usbank',       name: 'U.S. Bank',        color: '#002244', font: "'IBM Plex Sans', sans-serif",     fontSize: '0.88rem' },
  { id: 'td',           name: 'TD',               color: '#1B6E3B', font: "'Oswald', sans-serif",            fontSize: '1.4rem'  },
  { id: 'pnc',          name: 'PNC',              color: '#F47920', font: "'IBM Plex Sans', sans-serif",     fontSize: '1.1rem'  },
  { id: 'navy_federal', name: 'Navy Federal',     color: '#003366', font: "'Raleway', sans-serif",           fontSize: '0.78rem' },
  { id: 'other',        name: 'Card',             color: '#4B5563', font: "'Inter', sans-serif",             fontSize: '1rem'    },
];

const NETWORKS = [
  { id: 'visa',       label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'amex',       label: 'Amex' },
  { id: 'discover',   label: 'Discover' },
];

const BANK_MAP = Object.fromEntries(BANKS.map(b => [b.id, b]));
const EMPTY_FORM = { name: '', lastFour: '', cardType: 'visa', bank: 'chase' };

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(n);

function ChipIcon() {
  return (
    <svg className="card-chip" viewBox="0 0 44 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="44" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#d4a843" />
          <stop offset="40%"  stopColor="#f0d070" />
          <stop offset="100%" stopColor="#b89030" />
        </linearGradient>
      </defs>
      <rect width="44" height="34" rx="5" fill="url(#cg)" />
      <line x1="0" y1="12" x2="44" y2="12" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
      <line x1="0" y1="22" x2="44" y2="22" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
      <line x1="15" y1="0" x2="15" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
      <line x1="29" y1="0" x2="29" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" />
      <rect x="15" y="12" width="14" height="10" rx="2" fill="rgba(160,110,0,0.25)" />
      <rect x="1" y="1" width="42" height="8" rx="4" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}

function CardVisual({ card, isActive, offset, onClick, holderName }) {
  const bank = BANK_MAP[card.bank] || BANK_MAP.other;

  let cls = 'card-visual';
  if (isActive) cls += ' active';
  else if (offset === 1) cls += ' behind-1';
  else cls += ' behind-2';

  return (
    <div
      className={cls}
      style={{ background: bank.color, zIndex: isActive ? 10 : 10 - Math.abs(offset) }}
      onClick={onClick}
    >
      <div className="card-visual-shine" />

      {/* Bank name top-left */}
      <div className="card-visual-top">
        <span className="card-visual-bank" style={{ fontFamily: bank.font, fontSize: bank.fontSize }}>
          {bank.name}
        </span>
      </div>

      {/* Chip */}
      <ChipIcon />

      {/* Number + card name + cardholder */}
      <div className="card-visual-bottom">
        <span className="card-visual-number">•••• •••• •••• {card.lastFour}</span>
        <div className="card-visual-footer">
          <span className="card-visual-card-name">{card.name}</span>
          {holderName && (
            <span className="card-visual-name">{holderName.toUpperCase()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardManager({ cards, expenses, onAddCard, onDeleteCard, profile }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const holderName = profile?.firstName
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : null;

  const spendingByCard = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      if (e.cardId) map.set(e.cardId, (map.get(e.cardId) || 0) + e.amount);
    }
    return map;
  }, [expenses]);

  const handleBankChange = (bankId) => {
    const autoNetwork = bankId === 'amex' ? 'amex' : bankId === 'discover' ? 'discover' : form.cardType;
    setForm(f => ({ ...f, bank: bankId, cardType: autoNetwork }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.lastFour.length !== 4) return;
    setSaving(true);
    const bank = BANK_MAP[form.bank] || BANK_MAP.other;
    await onAddCard({
      name: form.name.trim(),
      lastFour: form.lastFour,
      cardType: form.cardType,
      bank: form.bank,
      color: bank.color,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  const displayCards = cards.slice(0, 3);
  const safeActiveIdx = Math.min(activeIdx, Math.max(displayCards.length - 1, 0));
  const activeCard = displayCards[safeActiveIdx];

  return (
    <div className="card card-manager">
      <div className="card-manager-header">
        <h2>Spending By Cards</h2>
        {!showForm && (
          <div className="card-manager-header-actions">
            <button className="card-manager-add-btn" onClick={() => setShowForm(true)}>
              + Add Card
            </button>
            {displayCards.length > 0 && (
              <button
                className="card-manager-remove-btn"
                onClick={() => { onDeleteCard(activeCard.id); setActiveIdx(0); }}
              >
                - Remove Card
              </button>
            )}
          </div>
        )}
      </div>

      {cards.length === 0 && !showForm && (
        <p className="empty-message">No cards yet. Add a card to track spending.</p>
      )}

      {displayCards.length > 0 && (
        <>
          <div className="card-stack">
            {displayCards.map((c, i) => (
              <CardVisual
                key={c.id}
                card={c}
                isActive={i === safeActiveIdx}
                offset={i - safeActiveIdx}
                onClick={() => setActiveIdx(i)}
                holderName={holderName}
              />
            ))}
          </div>

          {activeCard && (
            <div className="card-info-panel">
              <div className="card-info-number">
                •••• •••• •••• {activeCard.lastFour}
              </div>
              <div className="card-info-balance-row">
                <div>
                  <div className="card-info-balance">
                    {formatCurrency(spendingByCard.get(activeCard.id) || 0)}
                  </div>
                  <div className="card-info-balance-label">Total Balance</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <form className="card-add-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Bank</label>
            <div className="select-wrapper">
              <select value={form.bank} onChange={e => handleBankChange(e.target.value)}>
                {BANKS.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Card Name</label>
            <input
              className="form-input"
              placeholder="e.g. Chase Sapphire Reserve"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Last 4 Digits</label>
            <input
              className="form-input"
              placeholder="1234"
              maxLength={4}
              inputMode="numeric"
              value={form.lastFour}
              onChange={e => setForm(f => ({ ...f, lastFour: e.target.value.replace(/\D/g, '') }))}
            />
          </div>
          <div className="form-group">
            <label>Network</label>
            <div className="select-wrapper">
              <select value={form.cardType} onChange={e => setForm(f => ({ ...f, cardType: e.target.value }))}>
                {NETWORKS.map(n => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card-form-actions">
            <button type="submit" className="card-form-save" disabled={saving}>
              {saving ? 'Adding…' : 'Add Card'}
            </button>
            <button type="button" className="card-form-cancel" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
