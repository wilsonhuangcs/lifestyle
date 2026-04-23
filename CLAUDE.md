# LifestyleAIO — Project Bible

## Vision
A unified lifestyle platform covering budgeting, fitness, nutrition, cooking, and productivity. Available on web and mobile (iOS/Android).

## Current State
- Budgeting app exists (web only) — fully functional with budget/tracker modes, recurring transactions, charts, profiles
- Expanding to: gym tracker, macro tracker, cookbooks, to-do lists
- Expanding platform to: iOS + Android (React Native)

## Tech Stack
- **Frontend Web**: React 19 + Vite 6 (JSX, plain CSS)
- **Mobile**: React Native — planned (shared logic with web)
- **Database**: PostgreSQL via Supabase — project ref `dswetxilqyzvrgocqobf`
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (avatars bucket)
- **Client**: `@supabase/supabase-js` — direct browser-to-Supabase, no backend server
- **Charts**: Recharts (lazy-loaded)

## Feature Roadmap
- [x] Budgeting / Expense Tracker (web)
- [x] Income Tracking
- [x] Recurring Transactions
- [x] Custom Categories (colors, icons, names)
- [x] Spending Charts (donut + bar)
- [x] User Profiles with Avatar Upload
- [ ] Gym Tracker
- [ ] Macro Tracker
- [ ] Cookbooks
- [ ] To-Do Lists
- [ ] Mobile versions of all above

## Project Structure
```
src/
├── App.jsx              # Root component, page routing, state orchestration
├── App.css              # All styles (single file)
├── main.jsx             # Entry point
├── lib/
│   └── supabase.js      # Supabase client singleton
├── hooks/               # Custom React hooks (data layer)
│   ├── useAuth.js
│   ├── useSupabase.js   # useMonth, useBudget, useExpenses, useIncome
│   ├── useRecurring.js
│   ├── useProfile.js
│   └── useCategoryManager.js
├── components/          # UI components
│   ├── Auth.jsx
│   ├── Navbar.jsx
│   ├── BudgetHeader.jsx
│   ├── AddTransaction.jsx
│   ├── CategoryList.jsx
│   ├── TransactionHistory.jsx
│   ├── RecurringManager.jsx
│   ├── SpendingCharts.jsx
│   ├── DatePicker.jsx
│   └── ProfilePage.jsx
└── data/                # Default category definitions
    ├── categories.js
    └── incomeCategories.js
```

## Database Tables
- `budget` — (user_id, month) composite PK. Columns: amount, balance, mode
- `expenses` — id PK. Columns: category_id, amount, description, date, user_id
- `income` — id PK. Columns: category_id, amount, description, date, user_id
- `recurring` — id PK. Columns: user_id, type, category_id, amount, description, frequency, custom_dates, active
- `recurring_log` — id PK. Columns: recurring_id, applied_date
- `user_categories` — id PK. Columns: user_id, type, name, color, icon, sort_order
- `profiles` — user_id PK. Columns: first_name, last_name, birthday, bio, avatar_url

All tables have RLS enabled, scoped to `auth.uid() = user_id`.

## Architecture Patterns
- **No backend server** — all data flows through Supabase JS client directly from the browser
- **Hooks as data layer** — each hook owns one domain (budget, expenses, recurring, etc.)
- **Optimistic UI** — state updates immediately, then persists to Supabase async
- **Per-user data isolation** — RLS on every table, categories seeded per user with unique IDs
- **Per-month scoping** — budget/balance stored per month, transactions filtered by month date range
- **Lazy loading** — charts code-split into separate chunk
- **Single CSS file** — no CSS modules, no Tailwind; all styles in App.css with section comments

## Key Behaviors
- Budget mode resets monthly budget amount; Tracker mode carries over ending balance
- Recurring transactions auto-apply on current month load (daily/weekly/biweekly/monthly/custom)
- Default categories seeded on first login, matched by name+type to avoid duplicates
- Category colors, icons, names are fully user-customizable
- Profile supports avatar upload via Supabase Storage

## Agent System

### Agents (`.claude/agents/`)
| Agent | File | Role |
|---|---|---|
| Project Manager | `project-manager.md` | Breaks down features, routes to agents, maintains TASKS.md |
| Architect | `architect.md` | Defines schemas, API contracts, component structure, enforces patterns |
| Frontend Web | `frontend-web.md` | React components, hooks, CSS, page routing |
| Mobile | `mobile.md` | React Native screens, shares Supabase backend |
| Backend | `backend.md` | Supabase schemas, RLS, storage, Edge Functions |
| Data & Integrations | `data-integrations.md` | Third-party APIs, data models, nutrition/fitness/finance integrations |
| QA Reviewer | `qa-reviewer.md` | Code review, security audit, bug detection (read-only) |

### Agent Routing Rules
1. **Architect decides first** — any new feature starts with Architect defining schema, API contracts, and component structure
2. **Backend + Data can run in parallel** — schema changes and integrations are independent
3. **Frontend Web + Mobile run in parallel** — both consume the same Supabase API
4. **QA reviews after each feature completes** — never skip
5. **PM tracks all work** in TASKS.md and resolves cross-agent conflicts

### Agent Interaction Flow
```
User
  └── Project Manager
        ├── Architect (designs first, consulted on all new features)
        ├── Frontend Web Agent    ─┐
        ├── Mobile Agent           ├── coordinate via shared API contracts
        ├── Backend Agent         ─┘
        ├── Data & Integrations Agent
        └── QA Agent (reviews everyone's output)
```

## Workflow: Adding a New Feature

### Per-feature process (e.g., Gym Tracker):

**1. Plan it:**
Use the project-manager agent to break down the feature into backend, frontend web, and mobile tasks. Update TASKS.md.

**2. Design it:**
Use the architect agent to define the schema, hook interfaces, component tree, and integration points. Output goes to `/docs/`.

**3. Build backend + data in parallel:**
- Backend agent: create Supabase tables, RLS policies per the Architect's schema
- Data agent: design data models, seed data, integrate third-party APIs if needed

**4. Build frontend + mobile in parallel:**
- Frontend web agent: build React components and hooks per the Architect's component tree
- Mobile agent: build React Native screens using the same API contracts

**5. QA review:**
QA agent reviews all code for security, consistency, bugs, and accessibility.

**6. Repeat** for the next feature.

### Day-to-Day Loop
```
1. Tell the PM what you want to work on
2. PM breaks it down and routes to agents
3. Review each agent's output before it moves to the next step
4. QA reviews completed work
5. Commit and move to next task
```

## Commands
- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — Production build
- `npm run preview` — Preview production build
