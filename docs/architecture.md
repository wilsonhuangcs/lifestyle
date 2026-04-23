# LifestyleAIO — System Architecture

## 1. System Overview

LifestyleAIO is a unified lifestyle platform with five feature modules:

| Module | Status | Description |
|--------|--------|-------------|
| **Budget** | Shipped | Monthly budgeting, expense/income tracking, recurring transactions, charts, categories |
| **Gym** | Planned | Workout logging, exercise library, progress tracking |
| **Macro** | Planned | Daily nutrition/calorie tracking, food database |
| **Cookbook** | Planned | Recipe storage, ingredient lists, meal planning |
| **Todo** | Planned | Task lists, due dates, priorities |

All modules share a single Supabase backend, a single authentication system, and a common design language. Each module is self-contained in code but unified in navigation and user experience.

### Core Principles

1. **No backend server** — browser talks directly to Supabase via `@supabase/supabase-js`
2. **Hooks as data layer** — each domain gets one hook that owns queries, mutations, and local state
3. **Optimistic UI** — local state updates immediately; Supabase persistence is async and non-blocking
4. **Per-user isolation** — every table has `user_id` column with RLS policy `auth.uid() = user_id`
5. **Single CSS file** — all styles in `App.css` with section comment headers; no CSS modules, no Tailwind
6. **Lazy loading** — heavy components (charts, editors, recipe viewers) use `React.lazy()` + `Suspense`

---

## 2. Folder Structure

### Current (budget only)

```
src/
├── App.jsx
├── App.css
├── main.jsx
├── lib/supabase.js
├── hooks/
├── components/
└── data/
```

### Target (multi-feature)

```
src/
├── App.jsx                    # Root: auth gate, feature router, navbar
├── App.css                    # All styles (single file, section headers per feature)
├── main.jsx                   # Entry point
│
├── lib/
│   └── supabase.js            # Supabase client singleton
│
├── shared/                    # Cross-feature utilities
│   ├── index.js               # Barrel export
│   ├── design-tokens.js       # Colors, spacing, typography as JS constants
│   └── utils.js               # formatCurrency, formatDate, generateId, etc.
│
├── data/                      # Static seed/default data (all features)
│   ├── categories.js          # Default expense categories
│   ├── incomeCategories.js    # Default income categories
│   ├── exerciseLibrary.js     # Default exercises (gym)
│   └── foodDatabase.js        # Common foods (macro)
│
├── hooks/                     # All custom hooks (flat, one per domain)
│   ├── useAuth.js
│   ├── useSupabase.js         # useMonth, useBudget, useExpenses, useIncome
│   ├── useRecurring.js
│   ├── useCategoryManager.js
│   ├── useProfile.js
│   ├── useWorkouts.js         # Gym: workout sessions, exercises, sets
│   ├── useMacros.js           # Macro: daily food log, nutrient totals
│   ├── useRecipes.js          # Cookbook: recipe CRUD, ingredients
│   └── useTodos.js            # Todo: task CRUD, status, priorities
│
├── components/                # All UI components (flat or lightly grouped)
│   ├── Auth.jsx
│   ├── Navbar.jsx
│   ├── FeatureNav.jsx         # Sub-navigation between features
│   │
│   ├── budget/                # Budget feature components
│   │   ├── BudgetHeader.jsx
│   │   ├── AddTransaction.jsx
│   │   ├── CategoryList.jsx
│   │   ├── TransactionHistory.jsx
│   │   ├── RecurringManager.jsx
│   │   ├── SpendingCharts.jsx
│   │   ├── DatePicker.jsx
│   │   └── ProfilePage.jsx
│   │
│   ├── gym/                   # Gym feature components
│   │   ├── GymDashboard.jsx
│   │   ├── WorkoutLogger.jsx
│   │   ├── ExercisePicker.jsx
│   │   └── ProgressCharts.jsx
│   │
│   ├── macro/                 # Macro feature components
│   │   ├── MacroDashboard.jsx
│   │   ├── FoodLogger.jsx
│   │   ├── NutrientSummary.jsx
│   │   └── MacroCharts.jsx
│   │
│   ├── cookbook/               # Cookbook feature components
│   │   ├── CookbookBrowser.jsx
│   │   ├── RecipeEditor.jsx
│   │   └── RecipeViewer.jsx
│   │
│   └── todo/                  # Todo feature components
│       ├── TodoDashboard.jsx
│       ├── TaskList.jsx
│       └── TaskEditor.jsx
```

### Key Decisions

- **Hooks stay flat** — one file per domain, no nesting. A hook never imports another hook (except `useAuth` patterns). This keeps dependencies obvious.
- **Components are grouped by feature** — subdirectories under `components/` keep related JSX together. Shared components (Navbar, Auth, FeatureNav) stay at the `components/` root.
- **Data stays flat** — static seed data for all features in `data/`.
- **Shared module** — `src/shared/` holds utilities, design tokens, and anything used by 2+ features.

---

## 3. State Management Pattern

### Rule: One Hook Per Domain

Each feature domain has exactly one hook that encapsulates:
- **State** — local React state (`useState`)
- **Loading flag** — boolean, true during initial fetch
- **Actions** — CRUD functions that update local state optimistically then persist to Supabase
- **Derived data** — computed via `useMemo` in the consuming component, not inside the hook

### Hook Anatomy

```
useFeature(userId, ...scope)
  ├── useState for items[]
  ├── useState for loading
  ├── useEffect to fetch on mount / scope change
  ├── useCallback for add/update/delete (optimistic + Supabase)
  └── return { items, loading, add, update, delete }
```

### How Features Stay Isolated

- Hooks never import other hooks. If Feature A needs data from Feature B (e.g., macro tracker reading recipes), the parent component passes it down as props.
- App.jsx (or a future feature page component) is the only place where multiple hooks coexist and their data intersects.
- No React Context unless absolutely necessary. Props down, callbacks up.

---

## 4. Routing Strategy

### Current: State-Based Routing

The app uses `useState('budget')` in App.jsx to switch between "pages". This works for 2 pages but needs structure as features grow.

### Scaling Plan: Feature-Based Page State

**Option A: Keep state-based, add FeatureNav (recommended for now)**

```js
const [page, setPage] = useState('budget');
// 'budget' | 'gym' | 'macro' | 'cookbook' | 'todo' | 'profile'
```

A `<FeatureNav>` component renders navigation tabs. Each feature's component tree is conditionally rendered based on `page`.

**Option B: React Router (when URL-based navigation is needed)**

Migrate to React Router v7 with lazy-loaded route components when the app needs shareable URLs, deep linking, or browser back/forward support.

**Recommendation:** Stay with Option A until mobile work begins or URL sharing is needed.

---

## 5. Data Flow

```
Component (UI only)
    ↕ props/callbacks
App.jsx (orchestrator)
    ↕ calls hooks
useFeature() (custom hook)
    ↕ supabase.from(table)
Supabase JS Client
    ↕ HTTPS + JWT
Supabase PostgreSQL + RLS (auth.uid() = user_id)
```

### Optimistic Update Flow

1. Component calls `onAddItem({ ... })`
2. Hook generates client-side ID
3. Hook calls `setItems(prev => [newItem, ...prev])` — UI updates instantly
4. Hook calls `supabase.from('table').insert({...})` — async, non-blocking

---

## 6. Shared vs Feature-Specific Boundaries

### Shared (`src/shared/`)
Code used by 2+ features with no feature-specific logic:
- `formatCurrency()`, `formatDate()`, `generateId()`
- Design tokens
- Supabase client (`lib/supabase.js`)

### Feature-Specific
Code used by only one feature stays in that feature's directory.

**Rule:** If a utility is used in only one feature today, keep it there. Move to `shared/` only when a second feature needs it.

---

## 7. Performance Strategy

- **Lazy loading** — heavy components (charts, editors) via `React.lazy()` + `Suspense`
- **Per-feature code splitting** — lazy-load feature page containers
- **Memoization** — `useMemo` for expensive derived data, `useCallback` for action functions
- **Database queries** — filter by month range on indexed `date` column, no full-table scans
- **Bundle discipline** — avoid large libraries per feature; prefer lightweight solutions
