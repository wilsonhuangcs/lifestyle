import { useState } from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';

export default function CalendarDashboard({
  events = [],
  unreadDiscordCount = 0,
  onAddEvent,
  onSelectEvent,
  onSelectDay,
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else { setViewMonth(m => m - 1); }
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else { setViewMonth(m => m + 1); }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  return (
    <div className="cal-page">
      <CalendarHeader
        viewYear={viewYear}
        viewMonth={viewMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onToday={goToToday}
        events={events}
        unreadDiscordCount={unreadDiscordCount}
        onAddEvent={onAddEvent}
      />
      <CalendarGrid
        viewYear={viewYear}
        viewMonth={viewMonth}
        events={events}
        onSelectEvent={onSelectEvent}
        onSelectDay={onSelectDay}
      />
    </div>
  );
}
