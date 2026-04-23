import { useState, useMemo } from 'react';
import { formatDate, calculateStreak, calculateMonthlySummary } from '../../shared/utils';

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

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTotalVolume(workout) {
  let volume = 0;
  for (const we of workout.exercises) {
    for (const set of we.sets) {
      if (set.weight && set.reps) volume += set.weight * set.reps;
    }
  }
  return volume;
}
function formatDuration(minutes) {
  if (!minutes) return '--';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatWeight(weight) {
  if (weight == null) return '--';
  return Number(weight) % 1 === 0 ? `${Number(weight)}` : `${Number(weight).toFixed(1)}`;
}

function getSetTypeLabel(set) {
  const type = set.setType || (set.isWarmup ? 'warmup' : 'normal');
  switch (type) {
    case 'warmup': return 'W';
    case 'dropset':
    case 'drop_set': return 'D';
    case 'failure': return 'F';
    default: return null;
  }
}

function getMonthName(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function WorkoutHistory({ workouts, exercises, onDeleteWorkout, onEditWorkout, onBack, onSaveAsTemplate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);

  const sortedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [workouts]
  );

  const exerciseMap = useMemo(() => {
    const map = new Map();
    for (const ex of exercises) map.set(ex.id, ex);
    return map;
  }, [exercises]);

  // ─── Stats ───
  const rawStats = useMemo(() => calculateMonthlySummary(sortedWorkouts), [sortedWorkouts]);
  const stats = sortedWorkouts.length === 0 ? null : rawStats;

  // ─── Streak ───
  const streak = useMemo(() => calculateStreak(sortedWorkouts), [sortedWorkouts]);

  // ─── Calendar ───
  const workoutDateSet = useMemo(
    () => new Set(sortedWorkouts.map(w => w.date.slice(0, 10))),
    [sortedWorkouts]
  );

  const calendarCells = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = toDateStr(date);
      cells.push({ day: d, dateStr, hasWorkout: workoutDateSet.has(dateStr) });
    }
    return cells;
  }, [calendarDate, workoutDateSet]);

  const calendarWorkouts = useMemo(() => {
    if (!calendarSelectedDate) return [];
    return sortedWorkouts.filter(w => w.date.slice(0, 10) === calendarSelectedDate);
  }, [calendarSelectedDate, sortedWorkouts]);

  const todayStr = toDateStr(new Date());

  const handleToggle = (id) => setExpandedId(prev => (prev === id ? null : id));

  const prevMonth = () => {
    setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setCalendarSelectedDate(null);
  };
  const nextMonth = () => {
    setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setCalendarSelectedDate(null);
  };

  return (
    <div className="card workout-history">
      <div className="workout-history-header">
        <button className="btn-back" onClick={onBack}>&larr; Back</button>
        <h2>Workout History</h2>
        {sortedWorkouts.length > 0 && (
          <div className="workout-view-toggle">
            <button
              className={`workout-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`workout-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>
        )}
      </div>

      {sortedWorkouts.length === 0 ? (
        <p className="empty-message">No workouts yet. Complete a workout to see it here!</p>
      ) : (
        <>
          {/* Stats Row */}
          {stats && (
            <div className="workout-stats-grid">
              <div className="workout-stat-card">
                <span className="workout-stat-value">{stats.count}</span>
                <span className="workout-stat-label">Workouts</span>
              </div>
              <div className="workout-stat-card">
                <span className="workout-stat-value">{(stats.totalVolume / 1000).toFixed(1)}k</span>
                <span className="workout-stat-label">Total lbs</span>
              </div>
              <div className="workout-stat-card">
                <span className="workout-stat-value">{formatDuration(stats.totalTime)}</span>
                <span className="workout-stat-label">Total Time</span>
              </div>
              <div className="workout-stat-card">
                <span className="workout-stat-value">{formatDuration(stats.avgDuration)}</span>
                <span className="workout-stat-label">Avg Duration</span>
              </div>
              <div className="workout-stat-card workout-stat-streak">
                <span className="workout-stat-value">{streak.current}</span>
                <span className="workout-stat-label">Day Streak</span>
              </div>
              <div className="workout-stat-card">
                <span className="workout-stat-value">{streak.longest}</span>
                <span className="workout-stat-label">Best Streak</span>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="workout-calendar">
              <div className="workout-cal-header">
                <button className="workout-cal-nav" onClick={prevMonth}>&#8249;</button>
                <span className="workout-cal-month">{getMonthName(calendarDate)}</span>
                <button className="workout-cal-nav" onClick={nextMonth}>&#8250;</button>
              </div>

              <div className="workout-cal-grid">
                {WEEKDAY_LABELS.map(d => (
                  <div key={d} className="workout-cal-weekday">{d}</div>
                ))}
                {calendarCells.map((cell, i) => {
                  if (!cell) return <div key={`empty-${i}`} className="workout-cal-day empty" />;
                  const isToday = cell.dateStr === todayStr;
                  const isSelected = cell.dateStr === calendarSelectedDate;
                  return (
                    <div
                      key={cell.dateStr}
                      className={[
                        'workout-cal-day',
                        cell.hasWorkout ? 'has-workout' : '',
                        isToday ? 'today' : '',
                        isSelected ? 'selected' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => cell.hasWorkout && setCalendarSelectedDate(
                        prev => prev === cell.dateStr ? null : cell.dateStr
                      )}
                    >
                      {cell.day}
                      {cell.hasWorkout && <span className="workout-cal-dot" />}
                    </div>
                  );
                })}
              </div>

              {calendarSelectedDate && calendarWorkouts.length > 0 && (
                <div className="workout-cal-selected-workouts">
                  <h4 className="workout-cal-selected-date">
                    {formatDate(calendarSelectedDate)}
                  </h4>
                  {calendarWorkouts.map(workout => {
                    const volume = getTotalVolume(workout);
                    return (
                      <div key={workout.id} className="workout-cal-workout-card">
                        <div className="workout-cal-workout-meta">
                          <span>{workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}</span>
                          <span>&middot;</span>
                          <span>{formatDuration(workout.durationMinutes)}</span>
                          <span>&middot;</span>
                          <span>{volume.toLocaleString()} lbs</span>
                          {workout.isCompleted && <span className="workout-completed-badge">&#10003; Done</span>}
                        </div>
                        <div className="workout-cal-workout-exercises">
                          {workout.exercises.map(we => {
                            const ex = exerciseMap.get(we.exerciseId);
                            return (
                              <span key={we.id} className="workout-cal-ex-pill">
                                {ex?.name || 'Unknown'}
                              </span>
                            );
                          })}
                        </div>
                        <div className="workout-card-actions" style={{ marginTop: 8 }}>
                          {onEditWorkout && (
                            <button
                              className="btn-edit-workout"
                              onClick={() => onEditWorkout(workout.id)}
                            >
                              &#9998; Edit
                            </button>
                          )}
                          <button
                            className="btn-delete"
                            onClick={() => { onDeleteWorkout(workout.id); setCalendarSelectedDate(null); }}
                          >
                            &times; Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <ul className="workout-history-list">
              {sortedWorkouts.map((workout) => {
                const isExpanded = expandedId === workout.id;
                const volume = getTotalVolume(workout);
                const exerciseCount = workout.exercises.length;

                return (
                  <li key={workout.id} className="workout-card">
                    <div
                      className="workout-card-summary"
                      onClick={() => handleToggle(workout.id)}
                    >
                      <div className="workout-card-left">
                        <span className="workout-card-date">
                          {formatDate(workout.date)}
                          {workout.isCompleted && (
                            <span className="workout-completed-badge">&#10003; Completed</span>
                          )}
                        </span>
                        <span className="workout-card-meta">
                          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                          {' '}&middot;{' '}
                          {formatDuration(workout.durationMinutes)}
                        </span>
                        {(() => {
                          const { primary, secondary } = getWorkoutMuscleGroups(workout, exerciseMap);
                          return (primary.length > 0 || secondary.length > 0) ? (
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
                          ) : null;
                        })()}
                      </div>
                      <div className="workout-card-right">
                        <span className="workout-card-volume">
                          {volume.toLocaleString()} lbs
                        </span>
                        <span className="workout-card-volume-label">total volume</span>
                      </div>
                      <span className={`workout-card-chevron ${isExpanded ? 'expanded' : ''}`}>
                        &#9662;
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="workout-card-details">
                        {workout.exercises.length === 0 ? (
                          <p className="empty-message">No exercises recorded.</p>
                        ) : (
                          <ul className="workout-exercise-list">
                            {workout.exercises.map((we) => {
                              const ex = exerciseMap.get(we.exerciseId);
                              return (
                                <li key={we.id} className="workout-exercise-item">
                                  <span className="workout-exercise-name">
                                    {ex?.name || 'Unknown Exercise'}
                                  </span>
                                  {we.sets.length > 0 && (
                                    <ul className="workout-set-list">
                                      {we.sets.map((set, idx) => {
                                        const typeLabel = getSetTypeLabel(set);
                                        return (
                                          <li key={set.id} className="workout-set-row">
                                            <span className="workout-set-number">
                                              {typeLabel || (idx + 1)}
                                            </span>
                                            <span className="workout-set-detail">
                                              {set.reps ?? '--'} reps &times; {formatWeight(set.weight)} lbs
                                            </span>
                                            {set.rpe != null && (
                                              <span className="workout-set-rpe">RPE {set.rpe}</span>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <div className="workout-card-actions">
                          {onEditWorkout && (
                            <button
                              className="btn-edit-workout"
                              onClick={(e) => { e.stopPropagation(); onEditWorkout(workout.id); }}
                            >
                              &#9998; Edit
                            </button>
                          )}
                          {onSaveAsTemplate && (
                            <button
                              className="btn-save-template"
                              onClick={(e) => { e.stopPropagation(); onSaveAsTemplate(workout); }}
                            >
                              Save as Template
                            </button>
                          )}
                          <button
                            className="btn-delete"
                            onClick={(e) => { e.stopPropagation(); onDeleteWorkout(workout.id); }}
                          >
                            &times; Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
