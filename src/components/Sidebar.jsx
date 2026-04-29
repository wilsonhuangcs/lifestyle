import { useState } from 'react';
import { Mark } from './Logo';

const NAV_ITEMS = [
  { page: 'budget', icon: 'account_balance_wallet', label: 'Budget' },
  { page: 'gym',    icon: 'fitness_center',          label: 'Gym' },
];

export default function Sidebar({ user, profile, page, onSetPage, onSignOut, onOpenProfile, darkMode, onToggleDark }) {
  const [tooltip, setTooltip] = useState(null);

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const initials = displayName
    ? (profile.firstName?.[0] || '') + (profile.lastName?.[0] || '')
    : user?.email?.split('@')[0]?.slice(0, 2) || '??';

  return (
    <aside className="sidebar">
      {/* Logo mark */}
      <div className="sidebar-logo-mark">
        <Mark size={28} gradient={darkMode ? 'dark' : 'light'} />
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ page: p, icon, label }) => (
          <div
            key={p}
            className="sidebar-nav-item"
            onMouseEnter={() => setTooltip(p)}
            onMouseLeave={() => setTooltip(null)}
          >
            <button
              className={`sidebar-icon-btn ${page === p ? 'active' : ''}`}
              onClick={() => onSetPage(p)}
            >
              <span className="material-icons">{icon}</span>
            </button>
            {tooltip === p && (
              <div className="sidebar-tooltip">{label}</div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        <div
          className="sidebar-nav-item"
          onMouseEnter={() => setTooltip('theme')}
          onMouseLeave={() => setTooltip(null)}
        >
          <button className="sidebar-icon-btn" onClick={onToggleDark}>
            <span className="material-icons">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          {tooltip === 'theme' && (
            <div className="sidebar-tooltip">{darkMode ? 'Light Mode' : 'Dark Mode'}</div>
          )}
        </div>
        <div
          className="sidebar-nav-item"
          onMouseEnter={() => setTooltip('signout')}
          onMouseLeave={() => setTooltip(null)}
        >
          <button className="sidebar-icon-btn sidebar-signout-btn" onClick={onSignOut}>
            <span className="material-icons">logout</span>
          </button>
          {tooltip === 'signout' && (
            <div className="sidebar-tooltip">Sign Out</div>
          )}
        </div>
      </div>
    </aside>
  );
}
