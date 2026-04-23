import { useState, useMemo, useRef } from 'react';

function getExerciseName(exerciseId, exerciseMap) {
  const ex = exerciseMap.get(exerciseId);
  return ex ? ex.name : 'Unknown Exercise';
}

function TemplateForm({ exercises, exerciseMap, initialValues, onSave, onCancel, onOpenExercisePicker }) {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [templateExercises, setTemplateExercises] = useState(
    () => (initialValues?.exercises || []).map((te, i) => ({ ...te, _tempId: te.id || `t${i}` }))
  );
  const tempIdCounter = useRef(0);

  const handleAddExercise = () => {
    onOpenExercisePicker((exerciseId) => {
      setTemplateExercises(prev => [
        ...prev,
        {
          exerciseId,
          targetSets: 3,
          targetReps: 10,
          targetWeight: '',
          _tempId: `new_${tempIdCounter.current++}`,
        },
      ]);
    });
  };

  const handleRemoveExercise = (index) => {
    setTemplateExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleExerciseFieldChange = (index, field, value) => {
    setTemplateExercises(prev =>
      prev.map((te, i) =>
        i === index ? { ...te, [field]: value } : te
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      exercises: templateExercises.map((te, idx) => ({
        exerciseId: te.exerciseId,
        targetSets: parseInt(te.targetSets) || null,
        targetReps: parseInt(te.targetReps) || null,
        targetWeight: parseFloat(te.targetWeight) || null,
        sortOrder: idx,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="template-form">
      <div className="form-group">
        <label>Template Name</label>
        <input
          type="text"
          placeholder="e.g. Push Day, Upper Body"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="template-exercises-section">
        <div className="template-exercises-header">
          <label>Exercises</label>
          <button
            type="button"
            className="btn-add-recurring"
            onClick={handleAddExercise}
          >
            + Add Exercise
          </button>
        </div>

        {templateExercises.length === 0 ? (
          <p className="empty-message">No exercises added yet.</p>
        ) : (
          <ul className="template-exercise-list">
            {templateExercises.map((te, idx) => (
              <li key={te._tempId} className="template-exercise-row">
                <span className="template-exercise-name">
                  {getExerciseName(te.exerciseId, exerciseMap)}
                </span>
                <div className="template-exercise-targets">
                  <div className="form-group template-target-input">
                    <label>Sets</label>
                    <input
                      type="number"
                      min="1"
                      value={te.targetSets}
                      onChange={(e) => handleExerciseFieldChange(idx, 'targetSets', e.target.value)}
                    />
                  </div>
                  <div className="form-group template-target-input">
                    <label>Reps</label>
                    <input
                      type="number"
                      min="1"
                      value={te.targetReps}
                      onChange={(e) => handleExerciseFieldChange(idx, 'targetReps', e.target.value)}
                    />
                  </div>
                  <div className="form-group template-target-input">
                    <label>Weight</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="lbs"
                      value={te.targetWeight}
                      onChange={(e) => handleExerciseFieldChange(idx, 'targetWeight', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => handleRemoveExercise(idx)}
                  title="Remove Exercise"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="recurring-edit-actions">
        <button type="submit" className="btn-save-cat">Save Template</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function WorkoutTemplateManager({
  templates,
  exercises,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onStartFromTemplate,
  onOpenExercisePicker,
  onBack,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const exerciseMap = useMemo(() => {
    const map = new Map();
    for (const ex of exercises) map.set(ex.id, ex);
    return map;
  }, [exercises]);

  const handleCreate = (fields) => {
    onAddTemplate(fields);
    setShowForm(false);
  };

  const handleUpdate = (fields) => {
    onUpdateTemplate(editingId, fields);
    setEditingId(null);
  };

  const handleEdit = (templateId) => {
    setEditingId(templateId);
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="card template-manager">
      <div className="template-manager-header">
        <button className="btn-back" onClick={onBack}>&larr; Back</button>
        <h2>Workout Templates</h2>
        <button
          className="btn-add-recurring"
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
        >
          {showForm ? 'Cancel' : '+ Create Template'}
        </button>
      </div>

      {showForm && (
        <TemplateForm
          exercises={exercises}
          exerciseMap={exerciseMap}
          initialValues={null}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          onOpenExercisePicker={onOpenExercisePicker}
        />
      )}

      {templates.length === 0 && !showForm && (
        <p className="empty-message">No templates yet. Create one to get started!</p>
      )}

      <ul className="template-list">
        {templates.map((template) => {
          if (editingId === template.id) {
            return (
              <li key={template.id} className="template-card template-card-editing">
                <TemplateForm
                  exercises={exercises}
                  exerciseMap={exerciseMap}
                  initialValues={{
                    name: template.name,
                    description: template.description,
                    exercises: template.exercises.map(te => ({
                      exerciseId: te.exerciseId,
                      targetSets: te.targetSets || 3,
                      targetReps: te.targetReps || 10,
                      targetWeight: te.targetWeight || '',
                    })),
                  }}
                  onSave={handleUpdate}
                  onCancel={handleCancelEdit}
                  onOpenExercisePicker={onOpenExercisePicker}
                />
              </li>
            );
          }

          const exerciseCount = template.exercises.length;

          return (
            <li key={template.id} className="template-card">
              <div className="template-card-body">
                <div className="template-card-info">
                  <span className="template-card-name">{template.name}</span>
                  {template.description && (
                    <span className="template-card-desc">{template.description}</span>
                  )}
                  <span className="template-card-meta">
                    {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                  </span>
                  {exerciseCount > 0 && (
                    <ul className="template-card-exercises">
                      {template.exercises.map((te) => (
                        <li key={te.id || te.exerciseId} className="template-card-exercise-item">
                          {getExerciseName(te.exerciseId, exerciseMap)}
                          {te.targetSets && te.targetReps && (
                            <span className="template-card-exercise-target">
                              {' '}{te.targetSets} &times; {te.targetReps}
                              {te.targetWeight ? ` @ ${te.targetWeight} lbs` : ''}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="template-card-actions">
                  <button
                    className="btn-add"
                    onClick={() => onStartFromTemplate(template.id)}
                  >
                    Start Workout
                  </button>
                  <button
                    className="btn-edit-recurring"
                    onClick={() => handleEdit(template.id)}
                    title="Edit"
                  >
                    &#9998;
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => onDeleteTemplate(template.id)}
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
