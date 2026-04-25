import { useState, useEffect, useMemo } from 'react';
import { formatDate } from '../../shared/utils';

const SET_TYPES = [
  { value: 'normal',  label: 'Normal'   },
  { value: 'warmup',  label: 'Warmup'   },
  { value: 'dropset', label: 'Drop Set' },
  { value: 'failure', label: 'Failure'  },
];

const MUSCLE_COLORS = {
  chest:          '#7c5cfc',
  trapezius:      '#0ea5e9',
  upper_back:     '#0ea5e9',
  lower_back:     '#0ea5e9',
  front_deltoids: '#7c5cfc',
  rear_deltoids:  '#0ea5e9',
  biceps:         '#0ea5e9',
  triceps:        '#7c5cfc',
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
  hamstrings:     'Hamstrings',
  glutes:         'Glutes',
  calves:         'Calves',
  adductors:      'Adductors',
  abductors:      'Abductors',
  cardio:         'Cardio',
  full_body:      'Full Body',
};

function RestTimer({ seconds, onDismiss }) {
  const [remaining, setRemaining] = useState(seconds);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (remaining <= 0) { setPulsing(true); return; }
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div
      className={`rest-timer-overlay ${pulsing ? 'rest-timer-pulsing' : ''}`}
      onClick={onDismiss}
    >
      <div className="rest-timer-content">
        <span className="rest-timer-label">Rest</span>
        <span className="rest-timer-countdown">
          {mins}:{String(secs).padStart(2, '0')}
        </span>
        {pulsing && <span className="rest-timer-done">Time&#39;s up!</span>}
        <span className="rest-timer-dismiss">Tap to dismiss</span>
      </div>
    </div>
  );
}

export default function WorkoutLogger({
  workout,
  exercises,
  onUpdateWorkout,
  onRemoveExercise,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onFinish,
  onCancel,
  onOpenExercisePicker,
  onUpdateWorkoutExercise,
  onCompleteWorkout,
  onCheckIsPR,
}) {
  const isEditMode = workout?.isCompleted || false;
  const [elapsed, setElapsed]               = useState(() => isEditMode && workout?.durationMinutes ? workout.durationMinutes * 60 : 0);
  const [startTime]                         = useState(() => Date.now());
  const [restTimer, setRestTimer]           = useState(null);
  const [expandedNotes, setExpandedNotes]   = useState({});
  const [editingRestTimer, setEditingRestTimer] = useState(null);
  const [isCompleted, setIsCompleted]       = useState(false);

  useEffect(() => {
    if (isCompleted || isEditMode) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, isCompleted, isEditMode]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map(e => [e.id, e])),
    [exercises]
  );

  const formatTimer = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${m}:${String(sec).padStart(2,'0')}`;
  };

  const handleSetField = (setId, field, value) => {
    let parsed = value;
    if (field === 'reps' || field === 'weight' || field === 'rpe') {
      parsed = value === '' ? null : Number(value);
    }
    onUpdateSet(setId, { [field]: parsed });
  };

  const handleSetCompleted = (setId, checked, we) => {
    handleSetField(setId, 'completed', checked);
    if (checked) setRestTimer({ weId: we.id, seconds: we.restTimerSeconds || 90 });
  };

  const handleSetTypeChange = (setId, newType) => {
    onUpdateSet(setId, { setType: newType, isWarmup: newType === 'warmup' });
  };

  const handleFinish = () => {
    const mins = Math.round(elapsed / 60);
    if (onCompleteWorkout) onCompleteWorkout(workout.id, mins);
    else onFinish(workout.id, mins);
    setIsCompleted(true);
  };

  if (!workout) return null;

  if (isCompleted) {
    return (
      <div className="workout-logger">
        <div className="workout-completed-banner">
          <div className="workout-completed-icon">&#10003;</div>
          <h3>Workout Complete!</h3>
          <p className="workout-completed-duration">{formatTimer(elapsed)}</p>
          <p className="workout-completed-meta">
            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
          </p>
          <button
            className="btn-add gym-btn-primary"
            onClick={() => onFinish(workout.id, Math.round(elapsed / 60))}
            style={{ marginTop: 16 }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-logger">
      {restTimer && (
        <RestTimer seconds={restTimer.seconds} onDismiss={() => setRestTimer(null)} />
      )}

      {/* ── Header ── */}
      <div className="wl-header">
        <div className="wl-header-top">
          <div className="wl-header-left">
            {isEditMode && <span className="workout-edit-badge">Editing</span>}
            <span className="wl-date">{formatDate(workout.date)}</span>
            <span className="wl-exercise-count">
              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="wl-timer-wrap">
            <span className="wl-timer-icon">⏱</span>
            <span className="wl-timer">{formatTimer(elapsed)}</span>
          </div>
        </div>
        <textarea
          className="wl-notes-input"
          placeholder="Add workout notes..."
          value={workout.notes || ''}
          onChange={e => onUpdateWorkout(workout.id, { notes: e.target.value })}
          rows={2}
        />
      </div>

      {/* ── Exercise List ── */}
      <div className="workout-exercises">
        {workout.exercises.length === 0 && (
          <div className="wl-empty">
            <span className="wl-empty-icon">🏋️</span>
            <p>No exercises yet — tap <strong>+ Add Exercise</strong> to get started.</p>
          </div>
        )}

        {workout.exercises.map((we) => {
          const ex           = exerciseMap.get(we.exerciseId);
          const muscleGroup  = ex?.muscleGroup;
          const accentColor  = MUSCLE_COLORS[muscleGroup] || '#7c5cfc';
          const notesOpen    = expandedNotes[we.id] || false;
          const restOpen     = editingRestTimer === we.id;

          return (
            <div key={we.id} className="wl-exercise-card" style={{ '--ex-accent': accentColor }}>
              <div className="wl-exercise-accent" />

              {/* Card header */}
              <div className="wl-exercise-header">
                <div className="wl-exercise-header-left">
                  <h4 className="wl-exercise-name">{ex?.name || 'Unknown Exercise'}</h4>
                  <div className="wl-exercise-meta">
                    {muscleGroup && (
                      <span
                        className="wl-muscle-pill"
                        style={{ background: `${accentColor}22`, color: accentColor, borderColor: `${accentColor}55` }}
                      >
                        {MUSCLE_GROUP_LABELS[muscleGroup] || muscleGroup}
                      </span>
                    )}
                    <button
                      className={`wl-btn-notes ${notesOpen ? 'active' : ''}`}
                      onClick={() => setExpandedNotes(p => ({ ...p, [we.id]: !p[we.id] }))}
                    >
                      Notes
                    </button>
                    <button
                      className={`wl-btn-rest ${restOpen ? 'active' : ''}`}
                      onClick={() => setEditingRestTimer(restOpen ? null : we.id)}
                      title="Rest timer"
                    >
                      ⏱ {we.restTimerSeconds ?? 90}s
                    </button>
                  </div>
                </div>
                <button className="btn-delete" onClick={() => onRemoveExercise(we.id)} title="Remove">&times;</button>
              </div>

              {/* Notes */}
              {notesOpen && (
                <textarea
                  className="wl-notes-input wl-exercise-notes"
                  placeholder="Exercise notes..."
                  value={we.notes || ''}
                  onChange={e => onUpdateWorkoutExercise?.(we.id, { notes: e.target.value })}
                  rows={2}
                />
              )}

              {/* Rest timer editor */}
              {restOpen && (
                <div className="wl-rest-editor">
                  <span>Rest timer:</span>
                  <input
                    type="number"
                    className="set-input"
                    min="0"
                    step="15"
                    value={we.restTimerSeconds ?? 90}
                    onChange={e => onUpdateWorkoutExercise?.(we.id, { restTimerSeconds: Math.max(0, Number(e.target.value)) })}
                  />
                  <span>seconds</span>
                </div>
              )}

              {/* Sets */}
              <div className="wl-sets">
                {we.sets.length > 0 && (
                  <div className="wl-set-header">
                    <span>#</span>
                    <span>Type</span>
                    <span>Reps</span>
                    <span>Weight</span>
                    <span>RPE</span>
                    <span>Done</span>
                    <span />
                  </div>
                )}

                {we.sets.map((s, idx) => {
                  const setType  = s.setType || (s.isWarmup ? 'warmup' : 'normal');
                  const isPR     = onCheckIsPR && s.weight && s.completed && onCheckIsPR(we.exerciseId, Number(s.weight));

                  return (
                    <div
                      key={s.id}
                      className={`wl-set-row set-type-${setType} ${s.completed ? 'set-completed' : ''}`}
                    >
                      <span className="wl-set-num">{idx + 1}</span>

                      <select
                        className="set-type-selector"
                        value={setType}
                        onChange={e => handleSetTypeChange(s.id, e.target.value)}
                      >
                        {SET_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        className="set-input"
                        min="0"
                        placeholder="—"
                        value={s.reps ?? ''}
                        onChange={e => handleSetField(s.id, 'reps', e.target.value)}
                      />

                      <div className="wl-weight-cell">
                        <input
                          type="number"
                          className="set-input"
                          min="0"
                          step="any"
                          placeholder="—"
                          value={s.weight ?? ''}
                          onChange={e => handleSetField(s.id, 'weight', e.target.value)}
                        />
                        {isPR && <span className="pr-badge">PR!</span>}
                      </div>

                      <input
                        type="number"
                        className="set-input set-input-sm"
                        min="1"
                        max="10"
                        step="0.5"
                        placeholder="—"
                        value={s.rpe ?? ''}
                        onChange={e => handleSetField(s.id, 'rpe', e.target.value)}
                      />

                      <input
                        type="checkbox"
                        className="set-checkbox"
                        checked={s.completed || false}
                        onChange={e => handleSetCompleted(s.id, e.target.checked, we)}
                      />

                      <button
                        className="btn-delete-set"
                        onClick={() => onDeleteSet(s.id)}
                        title="Delete set"
                      >&times;</button>
                    </div>
                  );
                })}
              </div>

              <button className="btn-add-set" onClick={() => onAddSet(we.id, {})}>
                + Add Set
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="workout-logger-footer">
        <button className="btn-add gym-btn-secondary" onClick={onOpenExercisePicker}>
          + Add Exercise
        </button>
        {isEditMode ? (
          <button className="btn-add gym-btn-primary" onClick={() => onFinish(workout.id, workout.durationMinutes)}>
            Save Changes
          </button>
        ) : (
          <>
            <button className="btn-add gym-btn-primary" onClick={handleFinish}>
              Complete Workout
            </button>
            <button className="btn-cancel-workout" onClick={onCancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
