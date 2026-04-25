// ============================================================
// Gym Tracker — Field Maps
// ============================================================
// Each table has two maps:
//   rowMap     — DB → JS  (used by mapRow to convert snake_case query results to camelCase)
//   fieldMap   — JS → DB  (used by buildDbFields to convert camelCase updates to snake_case)
//
// Fields that are identical in both cases (e.g., id, name, notes) are still listed
// for explicitness so hooks can iterate all known columns.
// ============================================================

// --- exercises ---

export const exerciseRowMap = {
  id: 'id',
  user_id: 'userId',
  name: 'name',
  muscle_group: 'muscleGroup',
  equipment: 'equipment',
  secondary_muscles: 'secondaryMuscles',
  movement_type: 'movementType',
  instructions: 'instructions',
  is_custom: 'isCustom',
  created_at: 'createdAt',
};

export const exerciseFieldMap = {
  id: 'id',
  userId: 'user_id',
  name: 'name',
  muscleGroup: 'muscle_group',
  equipment: 'equipment',
  secondaryMuscles: 'secondary_muscles',
  movementType: 'movement_type',
  instructions: 'instructions',
  isCustom: 'is_custom',
  createdAt: 'created_at',
};

// --- workouts ---

export const workoutRowMap = {
  id: 'id',
  user_id: 'userId',
  date: 'date',
  duration_minutes: 'durationMinutes',
  notes: 'notes',
  template_id: 'templateId',
  is_completed: 'isCompleted',
  created_at: 'createdAt',
};

export const workoutFieldMap = {
  id: 'id',
  userId: 'user_id',
  date: 'date',
  durationMinutes: 'duration_minutes',
  notes: 'notes',
  templateId: 'template_id',
  isCompleted: 'is_completed',
  createdAt: 'created_at',
};

// --- workout_exercises ---

export const workoutExerciseRowMap = {
  id: 'id',
  workout_id: 'workoutId',
  exercise_id: 'exerciseId',
  sort_order: 'sortOrder',
  notes: 'notes',
  rest_timer_seconds: 'restTimerSeconds',
};

export const workoutExerciseFieldMap = {
  id: 'id',
  workoutId: 'workout_id',
  exerciseId: 'exercise_id',
  sortOrder: 'sort_order',
  notes: 'notes',
  restTimerSeconds: 'rest_timer_seconds',
};

// --- workout_sets ---

export const workoutSetRowMap = {
  id: 'id',
  workout_exercise_id: 'workoutExerciseId',
  set_number: 'setNumber',
  reps: 'reps',
  weight: 'weight',
  rpe: 'rpe',
  is_warmup: 'isWarmup',
  completed: 'completed',
  set_type: 'setType',
};

export const workoutSetFieldMap = {
  id: 'id',
  workoutExerciseId: 'workout_exercise_id',
  setNumber: 'set_number',
  reps: 'reps',
  weight: 'weight',
  rpe: 'rpe',
  isWarmup: 'is_warmup',
  completed: 'completed',
  setType: 'set_type',
};

// --- workout_templates ---

export const workoutTemplateRowMap = {
  id: 'id',
  user_id: 'userId',
  name: 'name',
  description: 'description',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

export const workoutTemplateFieldMap = {
  id: 'id',
  userId: 'user_id',
  name: 'name',
  description: 'description',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

// --- template_exercises ---

export const templateExerciseRowMap = {
  id: 'id',
  template_id: 'templateId',
  exercise_id: 'exerciseId',
  sort_order: 'sortOrder',
  target_sets: 'targetSets',
  target_reps: 'targetReps',
  target_weight: 'targetWeight',
};

export const templateExerciseFieldMap = {
  id: 'id',
  templateId: 'template_id',
  exerciseId: 'exercise_id',
  sortOrder: 'sort_order',
  targetSets: 'target_sets',
  targetReps: 'target_reps',
  targetWeight: 'target_weight',
};

// --- personal_records / pr_history ---

export const prRowMap = {
  exercise_id: 'exerciseId',
  pr_type: 'prType',
  workout_id: 'workoutId',
  achieved_at: 'achievedAt',
  created_at: 'createdAt',
  // value, reps, weight, id, user_id map directly (same name)
};

export const prFieldMap = {
  exerciseId: 'exercise_id',
  prType: 'pr_type',
  workoutId: 'workout_id',
  achievedAt: 'achieved_at',
};

// --- recovery_settings ---

export const recoverySettingsRowMap = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  // user_id, settings map directly
};

// --- muscle_recovery ---

export const muscleRecoveryRowMap = {
  muscle_group: 'muscleGroup',
  workout_id: 'workoutId',
  trained_at: 'trainedAt',
  recovery_hours: 'recoveryHours',
  recovered_at: 'recoveredAt',
  created_at: 'createdAt',
};

export const muscleRecoveryFieldMap = {
  muscleGroup: 'muscle_group',
  workoutId: 'workout_id',
  trainedAt: 'trained_at',
  recoveryHours: 'recovery_hours',
};
