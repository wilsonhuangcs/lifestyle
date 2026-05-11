import { useMemo } from 'react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CalendarGrid({ viewYear, viewMonth, events, onSelectEvent, onSelectDay }) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const { cells, eventsByDay } = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Six-row grid: Sunday on or before the 1st, Saturday on or after the last day,
    // padded to 42 cells so the height is stable across months.
    const calStart = new Date(viewYear, viewMonth, 1 - firstOfMonth.getDay());

    const cellArr = [];
    const cursor = new Date(calStart);
    for (let i = 0; i < 42; i++) {
      cellArr.push({
        date: new Date(cursor),
        dateStr: toDateStr(cursor),
        isCurrentMonth: cursor.getMonth() === viewMonth && cursor.getFullYear() === viewYear,
        isToday: toDateStr(cursor) === todayStr,
        isPastMonth: cursor < firstOfMonth,
        isFutureMonth: cursor > lastOfMonth,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const byDay = {};
    for (const ev of events) {
      const d = new Date(ev.startsAt);
      const key = toDateStr(d);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(ev);
    }
    for (const key of Object.keys(byDay)) {
      byDay[key].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    }

    return { cells: cellArr, eventsByDay: byDay };
  }, [viewYear, viewMonth, events, todayStr]);

  return (
    <div className="cal-grid-card">
      <div className="cal-grid-header">
        {DAY_NAMES.map(d => (
          <span key={d} className="cal-day-name">{d}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((cell, idx) => {
          const dayEvents = eventsByDay[cell.dateStr] || [];
          const shown = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - shown.length;
          return (
            <div
              key={idx}
              className={[
                'cal-cell',
                !cell.isCurrentMonth && 'cal-cell--out',
                cell.isToday && 'cal-cell--today',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelectDay?.(cell.dateStr)}
            >
              <div className="cal-cell-num-row">
                <span className="cal-cell-num">{cell.date.getDate()}</span>
              </div>
              <div className="cal-cell-events">
                {shown.map(ev => (
                  <button
                    key={ev.id}
                    className={[
                      'cal-event-chip',
                      `cal-event-chip--${ev.source}`,
                      ev.source === 'discord' && !ev.isRead && 'cal-event-chip--unread',
                    ].filter(Boolean).join(' ')}
                    onClick={(e) => { e.stopPropagation(); onSelectEvent?.(ev); }}
                    title={`${ev.title} · ${formatTime(ev.startsAt)}`}
                  >
                    <span className="cal-event-chip-time">{formatTime(ev.startsAt)}</span>
                    <span className="cal-event-chip-title">{ev.title}</span>
                  </button>
                ))}
                {overflow > 0 && (
                  <span className="cal-event-overflow">+{overflow} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
