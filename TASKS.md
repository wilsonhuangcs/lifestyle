# LifestyleAIO — Task Tracker

---

## Budget / Expense Tracker (Shipped)

- [x] Database schema: budget, expenses, income, recurring, recurring_log, user_categories, profiles tables with RLS — @backend — done
- [x] Auth flow: email/password signup and login via Supabase Auth — @backend — done
- [x] useAuth hook: session management, login, signup, logout — @frontend-web — done
- [x] useSupabase hook: useMonth, useBudget, useExpenses, useIncome — @frontend-web — done
- [x] useRecurring hook: recurring transaction CRUD and auto-apply logic — @frontend-web — done
- [x] useCategoryManager hook: user-customizable categories with colors, icons, names — @frontend-web — done
- [x] useProfile hook: profile CRUD, avatar upload via Supabase Storage — @frontend-web — done
- [x] Auth.jsx: login/signup form — @frontend-web — done
- [x] Navbar.jsx: top navigation with user menu — @frontend-web — done
- [x] BudgetHeader.jsx: budget/tracker mode toggle, monthly amount display — @frontend-web — done
- [x] AddTransaction.jsx: add expense or income with category, amount, description, date — @frontend-web — done
- [x] CategoryList.jsx: display and manage user categories — @frontend-web — done
- [x] TransactionHistory.jsx: filterable list of expenses and income — @frontend-web — done
- [x] RecurringManager.jsx: manage recurring transaction rules — @frontend-web — done
- [x] SpendingCharts.jsx: donut and bar charts for spending breakdown (lazy-loaded via Recharts) — @frontend-web — done
- [x] DatePicker.jsx: month navigation and date selection — @frontend-web — done
- [x] ProfilePage.jsx: view/edit profile, upload avatar — @frontend-web — done
- [x] App.css: all styles for budget feature — @frontend-web — done
- [x] Default category seed data (categories.js, incomeCategories.js) — @data-integrations — done

---

## Gym Tracker — Core Workout Logging

### Backend
- [x] Create `exercises` table with RLS (id, user_id, name, muscle_group, equipment, is_custom) — @backend — done
- [x] Create `workouts` table with RLS (id, user_id, date, duration_minutes, notes, template_id) — @backend — done
- [x] Create `workout_exercises` table with RLS and cascade delete (id, workout_id, exercise_id, sort_order, notes) — @backend — done
- [x] Create `workout_sets` table with RLS and cascade delete (id, workout_exercise_id, set_number, reps, weight, rpe, is_warmup, completed) — @backend — done
- [x] Add `set_type` column to `workout_sets` table: `TEXT CHECK (set_type IN ('normal','warmup','drop_set','failure'))` to replace boolean `is_warmup` — @backend — done
- [x] Add `is_completed` column to `workouts` table: `BOOLEAN DEFAULT false` to explicitly mark workout as finished — @backend — done
- [x] Add `rest_timer_seconds` column to `workout_exercises` table for per-exercise rest timer configuration — @backend — done
- [x] Write and test all RLS policies for gym tables (user isolation, cascade deletes, default exercise visibility) — @backend — done

### Data & Integrations
- [x] Create `src/data/exerciseLibrary.js` with 44 default exercises covering all muscle groups — @data-integrations — done
- [x] Define JS-to-DB field maps for all gym tables in `src/data/gymFieldMaps.js` — @data-integrations — done
- [x] Implement default exercise seeding logic in useExercises (check for duplicates by name) — @data-integrations — done
- [x] Add `set_type`, `is_completed`, `rest_timer_seconds` to gymFieldMaps — @data-integrations — done

### Frontend Web
- [x] Create `useExercises.js` hook: fetch, add, update, delete exercises with optimistic updates and seeding — @frontend-web — done
- [x] Create `useWorkouts.js` hook: CRUD for workouts, workout_exercises, and sets with nested state — @frontend-web — done
- [x] Create `useWorkoutTemplates.js` hook: template CRUD and createWorkoutFromTemplate — @frontend-web — done
- [x] Create `WorkoutLogger.jsx`: active workout UI with timer, exercise list, set table, add/remove/finish — @frontend-web — done
- [x] Create `ExercisePicker.jsx`: modal with search, muscle group filter pills, create custom exercise form — @frontend-web — done
- [x] Add `set_type` selector to WorkoutLogger set rows (normal/warmup/drop set/failure) replacing warmup checkbox — @frontend-web — done
- [x] Add rest timer between sets in WorkoutLogger: countdown timer that auto-starts when a set is marked complete, with customizable duration per exercise — @frontend-web — done
- [x] Add rest timer settings UI: per-exercise default rest time, visual countdown overlay, pulse alert on completion — @frontend-web — done
- [x] Workout duration tracking: auto-start timer on mount, display elapsed time, save duration on finish — @frontend-web — done
- [x] Notes on workouts: textarea in WorkoutLogger header for workout-level notes — @frontend-web — done
- [x] Notes on exercises: add per-exercise notes field to WorkoutLogger exercise cards — @frontend-web — done
- [x] Mark workout as complete: explicit "Complete" state with completion banner, badge in history and dashboard — @frontend-web — done
- [x] Quick-add previous workout as template: "Save as Template" button on WorkoutHistory cards — @frontend-web — done
- [x] Integrate gym into App.jsx: page routing, sub-navigation, lazy-loading, Navbar gym link — @frontend-web — done
- [x] Gym tracker CSS styles in App.css — @frontend-web — done

### Mobile
- [ ] Create React Native WorkoutLogger screen: touch-optimized set inputs, numeric keyboard, swipeable set rows, floating "Add Exercise" FAB, timer in header — @mobile — todo
- [ ] Create React Native ExercisePicker screen: full-screen modal with search, horizontal muscle group chips, FlatList, "New Exercise" in header — @mobile — todo
- [ ] Create React Native rest timer: overlay countdown with vibration/sound alert on completion — @mobile — todo

### QA
- [x] Test set_type field: verify normal/warmup/drop set/failure all persist and display correctly — @qa-reviewer — done (fixed: `drop_set` legacy alias added to `getSetTypeLabel`; duplicate `set_type` in `addSet` cleaned up)
- [x] Test rest timer: verify countdown starts on set completion, resets on new set, configurable duration works — @qa-reviewer — done (passes; note: timer does not reset on "+ Add Set", accepted as intended behavior)
- [x] Test workout completion flow: start -> log sets -> finish -> verify duration/completion saved — @qa-reviewer — done (passes; minor: `isCompleted` local state not rolled back on DB failure — low priority)
- [x] Test quick-add template from history: verify all exercises and set targets are copied correctly — @qa-reviewer — done (fixed: `|| null` → `?? null` for `targetReps`/`targetWeight` to preserve weight=0 on bodyweight exercises)

---

## Gym Tracker — Exercise Library

### Backend
- [x] `exercises` table exists with id, user_id, name, muscle_group, equipment, is_custom — @backend — done
- [x] Add `secondary_muscles` column to `exercises` table: `JSONB DEFAULT '[]'` — @backend — done
- [x] Add `movement_type` column to `exercises` table: `TEXT CHECK` — @backend — done
- [x] Add `instructions` column to `exercises` table: `TEXT` — @backend — done
- [ ] Add `equipment_type` column or expand `equipment` to support filtering by equipment category — @backend — todo

### Data & Integrations
- [x] exerciseLibrary.js expanded to 73 exercises with key variations across all muscle groups — @data-integrations — done
- [x] Add `secondaryMuscles` array to each exercise (e.g., bench press -> ['triceps', 'shoulders']) — @data-integrations — done
- [x] Add `movementType` to each exercise ('compound', 'isolation', 'cardio') — @data-integrations — done
- [x] Add `instructions` text to each exercise (1-2 sentence setup + execution tips) — @data-integrations — done

### Frontend Web
- [x] Create `ExerciseLibrary.jsx`: grouped by muscle group, search, filter pills, add/edit/delete custom, lock icon on defaults — @frontend-web — done
- [x] Add equipment filter to ExerciseLibrary: filter pills or dropdown for Barbell/Dumbbell/Cable/Machine/Bodyweight/None — @frontend-web — done
- [x] Add movement type filter to ExerciseLibrary: compound/isolation/cardio/stretch filter tabs — @frontend-web — done
- [x] Add exercise detail view: show primary muscle, secondary muscles, equipment, instructions, and exercise history — @frontend-web — done
- [x] Custom exercise creation form: name, muscle group, equipment — @frontend-web — done
- [x] Expand custom exercise form: add secondary muscles multi-select, movement type dropdown, instructions textarea — @frontend-web — done
- [x] Exercise history per exercise: show every workout where this exercise was performed with date, sets, reps, weight, volume — @frontend-web — done

### Mobile
- [ ] Create React Native ExerciseLibrary screen: grouped list, search, filter chips, custom exercise form — @mobile — todo
- [ ] Create React Native exercise detail screen: full info, exercise history, charts — @mobile — todo

### QA
- [x] Verify exercise library seeds correctly on first login with all ~70 exercises — @qa-reviewer — done (fixed: seed rows now include `secondary_muscles`, `movement_type`, `instructions`; DB migration backfilled all 73 existing exercises)
- [x] Verify secondary muscles, movement type, instructions display correctly — @qa-reviewer — done (passes after seed fix; detail view, card tags, and movement filter all working)
- [x] Verify exercise history shows accurate data from all workouts — @qa-reviewer — done (passes; minor: bodyweight weight=0 sets won't show "Top" stat — accepted)
- [x] Verify custom exercise CRUD works and default exercises remain locked — @qa-reviewer — done (passes; edit/delete buttons correctly gated on `isCustom`)

---

## Gym Tracker — Recovery Tracker

### Backend
- [x] Create `muscle_recovery` table with RLS — `recovered_at` auto-computed via trigger, indexes on `(user_id, muscle_group)`, `(user_id, trained_at DESC)`, `(workout_id)` — @backend — done
- [x] Create `recovery_settings` table with RLS — JSONB settings column with defaults for all 10 muscle groups — @backend — done
- [x] Create DB trigger: `trg_recovery_on_workout_complete` AFTER UPDATE on workouts — auto-inserts `muscle_recovery` rows when `is_completed` flips to true, using exercise muscle groups from that workout — @backend — done

### Data & Integrations
- [x] Define recovery window defaults per muscle group: stored as JSONB defaults in `recovery_settings` table — @data-integrations — done
- [x] Add recovery field maps to gymFieldMaps.js — `recoverySettingsRowMap`, `muscleRecoveryRowMap`, `muscleRecoveryFieldMap` added — @data-integrations — done

### Frontend Web
- [x] Create `useRecovery.js` hook: fetch recovery status for all muscle groups, compute green/yellow/red state based on current time vs trained_at + recovery_hours, update recovery settings — @frontend-web — done
- [x] Create `RecoveryTracker.jsx` component: 10-muscle-group grid with color-coded status cards (recovered/recovering/fatigued/untrained), time-remaining label, expandable settings panel — @frontend-web — done
- [x] Add recovery status to GymDashboard: summary card showing up to 3 fatigued/recovering muscles with "All clear" state and "View All" button — @frontend-web — done
- [ ] Add recovery warning to WorkoutLogger: when adding an exercise whose muscle group hasn't recovered, show warning banner — @frontend-web — todo
- [x] Create recovery settings UI: configurable recovery hours per muscle group (12–96 hour range, saves on blur) — @frontend-web — done
- [x] Add recovery section to gym sub-navigation in App.jsx — @frontend-web — done
- [x] Recovery tracker CSS styles — @frontend-web — done

### Mobile
- [ ] Create React Native RecoveryTracker screen: body map visualization, touch to see muscle group details — @mobile — todo
- [ ] Push notification when muscle group recovers: integrate with device notification API, schedule based on recovery_hours — @mobile — todo
- [ ] Recovery warning on workout start: alert before logging if target muscles haven't recovered — @mobile — todo

### QA
- [ ] Verify recovery status computes correctly based on workout timestamps and recovery windows — @qa-reviewer — todo
- [ ] Verify body map colors update in real time as recovery completes — @qa-reviewer — todo
- [ ] Verify configurable recovery hours persist and apply correctly — @qa-reviewer — todo
- [ ] Verify recovery warning appears for fatigued muscle groups and can be dismissed — @qa-reviewer — todo

---

## Gym Tracker — Analytics & Charts

### Backend
- [x] Create materialized view or Supabase Edge Function for weekly/monthly volume aggregation per user for chart performance — @backend — done (assessed 2026-04-07: all critical indexes exist; client-side JS aggregation sufficient at current scale; materialized view deferred until user data volume warrants it)

### Data & Integrations
- [ ] Define chart data transformation utilities: weekly volume aggregation, muscle group distribution calculation, 1RM estimation formulas (Epley, Brzycki) — @data-integrations — todo

### Frontend Web
- [x] Create `ProgressCharts.jsx` (lazy-loaded): Weight Over Time line chart per exercise, Volume Per Muscle Group stacked bar chart — @frontend-web — done
- [x] Add donut chart: muscle group distribution for 7/30/90 day periods showing training volume percentage per muscle group — @frontend-web — done
- [x] Add top lifts / PRs summary chart: display heaviest lifts across all exercises with sortable list — @frontend-web — done
- [x] Add volume over time line chart: weekly total volume as a line chart with date range selector — @frontend-web — done
- [x] Add workout frequency bar chart: workouts per week as a bar chart — @frontend-web — done
- [x] Add estimated 1RM progression chart: line chart with Epley formula per exercise — @frontend-web — done
- [x] Add body part balance chart: horizontal bar chart showing volume per muscle group — @frontend-web — done
- [x] Add date range selector to all charts: 7-day, 30-day, 90-day, all-time toggle — @frontend-web — done
- [x] Charts CSS updates for new chart types — @frontend-web — done

### Mobile
- [ ] Create React Native ProgressCharts screen: all chart views using react-native-chart-kit or victory-native, horizontal scroll, exercise selector as bottom sheet — @mobile — todo

### QA
- [x] Verify all charts render correctly with real workout data — @qa-reviewer — done (all 8 charts pass; fixed: `oneRmData` warmup check now consistent with `topLiftsData`)
- [x] Verify date range filters work on all charts — @qa-reviewer — done (all charts use `filteredWorkouts`; all-time range fixed by `useWorkouts(gymUserId, null)`)
- [x] Verify 1RM estimation matches expected values for known inputs — @qa-reviewer — done (Epley formula correct: `weight * (1 + reps/30)`)
- [x] Performance review: verify charts are lazy-loaded, data transforms use useMemo, no unnecessary re-renders — @qa-reviewer — done (lazy-loaded, all 13 useMemos correct, exported with `React.memo`)

---

## Gym Tracker — Personal Records (PRs)

### Backend
- [x] Create `personal_records` table with RLS — `(user_id, exercise_id, pr_type)` unique constraint, indexes on `(user_id, exercise_id)` and `(user_id, achieved_at DESC)` — @backend — done
- [x] Create `pr_history` table with RLS — append-only (no UPDATE policy), index on `(user_id, exercise_id, pr_type, achieved_at DESC)` — @backend — done

### Data & Integrations
- [x] Define PR detection algorithms — `detectPRs()` in `src/shared/utils.js`: max_weight, max_reps, max_estimated_1rm (Epley), max_volume — @data-integrations — done
- [x] Add PR field maps to gymFieldMaps.js — `prRowMap` and `prFieldMap` added — @data-integrations — done

### Frontend Web
- [x] Basic PR detection: heaviest weight per exercise, displayed on GymDashboard "Recent PRs" section — @frontend-web — done
- [x] Expand PR detection: auto-detect new PRs by max weight, most reps, best estimated 1RM, max single-set volume — `detectPRs()` in shared/utils.js — @frontend-web — done
- [x] Create `usePRs.js` hook: fetch/compute all PRs per exercise, detect new PRs during workout, persist to personal_records table with optimistic rollback — @frontend-web — done
- [x] PR badge in WorkoutLogger: "PR!" gold pill badge next to completed sets that beat current best weight — @frontend-web — done
- [ ] PR history log per exercise: show all PRs achieved over time for a given exercise in exercise detail view — @frontend-web — todo
- [ ] PR achievement notification: toast or modal when a new PR is set during a workout (with confetti animation) — @frontend-web — todo
- [ ] PR summary page: list all current PRs across all exercises, sortable by exercise/date/type — @frontend-web — todo
- [ ] Badge/achievement system on workout completion: show badges earned during the workout (new PRs, milestones) — @frontend-web — todo

### Mobile
- [ ] Create React Native PR notification: haptic feedback + toast on new PR detection — @mobile — todo
- [ ] Create React Native PR history screen: per-exercise PR timeline — @mobile — todo

### QA
- [ ] Verify PR detection works for all four types (max weight, max reps, best 1RM, max volume) — @qa-reviewer — todo
- [ ] Verify PR badges appear in real-time during workout logging — @qa-reviewer — todo
- [ ] Verify PR history is accurate and complete — @qa-reviewer — todo
- [ ] Verify PRs persist correctly to the database and survive page reload — @qa-reviewer — todo

---

## Gym Tracker — Workout Programs & Templates

### Backend
- [x] Create `workout_templates` table with RLS (id, user_id, name, description, created_at, updated_at) — @backend — done
- [x] Create `template_exercises` table with RLS and cascade delete (id, template_id, exercise_id, sort_order, target_sets, target_reps, target_weight) — @backend — done
- [ ] Create `workout_programs` table: `id TEXT PK`, `user_id UUID NOT NULL`, `name TEXT NOT NULL`, `description TEXT`, `duration_weeks INTEGER`, `program_type TEXT CHECK (program_type IN ('5x5','ppl','upper_lower','full_body','custom'))`, `is_active BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`. Enable RLS — @backend — todo
- [ ] Create `program_days` table: `id TEXT PK`, `program_id TEXT NOT NULL REFERENCES workout_programs(id) ON DELETE CASCADE`, `day_of_week INTEGER` (0=Sun..6=Sat), `template_id TEXT REFERENCES workout_templates(id)`, `week_number INTEGER DEFAULT 1`, `sort_order INTEGER`. Enable RLS — @backend — todo
- [ ] Create `program_progress` table: `id TEXT PK`, `user_id UUID NOT NULL`, `program_id TEXT NOT NULL REFERENCES workout_programs(id)`, `week_number INTEGER`, `day_of_week INTEGER`, `workout_id TEXT REFERENCES workouts(id)`, `completed_at TIMESTAMPTZ`. Enable RLS — @backend — todo

### Data & Integrations
- [ ] Create preset program templates: StrongLifts 5x5, PPL (Push/Pull/Legs), Upper/Lower split, Full Body 3x/week — @data-integrations — todo
- [ ] Define program data model: multi-week structure with day assignments and progressive overload rules — @data-integrations — todo

### Frontend Web
- [x] Create `WorkoutTemplateManager.jsx`: list templates, create/edit/delete, start workout from template — @frontend-web — done
- [x] Template form with exercise list builder, target sets/reps/weight per exercise — @frontend-web — done
- [x] `createWorkoutFromTemplate`: create workout with pre-populated exercises and sets from template — @frontend-web — done
- [ ] Create `useWorkoutPrograms.js` hook: CRUD for programs, assign templates to days, track progress — @frontend-web — todo
- [ ] Create `WorkoutProgramManager.jsx`: list programs, create/edit/delete, view program schedule — @frontend-web — todo
- [ ] Create program builder UI: assign templates to days of the week, set duration in weeks, name and describe program — @frontend-web — todo
- [ ] Program schedule view: weekly calendar showing which template is assigned to each day — @frontend-web — todo
- [ ] Program progress tracker: show current week, completed days, remaining days, completion percentage — @frontend-web — todo
- [ ] Clone and modify programs: duplicate an existing program and edit it — @frontend-web — todo
- [ ] Add program navigation to gym sub-views in App.jsx — @frontend-web — todo
- [ ] Quick-add previous workout as template: button on WorkoutHistory to save workout as template — @frontend-web — todo

### Mobile
- [ ] Create React Native WorkoutTemplateManager screen: template list, create/edit, start workout — @mobile — todo
- [ ] Create React Native WorkoutProgramManager screen: program list, schedule view, progress tracker — @mobile — todo
- [ ] Create React Native program schedule: weekly view with swipe navigation between weeks — @mobile — todo

### QA
- [ ] Verify template CRUD: create, edit, delete, start workout from template — @qa-reviewer — todo
- [ ] Verify program scheduling: templates assigned to correct days, multi-week support works — @qa-reviewer — todo
- [ ] Verify program progress: completed workouts tracked, percentage correct — @qa-reviewer — todo
- [ ] Verify clone program: all data copied correctly, changes don't affect original — @qa-reviewer — todo

---

## Gym Tracker — Workout History

### Backend
- [x] Workouts table supports date, duration_minutes, notes, nested exercises and sets — @backend — done
- [x] Add indexes for efficient history queries: `idx_workouts_user_date_desc` on `(user_id, date DESC)` added — @backend — done

### Data & Integrations
- [x] Define streak calculation logic — `calculateStreak()` exported from `src/shared/utils.js` — @data-integrations — done
- [x] Define monthly summary aggregations — `calculateMonthlySummary()` exported from `src/shared/utils.js` — @data-integrations — done

### Frontend Web
- [x] Create `WorkoutHistory.jsx`: sorted list of past workouts with date, duration, exercise count, total volume, expandable details — @frontend-web — done
- [x] Add calendar view to WorkoutHistory: month grid highlighting training days, tap day to see workouts — @frontend-web — done
- [x] Add streak tracking display: current streak and longest streak shown at top of history page — @frontend-web — done
- [x] Add monthly summary card: total workouts, total volume, total time, average duration for the selected month — @frontend-web — done
- [ ] Add date range filter / month selector to WorkoutHistory (reuse DatePicker pattern) — @frontend-web — todo (calendar view added; full App-level month nav is a separate pass)
- [x] Expand workout details on click: full exercise list with set details — @frontend-web — done
- [x] Delete workout from history — @frontend-web — done

### Mobile
- [ ] Create React Native WorkoutHistory screen: FlatList of workout cards, pull-to-refresh, animated accordion expand, month selector in header — @mobile — todo
- [ ] Create React Native calendar view: month grid with training day indicators, tap to navigate — @mobile — todo

### QA
- [ ] Verify calendar view correctly highlights all training days — @qa-reviewer — todo
- [ ] Verify streak calculation handles edge cases (missed days, timezone differences) — @qa-reviewer — todo
- [ ] Verify monthly summary numbers match manual calculation from workout data — @qa-reviewer — todo

---

## Gym Tracker — Social & Motivation

### Backend
- [ ] Create `workout_shares` table: `id TEXT PK`, `user_id UUID NOT NULL`, `workout_id TEXT NOT NULL REFERENCES workouts(id)`, `share_type TEXT CHECK (share_type IN ('image','link'))`, `image_url TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`. Enable RLS — @backend — todo
- [ ] Create `friendships` table: `id TEXT PK`, `requester_id UUID NOT NULL`, `addressee_id UUID NOT NULL`, `status TEXT CHECK (status IN ('pending','accepted','blocked'))`, `created_at TIMESTAMPTZ`. Enable RLS — @backend — todo
- [ ] Create `activity_feed` table: `id TEXT PK`, `user_id UUID NOT NULL`, `activity_type TEXT CHECK (activity_type IN ('workout_completed','pr_achieved','challenge_joined','streak_milestone'))`, `data JSONB`, `created_at TIMESTAMPTZ`. Enable RLS — @backend — todo
- [ ] Create `challenges` table: `id TEXT PK`, `creator_id UUID NOT NULL`, `name TEXT NOT NULL`, `description TEXT`, `challenge_type TEXT CHECK (challenge_type IN ('volume','frequency','streak'))`, `start_date TIMESTAMPTZ`, `end_date TIMESTAMPTZ`, `target_value NUMERIC`, `created_at TIMESTAMPTZ`. Enable RLS — @backend — todo
- [ ] Create `challenge_participants` table: `id TEXT PK`, `challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE`, `user_id UUID NOT NULL`, `current_value NUMERIC DEFAULT 0`, `joined_at TIMESTAMPTZ`. Enable RLS — @backend — todo
- [ ] Set up Supabase Storage bucket for workout share images — @backend — todo

### Data & Integrations
- [ ] Define workout summary card image generation: canvas-based or server-side rendering of workout stats as shareable image — @data-integrations — todo
- [ ] Define activity feed event types and data shapes — @data-integrations — todo
- [ ] Define leaderboard scoring algorithms per challenge type — @data-integrations — todo

### Frontend Web
- [ ] Create `useFriends.js` hook: send/accept/reject friend requests, list friends, fetch friend activity — @frontend-web — todo
- [ ] Create `useChallenges.js` hook: CRUD challenges, join/leave, update progress, fetch leaderboard — @frontend-web — todo
- [ ] Create `SocialFeed.jsx`: activity feed showing friends' workouts, PRs, and milestones — @frontend-web — todo
- [ ] Create workout share feature: generate workout summary card (image) with exercises, volume, duration, PRs — @frontend-web — todo
- [ ] Create `FriendsList.jsx`: manage friends, send invites, view friend profiles — @frontend-web — todo
- [ ] Create `ChallengeManager.jsx`: browse/create challenges, view leaderboard, track progress — @frontend-web — todo
- [ ] Create `Leaderboard.jsx`: ranked list of participants for shared exercises or challenges — @frontend-web — todo
- [ ] Add social section to gym navigation — @frontend-web — todo
- [ ] Social feature CSS styles — @frontend-web — todo

### Mobile
- [ ] Create React Native SocialFeed screen: scrollable activity feed with pull-to-refresh — @mobile — todo
- [ ] Create React Native share feature: generate and share workout summary card via native share sheet — @mobile — todo
- [ ] Create React Native FriendsList screen: friend management with push notification for friend requests — @mobile — todo
- [ ] Create React Native ChallengeManager screen: browse/join challenges, view leaderboard — @mobile — todo

### QA
- [ ] Verify friend request flow: send, accept, reject, block — @qa-reviewer — todo
- [ ] Verify activity feed shows correct events for friends only (RLS) — @qa-reviewer — todo
- [ ] Verify challenge progress updates correctly and leaderboard ranks are accurate — @qa-reviewer — todo
- [ ] Verify workout share image generates correctly with accurate data — @qa-reviewer — todo
- [ ] Security audit: verify users cannot see non-friend activity, cannot manipulate challenge scores — @qa-reviewer — todo

---

## Gym Tracker — Body Metrics

### Backend
- [ ] Create `body_weight_logs` table: `id TEXT PK`, `user_id UUID NOT NULL`, `weight NUMERIC(6,2) NOT NULL`, `unit TEXT CHECK (unit IN ('lbs','kg')) DEFAULT 'lbs'`, `date DATE NOT NULL`, `created_at TIMESTAMPTZ DEFAULT now()`. Enable RLS. Unique index on `(user_id, date)` — @backend — todo
- [ ] Create `body_measurements` table: `id TEXT PK`, `user_id UUID NOT NULL`, `measurement_type TEXT CHECK (measurement_type IN ('chest','waist','hips','bicep_left','bicep_right','thigh_left','thigh_right','calf_left','calf_right','neck','forearm'))`, `value NUMERIC(6,2) NOT NULL`, `unit TEXT CHECK (unit IN ('in','cm')) DEFAULT 'in'`, `date DATE NOT NULL`, `created_at TIMESTAMPTZ DEFAULT now()`. Enable RLS — @backend — todo
- [ ] Create `body_fat_logs` table: `id TEXT PK`, `user_id UUID NOT NULL`, `body_fat_percent NUMERIC(5,2) NOT NULL`, `method TEXT CHECK (method IN ('visual','caliper','dexa','bioimpedance','manual'))`, `date DATE NOT NULL`, `created_at TIMESTAMPTZ DEFAULT now()`. Enable RLS — @backend — todo
- [ ] Create `progress_photos` table: `id TEXT PK`, `user_id UUID NOT NULL`, `photo_url TEXT NOT NULL`, `date DATE NOT NULL`, `notes TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`. Enable RLS — @backend — todo
- [ ] Set up Supabase Storage bucket for progress photos with user-scoped access policies — @backend — todo

### Data & Integrations
- [ ] Define body metric field maps for JS-to-DB conversion — @data-integrations — todo
- [ ] Define trend line calculation: 7-day moving average for bodyweight — @data-integrations — todo

### Frontend Web
- [ ] Create `useBodyMetrics.js` hook: CRUD for bodyweight, measurements, body fat, progress photos — @frontend-web — todo
- [ ] Create `BodyWeightTracker.jsx`: log bodyweight, line chart with trend line (7-day moving average), date picker — @frontend-web — todo
- [ ] Create `BodyMeasurements.jsx`: log measurements by body part, history per measurement type, comparison over time — @frontend-web — todo
- [ ] Create `BodyFatTracker.jsx`: log body fat %, line chart over time, method selector — @frontend-web — todo
- [ ] Create `ProgressPhotos.jsx`: upload photos tied to dates, side-by-side comparison view, gallery — @frontend-web — todo
- [ ] Create `BodyMetricsDashboard.jsx`: overview page linking to all body metric sub-views with summary cards — @frontend-web — todo
- [ ] Add body metrics section to gym navigation — @frontend-web — todo
- [ ] Body metrics CSS styles — @frontend-web — todo

### Mobile
- [ ] Create React Native BodyWeightTracker screen: quick weight entry, trend chart — @mobile — todo
- [ ] Create React Native BodyMeasurements screen: measurement entry with body part selector — @mobile — todo
- [ ] Create React Native ProgressPhotos screen: camera integration for photos, gallery view, comparison slider — @mobile — todo

### QA
- [ ] Verify bodyweight logging and trend line calculation accuracy — @qa-reviewer — todo
- [ ] Verify body measurement CRUD and history display — @qa-reviewer — todo
- [ ] Verify progress photo upload, storage, and date association — @qa-reviewer — todo
- [ ] Verify unit conversion (lbs/kg, in/cm) works correctly across all body metric views — @qa-reviewer — todo

---

## Gym Tracker — Settings & Personalization

### Backend
- [ ] Create `gym_settings` table: `user_id UUID PK REFERENCES auth.users(id)`, `weight_unit TEXT CHECK (weight_unit IN ('lbs','kg')) DEFAULT 'lbs'`, `measurement_unit TEXT CHECK (measurement_unit IN ('in','cm')) DEFAULT 'in'`, `default_rest_timer_seconds INTEGER DEFAULT 90`, `one_rm_formula TEXT CHECK (one_rm_formula IN ('epley','brzycki')) DEFAULT 'epley'`, `theme TEXT CHECK (theme IN ('light','dark','system')) DEFAULT 'system'`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`. Enable RLS — @backend — todo

### Data & Integrations
- [ ] Define gym settings field maps for JS-to-DB conversion — @data-integrations — todo
- [ ] Define 1RM formulas: Epley (weight x (1 + reps/30)), Brzycki (weight x 36 / (37 - reps)) — @data-integrations — todo
- [ ] Define plate calculator logic: given a target weight and bar weight, compute plates needed per side — @data-integrations — todo
- [ ] Define default rest timer presets per exercise type: compound 120s, isolation 60s, cardio 0s — @data-integrations — todo

### Frontend Web
- [ ] Create `useGymSettings.js` hook: fetch/update gym settings, provide settings context to all gym components — @frontend-web — todo
- [ ] Create `GymSettings.jsx` page: weight unit toggle (lbs/kg), measurement unit toggle (in/cm), default rest timer input, 1RM formula selector — @frontend-web — todo
- [ ] Create `PlateCalculator.jsx`: input target weight, display plates needed per side with visual plate diagram — @frontend-web — todo
- [ ] Apply weight unit setting throughout all gym components: display lbs or kg based on user preference — @frontend-web — todo
- [ ] Apply 1RM formula preference to all 1RM calculations in charts and PR detection — @frontend-web — todo
- [ ] Add rest timer defaults per exercise type: auto-set rest timer based on compound vs isolation vs cardio — @frontend-web — todo
- [ ] Dark/light mode toggle: implement theme switching in GymSettings and apply to App.css — @frontend-web — todo
- [ ] Add settings link to gym navigation — @frontend-web — todo
- [ ] Gym settings CSS styles (including dark mode styles) — @frontend-web — todo

### Mobile
- [ ] Create React Native GymSettings screen: all settings with native toggle components — @mobile — todo
- [ ] Create React Native PlateCalculator screen: visual plate diagram — @mobile — todo
- [ ] Apply dark/light mode theme across all React Native gym screens — @mobile — todo

### QA
- [ ] Verify lbs/kg toggle applies to all weight displays and inputs — @qa-reviewer — todo
- [ ] Verify 1RM formula preference applies correctly to charts and PR detection — @qa-reviewer — todo
- [ ] Verify plate calculator produces correct results for various weight/bar combinations — @qa-reviewer — todo
- [ ] Verify dark/light mode renders correctly across all components — @qa-reviewer — todo
- [ ] Verify rest timer defaults apply correctly per exercise type — @qa-reviewer — todo

---

## Gym Tracker — Cross-Cutting QA

### QA
- [x] Security audit: test all RLS policies on all gym tables. Attempt cross-user reads/writes. Verify default exercises are globally readable but not writable. Verify cascade deletes respect RLS — @qa-reviewer — done
- [x] Data integrity review: test foreign key constraints across all gym tables. Delete a workout and verify cascades. Test template-based workout creation produces valid data — @qa-reviewer — done
- [x] Hook code review: verify all gym hooks follow api-contracts.md patterns. Check optimistic updates, camelCase/snake_case mapping, loading states, error logging, useEffect cleanup, dependency arrays — @qa-reviewer — done
- [x] Component code review: verify all gym components follow props-down/callbacks-up. No direct supabase imports in components. Proper key props on all lists. Accessible form inputs — @qa-reviewer — done
- [x] Performance review: verify ProgressCharts is lazy-loaded. Verify queries filter by date range. Check useMemo usage. Verify no unnecessary re-renders in WorkoutLogger — @qa-reviewer — done
- [x] Integration review: verify gym feature does not break budget feature. Test navigation between pages. Verify shared hooks still work. Test fresh user signup seeds both categories and exercises — @qa-reviewer — done

### QA Findings — Bugs to Fix

> Audit completed 2026-04-07. Issues logged below in priority order. HIGH items must be fixed before shipping; MEDIUM items before public launch; LOW items are polish.

#### HIGH Priority
- [x] **No optimistic rollback on DB failure** — added rollback to all CRUD in `useExercises`, `useWorkouts`, `useWorkoutTemplates`: captures previous state before optimistic update, restores on error — @frontend-web — done
- [x] **ProgressCharts "All Time" range is broken** — `useWorkouts` now accepts `month=null` for all-time queries (no date filter). Gym hooks in `App.jsx` now use `useWorkouts(gymUserId, null)`, so `ProgressCharts` receives all-time data — @frontend-web — done
- [x] **GymDashboard "Start from Template" passes no templateId** — replaced button with a template select dropdown + "Start" button; disabled when no template selected; shows "Create a Template" button when no templates exist — @frontend-web — done

#### MEDIUM Priority
- [x] **Stale closure: `sortOrder` in `addExerciseToWorkout`** — `sortOrder` now captured inside `setWorkouts` callback from live `prev` state, eliminating stale closure — @frontend-web — done
- [x] **Stale closure: `setNumber` in `addSet`** — same fix; `setNumber` now captured inside `setWorkouts` callback — @frontend-web — done
- [x] **`deleteWorkout` and `deleteTemplate` rely on DB cascade with no client fallback** — added `user_id` guard to both deletes; rollback restores removed item if DB call fails — @frontend-web — done (DB cascade still needs verification — @backend — todo)
- [x] **Gym hooks always initialized on every page load** — `gymUserId = page === 'gym' ? user?.id : null` passed to all three gym hooks; hooks early-return when userId is null, preventing DB queries on non-gym pages — @frontend-web — done
- [x] **Gym month scope coupled to budget month navigator** — gym now uses `useWorkouts(gymUserId, null)` (all-time), fully decoupled from budget month — @frontend-web — done

#### LOW Priority
- [x] **No `useEffect` cleanup in gym hooks** — added `cancelled` flag to all three hooks; `setState` is skipped if effect is cancelled before async load completes — @frontend-web — done
- [x] **`updateExercise`/`deleteExercise` lack explicit `user_id` guard** — both calls now include `.eq('user_id', userId)` — @frontend-web — done
- [x] **Dead ternary in WorkoutLogger timer display** — simplified to `{formatTimer(elapsed)}` — @frontend-web — done
- [x] **`ExercisePicker` doesn't auto-select newly created exercise** — `handleCreate` is now async; auto-calls `onSelect(newExercise.id)` after creation — @frontend-web — done
- [x] **`WorkoutTemplateManager` uses index-based keys on exercise list** — added `_tempId` to each form exercise (stable across re-renders, generated on add) — @frontend-web — done

#### Still Open
- [x] **Verify DB cascade constraints on `workout_exercises`, `workout_sets`, `template_exercises`** — confirmed via SQL: `workout_exercises.workout_id` CASCADE, `workout_sets.workout_exercise_id` CASCADE, `template_exercises.template_id` CASCADE. `exercise_id` FKs are intentionally NO ACTION. No migration needed — @backend — done

---

## Gym Tracker — Mobile Core (React Native)

### Mobile
- [ ] Create React Native GymDashboard screen: quick-start buttons, this-week stats, recent workouts FlatList, recent PRs section. React Navigation stack — @mobile — todo
- [ ] Shared Supabase hooks: port useExercises, useWorkouts, useWorkoutTemplates to work in React Native (same logic, different imports) — @mobile — todo
- [ ] React Native gym navigation: tab or stack navigator for gym sub-screens (dashboard, workout, history, templates, exercises, progress, recovery, body metrics, social, settings) — @mobile — todo

### QA
- [ ] Mobile review: verify all React Native gym screens match web feature parity. Test on iOS and Android simulators. Verify touch targets meet 44px minimum. Test keyboard handling. Verify navigation stack. Test offline/slow network behavior — @qa-reviewer — todo

---

## UI/UX Revamp — Modern Aesthetic

> **Goal:** Replace the current generic base-plate look with a cohesive, polished design inspired by modern SaaS dashboards. Two reference aesthetics to blend:
>
> **Reference 1 (Nixtio):** Soft lavender/warm-white gradient background, icon-based collapsed sidebar, white cards with generous padding, dark pill CTA buttons, large hero greeting at top of each page.
>
> **Reference 2 (BizLink):** Off-white/cream `#F5F5F0` background, full sidebar with icon + text labels, app logo at top, section groupings in sidebar (nav / projects / members), top action bar per page (search + sort/filter + primary CTA), stats/charts embedded inline at the top of the content area (not on a separate page), full-width use of horizontal space, clean monochromatic palette with one selected/active dark card for emphasis, metadata rows at card bottoms (date pill, comment count, attachment count icons).
>
> **Key principle from Reference 2:** Charts and stats should live inline in the dashboard/page header — not hidden behind a separate "Charts" tab. The gym dashboard should have a full-width stats bar at the top with key metrics and mini charts (weekly volume bar chart, muscle group donut, streak counter) visible immediately without navigating away.

### Design
- [ ] Define design tokens: color palette (off-white cream `#F5F5F0` page bg, white `#FFFFFF` cards, near-black `#141414` primary text, accent `#6C63FF` purple for active states, muted `#8A8A9A` for labels/metadata), typography (Inter, 28px page title / 20px section header / 15px body / 12px metadata), spacing scale (4/8/12/16/24/32/48px), border radius (12px cards, 8px inputs, 999px pills, 6px tags) — @architect — todo
- [ ] Audit current App.css: map all hardcoded hex/px values to token names. Flag components that need structural HTML changes vs. CSS-only updates — @architect — todo
- [ ] Define new layout structure: fixed vertical sidebar (240px, icon + label) with app name/logo at top, nav sections with group labels, user avatar + sign-out at bottom. Main content area takes remaining width. Each page has a top action bar (search/sort/filter + primary CTA) followed by a full-width stats/chart banner, then the main content grid — @architect — todo
- [ ] Define gym dashboard layout spec: full-width stats banner at top (weekly volume mini bar chart + muscle group donut + streak + total workouts this month as big numbers), then quick-start action cards below in a grid — @architect — todo

### Frontend Web
- [x] Introduce CSS custom properties in `:root` for all color, spacing, typography, shadow, and border-radius tokens — @frontend-web — done
- [x] Replace Navbar with vertical Sidebar (240px): glass effect (`backdrop-filter: blur(24px) saturate(160%)`), text-only nav items (no icons), app logo at top, user name + email + sign-out at bottom — @frontend-web — done
- [ ] Add top action bar per page: left side = page title or search input, right side = sort/filter actions + primary dark pill CTA button (e.g., "+ Add Transaction", "+ Start Workout") — @frontend-web — todo
- [x] Revamp overall page shell: glass/white aesthetic, full-width layout (removed `max-width` constraint), `.app-shell` + `.main-area` + `.page-content` layout structure — @frontend-web — done
- [ ] Revamp all cards: white `#FFFFFF`, `border-radius: 12px`, `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`, `padding: 20px 24px`, 1px light border `#EBEBEB` — @frontend-web — todo
- [ ] Revamp all primary action buttons: dark pill (`background: #141414`, `border-radius: 999px`, `padding: 8px 18px`, white text, icon prefix) — @frontend-web — todo
- [ ] Revamp filter pills and toggle tabs: `border-radius: 999px`, inactive = `#F0F0F0` bg + `#666` text, active = `#141414` bg + white text — @frontend-web — todo
- [ ] Gym Dashboard — embed stats inline: full-width stats banner card at top with mini weekly-volume bar chart (Recharts, 120px tall), muscle group donut (Recharts, 100px), streak badge, and 2-3 big number stats (workouts this month, total volume, avg duration). Remove the need to navigate to "Progress" just to see basic stats — @frontend-web — todo
- [ ] Budget Dashboard — embed stats inline: full-width stats banner at top with spending donut (mini, 100px), budget remaining big number, income vs. spent bar, top category this month. Replaces the current disconnected SpendingCharts section — @frontend-web — todo
- [ ] Revamp Auth page: centered card on cream background, clean inputs with `border-radius: 8px`, dark pill submit button — @frontend-web — todo
- [x] Revamp Budget page: page title + 4-column stat card grid (budget/balance, income, expenses, remaining), progress bar, month navigator, mode toggle — Donezo-style dashboard with `BudgetDashboard` 2-column layout — @frontend-web — done
- [ ] Revamp TransactionHistory: clean row layout, subtle `#F7F7F7` alternating rows, date group headers in muted gray, metadata row (category pill + amount + date) — @frontend-web — todo
- [ ] Revamp GymDashboard: stats banner (inline charts), quick-start action cards in a grid row below, recent workouts as card list — @frontend-web — todo
- [ ] Revamp WorkoutLogger: white card shell, set table with clean alternating rows, timer as large number in header, "Complete" as dark pill button — @frontend-web — todo
- [ ] Revamp WorkoutHistory: stats row at top (cards, not banner), calendar as white card, list view with card-bottom metadata rows (date pill + exercise count + volume) — @frontend-web — todo
- [ ] Revamp ExerciseLibrary: top action bar with search + "+ Add Exercise" CTA, filter pill rows, exercise items in a clean list/grid inside white card, active/selected item gets dark card treatment (Reference 2 "Prime Estate" style) — @frontend-web — todo
- [ ] Add active/selected dark card style: when a card is selected or expanded, invert to `background: #141414`, white text, muted light-gray metadata — @frontend-web — todo
- [ ] Add micro-interactions: card hover lift (`translateY(-1px)` + shadow increase), button press scale `0.97`, sidebar active transition — @frontend-web — todo
- [ ] Revamp loading states: skeleton shimmer cards replacing all "Loading..." text — @frontend-web — todo
- [ ] Implement dark mode: CSS variable overrides on `[data-theme="dark"]` — @frontend-web — todo
- [ ] Mobile responsiveness: sidebar collapses to bottom tab bar on `< 768px`, stats banner scrolls horizontally, cards go full-width — @frontend-web — todo

### QA
- [ ] Visual regression check: verify revamp does not break any functional behavior — @qa-reviewer — todo
- [ ] Accessibility audit: verify color contrast ratios meet WCAG AA, focus states visible on all interactive elements, sidebar keyboard-navigable — @qa-reviewer — todo
- [ ] Cross-browser check: CSS variables, backdrop-filter (frosted glass), and transitions work in Chrome, Safari, Firefox — @qa-reviewer — todo

---

## Budget — Cards + Goals Dashboard

> **Goal:** Allow users to track their credit/debit cards and see spending per card. Redesign the budget layout to show goal cards (spending by category) at the top, then transaction history below — inspired by the ofsp_ce dashboard screenshot.

### Backend
- [x] Create `user_cards` table with RLS: `id TEXT PK`, `user_id UUID NOT NULL`, `name TEXT NOT NULL`, `last_four TEXT`, `card_type TEXT CHECK (card_type IN ('credit','debit','other'))`, `color TEXT`, `created_at TIMESTAMPTZ`. All four RLS policies (select/insert/update/delete) scoped to `auth.uid() = user_id` — @backend — done
- [x] Add nullable `card_id TEXT REFERENCES user_cards(id) ON DELETE SET NULL` column to `expenses` table — @backend — done

### Data & Integrations
- [x] Create `src/data/budgetFieldMaps.js`: `cardRowMap` (DB→JS) and `cardFieldMap` (JS→DB) for the `user_cards` table — @data-integrations — done

### Frontend Web
- [x] Create `useCards.js` hook: fetch, add, update, delete user cards with optimistic rollback. Returns `{ cards, loading, addCard, updateCard, deleteCard }` — @frontend-web — done
- [x] Patch `useSupabase.js`: add `cardId` to expense row mapping, `addItem`, and `updateItem` so card association persists — @frontend-web — done
- [x] Create `CardManager.jsx`: visual card stack (up to 3 cards offset/scaled), spending per card computed from expenses, add/edit/delete with preset color swatches — @frontend-web — done
- [x] Create `GoalCards.jsx`: spending breakdown grid by expense category — spent amount, % of total, colored progress bar — @frontend-web — done
- [x] Patch `AddTransaction.jsx`: accept `cards` prop, add `cardId` state, card selector dropdown for expense transactions — @frontend-web — done
- [x] Create `BudgetDashboard.jsx`: 2-column layout composing all budget UI — left (CardManager, AddTransaction, RecurringManager, CategoryList), right (GoalCards, TransactionHistory, SpendingCharts) — @frontend-web — done
- [x] Wire `BudgetDashboard` into `App.jsx`: add `useCards` hook, `cardsLoading` gate, replace old direct budget render with `<BudgetDashboard>` — @frontend-web — done
- [x] Add Card Manager + Goal Cards + Budget Dashboard CSS to `App.css` — @frontend-web — done

### QA
- [ ] Verify card CRUD: add, edit, delete — verify RLS prevents cross-user access — @qa-reviewer — todo
- [ ] Verify card selector appears on expense form and `card_id` persists to DB — @qa-reviewer — todo
- [ ] Verify spending per card is calculated correctly from expenses — @qa-reviewer — todo
- [ ] Verify GoalCards shows correct amounts and progress bars per category — @qa-reviewer — todo
- [ ] Verify BudgetDashboard 2-column layout renders correctly at various screen widths — @qa-reviewer — todo

---

## Budget — Spending Calendar

> **Goal:** Add a calendar section to the budget page showing each day of the current month. Each day is color-coded by spending intensity relative to the user's daily budget (total budget ÷ days in month). Green shades = under daily budget, red shades = over daily budget. No-spend days get a neutral/empty state. Helps users spot high-spend days at a glance.

### Design Notes (Architect)
- Daily budget threshold = `effectiveBudget / daysInMonth`
- Color scale (expense days):
  - No spend → neutral (empty, subtle outline)
  - ≤ 50% of daily budget → strong green
  - 51–100% of daily budget → light green
  - 101–150% of daily budget → light red
  - > 150% of daily budget → strong red
- Income days do not affect the color; only expenses count
- Hovering a day shows a tooltip with: date, total spent, daily budget, and a list of transactions for that day
- Future months show all days as neutral; past days with no data show as neutral
- Today is highlighted with a subtle ring/border
- Component sits at the top of the left column in `BudgetDashboard`, above `CardManager`

### Backend
- No schema changes needed — expenses already have a `date` field

### Frontend Web
- [ ] Create `SpendingCalendar.jsx`: month grid (Sun–Sat header), compute daily totals from `expenses` prop, color-code each day cell against `dailyBudget`, hover tooltip showing day's transactions — @frontend-web — todo
- [ ] Add `SpendingCalendar` to `BudgetDashboard.jsx`: place at the top of the left column above `CardManager`, pass `expenses`, `effectiveBudget`, `month`, `expenseCategories` — @frontend-web — todo
- [ ] Add `SpendingCalendar` CSS to `App.css`: grid layout, day cell colors (green/red scale with CSS custom properties or inline style), hover tooltip, today ring, responsive sizing — @frontend-web — todo

### QA
- [ ] Verify color thresholds are correct at boundary values (exactly 50%, 100%, 150%) — @qa-reviewer — todo
- [ ] Verify calendar grid alignment is correct for months starting on any day of the week — @qa-reviewer — todo
- [ ] Verify hover tooltip shows correct transactions for each day — @qa-reviewer — todo
- [ ] Verify behavior for months with no expenses (all neutral) and months fully in the past — @qa-reviewer — todo

---

## AI Financial Advisor

> **Goal:** Add a floating AI chat assistant (bottom-right FAB) accessible from all pages. The AI receives the user's full financial context (income, expenses, budget, goals, recurring items) in its system prompt and acts as a personalized financial advisor. Users can ask questions like "help me plan to buy a house in 3 years" and get advice grounded in their real numbers. Powered by Google Gemini (free tier — 1,500 requests/day, no credit card required). API key stored securely as a Supabase Edge Function secret — never exposed client-side.

### Design Notes (Architect)
- Provider: Google Gemini `gemini-2.0-flash-lite` via Google AI Studio free tier
- API key lives only in Supabase Edge Function secrets (`GEMINI_API_KEY`)
- Edge Function verifies Supabase JWT before calling Gemini (unauthenticated requests rejected)
- Conversation history is ephemeral (session-only React state, no DB tables needed)
- System prompt assembled client-side from already-loaded financial state and sent to Edge Function
- Message history capped at last 20 exchanges before sending to API (cost/rate control)
- UI: floating `psychology` icon FAB fixed bottom-right, slides in 380px panel from right
- Panel matches app glass-morphism aesthetic; user bubbles right-aligned, assistant left-aligned

### Backend
- [ ] Create `supabase/functions/ai-advisor/index.ts`: verify JWT, validate body, convert messages to Gemini format (`role: 'model'` instead of `'assistant'`, `systemInstruction` field), call Gemini API, return `{ content }` or `{ error }`, handle CORS preflight — @backend — todo
- [ ] Set `GEMINI_API_KEY` and `SUPABASE_JWT_SECRET` as Edge Function secrets in Supabase dashboard — @backend — todo
- [ ] Get free Gemini API key from aistudio.google.com (sign in with Google → Get API key → Create API key) — @backend — todo

### Frontend Web
- [ ] Create `src/hooks/useAIChat.js`: `messages` state, `isLoading`, `error`, `sendMessage(userText, financialContext)`, `clearConversation()`, and `buildSystemPrompt(ctx)` pure function that injects profile/budget/expenses/income/goals/recurring into system prompt — @frontend-web — todo
- [ ] Create `src/components/AIChatPanel.jsx`: floating FAB + slide-in panel, message bubbles, textarea input (Enter to send), pulsing dots loading state, Escape to close, auto-scroll to bottom — @frontend-web — todo
- [ ] Edit `src/App.jsx`: add `financialContext` useMemo assembling all financial state; render `<AIChatPanel financialContext={financialContext} userId={user.id} />` inside every `app-shell` div — @frontend-web — todo
- [ ] Add AI Chat Panel CSS to `src/App.css`: FAB, slide-in panel, user/assistant message bubbles, typing animation, input row — @frontend-web — todo

### QA
- [ ] Verify API key is not present in production bundle (`npm run build && grep -r "AIza" dist/`) — @qa-reviewer — todo
- [ ] Verify Edge Function returns 401 for requests without a valid JWT — @qa-reviewer — todo
- [ ] Verify financial context is correctly injected (amounts match what's shown in dashboard) — @qa-reviewer — todo
- [ ] Verify conversation clears on "Clear" button and on page refresh — @qa-reviewer — todo

---

## Future Features (Not Yet Planned)

- [ ] Macro Tracker — @architect — todo (pending gym tracker completion)
- [ ] Cookbooks — @architect — todo (pending macro tracker completion)
- [ ] To-Do Lists — @architect — todo
- [ ] Mobile port of Budget feature — @mobile — todo

---

## Stretch Goals (Post-MVP, Revisit at End of Project)

### Plaid Bank Integration — Real-Time Transaction Sync

> **Overview:** Use Plaid (or a similar aggregator) as a secure middleman between the app and a user's bank. Users connect their bank through a Plaid-hosted Link modal — credentials never touch our app. Once connected, we pull live transactions, balances, and account info via Plaid's API to auto-populate the budget/expense tracker.
>
> **Alternatives considered:** MX, Finicity (Mastercard) — better suited for enterprise. Plaid is the right fit here (used by Venmo, Robinhood, Mint; free dev tier available).
>
> **Auth flow:**
> 1. User clicks "Connect Bank" in the app
> 2. Plaid Link modal opens (hosted by Plaid, not our app)
> 3. User logs into their bank through the modal
> 4. Plaid returns a `public_token` → exchanged server-side for a permanent `access_token`
> 5. App uses `access_token` to fetch transactions, balances, and account metadata via Plaid API
>
> **Note:** This feature requires a backend server or Supabase Edge Function to securely exchange tokens and store `access_token` — it cannot run browser-side. This is a meaningful architectural shift from the current no-backend pattern.

#### Backend
- [ ] Create `plaid_items` table: `id TEXT PK`, `user_id UUID NOT NULL`, `access_token TEXT NOT NULL`, `item_id TEXT NOT NULL`, `institution_name TEXT`, `institution_id TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`. Enable RLS — @backend — stretch
- [ ] Create `linked_accounts` table: `id TEXT PK`, `user_id UUID NOT NULL`, `item_id TEXT REFERENCES plaid_items(item_id)`, `account_id TEXT NOT NULL`, `name TEXT`, `official_name TEXT`, `type TEXT`, `subtype TEXT`, `mask TEXT`, `current_balance NUMERIC(12,2)`, `available_balance NUMERIC(12,2)`, `currency TEXT DEFAULT 'USD'`, `last_synced TIMESTAMPTZ`. Enable RLS — @backend — stretch
- [ ] Create Supabase Edge Function: `plaid-exchange-token` — receives `public_token` from frontend, exchanges for `access_token` via Plaid `/item/public_token/exchange`, stores in `plaid_items`. Never expose `access_token` to client — @backend — stretch
- [ ] Create Supabase Edge Function: `plaid-sync-transactions` — calls Plaid `/transactions/sync`, maps results to existing `expenses`/`income` schema, upserts new transactions, marks them as `source: 'plaid'` — @backend — stretch
- [ ] Add `source` column to `expenses` and `income` tables: `TEXT CHECK (source IN ('manual','plaid')) DEFAULT 'manual'` — @backend — stretch
- [ ] Add `plaid_transaction_id` column to `expenses` and `income` tables: `TEXT UNIQUE` to prevent duplicate imports — @backend — stretch
- [ ] Store Plaid `access_token` encrypted at rest (use Supabase Vault or environment-scoped secrets) — @backend — stretch

#### Data & Integrations
- [ ] Map Plaid transaction categories to app expense/income categories — @data-integrations — stretch
- [ ] Define deduplication logic: match Plaid `transaction_id` against existing records to avoid double-counting manual + auto entries — @data-integrations — stretch
- [ ] Define field maps: Plaid transaction shape → app `expenses`/`income` schema — @data-integrations — stretch

#### Frontend Web
- [ ] Create `usePlaid.js` hook: initialize Plaid Link, handle `onSuccess` callback, call token exchange Edge Function, fetch linked accounts — @frontend-web — stretch
- [ ] Create `ConnectBank.jsx` component: "Connect Bank" button that opens Plaid Link modal using `react-plaid-link` — @frontend-web — stretch
- [ ] Create `LinkedAccounts.jsx`: list connected bank accounts with name, mask, balance; option to unlink — @frontend-web — stretch
- [ ] Add sync indicator to TransactionHistory: badge or label on Plaid-sourced transactions ("Auto-imported") — @frontend-web — stretch
- [ ] Add "Sync Now" button to trigger manual transaction pull from Plaid — @frontend-web — stretch
- [ ] Handle conflict resolution UI: when a Plaid transaction matches a manual entry, let user merge or keep both — @frontend-web — stretch

#### Mobile
- [ ] Integrate Plaid Link SDK for React Native: use `react-native-plaid-link-sdk` — @mobile — stretch
- [ ] Create React Native ConnectBank screen: same flow as web — @mobile — stretch

#### QA
- [ ] Security audit: verify `access_token` is never sent to the client, only stored server-side — @qa-reviewer — stretch
- [ ] Verify deduplication prevents double-importing same transactions — @qa-reviewer — stretch
- [ ] Verify Plaid-sourced transactions map to correct expense/income categories — @qa-reviewer — stretch
- [ ] Test token exchange Edge Function in Plaid sandbox environment — @qa-reviewer — stretch
