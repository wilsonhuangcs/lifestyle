import { useState, useMemo, memo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

const MUSCLE_COLORS = {
  chest: '#FF6B6B', back: '#4ECDC4', shoulders: '#45B7D1',
  biceps: '#F7DC6F', triceps: '#BB8FCE', legs: '#96CEB4',
  glutes: '#F0B27A', core: '#DDA0DD', cardio: '#98D8C8', full_body: '#1abc9c',
};

const LINE_COLORS = [
  '#FF6B6B', '#45B7D1', '#2ecc71', '#9b59b6', '#F0B27A',
  '#3498db', '#E91E63', '#F7DC6F', '#1abc9c', '#34495e',
];

const DATE_RANGES = [
  { key: '7d', label: '7 Days', days: 7 },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '90d', label: '90 Days', days: 90 },
  { key: 'all', label: 'All Time', days: null },
];

function formatDateShort(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getWeekLabel(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getWeekKey(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

const WeightTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <span className="chart-tooltip-name">{label}</span>
        {payload.map((entry, i) => (
          <div key={i} className="chart-tooltip-row">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="chart-tooltip-value">{entry.value} lbs</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const VolumeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <span className="chart-tooltip-name">{label}</span>
        {payload.map((entry, i) => (
          <div key={i} className="chart-tooltip-row">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="chart-tooltip-value">{entry.value.toLocaleString()} lbs</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <span className="chart-tooltip-name">{d.name}</span>
        <span className="chart-tooltip-value">{d.value.toLocaleString()} lbs</span>
        {d.percent !== undefined && (
          <span className="chart-tooltip-pct">{d.percent}%</span>
        )}
      </div>
    );
  }
  return null;
};

const SimpleTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <span className="chart-tooltip-name">{label}</span>
        {payload.map((entry, i) => (
          <div key={i} className="chart-tooltip-row">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="chart-tooltip-value">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}{unit ? ` ${unit}` : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function ProgressCharts({ workouts, exercises }) {
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);
  const [dateRange, setDateRange] = useState('30d');
  const [oneRmExerciseId, setOneRmExerciseId] = useState('');

  const exerciseMap = useMemo(() => {
    const map = new Map();
    for (const ex of exercises) map.set(ex.id, ex);
    return map;
  }, [exercises]);

  // Filter workouts by selected date range
  const filteredWorkouts = useMemo(() => {
    const rangeDef = DATE_RANGES.find(r => r.key === dateRange);
    if (!rangeDef || rangeDef.days === null) return workouts;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDef.days);
    cutoff.setHours(0, 0, 0, 0);
    return workouts.filter(w => new Date(w.date) >= cutoff);
  }, [workouts, dateRange]);

  // Build list of exercises that appear in workouts for the dropdown
  const exercisesInWorkouts = useMemo(() => {
    const ids = new Set();
    for (const w of filteredWorkouts) {
      for (const we of w.exercises) {
        ids.add(we.exerciseId);
      }
    }
    return exercises.filter(ex => ids.has(ex.id));
  }, [filteredWorkouts, exercises]);

  // All exercises that appear in any workout (for 1RM dropdown, not filtered by date)
  const allExercisesInWorkouts = useMemo(() => {
    const ids = new Set();
    for (const w of workouts) {
      for (const we of w.exercises) {
        ids.add(we.exerciseId);
      }
    }
    return exercises.filter(ex => ids.has(ex.id));
  }, [workouts, exercises]);

  // ─── Weight Over Time ───
  const weightOverTimeData = useMemo(() => {
    if (selectedExerciseIds.length === 0) return [];

    const sorted = [...filteredWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted
      .map((w) => {
        const point = { date: formatDateShort(w.date) };
        let hasData = false;

        for (const exId of selectedExerciseIds) {
          const we = w.exercises.find(e => e.exerciseId === exId);
          if (we && we.sets.length > 0) {
            const maxWeight = Math.max(
              ...we.sets
                .filter(s => s.weight != null && !s.isWarmup)
                .map(s => Number(s.weight)),
              0
            );
            if (maxWeight > 0) {
              const ex = exerciseMap.get(exId);
              point[ex?.name || exId] = maxWeight;
              hasData = true;
            }
          }
        }

        return hasData ? point : null;
      })
      .filter(Boolean);
  }, [filteredWorkouts, selectedExerciseIds, exerciseMap]);

  // ─── Volume Per Muscle Group (stacked bar) ───
  const volumeByMuscleGroupData = useMemo(() => {
    const weekMap = new Map();
    const sorted = [...filteredWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    for (const w of sorted) {
      const weekLabel = getWeekLabel(w.date);
      const weekKey = getWeekKey(w.date);

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { week: weekLabel, _key: weekKey });
      }
      const weekEntry = weekMap.get(weekKey);

      for (const we of w.exercises) {
        const ex = exerciseMap.get(we.exerciseId);
        const muscleGroup = ex?.muscleGroup || 'full_body';

        let volume = 0;
        for (const set of we.sets) {
          if (set.weight && set.reps) {
            volume += Number(set.weight) * Number(set.reps);
          }
        }

        if (volume > 0) {
          weekEntry[muscleGroup] = (weekEntry[muscleGroup] || 0) + volume;
        }
      }
    }

    return Array.from(weekMap.values())
      .sort((a, b) => a._key.localeCompare(b._key));
  }, [filteredWorkouts, exerciseMap]);

  const muscleGroupsInData = useMemo(() => {
    const groups = new Set();
    for (const entry of volumeByMuscleGroupData) {
      for (const key of Object.keys(entry)) {
        if (key !== 'week' && key !== '_key') groups.add(key);
      }
    }
    return Array.from(groups);
  }, [volumeByMuscleGroupData]);

  // ─── Muscle Group Distribution (donut) ───
  const muscleDistributionData = useMemo(() => {
    const totals = new Map();
    let grandTotal = 0;

    for (const w of filteredWorkouts) {
      for (const we of w.exercises) {
        const ex = exerciseMap.get(we.exerciseId);
        const muscleGroup = ex?.muscleGroup || 'full_body';

        for (const set of we.sets) {
          if (set.weight && set.reps) {
            const vol = Number(set.weight) * Number(set.reps);
            totals.set(muscleGroup, (totals.get(muscleGroup) || 0) + vol);
            grandTotal += vol;
          }
        }
      }
    }

    return Array.from(totals.entries())
      .map(([group, value]) => ({
        name: group.replace('_', ' '),
        value,
        color: MUSCLE_COLORS[group] || '#95a5a6',
        percent: grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredWorkouts, exerciseMap]);

  // ─── Volume Over Time (line chart) ───
  const volumeOverTimeData = useMemo(() => {
    const weekMap = new Map();
    const sorted = [...filteredWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    for (const w of sorted) {
      const weekLabel = getWeekLabel(w.date);
      const weekKey = getWeekKey(w.date);

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { week: weekLabel, _key: weekKey, volume: 0 });
      }
      const weekEntry = weekMap.get(weekKey);

      for (const we of w.exercises) {
        for (const set of we.sets) {
          if (set.weight && set.reps) {
            weekEntry.volume += Number(set.weight) * Number(set.reps);
          }
        }
      }
    }

    return Array.from(weekMap.values())
      .sort((a, b) => a._key.localeCompare(b._key));
  }, [filteredWorkouts]);

  // ─── Workout Frequency (bar chart) ───
  const workoutFrequencyData = useMemo(() => {
    const weekMap = new Map();
    const sorted = [...filteredWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    for (const w of sorted) {
      const weekLabel = getWeekLabel(w.date);
      const weekKey = getWeekKey(w.date);

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { week: weekLabel, _key: weekKey, count: 0 });
      }
      weekMap.get(weekKey).count += 1;
    }

    return Array.from(weekMap.values())
      .sort((a, b) => a._key.localeCompare(b._key));
  }, [filteredWorkouts]);

  // ─── Estimated 1RM Progression (line chart) ───
  const oneRmData = useMemo(() => {
    if (!oneRmExerciseId) return [];

    const sorted = [...filteredWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));
    const points = [];

    for (const w of sorted) {
      const we = w.exercises.find(e => e.exerciseId === oneRmExerciseId);
      if (!we || we.sets.length === 0) continue;

      // Find heaviest set (by estimated 1RM)
      let best1RM = 0;
      for (const set of we.sets) {
        if (set.weight && set.reps && set.setType !== 'warmup' && !set.isWarmup) {
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          const e1rm = weight * (1 + reps / 30);
          if (e1rm > best1RM) best1RM = e1rm;
        }
      }

      if (best1RM > 0) {
        points.push({
          date: formatDateShort(w.date),
          e1rm: Math.round(best1RM),
        });
      }
    }

    return points;
  }, [filteredWorkouts, oneRmExerciseId]);

  // ─── Top Lifts / PRs ───
  const topLiftsData = useMemo(() => {
    const maxWeights = new Map();
    for (const w of filteredWorkouts) {
      for (const we of w.exercises) {
        const ex = exerciseMap.get(we.exerciseId);
        if (!ex) continue;
        for (const set of we.sets) {
          const isWarmup = set.setType === 'warmup' || set.isWarmup;
          if (set.weight && Number(set.weight) > 0 && !isWarmup) {
            const current = maxWeights.get(we.exerciseId);
            if (!current || Number(set.weight) > current.weight) {
              maxWeights.set(we.exerciseId, { name: ex.name, weight: Number(set.weight) });
            }
          }
        }
      }
    }
    return Array.from(maxWeights.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15);
  }, [filteredWorkouts, exerciseMap]);

  // ─── Body Part Balance (horizontal bar) ───
  const bodyPartBalanceData = useMemo(() => {
    const totals = new Map();

    for (const w of filteredWorkouts) {
      for (const we of w.exercises) {
        const ex = exerciseMap.get(we.exerciseId);
        const muscleGroup = ex?.muscleGroup || 'full_body';

        for (const set of we.sets) {
          if (set.weight && set.reps) {
            const vol = Number(set.weight) * Number(set.reps);
            totals.set(muscleGroup, (totals.get(muscleGroup) || 0) + vol);
          }
        }
      }
    }

    return Array.from(totals.entries())
      .map(([group, volume]) => ({
        name: group.replace('_', ' '),
        volume,
        color: MUSCLE_COLORS[group] || '#95a5a6',
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [filteredWorkouts, exerciseMap]);

  const handleExerciseSelect = (e) => {
    const id = e.target.value;
    if (!id) return;
    if (!selectedExerciseIds.includes(id)) {
      setSelectedExerciseIds(prev => [...prev, id]);
    }
  };

  const handleRemoveExercise = (id) => {
    setSelectedExerciseIds(prev => prev.filter(exId => exId !== id));
  };

  if (workouts.length === 0) return null;

  return (
    <>
      {/* Date Range Tabs */}
      <div className="chart-date-range-tabs">
        {DATE_RANGES.map(r => (
          <button
            key={r.key}
            className={`chart-date-tab${dateRange === r.key ? ' active' : ''}`}
            onClick={() => setDateRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Muscle Group Distribution — Donut */}
      <div className="card chart-card">
        <h2>Muscle Group Distribution</h2>
        {muscleDistributionData.length === 0 ? (
          <p className="empty-message">No volume data to display.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={muscleDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={2}
                  stroke="none"
                >
                  {muscleDistributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
                <Legend
                  formatter={(value) => {
                    const d = muscleDistributionData.find(p => p.name === value);
                    return `${value} (${d?.percent || 0}%)`;
                  }}
                  wrapperStyle={{ fontSize: '0.8rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Volume Over Time — Line */}
      <div className="card chart-card">
        <h2>Volume Over Time</h2>
        {volumeOverTimeData.length === 0 ? (
          <p className="empty-message">No volume data to display.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={volumeOverTimeData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip content={<SimpleTooltip unit="lbs" />} />
                <Line
                  type="monotone"
                  dataKey="volume"
                  name="Total Volume"
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Workout Frequency — Bar */}
      <div className="card chart-card">
        <h2>Workout Frequency</h2>
        {workoutFrequencyData.length === 0 ? (
          <p className="empty-message">No workout data to display.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workoutFrequencyData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar
                  dataKey="count"
                  name="Workouts"
                  fill="#45B7D1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Lifts / PRs — Horizontal Bar */}
      <div className="card chart-card">
        <h2>Top Lifts</h2>
        <p className="chart-subtitle">Heaviest set per exercise (non-warmup)</p>
        {topLiftsData.length === 0 ? (
          <p className="empty-message">No weight data to display.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={Math.max(250, topLiftsData.length * 36)}>
              <BarChart data={topLiftsData} layout="vertical" margin={{ left: 10, right: 50, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" fontSize={12} tickFormatter={(v) => `${v}`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  fontSize={11}
                  tick={{ fill: '#555' }}
                />
                <Tooltip content={<SimpleTooltip unit="lbs" />} />
                <Bar dataKey="weight" name="Max Weight" radius={[0, 6, 6, 0]}>
                  {topLiftsData.map((_, i) => (
                    <Cell key={i} fill={LINE_COLORS[i % LINE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Estimated 1RM Progression — Line */}
      <div className="card chart-card">
        <h2>Estimated 1RM Progression</h2>
        <div className="chart-controls">
          <select
            className="filter-select"
            value={oneRmExerciseId}
            onChange={(e) => setOneRmExerciseId(e.target.value)}
          >
            <option value="">Select an exercise...</option>
            {allExercisesInWorkouts.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        {!oneRmExerciseId ? (
          <p className="empty-message">Select an exercise to view estimated 1RM progression.</p>
        ) : oneRmData.length === 0 ? (
          <p className="empty-message">No data for selected exercise in this date range.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={oneRmData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${v}`} />
                <Tooltip content={<SimpleTooltip unit="lbs" />} />
                <Line
                  type="monotone"
                  dataKey="e1rm"
                  name="Est. 1RM"
                  stroke="#FF6B6B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Body Part Balance — Horizontal Bar */}
      <div className="card chart-card">
        <h2>Body Part Balance</h2>
        {bodyPartBalanceData.length === 0 ? (
          <p className="empty-message">No volume data to display.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={Math.max(250, bodyPartBalanceData.length * 40)}>
              <BarChart data={bodyPartBalanceData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" fontSize={12} tickFormatter={(v) => v.toLocaleString()} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  fontSize={12}
                  tick={{ fill: '#555' }}
                />
                <Tooltip content={<SimpleTooltip unit="lbs" />} />
                <Bar dataKey="volume" name="Volume" radius={[0, 6, 6, 0]}>
                  {bodyPartBalanceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weight Over Time — existing */}
      <div className="card chart-card">
        <h2>Weight Over Time</h2>
        <div className="chart-controls">
          <select
            className="filter-select"
            value=""
            onChange={handleExerciseSelect}
          >
            <option value="">+ Add exercise to chart...</option>
            {exercisesInWorkouts
              .filter(ex => !selectedExerciseIds.includes(ex.id))
              .map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))
            }
          </select>
          {selectedExerciseIds.length > 0 && (
            <div className="chart-exercise-tags">
              {selectedExerciseIds.map((id, idx) => {
                const ex = exerciseMap.get(id);
                return (
                  <span
                    key={id}
                    className="chart-exercise-tag"
                    style={{ borderColor: LINE_COLORS[idx % LINE_COLORS.length] }}
                  >
                    {ex?.name || id}
                    <button
                      className="chart-tag-remove"
                      onClick={() => handleRemoveExercise(id)}
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {selectedExerciseIds.length === 0 ? (
          <p className="empty-message">Select an exercise to view weight progression.</p>
        ) : weightOverTimeData.length === 0 ? (
          <p className="empty-message">No weight data for selected exercises.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightOverTimeData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${v}`} />
                <Tooltip content={<WeightTooltip />} />
                <Legend />
                {selectedExerciseIds.map((id, idx) => {
                  const ex = exerciseMap.get(id);
                  return (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={ex?.name || id}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Volume Per Muscle Group — existing */}
      <div className="card chart-card">
        <h2>Volume Per Muscle Group</h2>
        {volumeByMuscleGroupData.length === 0 ? (
          <p className="empty-message">No volume data to display.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeByMuscleGroupData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip content={<VolumeTooltip />} />
                <Legend />
                {muscleGroupsInData.map((group) => (
                  <Bar
                    key={group}
                    dataKey={group}
                    name={group.replace('_', ' ')}
                    fill={MUSCLE_COLORS[group] || '#95a5a6'}
                    stackId="volume"
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}

export default memo(ProgressCharts);
