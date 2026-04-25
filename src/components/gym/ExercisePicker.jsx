import { useState, useMemo } from 'react';

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

export default function ExercisePicker({
  exercises,
  onSelect,
  onCreateExercise,
  onClose,
}) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState('chest');
  const [newEquipment, setNewEquipment] = useState('');

  const filtered = useMemo(() => {
    let result = exercises;

    if (muscleFilter !== 'all') {
      result = result.filter(e => e.muscleGroup === muscleFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(e => e.name.toLowerCase().includes(q));
    }

    return result;
  }, [exercises, search, muscleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const newExercise = await onCreateExercise({
      name: trimmedName,
      muscleGroup: newMuscleGroup,
      equipment: newEquipment.trim() || null,
    });

    // Auto-select the newly created exercise so the user doesn't have to find it
    if (newExercise?.id) {
      onSelect(newExercise.id);
      return;
    }

    setNewName('');
    setNewMuscleGroup('chest');
    setNewEquipment('');
    setShowCreateForm(false);
  };

  return (
    <div className="exercise-picker-overlay" onClick={onClose}>
      <div className="exercise-picker" onClick={(e) => e.stopPropagation()}>
        <div className="exercise-picker-header">
          <h3>Select Exercise</h3>
          <button className="btn-delete" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          className="exercise-picker-search"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        {/* Muscle Group Filter Pills */}
        <div className="exercise-picker-filters">
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              className={`exercise-filter-pill ${muscleFilter === mg ? 'active' : ''}`}
              onClick={() => setMuscleFilter(mg)}
            >
              {MUSCLE_GROUP_LABELS[mg]}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <ul className="exercise-picker-list">
          {filtered.length === 0 ? (
            <li className="empty-message">No exercises found.</li>
          ) : (
            filtered.map(ex => (
              <li
                key={ex.id}
                className="exercise-picker-item"
                onClick={() => onSelect(ex.id)}
              >
                <div className="exercise-picker-item-info">
                  <span className="exercise-picker-item-name">{ex.name}</span>
                  <span className="exercise-picker-item-meta">
                    {MUSCLE_GROUP_LABELS[ex.muscleGroup] || ex.muscleGroup}
                    {ex.equipment && <> &middot; {ex.equipment}</>}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Create Custom */}
        {!showCreateForm ? (
          <button
            className="btn-add gym-btn-secondary exercise-picker-create-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create Custom Exercise
          </button>
        ) : (
          <form onSubmit={handleCreate} className="exercise-picker-create-form">
            <h4>New Custom Exercise</h4>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Exercise name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Muscle Group</label>
              <select
                value={newMuscleGroup}
                onChange={(e) => setNewMuscleGroup(e.target.value)}
              >
                {MUSCLE_GROUPS.filter(mg => mg !== 'all').map(mg => (
                  <option key={mg} value={mg}>
                    {MUSCLE_GROUP_LABELS[mg]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Equipment (optional)</label>
              <input
                type="text"
                placeholder="e.g. Barbell, Dumbbell"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
              />
            </div>
            <div className="recurring-edit-actions">
              <button type="submit" className="btn-save-cat">Create</button>
              <button type="button" className="btn-cancel" onClick={() => setShowCreateForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
