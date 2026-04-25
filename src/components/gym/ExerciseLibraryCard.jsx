import { useState, useMemo, useEffect } from 'react';
import { useExerciseGif } from '../../hooks/useExerciseGif';

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

const EQUIPMENT_TYPES = ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell'];
const MOVEMENT_TYPES  = ['compound', 'isolation', 'cardio'];
const MOVEMENT_LABELS = { compound: 'Compound', isolation: 'Isolation', cardio: 'Cardio' };

// ── Animated exercise images (cycles start → end position) ──
function ExerciseImages({ images, name }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!images || images.length < 2) return;
    const id = setInterval(() => setFrame(f => (f + 1) % images.length), 800);
    return () => clearInterval(id);
  }, [images]);

  if (!images?.length) return null;
  return (
    <img
      src={images[frame]}
      alt={`${name} demonstration`}
      className="exlib-video-gif"
    />
  );
}

// ── Video modal (separate component so the hook only fires when open) ──
function ExerciseVideoModal({ exercise, onClose }) {
  const { images, matchName, isLoading, error } = useExerciseGif(exercise.name, exercise.equipment);
  const accentColor = MUSCLE_COLORS[exercise.muscleGroup] || '#6b7280';

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="exlib-video-backdrop" onClick={onClose}>
      <div className="exlib-video-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="exlib-video-modal-header">
          <div className="exlib-video-modal-title">
            <span className="exlib-video-modal-dot" style={{ background: accentColor }} />
            <h4>{exercise.name}</h4>
            {matchName && matchName.toLowerCase() !== exercise.name.toLowerCase() && (
              <span className="exlib-video-match-label">via "{matchName}"</span>
            )}
          </div>
          <button className="exlib-video-modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Demo images / loading / error */}
        <div className="exlib-video-modal-body">
          {isLoading && (
            <div className="exlib-video-loading">
              <span className="exlib-video-spinner" />
              <p>Loading demonstration...</p>
            </div>
          )}
          {!isLoading && images?.length > 0 && (
            <ExerciseImages images={images} name={exercise.name} />
          )}
          {!isLoading && error && (
            <div className="exlib-video-fallback">
              <p>No demonstration found for this exercise.</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        {exercise.instructions && (
          <p className="exlib-video-modal-instructions">{exercise.instructions}</p>
        )}

        {/* YouTube fallback link */}
        <a
          className="exlib-video-modal-yt-link"
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' exercise form tutorial')}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on YouTube ↗
        </a>
      </div>
    </div>
  );
}

export default function ExerciseLibraryCard({
  exercises,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
}) {
  const [search,      setSearch]      = useState('');
  const [filterGroup, setFilterGroup] = useState('chest');

  // Add-custom form
  const [showForm,     setShowForm]     = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newMuscle,    setNewMuscle]    = useState('chest');
  const [newEquipment, setNewEquipment] = useState('');
  const [newMovement,  setNewMovement]  = useState('compound');

  // Video modal
  const [videoExercise, setVideoExercise] = useState(null);

  // Inline edit
  const [editingId,        setEditingId]        = useState(null);
  const [editName,         setEditName]         = useState('');
  const [editMuscle,       setEditMuscle]       = useState('');
  const [editEquipment,    setEditEquipment]    = useState('');
  const [editMovement,     setEditMovement]     = useState('compound');

  const filtered = useMemo(() => {
    let list = exercises.filter(e =>
      e.muscleGroup === filterGroup ||
      (Array.isArray(e.secondaryMuscles) && e.secondaryMuscles.includes(filterGroup))
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      const aPrimary = a.muscleGroup === filterGroup;
      const bPrimary = b.muscleGroup === filterGroup;
      if (aPrimary !== bPrimary) return aPrimary ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [exercises, filterGroup, search]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddExercise({
      name:         newName.trim(),
      muscleGroup:  newMuscle,
      equipment:    newEquipment.trim() || null,
      movementType: newMovement || null,
    });
    setNewName(''); setNewMuscle('chest'); setNewEquipment(''); setNewMovement('compound');
    setShowForm(false);
  };

  const startEdit = (ex) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditMuscle(ex.muscleGroup);
    setEditEquipment(ex.equipment || '');
    setEditMovement(ex.movementType || 'compound');
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdateExercise(editingId, {
      name:         editName.trim(),
      muscleGroup:  editMuscle,
      equipment:    editEquipment.trim() || null,
      movementType: editMovement || null,
    });
    setEditingId(null);
  };

  return (
    <div className="card exlib-card-container">

      {/* ── Header ── */}
      <div className="exlib-card-header">
        <h3>Exercise Library</h3>
        <button
          className="btn-add gym-btn-secondary exlib-add-custom-btn"
          onClick={() => { setShowForm(s => !s); setEditingId(null); }}
        >
          {showForm ? 'Cancel' : '+ Custom'}
        </button>
      </div>

      {/* ── Search + muscle group filter ── */}
      <div className="exlib-card-search-row">
        <div className="exlib-card-search">
          <span className="exlib-search-icon">&#128269;</span>
          <input
            type="text"
            placeholder="Search Exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="exlib-search-clear" onClick={() => setSearch('')}>&times;</button>
          )}
        </div>
        <select
          className="exlib-group-select"
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
        >
          {MUSCLE_GROUPS.map(mg => (
            <option key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg]}</option>
          ))}
        </select>
      </div>

      {/* ── Add Custom Form ── */}
      {showForm && (
        <form onSubmit={handleAdd} className="exlib-inline-form">
          <div className="exlib-inline-form-row">
            <input
              type="text"
              placeholder="Exercise Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              autoFocus
              className="exlib-inline-input"
            />
            <select value={newMuscle} onChange={e => setNewMuscle(e.target.value)} className="exlib-inline-select">
              {MUSCLE_GROUPS.map(mg => (
                <option key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg]}</option>
              ))}
            </select>
            <select value={newEquipment} onChange={e => setNewEquipment(e.target.value)} className="exlib-inline-select">
              <option value="">No Equipment</option>
              {EQUIPMENT_TYPES.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
            <select value={newMovement} onChange={e => setNewMovement(e.target.value)} className="exlib-inline-select">
              {MOVEMENT_TYPES.map(mt => (
                <option key={mt} value={mt}>{MOVEMENT_LABELS[mt]}</option>
              ))}
            </select>
            <button type="submit" className="btn-save-cat">Add</button>
          </div>
        </form>
      )}

      {/* ── Video Modal ── */}
      {videoExercise && (
        <ExerciseVideoModal
          exercise={videoExercise}
          onClose={() => setVideoExercise(null)}
        />
      )}

      {/* ── Exercise Grid ── */}
      <div className="exlib-grid">
        {filtered.length === 0 ? (
          <p className="empty-message exlib-empty">
            {search ? 'No exercises match your search.' : `No exercises for ${MUSCLE_GROUP_LABELS[filterGroup]}.`}
          </p>
        ) : (
          filtered.map(ex => {
            const accentColor = MUSCLE_COLORS[ex.muscleGroup] || '#6b7280';
            const isSecondary = ex.muscleGroup !== filterGroup;

            if (editingId === ex.id) {
              return (
                <form key={ex.id} onSubmit={handleEditSave} className="exlib-edit-card">
                  <input
                    className="exlib-inline-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                    autoFocus
                  />
                  <select value={editMuscle} onChange={e => setEditMuscle(e.target.value)} className="exlib-inline-select">
                    {MUSCLE_GROUPS.map(mg => (
                      <option key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg]}</option>
                    ))}
                  </select>
                  <select value={editEquipment} onChange={e => setEditEquipment(e.target.value)} className="exlib-inline-select">
                    <option value="">No Equipment</option>
                    {EQUIPMENT_TYPES.map(eq => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                  <select value={editMovement} onChange={e => setEditMovement(e.target.value)} className="exlib-inline-select">
                    {MOVEMENT_TYPES.map(mt => (
                      <option key={mt} value={mt}>{MOVEMENT_LABELS[mt]}</option>
                    ))}
                  </select>
                  <div className="exlib-edit-card-actions">
                    <button type="submit" className="btn-save-cat">Save</button>
                    <button type="button" className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={ex.id}
                className="exlib-ex-card"
                style={{ '--accent': accentColor }}
                onClick={() => !editingId && setVideoExercise(ex)}
              >
                <div className="exlib-ex-card-accent" />
                <div className="exlib-ex-card-body">
                  <span className="exlib-ex-card-name">{ex.name}</span>
                  <div className="exlib-ex-card-tags">
                    {/* Calisthenics tag for no-equipment exercises */}
                    {(!ex.equipment || ex.equipment === 'Bodyweight' || ex.equipment === 'None') && (
                      <span className="exlib-card-calisthenics">Calisthenics</span>
                    )}
                    {/* Primary muscle — emphasized pill */}
                    {(() => {
                      const c = MUSCLE_COLORS[ex.muscleGroup] || '#6b7280';
                      return (
                        <span
                          className="exlib-muscle-pill exlib-muscle-pill--primary"
                          style={{
                            background:   `${c}25`,
                            borderColor:  `${c}70`,
                            color:        c,
                          }}
                          data-tooltip="Primary"
                        >
                          {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                        </span>
                      );
                    })()}
                    {/* Secondary muscles — muted pills */}
                    {Array.isArray(ex.secondaryMuscles) && ex.secondaryMuscles.map(mg => (
                      <span key={mg} className="exlib-muscle-pill exlib-muscle-pill--secondary" data-tooltip="Secondary">
                        {MUSCLE_GROUP_LABELS[mg] || mg.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                {ex.isCustom && (
                  <div className="exlib-ex-card-actions">
                    <button className="btn-edit-recurring" onClick={() => startEdit(ex)} title="Edit">&#9998;</button>
                    <button className="btn-delete" onClick={() => onDeleteExercise(ex.id)} title="Delete">&times;</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
