import { useState } from 'react';
import { FREQUENCIES } from '../hooks/useRecurring';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(amount);

const FREQUENCY_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

function DateGrid({ selected, onToggle }) {
  return (
    <>
      <div className="date-grid">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            type="button"
            className={`date-cell ${selected.includes(day) ? 'selected' : ''} ${day >= 29 ? 'date-cell--short-month' : ''}`}
            onClick={() => onToggle(day)}
            title={day >= 29 ? 'May not occur in all months' : undefined}
          >
            {day}
          </button>
        ))}
      </div>
      <p className="date-grid-note">Days 29–31 will be skipped in shorter months.</p>
    </>
  );
}

function monthlyOccurrences(item) {
  switch (item.frequency) {
    case 'daily': return 30;
    case 'weekly': return 4;
    case 'biweekly': return 2;
    case 'monthly': return 1;
    case 'custom': return (item.customDates || []).length;
    default: return 1;
  }
}

function formatCustomDates(dates) {
  if (!dates || dates.length === 0) return 'No dates';
  const sorted = [...dates].sort((a, b) => a - b);
  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  if (sorted.length <= 3) return sorted.map(ordinal).join(', ');
  return `${sorted.length} dates/mo`;
}

const PRESET_COLORS = [
  '#FF6B6B', '#e74c3c', '#E91E63', '#FF6F00',
  '#F0B27A', '#F7DC6F', '#FFEAA7', '#2ecc71',
  '#27ae60', '#00b894', '#4ECDC4', '#1abc9c',
  '#45B7D1', '#3498db', '#2980b9', '#BB8FCE',
  '#9b59b6', '#DDA0DD', '#8e44ad', '#1a1a2e',
  '#555555', '#95a5a6', '#B0BEC5', '#34495e',
];

function RecurringEditForm({ item, categories, onSave, onCancel, onUpdateCategoryColor }) {
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [amount, setAmount] = useState(item.amount.toString());
  const [description, setDescription] = useState(item.description);
  const [frequency, setFrequency] = useState(item.frequency);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customDates, setCustomDates] = useState(item.customDates || []);

  const handleDateToggle = (day) => {
    setCustomDates(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!categoryId || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (frequency === 'custom' && customDates.length === 0) return;

    onSave({
      categoryId,
      amount: parsedAmount,
      description: description.trim() || item.description,
      frequency,
      customDates: frequency === 'custom' ? customDates : [],
    });
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="recurring-edit-form">
      <div className="form-group">
        <label>Category</label>
        <div className="category-color-row">
          <span
            className="color-swatch-sm"
            style={{ backgroundColor: selectedCategory?.color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Change color"
          />
          <div className="select-wrapper" style={{ borderLeftColor: selectedCategory?.color, flex: 1 }}>
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setShowColorPicker(false); }}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {showColorPicker && selectedCategory && (
          <div className="color-picker-inline">
            <div className="color-presets">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-preset ${c === selectedCategory.color ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => { onUpdateCategoryColor(selectedCategory.id, { color: c }); setShowColorPicker(false); }}
                />
              ))}
            </div>
            <div className="color-custom-row">
              <input
                type="color"
                value={selectedCategory.color}
                onChange={(e) => onUpdateCategoryColor(selectedCategory.id, { color: e.target.value })}
                className="color-input-native"
              />
              <span className="color-custom-label">Custom color</span>
            </div>
          </div>
        )}
      </div>
      <div className="form-group">
        <label>Frequency</label>
        <div className="frequency-picker">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              type="button"
              className={`frequency-btn ${frequency === f ? 'active' : ''}`}
              onClick={() => setFrequency(f)}
            >
              {FREQUENCY_LABELS[f]}
            </button>
          ))}
        </div>
      </div>
      {frequency === 'custom' && (
        <div className="form-group">
          <label>Select Dates {customDates.length > 0 && `(${customDates.length} selected)`}</label>
          <DateGrid selected={customDates} onToggle={handleDateToggle} />
        </div>
      )}
      <div className="recurring-form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Amount</label>
          <input
            type="number"
            min="0.01" step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label>Description</label>
          <input
            type="text"
            placeholder="e.g. Netflix, Rent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="recurring-edit-actions">
        <button type="submit" className="btn-save-cat">Save</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function RecurringItem({ item, cat, isIncome, onEdit, onToggle, onDelete }) {
  return (
    <li className={`recurring-item ${!item.active ? 'inactive' : ''}`}>
      <span className="recurring-dot" style={{ backgroundColor: cat?.color }} />
      <div className="recurring-details">
        <span className="recurring-desc">{item.description}</span>
        <span className="recurring-meta">
          {cat?.icon} {cat?.name} &middot; {FREQUENCY_LABELS[item.frequency]}
          {item.frequency === 'custom' && ` (${formatCustomDates(item.customDates)})`}
        </span>
      </div>
      <span className={`recurring-amount ${isIncome ? 'income-amount' : ''}`}>
        {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
      </span>
      <button className="btn-edit-recurring" onClick={() => onEdit(item.id)} title="Edit">
        &#9998;
      </button>
      <button
        className={`btn-toggle ${item.active ? 'active' : ''}`}
        onClick={() => onToggle(item.id)}
        title={item.active ? 'Pause' : 'Resume'}
      >
        {item.active ? 'On' : 'Off'}
      </button>
      <button className="btn-delete" onClick={() => onDelete(item.id)} title="Delete">
        &times;
      </button>
    </li>
  );
}

export default function RecurringManager({
  recurring,
  expenseCategories,
  incomeCategories,
  onAdd,
  onUpdate,
  onToggle,
  onDelete,
  onUpdateCategory,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState(expenseCategories[0].id);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [customDates, setCustomDates] = useState([]);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const allCategories = new Map([
    ...expenseCategories.map(c => [c.id, c]),
    ...incomeCategories.map(c => [c.id, c]),
  ]);

  const handleTypeChange = (newType) => {
    setType(newType);
    const cats = newType === 'expense' ? expenseCategories : incomeCategories;
    setCategoryId(cats[0].id);
  };

  const handleDateToggle = (day) => {
    setCustomDates(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!categoryId || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (frequency === 'custom' && customDates.length === 0) return;

    await onAdd({
      type,
      categoryId,
      amount: parsedAmount,
      description: description.trim() || categories.find(c => c.id === categoryId).name,
      frequency,
      customDates: frequency === 'custom' ? customDates : [],
    });

    setAmount('');
    setDescription('');
    setFrequency('monthly');
    setCustomDates([]);
    setShowForm(false);
  };

  const handleEditSave = async (id, fields) => {
    await onUpdate(id, fields);
    setEditingId(null);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const recurringExpenses = recurring.filter(r => r.type === 'expense').sort((a, b) => b.amount - a.amount);
  const recurringIncome = recurring.filter(r => r.type === 'income').sort((a, b) => b.amount - a.amount);

  return (
    <div className="card recurring-manager">
      <div className="recurring-header">
        <h2>Recurring</h2>
        <button className="btn-add-recurring" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="recurring-form">
          <div className="tab-bar">
            <button
              type="button"
              className={`tab-btn tab-sm ${type === 'expense' ? 'active' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`tab-btn tab-sm tab-income ${type === 'income' ? 'active' : ''}`}
              onClick={() => handleTypeChange('income')}
            >
              Income
            </button>
          </div>
          <div className="form-group">
            <label>Category</label>
            <div className="select-wrapper" style={{ borderLeftColor: selectedCategory?.color }}>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <div className="frequency-picker">
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`frequency-btn ${frequency === f ? 'active' : ''}`}
                  onClick={() => setFrequency(f)}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
          {frequency === 'custom' && (
            <div className="form-group">
              <label>Select Dates {customDates.length > 0 && `(${customDates.length} selected)`}</label>
              <DateGrid selected={customDates} onToggle={handleDateToggle} />
            </div>
          )}
          <div className="recurring-form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Amount</label>
              <input
                type="number"
                min="0.01" step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Description</label>
              <input
                type="text"
                placeholder="e.g. Netflix, Rent"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className={`btn-add ${type === 'income' ? 'btn-income' : ''}`}>
            Add Recurring {type === 'income' ? 'Income' : 'Expense'}
          </button>
        </form>
      )}

      {recurring.length === 0 && !showForm && (
        <p className="empty-message">No recurring items yet.</p>
      )}

      {recurringExpenses.length > 0 && (
        <div className="recurring-section">
          <div className="recurring-section-header">
            <h3 className="recurring-section-title">Expenses</h3>
            <span className="recurring-section-total expense-value">
              {formatCurrency(recurringExpenses.reduce((sum, r) => sum + r.amount * monthlyOccurrences(r), 0))}/mo
            </span>
          </div>
          <ul className="recurring-list">
            {recurringExpenses.map((item) => {
              const cat = allCategories.get(item.categoryId);
              if (editingId === item.id) {
                return (
                  <li key={item.id} className="recurring-item-edit">
                    <RecurringEditForm
                      item={item}
                      categories={expenseCategories}
                      onSave={(fields) => handleEditSave(item.id, fields)}
                      onCancel={() => setEditingId(null)}
                      onUpdateCategoryColor={onUpdateCategory}
                    />
                  </li>
                );
              }
              return (
                <RecurringItem
                  key={item.id}
                  item={item}
                  cat={cat}
                  isIncome={false}
                  onEdit={() => { setEditingId(item.id); setShowForm(false); }}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              );
            })}
          </ul>
        </div>
      )}

      {recurringIncome.length > 0 && (
        <div className="recurring-section">
          <div className="recurring-section-header">
            <h3 className="recurring-section-title">Income</h3>
            <span className="recurring-section-total income-amount">
              {formatCurrency(recurringIncome.reduce((sum, r) => sum + r.amount * monthlyOccurrences(r), 0))}/mo
            </span>
          </div>
          <ul className="recurring-list">
            {recurringIncome.map((item) => {
              const cat = allCategories.get(item.categoryId);
              if (editingId === item.id) {
                return (
                  <li key={item.id} className="recurring-item-edit">
                    <RecurringEditForm
                      item={item}
                      categories={incomeCategories}
                      onSave={(fields) => handleEditSave(item.id, fields)}
                      onCancel={() => setEditingId(null)}
                      onUpdateCategoryColor={onUpdateCategory}
                    />
                  </li>
                );
              }
              return (
                <RecurringItem
                  key={item.id}
                  item={item}
                  cat={cat}
                  isIncome={true}
                  onEdit={() => { setEditingId(item.id); setShowForm(false); }}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
