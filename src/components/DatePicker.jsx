import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CALENDAR_H = 310;

export default function DatePicker({ value, onChange, forceUp = false, renderTrigger, mobile = false }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = value ? new Date(value + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const isDark = document.documentElement.classList.contains('dark');

  const computePos = (rect) => {
    const measuredH = dropdownRef.current?.offsetHeight || CALENDAR_H;
    const DROPDOWN_H = forceUp ? CALENDAR_H : measuredH;
    const GAP = forceUp ? 140 : 6;
    const spaceBelow = window.innerHeight - rect.bottom - GAP;
    const top = forceUp || spaceBelow < DROPDOWN_H
      ? Math.max(8, rect.top - DROPDOWN_H - GAP)
      : rect.bottom + GAP;
    return { top, left: rect.left, width: rect.width };
  };

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setDropdownPos(computePos(rect));
    setOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const calcPos = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setDropdownPos(computePos(rect));
    };
    const t = setTimeout(() => window.addEventListener('scroll', calcPos, true), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', calcPos, true);
    };
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleSelect = (day) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const isSelected = (day) => (
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day
  );

  const isToday = (day) => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  };

  const displayDate = selected.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  return (
    <div className="datepicker" ref={triggerRef}>
      {renderTrigger ? (
        <div onClick={handleToggle} style={{ cursor: 'pointer' }}>
          {renderTrigger({ display: displayDate, selected, isOpen: open })}
        </div>
      ) : (
        <button type="button" className="datepicker-trigger" onClick={handleToggle}>
          <span className="datepicker-icon">&#128197;</span>
          <span className="datepicker-value">{displayDate}</span>
          <span className="datepicker-caret">&#9662;</span>
        </button>
      )}
      {open && createPortal(
        <div className={isDark ? 'dark' : ''}>
          <div
            ref={dropdownRef}
            className={`datepicker-dropdown ${mobile ? 'datepicker-dropdown-mobile' : ''}`}
            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            <div className="datepicker-nav">
              <button type="button" className="datepicker-nav-btn" onClick={prevMonth}>&larr;</button>
              <span className="datepicker-month-label">{monthLabel}</span>
              <button type="button" className="datepicker-nav-btn" onClick={nextMonth}>&rarr;</button>
            </div>
            <div className="datepicker-weekdays">
              {DAYS.map(d => <span key={d} className="datepicker-weekday">{d}</span>)}
            </div>
            <div className="datepicker-grid">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <span key={`empty-${i}`} className="datepicker-day empty" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  type="button"
                  className={`datepicker-day ${isSelected(day) ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
                  onClick={() => handleSelect(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
