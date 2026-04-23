import { useState, useMemo } from 'react';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MUSCLE_GROUP_LABELS = {
  chest:          'Chest',
  trapezius:      'Traps',
  upper_back:     'Lats',
  lower_back:     'Lower Back',
  front_deltoids: 'Front Delts',
  rear_deltoids:  'Rear Delts',
  biceps:         'Biceps',
  triceps:        'Triceps',
  forearms:       'Forearms',
  abs:            'Abs',
  obliques:       'Obliques',
  quadriceps:     'Quads',
  hamstrings:     'Hams',
  glutes:         'Glutes',
  calves:         'Calves',
  adductors:      'Adductors',
  abductors:      'Abductors',
  cardio:         'Cardio',
  full_body:      'Full Body',
};

const MUSCLE_TAG_COLORS = {
  chest:          '#7c5cfc',
  front_deltoids: '#7c5cfc',
  triceps:        '#7c5cfc',
  upper_back:     '#0ea5e9',
  lower_back:     '#0ea5e9',
  trapezius:      '#0ea5e9',
  rear_deltoids:  '#0ea5e9',
  biceps:         '#0ea5e9',
  forearms:       '#0ea5e9',
  abs:            '#10b981',
  obliques:       '#10b981',
  quadriceps:     '#f59e0b',
  hamstrings:     '#f59e0b',
  glutes:         '#f59e0b',
  calves:         '#f59e0b',
  adductors:      '#f59e0b',
  abductors:      '#f59e0b',
  cardio:         '#ef4444',
  full_body:      '#8b5cf6',
};

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatVolume(vol) {
  if (!vol) return '0';
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
  return vol.toLocaleString();
}

function formatDuration(minutes) {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getWorkoutMuscleGroups(workout, exerciseMap) {
  const primary = new Set();
  const secondary = new Set();
  for (const we of workout.exercises) {
    const ex = exerciseMap.get(we.exerciseId);
    if (!ex) continue;
    if (ex.muscleGroup) primary.add(ex.muscleGroup);
    if (Array.isArray(ex.secondaryMuscles)) {
      for (const m of ex.secondaryMuscles) secondary.add(m);
    }
  }
  for (const m of primary) secondary.delete(m);
  return { primary: [...primary], secondary: [...secondary] };
}

export default function GymHeader({ workouts, exercises }) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(null);

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const monthLabel = getMonthLabel(viewYear, viewMonth);

  const prevMonth = () => {
    setSelectedWeekIdx(null);
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else { setViewMonth(m => m - 1); }
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    setSelectedWeekIdx(null);
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else { setViewMonth(m => m + 1); }
  };

  const exerciseMap = useMemo(
    () => new Map(exercises.map(e => [e.id, e])),
    [exercises]
  );

  const monthWorkouts = useMemo(() =>
    workouts.filter(w => {
      const d = new Date(w.date.slice(0, 10) + 'T12:00:00');
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    }),
    [workouts, viewYear, viewMonth]
  );

  const monthStats = useMemo(() => {
    let volume = 0, totalMinutes = 0, durationCount = 0;
    for (const w of monthWorkouts) {
      for (const we of w.exercises) {
        for (const s of we.sets) {
          if (s.completed && s.weight && s.reps) volume += s.weight * s.reps;
        }
      }
      if (w.durationMinutes) { totalMinutes += w.durationMinutes; durationCount++; }
    }
    return {
      count: monthWorkouts.length,
      volume,
      totalMinutes,
      avgDuration: durationCount > 0 ? Math.round(totalMinutes / durationCount) : 0,
    };
  }, [monthWorkouts]);

  const { weeks, autoWeekIdx } = useMemo(() => {
    const workoutsByDate = {};
    for (const w of monthWorkouts) {
      const dStr = w.date.slice(0, 10);
      if (!workoutsByDate[dStr]) workoutsByDate[dStr] = [];
      workoutsByDate[dStr].push(w);
    }

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth  = new Date(viewYear, viewMonth + 1, 0);

    // Sunday on or before the 1st; Saturday on or after the last day
    const calStart = new Date(viewYear, viewMonth, 1 - firstOfMonth.getDay());
    const calEnd   = new Date(viewYear, viewMonth + 1, 0 + (6 - lastOfMonth.getDay()));

    const weeks = [];
    let cursor = new Date(calStart);
    let autoIdx = 0;

    while (cursor <= calEnd) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(cursor);
        const dStr = toDateStr(d);
        days.push({
          date: d,
          dateStr: dStr,
          isCurrentMonth: d.getMonth() === viewMonth && d.getFullYear() === viewYear,
          isToday: dStr === todayStr,
          hasWorkout: !!workoutsByDate[dStr],
          workouts: workoutsByDate[dStr] || [],
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      const monthDays    = days.filter(d => d.isCurrentMonth);
      const weekWorkouts = monthDays.flatMap(d => d.workouts);

      if (days.some(d => d.isToday)) autoIdx = weeks.length;

      weeks.push({
        days,
        workouts: weekWorkouts,
        workoutCount: monthDays.filter(d => d.hasWorkout).length,
      });
    }

    // For past months: auto-select last week that had workouts
    if (!weeks.some(w => w.days.some(d => d.isToday))) {
      const lastActive = [...weeks].reverse().findIndex(w => w.workoutCount > 0);
      autoIdx = lastActive >= 0 ? weeks.length - 1 - lastActive : weeks.length - 1;
    }

    return { weeks, autoWeekIdx: autoIdx };
  }, [monthWorkouts, viewYear, viewMonth, todayStr]);

  const activeWeekIdx = selectedWeekIdx !== null ? selectedWeekIdx : autoWeekIdx;
  const activeWeek    = weeks[activeWeekIdx];

  return (
    <div className="gym-page-header">

      {/* ── Title + month nav ── */}
      <div className="budget-title-row">
        <div>
          <h1 className="gym-page-title">Gym Tracker</h1>
          <p className="gym-page-subtitle">Your workouts for {monthLabel}</p>
        </div>
        <div className="header-month-nav">
          <button className="header-month-btn" onClick={prevMonth}>&larr;</button>
          <span className="header-month-label">{monthLabel}</span>
          <button className="header-month-btn" onClick={nextMonth} disabled={isCurrentMonth}>&rarr;</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="gym-header-stat-cards">
        <div className="gym-header-stat-card gym-header-stat-card--featured">
          <span className="budget-stat-card-label">Workouts</span>
          <span className="budget-stat-card-value">{monthStats.count}</span>
          <span className="budget-stat-card-sub">This month</span>
        </div>
        <div className="gym-header-stat-card">
          <span className="budget-stat-card-label">Volume</span>
          <span className="budget-stat-card-value">
            {formatVolume(monthStats.volume)}
            <span className="gym-stat-card-unit"> lbs</span>
          </span>
          <span className="budget-stat-card-sub">Total lifted</span>
        </div>
        <div className="gym-header-stat-card">
          <span className="budget-stat-card-label">Total Time</span>
          <span className="budget-stat-card-value">{formatDuration(monthStats.totalMinutes)}</span>
          <span className="budget-stat-card-sub">Across all workouts</span>
        </div>
        <div className="gym-header-stat-card">
          <span className="budget-stat-card-label">Avg Duration</span>
          <span className="budget-stat-card-value">
            {monthStats.avgDuration > 0 ? formatDuration(monthStats.avgDuration) : '—'}
          </span>
          <span className="budget-stat-card-sub">Per workout</span>
        </div>
      </div>

      {/* ── Week strip ── */}
      <div className="gym-week-strip-card">
        <div className="gym-week-strip-nav">
          <button
            className="gym-week-nav-btn"
            onClick={() => setSelectedWeekIdx(Math.max(0, activeWeekIdx - 1))}
            disabled={activeWeekIdx === 0}
          >
            &larr;
          </button>
          <span className="gym-week-strip-range">Weekly Progress</span>
          <button
            className="gym-week-nav-btn"
            onClick={() => setSelectedWeekIdx(Math.min(weeks.length - 1, activeWeekIdx + 1))}
            disabled={activeWeekIdx === weeks.length - 1}
          >
            &rarr;
          </button>
        </div>

        <div className="gym-week-circles">
          {activeWeek?.days.map((day, i) => {
            const isPast = day.isCurrentMonth && day.dateStr <= todayStr;
            const tooltipText = day.hasWorkout && day.isCurrentMonth
              ? [...new Set(
                  day.workouts.flatMap(w =>
                    w.exercises
                      .map(we => exerciseMap.get(we.exerciseId)?.muscleGroup)
                      .filter(Boolean)
                  )
                )].map(mg => MUSCLE_GROUP_LABELS[mg] || mg).join(', ')
              : null;

            return (
              <div
                key={i}
                className="gym-week-circle-col"
                data-tooltip={tooltipText}
              >
                <div
                  className={[
                    'gym-week-circle',
                    !day.isCurrentMonth        && 'out-of-month',
                    day.isToday                && 'today',
                    day.isCurrentMonth && day.hasWorkout  && 'has-workout',
                    day.isCurrentMonth && !day.hasWorkout && isPast && 'no-workout',
                  ].filter(Boolean).join(' ')}
                >
                  {day.date.getDate()}
                </div>
                <span className="gym-week-day-label">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected-week workout cards ── */}
      {activeWeek && activeWeek.workouts.length > 0 && (
        <div className="gym-week-workout-list">
          {[...activeWeek.workouts]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(w => {
              const volume = w.exercises.reduce((sum, we) =>
                sum + we.sets.reduce((s, set) =>
                  s + (set.completed && set.weight && set.reps ? set.weight * set.reps : 0), 0
                ), 0
              );
              const { primary, secondary } = getWorkoutMuscleGroups(w, exerciseMap);
              const displayDate = new Date(w.date.slice(0, 10) + 'T12:00:00')
                .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div key={w.id} className="gym-week-workout-card">
                  <div className="gym-week-workout-top">
                    <span className="gym-week-workout-date">
                      {displayDate}
                      {w.isCompleted && <span className="workout-completed-badge-sm">&#10003;</span>}
                    </span>
                    <span className="gym-week-workout-meta">
                      {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}
                      {w.durationMinutes != null && <> &middot; {w.durationMinutes} min</>}
                      {volume > 0 && <> &middot; {formatVolume(volume)} lbs</>}
                    </span>
                  </div>
                  {(primary.length > 0 || secondary.length > 0) && (
                    <div className="workout-muscle-tags">
                      {primary.map(mg => (
                        <span
                          key={mg}
                          className="muscle-tag muscle-tag--primary"
                          style={{ '--tag-color': MUSCLE_TAG_COLORS[mg] || '#6b7280' }}
                        >
                          {MUSCLE_GROUP_LABELS[mg] || mg}
                        </span>
                      ))}
                      {secondary.map(mg => (
                        <span
                          key={mg}
                          className="muscle-tag muscle-tag--secondary"
                          style={{ '--tag-color': MUSCLE_TAG_COLORS[mg] || '#6b7280' }}
                        >
                          {MUSCLE_GROUP_LABELS[mg] || mg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}


    </div>
  );
}
