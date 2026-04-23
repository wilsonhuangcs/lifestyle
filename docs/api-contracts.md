# LifestyleAIO — API Contracts

Standard patterns that all agents follow when designing new features.

---

## 1. Supabase Table Schema Format

```sql
CREATE TABLE feature_name (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  -- feature-specific columns --
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feature_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feature_name"
  ON feature_name FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Column Type Conventions

| Data Type | Postgres Type | Notes |
|-----------|--------------|-------|
| ID | `TEXT` | Client-generated via `generateId()` |
| User reference | `UUID NOT NULL REFERENCES auth.users(id)` | Always present |
| Money/amounts | `NUMERIC(12,2)` | Never FLOAT |
| Dates | `TIMESTAMPTZ` | ISO 8601 from JS |
| Booleans | `BOOLEAN DEFAULT true` | Explicit defaults |
| Text | `TEXT` | No VARCHAR limits |
| JSON arrays | `JSONB DEFAULT '[]'` | For flexible sub-structures |
| Enum-like | `TEXT CHECK (col IN ('a','b','c'))` | App-layer validation also OK |
| Sort order | `INTEGER DEFAULT 0` | For user-reorderable lists |

### ID Generation

```js
import { generateId } from '../shared';
const id = generateId(); // e.g., "m1abc2xyz"
```

---

## 2. Standard Hook Interface

```js
export function useFeatureName(userId, ...scopeArgs) {
  return {
    items,          // Array of domain objects (camelCase)
    loading,        // boolean
    addItem,        // async (fields) => newItem
    updateItem,     // async (id, fields) => void
    deleteItem,     // async (id) => void
  };
}
```

### Rules
1. Hook owns all Supabase queries — components never import `supabase`
2. Optimistic updates — `setItems()` before `await supabase...`
3. camelCase in JS, snake_case in DB — hook maps between them
4. Loading starts true, becomes false after initial fetch
5. userId is the first parameter — if null, skip fetch

---

## 3. Component Props Interface

### Data Down, Actions Up

```jsx
<Component
  items={items}
  onAdd={addItem}
  onUpdate={updateItem}
  onDelete={deleteItem}
/>
```

### Naming Conventions

| Pattern | Example | Meaning |
|---------|---------|---------|
| `items` | `expenses`, `recipes` | Data array |
| `onVerb` | `onAdd`, `onDelete` | Callback |
| `is/has` | `isCurrentMonth` | Boolean |
| Noun | `title`, `budget` | Config/scalar |

---

## 4. CRUD Patterns

### Create
```js
const addItem = useCallback(async (fields) => {
  const id = generateId();
  const newItem = { id, ...fields };
  setItems(prev => [newItem, ...prev]);          // optimistic
  await supabase.from('table').insert({           // persist
    id, user_id: userId, column_name: fields.camelCase,
  });
}, [userId]);
```

### Read
```js
useEffect(() => {
  if (!userId) return;
  setLoading(true);
  supabase.from('table').select('*').eq('user_id', userId)
    .then(({ data }) => {
      setItems((data || []).map(mapRow));
      setLoading(false);
    });
}, [userId]);
```

### Update
```js
const updateItem = useCallback(async (id, fields) => {
  setItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i));
  const dbFields = buildDbFields(fields, keyMap);
  await supabase.from('table').update(dbFields).eq('id', id);
}, []);
```

### Delete
```js
const deleteItem = useCallback(async (id) => {
  setItems(prev => prev.filter(i => i.id !== id));
  await supabase.from('table').delete().eq('id', id);
}, []);
```

---

## 5. Error Handling

```js
const { error } = await supabase.from('table').insert({...});
if (error) {
  console.error(`[useFeature] insert failed:`, error.message);
  // Do NOT roll back optimistic state
}
```

---

## 6. Naming Conventions

### Database (snake_case)
- Tables: plural nouns (`expenses`, `workouts`)
- Columns: `user_id`, `category_id`, `created_at`

### JavaScript (camelCase)
- Hooks: `useExpenses`, `useWorkouts`
- Actions: `addExpense`, `deleteRecipe`
- Props: `onAddExpense`, `onDelete`
- Components: `WorkoutLogger`, `RecipeEditor`

### CSS (kebab-case)
- Section: `/* --- Gym Tracker --- */`
- Block: `.gym-dashboard`, `.recipe-card`
- Element: `.gym-session-header`
- State: `.active`, `.editing`
