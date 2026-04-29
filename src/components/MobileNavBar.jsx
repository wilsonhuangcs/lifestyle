const NAV_ITEMS = [
  { page: 'budget', icon: 'account_balance_wallet', label: 'Budget' },
  { page: 'gym',    icon: 'fitness_center',          label: 'Gym'    },
];

export default function MobileNavBar({ page, onSetPage }) {
  return (
    <nav className="mobile-nav-bar">
      {NAV_ITEMS.map(({ page: p, icon, label }) => (
        <button
          key={p}
          className={`mobile-nav-item ${page === p ? 'active' : ''}`}
          onClick={() => onSetPage(p)}
        >
          <span className="material-icons">{icon}</span>
          <span className="mobile-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
