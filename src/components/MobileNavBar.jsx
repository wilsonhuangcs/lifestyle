const NAV_ITEMS = [
  { page: 'budget',   icon: 'account_balance_wallet', label: 'Budget'   },
  { page: 'gym',      icon: 'fitness_center',          label: 'Gym'      },
  { page: 'calendar', icon: 'calendar_today',          label: 'Calendar' },
];

export default function MobileNavBar({ page, onSetPage, badges = {} }) {
  return (
    <nav className="mobile-nav-bar">
      {NAV_ITEMS.map(({ page: p, icon, label }) => {
        const badgeCount = badges[p] || 0;
        return (
          <button
            key={p}
            className={`mobile-nav-item ${page === p ? 'active' : ''}`}
            onClick={() => onSetPage(p)}
          >
            <span className="mobile-nav-icon-wrap">
              <span className="material-icons">{icon}</span>
              {badgeCount > 0 && (
                <span className="mobile-nav-badge">{badgeCount > 9 ? '9+' : badgeCount}</span>
              )}
            </span>
            <span className="mobile-nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
