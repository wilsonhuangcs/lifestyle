import { useMemo, useState } from 'react';
import { formatDate, formatDateShort } from '../../shared/utils';
import BodyMap from './BodyMap';
import GymHeader from './GymHeader';
import ExerciseLibraryCard from './ExerciseLibraryCard';

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

export default function GymDashboard({
  workouts,
  templates,
  exercises,
  recoveryStatus,
  recoveryRows,
  onStartWorkout,
  onStartFromTemplate,
  onDeleteWorkout,
  onDeleteTemplate,
  onViewHistory,
  onCreateTemplate,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
}) {

  const exerciseMap = useMemo(
    () => new Map(exercises.map(e => [e.id, e])),
    [exercises]
  );

  const recentWorkouts = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.slice(0, 5);
  }, [workouts]);

  const recentPRs = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const historicalMax = {};
    const recentMax = {};

    for (const w of workouts) {
      const wDate = new Date(w.date);
      for (const we of w.exercises) {
        for (const s of we.sets) {
          if (!s.completed || !s.weight || s.isWarmup) continue;
          if (wDate < sevenDaysAgo) {
            if (!historicalMax[we.exerciseId] || s.weight > historicalMax[we.exerciseId]) {
              historicalMax[we.exerciseId] = s.weight;
            }
          } else {
            if (!recentMax[we.exerciseId] || s.weight > recentMax[we.exerciseId].weight) {
              recentMax[we.exerciseId] = { weight: s.weight, date: w.date };
            }
          }
        }
      }
    }

    const prs = [];
    for (const [exerciseId, { weight, date }] of Object.entries(recentMax)) {
      const prev = historicalMax[exerciseId] || 0;
      if (weight > prev) {
        const ex = exerciseMap.get(exerciseId);
        prs.push({ exerciseId, exerciseName: ex?.name || 'Unknown', weight, previousWeight: prev, date });
      }
    }

    return prs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [workouts, exerciseMap]);

  const formatVolume = (vol) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toLocaleString();
  };

  return (
    <div className="gym-dashboard">

      {/* ── Full-width header with month nav, stats, week calendar ── */}
      <GymHeader workouts={workouts} exercises={exercises} />

      {/* ── Nav links ── */}
      <div className="gym-nav-links gym-nav-links--bar">
        <button className="gym-nav-btn" onClick={onViewHistory}>History</button>
      </div>

      {/* ── 2-column body ── */}
      <div className="dashboard-columns">

        {/* Left: Quick Start + Recovery */}
        <div className="dashboard-col-left">

          <div className="card gym-quick-start">
            <h3>Quick Start</h3>
            <div className="gym-quick-start-buttons">
              <button className="btn-add gym-btn-primary" onClick={onStartWorkout}>
                + New Workout
              </button>
            </div>
          </div>

          {recoveryStatus && (
            <div className="card gym-recovery-summary">
              <div className="gym-section-header">
                <h3>Recovery</h3>
              </div>
              <BodyMap recoveryStatus={recoveryStatus} recoveryRows={recoveryRows || []} />
            </div>
          )}

          {/* ── My Templates ── */}
          <div className="card gym-templates-card">
            <div className="gym-section-header">
              <h3>My Templates</h3>
              <button className="gym-nav-btn" onClick={onCreateTemplate}>+ Create</button>
            </div>
            {templates.length === 0 ? (
              <div className="gym-empty-state">
                <span className="material-icons gym-empty-icon">content_copy</span>
                <p>No templates yet — save a workout as a template to reuse it.</p>
                <button className="btn-add gym-btn-secondary" onClick={onCreateTemplate}>
                  Create Template
                </button>
              </div>
            ) : (
              <ul className="gym-template-list">
                {templates.map(t => {
                  const muscleGroups = [...new Set(
                    t.exercises
                      .map(te => exerciseMap.get(te.exerciseId)?.muscleGroup)
                      .filter(Boolean)
                  )];
                  return (
                    <li key={t.id} className="gym-template-row">
                      <div className="gym-template-info">
                        <span className="gym-template-name">{t.name}</span>
                        <div className="gym-template-meta">
                          <span>{t.exercises.length} exercise{t.exercises.length !== 1 ? 's' : ''}</span>
                          {muscleGroups.length > 0 && (
                            <div className="workout-muscle-tags">
                              {muscleGroups.slice(0, 4).map(mg => (
                                <span
                                  key={mg}
                                  className="muscle-tag muscle-tag--primary"
                                  style={{ '--tag-color': MUSCLE_TAG_COLORS[mg] || '#6b7280' }}
                                >
                                  {MUSCLE_GROUP_LABELS[mg] || mg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="gym-template-actions">
                        <button
                          className="btn-add gym-btn-secondary gym-template-start-btn"
                          onClick={() => onStartFromTemplate(t.id)}
                        >
                          Start
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => onDeleteTemplate(t.id)}
                          title="Delete template"
                        >
                          &times;
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Recent workouts + PRs */}
        <div className="dashboard-col-right">

          <div className="card gym-recent-workouts">
            <div className="gym-section-header">
              <h3>Recent Workouts</h3>
              {workouts.length > 5 && (
                <button className="gym-nav-btn" onClick={onViewHistory}>View All</button>
              )}
            </div>
            {recentWorkouts.length === 0 ? (
              <div className="gym-empty-state">
                <span className="material-icons gym-empty-icon">fitness_center</span>
                <p>No workouts yet — start your first one!</p>
                <button className="btn-add gym-btn-primary" onClick={onStartWorkout}>
                  + New Workout
                </button>
              </div>
            ) : (
              <ul className="gym-workout-list">
                {recentWorkouts.map(w => (
                  <li key={w.id} className="gym-workout-row">
                    <div className="gym-workout-details">
                      <span className="gym-workout-date">
                        {formatDate(w.date)}
                        {w.isCompleted && (
                          <span className="workout-completed-badge-sm">&#10003;</span>
                        )}
                      </span>
                      <span className="gym-workout-meta">
                        {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}
                        {w.durationMinutes != null && <> &middot; {w.durationMinutes} min</>}
                      </span>
                      {(() => {
                        const { primary, secondary } = getWorkoutMuscleGroups(w, exerciseMap);
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
                    <span className="gym-workout-volume">
                      {formatVolume(
                        w.exercises.reduce((sum, we) =>
                          sum + we.sets.reduce((s, set) =>
                            s + ((set.completed && set.weight && set.reps) ? set.weight * set.reps : 0), 0
                          ), 0
                        )
                      )} lbs
                    </span>
                    <button
                      className="btn-delete"
                      onClick={(e) => { e.stopPropagation(); onDeleteWorkout(w.id); }}
                      title="Delete workout"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {recentPRs.length > 0 && (
            <div className="card gym-recent-prs">
              <div className="gym-section-header">
                <h3>Recent PRs</h3>
              </div>
              <ul className="gym-pr-list">
                {recentPRs.map(pr => (
                  <li key={pr.exerciseId} className="gym-pr-row">
                    <div className="gym-pr-details">
                      <span className="gym-pr-exercise">{pr.exerciseName}</span>
                      <span className="gym-pr-date">{formatDateShort(pr.date)}</span>
                    </div>
                    <div className="gym-pr-weight">
                      <span className="gym-pr-badge">PR</span>
                      <span className="gym-pr-value">{pr.weight} lbs</span>
                      {pr.previousWeight > 0 && (
                        <span className="gym-pr-prev">(was {pr.previousWeight} lbs)</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Exercise Library ── */}
          <ExerciseLibraryCard
            exercises={exercises}
            onAddExercise={onAddExercise}
            onUpdateExercise={onUpdateExercise}
            onDeleteExercise={onDeleteExercise}
          />

        </div>
      </div>
    </div>
  );
}
