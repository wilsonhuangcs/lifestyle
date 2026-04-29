const NAV_ITEMS = [
  { page: 'budget', icon: 'account_balance_wallet', label: 'Budget' },
  { page: 'gym',    icon: 'fitness_center',          label: 'Gym'    },
];

export default function MobileNavBar({ page, onSetPage, darkMode, onToggleDark }) {
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
      <button className="mobile-nav-item" onClick={onToggleDark}>
        <span className="material-icons">{darkMode ? 'light_mode' : 'dark_mode'}</span>
        <span className="mobile-nav-label">{darkMode ? 'Light' : 'Dark'}</span>
      </button>
    </nav>
  );
}
