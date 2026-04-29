import { useMemo, useState, lazy, Suspense } from 'react';
import { formatDate } from './shared/utils';
import { useAuth } from './hooks/useAuth';
import { useMonth, useBudget, useExpenses, useIncome } from './hooks/useSupabase';
import { useRecurring } from './hooks/useRecurring';
import { useCategoryManager } from './hooks/useCategoryManager';
import { useProfile } from './hooks/useProfile';
import { useExercises } from './hooks/useExercises';
import { useWorkouts } from './hooks/useWorkouts';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { useRecovery } from './hooks/useRecovery';
import { usePRs } from './hooks/usePRs';
import { useCards } from './hooks/useCards';
import { useGoals } from './hooks/useGoals';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNavBar from './components/MobileNavBar';
import BudgetDashboard from './components/BudgetDashboard';
import ProfilePage from './components/ProfilePage';
import GymDashboard from './components/gym/GymDashboard';
import WorkoutLogger from './components/gym/WorkoutLogger';
import ExercisePicker from './components/gym/ExercisePicker';
import WorkoutHistory from './components/gym/WorkoutHistory';
import WorkoutTemplateManager from './components/gym/WorkoutTemplateManager';

const ProgressCharts = lazy(() => import('./components/gym/ProgressCharts'));

export default function App() {
  const [page, setPage] = useState('budget');
  const [gymView, setGymView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => setDarkMode(prev => {
    const next = !prev;
    localStorage.setItem('darkMode', next);
    return next;
  });
  const [activeWorkoutId, setActiveWorkoutId] = useState(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercisePickerCallback, setExercisePickerCallback] = useState(null);

  const { user, loading: authLoading, signUp, signIn, signOut } = useAuth();
  const {
    expenseCategories, incomeCategories,
    addCategory, updateCategory, deleteCategory,
    loading: categoriesLoading,
  } = useCategoryManager(user?.id);
  const { profile, updateProfile, loading: profileLoading } = useProfile(user?.id);
  const { month, label: monthLabel, isCurrentMonth, goToPrevMonth, goToNextMonth } = useMonth();
  const {
    budget, setBudget,
    balance, setBalance,
    mode, setMode,
    loading: budgetLoading,
  } = useBudget(user?.id, month);
  const [expenses, addExpense, updateExpense, deleteExpense, expensesLoading] = useExpenses(user?.id, month);
  const [income, addIncome, updateIncome, deleteIncome, incomeLoading] = useIncome(user?.id, month);
  const {
    items: recurringItems,
    loading: recurringLoading,
    addRecurring,
    updateRecurring,
    toggleRecurring,
    deleteRecurring,
  } = useRecurring(user?.id, isCurrentMonth ? month : null, addExpense, addIncome);

  const { cards, loading: cardsLoading, addCard, updateCard, deleteCard } = useCards(user?.id);
  const { goals, loading: goalsLoading, addGoal, updateGoal, deleteGoal } = useGoals(user?.id);

  // Gym hooks — only activate when on gym page to avoid unnecessary DB queries
  const gymUserId = page === 'gym' ? user?.id : null;
  const { exercises, loading: exercisesLoading, addExercise, updateExercise, deleteExercise } = useExercises(gymUserId);
  const {
    workouts, loading: workoutsLoading,
    addWorkout, updateWorkout, deleteWorkout, completeWorkout,
    addExerciseToWorkout, removeExerciseFromWorkout, updateWorkoutExercise,
    addSet, updateSet, deleteSet,
  } = useWorkouts(gymUserId, null); // null month = all-time; fixes ProgressCharts "All Time" range
  const {
    templates, loading: templatesLoading,
    addTemplate, updateTemplate, deleteTemplate, createWorkoutFromTemplate,
  } = useWorkoutTemplates(gymUserId);
  const {
    recoveryStatus, recoveryRows,
    settings: recoverySettings, updateSettings: updateRecoverySettings,
    logRecovery, loading: recoveryLoading,
  } = useRecovery(gymUserId);
  const { prs, loading: prsLoading, checkIsPR, detectAndSaveWorkoutPRs } = usePRs(gymUserId);

  // Budget derived data
  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const totalIncome = useMemo(
    () => income.reduce((sum, e) => sum + e.amount, 0),
    [income]
  );

  const spendingByCategory = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
    }
    return map;
  }, [expenses]);

  const incomeByCategory = useMemo(() => {
    const map = new Map();
    for (const e of income) {
      map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
    }
    return map;
  }, [income]);

  // Gym helpers
  const activeWorkout = activeWorkoutId
    ? workouts.find(w => w.id === activeWorkoutId)
    : null;

  const handleStartWorkout = async () => {
    const w = await addWorkout({ date: new Date().toISOString(), notes: '' });
    if (w) {
      setActiveWorkoutId(w.id);
      setGymView('workout');
    }
  };

  const handleStartFromTemplate = async (templateId) => {
    const w = await createWorkoutFromTemplate(templateId, addWorkout, addExerciseToWorkout, addSet);
    if (w) {
      setActiveWorkoutId(w.id);
      setGymView('workout');
    }
  };

  const handleFinishWorkout = (workoutId, durationMinutes) => {
    // Called from "Back to Dashboard" after completion, or as legacy finish
    if (workoutId && durationMinutes) {
      updateWorkout(workoutId, { durationMinutes });
    }
    setActiveWorkoutId(null);
    setGymView('dashboard');
  };

  const handleCompleteWorkout = async (workoutId, durationMinutes) => {
    await completeWorkout(workoutId, durationMinutes);
    detectAndSaveWorkoutPRs(activeWorkout, new Map(exercises.map(e => [e.id, e])));

    // Log recovery for each unique muscle group worked in this workout
    if (activeWorkout?.exercises?.length) {
      const exerciseMap = new Map(exercises.map(e => [e.id, e]));
      const now = new Date().toISOString();
      const muscleGroupsSeen = new Set();
      for (const we of activeWorkout.exercises) {
        const ex = exerciseMap.get(we.exerciseId);
        if (!ex) continue;
        if (ex.muscleGroup && !muscleGroupsSeen.has(ex.muscleGroup)) {
          muscleGroupsSeen.add(ex.muscleGroup);
          logRecovery(ex.muscleGroup, workoutId, now);
        }
      }
    }
  };

  const handleSaveAsTemplate = async (workout) => {
    const templateExercises = workout.exercises.map((we, idx) => {
      // Use the first set's reps/weight as target, or null
      const firstSet = we.sets[0];
      return {
        exerciseId: we.exerciseId,
        sortOrder: idx,
        targetSets: we.sets.length || null,
        targetReps: firstSet?.reps ?? null,
        targetWeight: firstSet?.weight ?? null,
      };
    });

    const templateName = `Workout ${formatDate(workout.date)}`;
    await addTemplate({
      name: templateName,
      description: '',
      exercises: templateExercises,
    });
  };

  const handleOpenExercisePicker = (callback) => {
    setExercisePickerCallback(() => callback || null);
    setShowExercisePicker(true);
  };

  const handleSelectExercise = (exerciseId) => {
    if (exercisePickerCallback) {
      exercisePickerCallback(exerciseId);
    } else if (activeWorkoutId) {
      addExerciseToWorkout(activeWorkoutId, exerciseId);
    }
    setShowExercisePicker(false);
    setExercisePickerCallback(null);
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSignIn={signIn} onSignUp={signUp} />;
  }

  const navbarProps = {
    user,
    profile,
    page,
    onSetPage: setPage,
    onSignOut: signOut,
    onOpenProfile: () => setPage('profile'),
    darkMode,
    onToggleDark: toggleDarkMode,
  };

  if (budgetLoading || expensesLoading || incomeLoading || recurringLoading || categoriesLoading || profileLoading || cardsLoading || goalsLoading) {
    return (
      <div className={`app-shell${darkMode ? " dark" : ""}`}>
        <Sidebar {...navbarProps} />
        <main className="main-area">
          <Navbar {...navbarProps} />
          <div className="page-content">
            <div className="loading">Loading...</div>
          </div>
        </main>
        <MobileNavBar page={page} onSetPage={setPage} darkMode={darkMode} onToggleDark={toggleDarkMode} />
      </div>
    );
  }

  // Profile page
  if (page === 'profile') {
    return (
      <div className={`app-shell${darkMode ? " dark" : ""}`}>
        <Sidebar {...navbarProps} />
        <main className="main-area">
          <Navbar {...navbarProps} />
          <div className="page-content">
            <ProfilePage
              user={user}
              profile={profile}
              onUpdateProfile={updateProfile}
              onBack={() => setPage('budget')}
              onSignOut={signOut}
            />
          </div>
        </main>
        <MobileNavBar page={page} onSetPage={setPage} darkMode={darkMode} onToggleDark={toggleDarkMode} />
      </div>
    );
  }

  // Gym page
  if (page === 'gym') {
    if (exercisesLoading || workoutsLoading || templatesLoading || recoveryLoading) {
      return (
        <div className={`app-shell${darkMode ? " dark" : ""}`}>
          <Sidebar {...navbarProps} />
          <main className="main-area">
            <Navbar {...navbarProps} />
            <div className="page-content">
              <div className="loading">Loading gym...</div>
            </div>
          </main>
          <MobileNavBar page={page} onSetPage={setPage} darkMode={darkMode} onToggleDark={toggleDarkMode} />
        </div>
      );
    }

    return (
      <div className={`app-shell${darkMode ? " dark" : ""}`}>
        <Sidebar {...navbarProps} />
        <main className="main-area">
          <Navbar {...navbarProps} />
          <div className="page-content">
            {showExercisePicker && (
              <ExercisePicker
                exercises={exercises}
                onSelect={handleSelectExercise}
                onCreateExercise={addExercise}
                onClose={() => { setShowExercisePicker(false); setExercisePickerCallback(null); }}
              />
            )}

            {gymView === 'dashboard' && (
              <GymDashboard
                workouts={workouts}
                templates={templates}
                exercises={exercises}
                recoveryStatus={recoveryStatus}
                recoveryRows={recoveryRows}
                onStartWorkout={handleStartWorkout}
                onStartFromTemplate={handleStartFromTemplate}
                onDeleteWorkout={deleteWorkout}
                onDeleteTemplate={deleteTemplate}
                onViewHistory={() => setGymView('history')}
                onCreateTemplate={() => setGymView('templates')}
                onAddExercise={addExercise}
                onUpdateExercise={updateExercise}
                onDeleteExercise={deleteExercise}
              />
            )}

            {gymView === 'workout' && activeWorkout && (
              <WorkoutLogger
                workout={activeWorkout}
                exercises={exercises}
                onUpdateWorkout={(id, fields) => updateWorkout(id, fields)}
                onAddExercise={(exerciseId) => addExerciseToWorkout(activeWorkoutId, exerciseId)}
                onRemoveExercise={removeExerciseFromWorkout}
                onAddSet={addSet}
                onUpdateSet={updateSet}
                onDeleteSet={deleteSet}
                onFinish={handleFinishWorkout}
                onCancel={() => { deleteWorkout(activeWorkoutId); setActiveWorkoutId(null); setGymView('dashboard'); }}
                onOpenExercisePicker={() => handleOpenExercisePicker(null)}
                onUpdateWorkoutExercise={updateWorkoutExercise}
                onCompleteWorkout={handleCompleteWorkout}
                onCheckIsPR={(exerciseId, value) => checkIsPR(exerciseId, 'max_weight', value)}
              />
            )}

            {gymView === 'history' && (
              <WorkoutHistory
                workouts={workouts}
                exercises={exercises}
                onDeleteWorkout={deleteWorkout}
                onEditWorkout={(workoutId) => { setActiveWorkoutId(workoutId); setGymView('workout'); }}
                onBack={() => setGymView('dashboard')}
                onSaveAsTemplate={handleSaveAsTemplate}
              />
            )}

            {gymView === 'templates' && (
              <WorkoutTemplateManager
                templates={templates}
                exercises={exercises}
                onAddTemplate={addTemplate}
                onUpdateTemplate={updateTemplate}
                onDeleteTemplate={deleteTemplate}
                onStartFromTemplate={handleStartFromTemplate}
                onOpenExercisePicker={handleOpenExercisePicker}
                onBack={() => setGymView('dashboard')}
              />
            )}

            {gymView === 'progress' && (
              <Suspense fallback={<div className="loading">Loading charts...</div>}>
                <div className="gym-progress-page">
                  <button className="profile-back-btn" onClick={() => setGymView('dashboard')}>&larr; Back</button>
                  <ProgressCharts workouts={workouts} exercises={exercises} />
                </div>
              </Suspense>
            )}
          </div>
        </main>
        <MobileNavBar page={page} onSetPage={setPage} darkMode={darkMode} onToggleDark={toggleDarkMode} />
      </div>
    );
  }

  // Budget page (default)
  const effectiveBudget = mode === 'budget' ? budget : balance;

  return (
    <div className={`app-shell${darkMode ? " dark" : ""}`}>
      <Sidebar {...navbarProps} />
      <main className="main-area">
        <Navbar {...navbarProps} />
        <div className="page-content">
          <BudgetDashboard
            mode={mode} onSetMode={setMode}
            budget={budget} onSetBudget={setBudget}
            balance={balance} onSetBalance={setBalance}
            totalIncome={totalIncome} totalSpent={totalSpent}
            month={month} monthLabel={monthLabel} isCurrentMonth={isCurrentMonth}
            onPrevMonth={goToPrevMonth} onNextMonth={goToNextMonth}
            cards={cards} onAddCard={addCard} onUpdateCard={updateCard} onDeleteCard={deleteCard} profile={profile}
            userId={user.id}
            expenses={expenses} income={income}
            onAddExpense={addExpense} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense}
            onAddIncome={addIncome} onUpdateIncome={updateIncome} onDeleteIncome={deleteIncome}
            expenseCategories={expenseCategories} incomeCategories={incomeCategories}
            spendingByCategory={spendingByCategory} incomeByCategory={incomeByCategory}
            effectiveBudget={effectiveBudget}
            onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} onAddCategory={addCategory}
            recurringItems={recurringItems}
            onAddRecurring={addRecurring} onUpdateRecurring={updateRecurring}
            onToggleRecurring={toggleRecurring} onDeleteRecurring={deleteRecurring}
            goals={goals} onAddGoal={addGoal} onUpdateGoal={updateGoal} onDeleteGoal={deleteGoal}
          />
        </div>
      </main>
      <MobileNavBar page={page} onSetPage={setPage} darkMode={darkMode} onToggleDark={toggleDarkMode} />
    </div>
  );
}
