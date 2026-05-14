import { useState, useRef, useEffect } from 'react';
import { useInAppNotifications } from '../hooks/useInAppNotifications';

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Navbar({ user, profile, onOpenProfile, onSignOut, darkMode, onToggleDark }) {
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const menuRef = useRef(null);
  const bellRef = useRef(null);
  const { items: notifications, unreadCount, markRead, markAllRead, remove, clearAll } = useInAppNotifications();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
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
        <div className="topbar-notif-wrap" ref={bellRef}>
          <button
            className="topbar-icon-btn"
            title="Notifications"
            onClick={() => setBellOpen((v) => !v)}
          >
            <span className="material-icons">notifications</span>
            {unreadCount > 0 && (
              <span className="topbar-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {bellOpen && (
            <div className="topbar-notif-dropdown" role="dialog" aria-label="Notifications">
              <div className="topbar-notif-header">
                <span className="topbar-notif-title">Notifications</span>
                <div className="topbar-notif-actions">
                  {unreadCount > 0 && (
                    <button className="topbar-notif-action" onClick={markAllRead}>Mark all read</button>
                  )}
                  {notifications.length > 0 && (
                    <button className="topbar-notif-action" onClick={clearAll}>Clear</button>
                  )}
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="topbar-notif-empty">No notifications yet.</div>
              ) : (
                <ul className="topbar-notif-list">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`topbar-notif-item ${n.read ? '' : 'topbar-notif-item--unread'}`}
                      onClick={() => markRead(n.id)}
                    >
                      <div className="topbar-notif-item-row">
                        <span className="topbar-notif-item-title">{n.title}</span>
                        <button
                          className="topbar-notif-item-close"
                          onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                          title="Dismiss"
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>
                      {n.body && <div className="topbar-notif-item-body">{n.body}</div>}
                      <div className="topbar-notif-item-time">{timeAgo(n.createdAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
