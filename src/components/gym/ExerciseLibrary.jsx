import { useState, useMemo } from 'react';
import { formatDate } from '../../shared/utils';

const MUSCLE_GROUPS = [
  'all',
  'chest',
  'trapezius', 'upper_back', 'lower_back',
  'front_deltoids', 'rear_deltoids',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors',
  'cardio', 'full_body',
];

const MUSCLE_GROUP_LABELS = {
  all:            'All',
  chest:          'Chest',
  trapezius:      'Trapezius',
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

const EQUIPMENT_TYPES = ['All', 'Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'None'];
const MOVEMENT_TYPES = ['all', 'compound', 'isolation', 'cardio'];
const MOVEMENT_LABELS = { all: 'All', compound: 'Compound', isolation: 'Isolation', cardio: 'Cardio' };

function formatWeight(w) {
  if (w == null) return '--';
  return Number(w) % 1 === 0 ? `${Number(w)}` : `${Number(w).toFixed(1)}`;
}

export default function ExerciseLibrary({
  exercises,
  workouts = [],
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onBack,
}) {
  // Filter state
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('All');
  const [filterMovement, setFilterMovement] = useState('all');

  // Add form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('chest');
  const [equipment, setEquipment] = useState('');
  const [movementType, setMovementType] = useState('compound');
  const [secondaryMuscles, setSecondaryMuscles] = useState([]);
  const [instructions, setInstructions] = useState('');

  // Edit form state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMuscleGroup, setEditMuscleGroup] = useState('');
  const [editEquipment, setEditEquipment] = useState('');
  const [editMovementType, setEditMovementType] = useState('compound');
  const [editSecondaryMuscles, setEditSecondaryMuscles] = useState([]);
  const [editInstructions, setEditInstructions] = useState('');

  // Detail view state
  const [detailExercise, setDetailExercise] = useState(null);

  const filtered = useMemo(() => {
    let list = exercises;
    if (filterGroup !== 'all') list = list.filter(e => e.muscleGroup === filterGroup);
    if (filterEquipment !== 'All') list = list.filter(e => e.equipment === filterEquipment);
    if (filterMovement !== 'all') list = list.filter(e => e.movementType === filterMovement);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q));
    }
    const groups = {};
    for (const mg of MUSCLE_GROUPS.filter(m => m !== 'all')) {
      const items = list.filter(e => e.muscleGroup === mg).sort((a, b) => a.name.localeCompare(b.name));
      if (items.length > 0) groups[mg] = items;
    }
    return groups;
  }, [exercises, filterGroup, filterEquipment, filterMovement, search]);

  const groupCounts = useMemo(() => {
    const counts = { all: exercises.length };
    for (const ex of exercises) counts[ex.muscleGroup] = (counts[ex.muscleGroup] || 0) + 1;
    return counts;
  }, [exercises]);

  const filteredTotal = useMemo(
    () => Object.values(filtered).reduce((sum, items) => sum + items.length, 0),
    [filtered]
  );

  // Exercise history for detail view
  const exerciseHistory = useMemo(() => {
    if (!detailExercise) return [];
    return workouts
      .filter(w => w.exercises.some(we => we.exerciseId === detailExercise.id))
      .map(w => {
        const we = w.exercises.find(e => e.exerciseId === detailExercise.id);
        const completedSets = we.sets.filter(s => s.completed && s.weight && s.reps);
        const maxWeight = completedSets.length > 0
          ? Math.max(...completedSets.map(s => Number(s.weight)))
          : 0;
        const totalVolume = completedSets.reduce(
          (sum, s) => sum + Number(s.weight) * Number(s.reps), 0
        );
        return { date: w.date, sets: we.sets, completedSets, maxWeight, totalVolume };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [detailExercise, workouts]);

  const toggleSecondary = (mg, current, setter) => {
    setter(prev => prev.includes(mg) ? prev.filter(m => m !== mg) : [...prev, mg]);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddExercise({
      name: name.trim(),
      muscleGroup,
      equipment: equipment.trim() || null,
      movementType: movementType || null,
      secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : null,
      instructions: instructions.trim() || null,
    });
    setName(''); setMuscleGroup('chest'); setEquipment('');
    setMovementType('compound'); setSecondaryMuscles([]); setInstructions('');
    setShowForm(false);
  };

  const startEdit = (ex) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditMuscleGroup(ex.muscleGroup);
    setEditEquipment(ex.equipment || '');
    setEditMovementType(ex.movementType || 'compound');
    setEditSecondaryMuscles(ex.secondaryMuscles || []);
    setEditInstructions(ex.instructions || '');
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdateExercise(editingId, {
      name: editName.trim(),
      muscleGroup: editMuscleGroup,
      equipment: editEquipment.trim() || null,
      movementType: editMovementType || null,
      secondaryMuscles: editSecondaryMuscles.length > 0 ? editSecondaryMuscles : null,
      instructions: editInstructions.trim() || null,
    });
    setEditingId(null);
  };

  // ─── Detail View ───
  if (detailExercise) {
    const ex = detailExercise;
    return (
      <div className="exlib">
        <div className="exlib-header">
          <div className="exlib-header-top">
            <button className="exlib-back-btn" onClick={() => setDetailExercise(null)}>&larr; Back</button>
            <h2 className="exlib-title">{ex.name}</h2>
            {ex.isCustom && <span className="exlib-detail-custom-badge">Custom</span>}
          </div>
        </div>

        <div className="exlib-detail-body">
          {/* Meta grid */}
          <div className="card exlib-detail-meta-card">
            <div className="exlib-detail-meta-grid">
              <div className="exlib-detail-meta-item">
                <span className="exlib-detail-meta-label">Primary Muscle</span>
                <span className="exlib-detail-meta-value">{MUSCLE_GROUP_LABELS[ex.muscleGroup] || ex.muscleGroup}</span>
              </div>
              {ex.equipment && (
                <div className="exlib-detail-meta-item">
                  <span className="exlib-detail-meta-label">Equipment</span>
                  <span className="exlib-detail-meta-value">{ex.equipment}</span>
                </div>
              )}
              {ex.movementType && (
                <div className="exlib-detail-meta-item">
                  <span className="exlib-detail-meta-label">Movement Type</span>
                  <span className="exlib-detail-meta-value">{MOVEMENT_LABELS[ex.movementType] || ex.movementType}</span>
                </div>
              )}
            </div>

            {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
              <div className="exlib-detail-secondary">
                <span className="exlib-detail-meta-label">Secondary Muscles</span>
                <div className="exlib-detail-secondary-tags">
                  {ex.secondaryMuscles.map(mg => (
                    <span key={mg} className="exlib-secondary-tag">{MUSCLE_GROUP_LABELS[mg] || mg}</span>
                  ))}
                </div>
              </div>
            )}

            {ex.instructions && (
              <div className="exlib-detail-instructions">
                <span className="exlib-detail-meta-label">Instructions</span>
                <p className="exlib-detail-instructions-text">{ex.instructions}</p>
              </div>
            )}
          </div>

          {/* Exercise History */}
          <div className="card exlib-detail-history-card">
            <h3 className="exlib-detail-section-title">
              Exercise History
              {exerciseHistory.length > 0 && (
                <span className="exlib-detail-history-count">{exerciseHistory.length} session{exerciseHistory.length !== 1 ? 's' : ''}</span>
              )}
            </h3>
            {exerciseHistory.length === 0 ? (
              <p className="empty-message">No workout history for this exercise yet.</p>
            ) : (
              <div className="exlib-history-list">
                {exerciseHistory.map((entry, i) => (
                  <div key={i} className="exlib-history-entry">
                    <div className="exlib-history-entry-header">
                      <span className="exlib-history-date">{formatDate(entry.date)}</span>
                      <div className="exlib-history-stats">
                        {entry.maxWeight > 0 && (
                          <span className="exlib-history-stat">
                            <span className="exlib-history-stat-label">Top</span>
                            {formatWeight(entry.maxWeight)} lbs
                          </span>
                        )}
                        {entry.totalVolume > 0 && (
                          <span className="exlib-history-stat">
                            <span className="exlib-history-stat-label">Vol</span>
                            {entry.totalVolume.toLocaleString()} lbs
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="exlib-history-sets">
                      {entry.sets.map((set, si) => (
                        <span key={si} className={`exlib-history-set-pill ${!set.completed ? 'incomplete' : ''}`}>
                          {set.reps ?? '--'} × {formatWeight(set.weight)}
                          {set.setType === 'warmup' ? ' W' : set.setType === 'dropset' ? ' D' : set.setType === 'failure' ? ' F' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Library View ───
  return (
    <div className="exlib">
      {/* Header */}
      <div className="exlib-header">
        <div className="exlib-header-top">
          <button className="exlib-back-btn" onClick={onBack}>&larr; Back</button>
          <h2 className="exlib-title">Exercise Library</h2>
          <span className="exlib-count">{exercises.length} exercises</span>
        </div>

        <div className="exlib-search">
          <span className="exlib-search-icon">&#128269;</span>
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Muscle group filters */}
        <div className="exlib-filters">
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              className={`exlib-filter-pill ${filterGroup === mg ? 'active' : ''}`}
              onClick={() => setFilterGroup(mg)}
            >
              {MUSCLE_GROUP_LABELS[mg]}
              {groupCounts[mg] > 0 && (
                <span className="exlib-filter-count">{groupCounts[mg] || 0}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment + Movement type filters */}
      <div className="exlib-subfilters">
        <div className="exlib-subfilter-row">
          <span className="exlib-subfilter-label">Equipment</span>
          <div className="exlib-subfilter-pills">
            {EQUIPMENT_TYPES.map(eq => (
              <button
                key={eq}
                className={`exlib-subfilter-pill ${filterEquipment === eq ? 'active' : ''}`}
                onClick={() => setFilterEquipment(eq)}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
        <div className="exlib-subfilter-row">
          <span className="exlib-subfilter-label">Type</span>
          <div className="exlib-subfilter-pills">
            {MOVEMENT_TYPES.map(mt => (
              <button
                key={mt}
                className={`exlib-subfilter-pill ${filterMovement === mt ? 'active' : ''}`}
                onClick={() => setFilterMovement(mt)}
              >
                {MOVEMENT_LABELS[mt]}
              </button>
            ))}
          </div>
        </div>
        {(filterEquipment !== 'All' || filterMovement !== 'all' || filterGroup !== 'all' || search) && (
          <div className="exlib-filter-result">
            {filteredTotal} result{filteredTotal !== 1 ? 's' : ''}
            <button
              className="exlib-filter-clear"
              onClick={() => { setFilterGroup('all'); setFilterEquipment('All'); setFilterMovement('all'); setSearch(''); }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        className="exlib-add-btn"
        onClick={() => { setShowForm(!showForm); setEditingId(null); }}
      >
        {showForm ? 'Cancel' : '+ Add Custom Exercise'}
      </button>

      {/* Add Form */}
      {showForm && (
        <div className="card exlib-form-card">
          <form onSubmit={handleAdd} className="exlib-form">
            <div className="form-group">
              <label>Exercise Name</label>
              <input
                type="text"
                placeholder="e.g. Bulgarian Split Squat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="exlib-form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Muscle Group</label>
                <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
                  {MUSCLE_GROUPS.filter(mg => mg !== 'all').map(mg => (
                    <option key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Equipment</label>
                <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
                  <option value="">None / Other</option>
                  {EQUIPMENT_TYPES.filter(e => e !== 'All').map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Movement Type</label>
                <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                  {MOVEMENT_TYPES.filter(m => m !== 'all').map(mt => (
                    <option key={mt} value={mt}>{MOVEMENT_LABELS[mt]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Secondary Muscles</label>
              <div className="exlib-muscle-checkboxes">
                {MUSCLE_GROUPS.filter(mg => mg !== 'all' && mg !== muscleGroup).map(mg => (
                  <label key={mg} className="exlib-muscle-check">
                    <input
                      type="checkbox"
                      checked={secondaryMuscles.includes(mg)}
                      onChange={() => toggleSecondary(mg, secondaryMuscles, setSecondaryMuscles)}
                    />
                    {MUSCLE_GROUP_LABELS[mg]}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Instructions <span className="exlib-optional">(optional)</span></label>
              <textarea
                placeholder="Setup and execution cues..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="exlib-textarea"
              />
            </div>
            <button type="submit" className="btn-add">Add Exercise</button>
          </form>
        </div>
      )}

      {/* Grouped Exercise List */}
      {Object.keys(filtered).length === 0 ? (
        <div className="card">
          <p className="empty-message">
            {search || filterEquipment !== 'All' || filterMovement !== 'all'
              ? 'No exercises match the current filters.'
              : 'No exercises in this category.'}
          </p>
        </div>
      ) : (
        Object.entries(filtered).map(([mg, items]) => (
          <div key={mg} className="card exlib-group">
            <div className="exlib-group-header">
              <h3 className="exlib-group-title">{MUSCLE_GROUP_LABELS[mg]}</h3>
              <span className="exlib-group-count">{items.length}</span>
            </div>
            <div className="exlib-group-grid">
              {items.map(ex => {
                if (editingId === ex.id) {
                  return (
                    <div key={ex.id} className="exlib-card editing">
                      <form onSubmit={handleEditSave} className="exlib-edit-form">
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>
                        <div className="exlib-form-row">
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Muscle Group</label>
                            <select value={editMuscleGroup} onChange={(e) => setEditMuscleGroup(e.target.value)}>
                              {MUSCLE_GROUPS.filter(m => m !== 'all').map(g => (
                                <option key={g} value={g}>{MUSCLE_GROUP_LABELS[g]}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Equipment</label>
                            <select value={editEquipment} onChange={(e) => setEditEquipment(e.target.value)}>
                              <option value="">None / Other</option>
                              {EQUIPMENT_TYPES.filter(e => e !== 'All').map(eq => (
                                <option key={eq} value={eq}>{eq}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Movement Type</label>
                            <select value={editMovementType} onChange={(e) => setEditMovementType(e.target.value)}>
                              {MOVEMENT_TYPES.filter(m => m !== 'all').map(mt => (
                                <option key={mt} value={mt}>{MOVEMENT_LABELS[mt]}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Secondary Muscles</label>
                          <div className="exlib-muscle-checkboxes">
                            {MUSCLE_GROUPS.filter(mg => mg !== 'all' && mg !== editMuscleGroup).map(mg => (
                              <label key={mg} className="exlib-muscle-check">
                                <input
                                  type="checkbox"
                                  checked={editSecondaryMuscles.includes(mg)}
                                  onChange={() => toggleSecondary(mg, editSecondaryMuscles, setEditSecondaryMuscles)}
                                />
                                {MUSCLE_GROUP_LABELS[mg]}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Instructions</label>
                          <textarea
                            value={editInstructions}
                            onChange={(e) => setEditInstructions(e.target.value)}
                            rows={3}
                            className="exlib-textarea"
                            placeholder="Setup and execution cues..."
                          />
                        </div>
                        <div className="recurring-edit-actions">
                          <button type="submit" className="btn-save-cat">Save</button>
                          <button type="button" className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  );
                }

                return (
                  <div key={ex.id} className="exlib-card">
                    <div
                      className="exlib-card-body exlib-card-body-clickable"
                      onClick={() => setDetailExercise(ex)}
                      title="View details"
                    >
                      <span className="exlib-card-name">{ex.name}</span>
                      <div className="exlib-card-tags">
                        {ex.equipment && (
                          <span className="exlib-card-equip">{ex.equipment}</span>
                        )}
                        {ex.movementType && (
                          <span className="exlib-card-movement">{MOVEMENT_LABELS[ex.movementType]}</span>
                        )}
                      </div>
                    </div>
                    <div className="exlib-card-actions">
                      {ex.isCustom && <span className="exlib-card-badge">Custom</span>}
                      {ex.isCustom && (
                        <button
                          className="btn-edit-recurring"
                          onClick={() => startEdit(ex)}
                          title="Edit"
                        >
                          &#9998;
                        </button>
                      )}
                      {ex.isCustom && (
                        <button
                          className="btn-delete"
                          onClick={() => onDeleteExercise(ex.id)}
                          title="Remove"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
