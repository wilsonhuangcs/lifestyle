import { useState } from 'react';
import BodyMap from './BodyMap';

const MUSCLE_GROUPS = [
  'chest',
  'trapezius', 'upper_back', 'lower_back',
  'front_deltoids', 'rear_deltoids',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors',
  'cardio', 'full_body',
];

const MUSCLE_GROUP_LABELS = {
  chest:          'Chest',
  trapezius:      'Trapezius',
  upper_back:     'Latissimus Dorsi',
  lower_back:     'Lower Back',
  front_deltoids: 'Front Deltoids',
  rear_deltoids:  'Rear Deltoids',
  biceps:         'Biceps',
  triceps:        'Triceps',
  forearms:       'Forearms',
  abs:            'Abdominals',
  obliques:       'Obliques',
  quadriceps:     'Quadriceps',
  hamstrings:     'Hamstrings',
  glutes:         'Glutes',
  calves:         'Calves',
  adductors:      'Adductors',
  abductors:      'Abductors',
  cardio:         'Cardio',
  full_body:      'Full Body',
};

function formatMuscleGroup(key) {
  return MUSCLE_GROUP_LABELS[key] || key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getTimeRemaining(recoveryRows, muscleGroup) {
  const row = recoveryRows.find(r => r.muscleGroup === muscleGroup);
  if (!row) return null;

  const recoveredAt = new Date(row.recoveredAt);
  const now = new Date();

  if (recoveredAt <= now) return null; // already recovered

  const diffMs = recoveredAt - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    const hrs = diffHours % 24;
    return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
  }
  if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
  return `${diffMins}m`;
}

function RecoveryCard({ muscle, status, recoveryRows }) {
  const timeRemaining = getTimeRemaining(recoveryRows, muscle);

  const dotClass = `recovery-status-dot ${status}`;

  let timeLabel = null;
  if (status === 'recovered') {
    timeLabel = 'Recovered';
  } else if (status === 'untrained') {
    timeLabel = 'Not trained';
  } else if (timeRemaining) {
    timeLabel = `Recovers in ${timeRemaining}`;
  }

  return (
    <div className={`recovery-card recovery-card--${status}`}>
      <div className="recovery-card-header">
        <span className={dotClass} />
        <span className="recovery-card-name">{formatMuscleGroup(muscle)}</span>
      </div>
      {timeLabel && (
        <span className="recovery-time-label">{timeLabel}</span>
      )}
    </div>
  );
}

export default function RecoveryTracker({
  recoveryStatus,
  recoveryRows,
  settings,
  onUpdateSettings,
  onBack,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleBlur = (muscle, value) => {
    const hours = Math.min(96, Math.max(12, Number(value)));
    const updated = { ...localSettings, [muscle]: hours };
    setLocalSettings(updated);
    onUpdateSettings({ [muscle]: hours });
  };

  const handleChange = (muscle, value) => {
    setLocalSettings(prev => ({ ...prev, [muscle]: value }));
  };

  return (
    <div className="recovery-tracker">
      <div className="gym-section-header">
        <button className="profile-back-btn" onClick={onBack}>&larr; Back</button>
        <h2>Recovery Status</h2>
      </div>

      <div className="card recovery-body-map-card">
        <BodyMap recoveryStatus={recoveryStatus} recoveryRows={recoveryRows} />
      </div>

      <div className="recovery-grid">
        {MUSCLE_GROUPS.map(muscle => (
          <RecoveryCard
            key={muscle}
            muscle={muscle}
            status={recoveryStatus[muscle] || 'untrained'}
            recoveryRows={recoveryRows}
          />
        ))}
      </div>

      <div className="recovery-settings-panel">
        <button
          className="gym-nav-btn recovery-settings-toggle"
          onClick={() => setSettingsOpen(o => !o)}
        >
          {settingsOpen ? 'Hide Settings' : 'Recovery Settings'}
        </button>

        {settingsOpen && (
          <div className="recovery-settings-body">
            <p className="recovery-settings-hint">
              Set recovery hours per muscle group (12–96 hours). Changes save automatically.
            </p>
            <div className="recovery-settings-grid">
              {MUSCLE_GROUPS.map(muscle => (
                <div key={muscle} className="recovery-setting-row">
                  <label className="recovery-setting-label">
                    {formatMuscleGroup(muscle)}
                  </label>
                  <input
                    type="number"
                    className="recovery-setting-input"
                    min={12}
                    max={96}
                    value={localSettings[muscle] ?? settings[muscle] ?? 48}
                    onChange={e => handleChange(muscle, e.target.value)}
                    onBlur={e => handleBlur(muscle, e.target.value)}
                  />
                  <span className="recovery-setting-unit">hrs</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
