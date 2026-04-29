import { useState, useRef, useEffect } from 'react';

export default function Navbar({ user, profile, onOpenProfile, onSignOut, darkMode, onToggleDark }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const initials = displayName
    ? (profile.firstName?.[0] || '') + (profile.lastName?.[0] || '')
    : user?.email?.split('@')[0]?.slice(0, 2) || '??';

  return (
    <header className="topbar">
      <span className="topbar-title">Lifestyle</span>

      <div className="topbar-right">
        {/* Profile pill */}
        <div className="topbar-profile-wrap" ref={menuRef}>
          <button className="topbar-profile-btn" onClick={() => setOpen(v => !v)}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="avatar" className="topbar-avatar-img" />
            ) : (
              <span className="topbar-avatar-initials">{initials.toUpperCase()}</span>
            )}
            <div className="topbar-profile-info">
              <span className="topbar-profile-name">{displayName || user?.email?.split('@')[0]}</span>
              <span className="topbar-profile-email">{user?.email}</span>
            </div>
            <span className="material-icons topbar-chevron">expand_more</span>
          </button>

          {open && (
            <div className="topbar-dropdown">
              <button className="topbar-dropdown-item" onClick={() => { onOpenProfile(); setOpen(false); }}>
                <span className="material-icons">person</span>
                Profile
              </button>
              <button className="topbar-dropdown-item topbar-dropdown-signout" onClick={onSignOut}>
                <span className="material-icons">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle — mobile only (sidebar handles desktop) */}
        <button
          className="topbar-icon-btn topbar-theme-btn"
          onClick={onToggleDark}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          <span className="material-icons">{darkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>

        {/* Notification bell */}
        <button className="topbar-icon-btn" title="Notifications">
          <span className="material-icons">notifications</span>
        </button>
      </div>
    </header>
  );
}
