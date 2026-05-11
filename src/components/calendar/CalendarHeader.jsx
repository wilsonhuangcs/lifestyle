import { useMemo } from 'react';

function getMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function CalendarHeader({
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  events,
  unreadDiscordCount,
  onAddEvent,
}) {
  const today = new Date();
  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const monthLabel = getMonthLabel(viewYear, viewMonth);

  const stats = useMemo(() => {
    const monthEvents = events.filter(e => {
      const d = new Date(e.startsAt);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    });

    const now = Date.now();
    const upcoming7Cutoff = now + 7 * 24 * 60 * 60 * 1000;
    const upcoming = events.filter(e => {
      const t = new Date(e.startsAt).getTime();
      return t >= now && t <= upcoming7Cutoff;
    });

    const discord = monthEvents.filter(e => e.source === 'discord');

    return {
      monthCount: monthEvents.length,
      upcomingCount: upcoming.length,
      discordCount: discord.length,
    };
  }, [events, viewYear, viewMonth]);

  return (
    <div className="cal-page-header">
      <div className="budget-title-row">
        <div>
          <h1 className="cal-page-title">Calendar</h1>
          <p className="cal-page-subtitle">{monthLabel}</p>
        </div>
        <div className="cal-header-actions">
          <button className="cal-today-btn" onClick={onToday} disabled={isCurrentMonth}>Today</button>
          <div className="header-month-nav">
            <button className="header-month-btn" onClick={onPrevMonth}>&larr;</button>
            <span className="header-month-label">{monthLabel}</span>
            <button className="header-month-btn" onClick={onNextMonth}>&rarr;</button>
          </div>
          <button className="cal-add-btn" onClick={onAddEvent}>
            <span className="material-icons">add</span>
            New event
          </button>
        </div>
      </div>

      <div className="cal-header-stat-cards">
        <div className="cal-header-stat-card cal-header-stat-card--featured">
          <span className="budget-stat-card-label">Events</span>
          <span className="budget-stat-card-value">{stats.monthCount}</span>
          <span className="budget-stat-card-sub">This month</span>
        </div>
        <div className="cal-header-stat-card">
          <span className="budget-stat-card-label">Upcoming</span>
          <span className="budget-stat-card-value">{stats.upcomingCount}</span>
          <span className="budget-stat-card-sub">Next 7 days</span>
        </div>
        <div className="cal-header-stat-card">
          <span className="budget-stat-card-label">Pokemon drops</span>
          <span className="budget-stat-card-value">
            {stats.discordCount}
            {unreadDiscordCount > 0 && (
              <span className="cal-unread-badge">{unreadDiscordCount}</span>
            )}
          </span>
          <span className="budget-stat-card-sub">From Discord</span>
        </div>
      </div>
    </div>
  );
}
