import { useState, useEffect, useRef } from 'react';
import DatePicker from './DatePicker';
import { formatDateForStorage } from '../shared/utils';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(amount);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function TransactionEditForm({ item, categories, cards, onSave, onCancel }) {
  const validInitialId = categories.find(c => c.id === item.categoryId)
    ? item.categoryId
    : (categories[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(validInitialId);
  const [amount, setAmount] = useState(item.amount.toString());
  const [description, setDescription] = useState(item.description);
  const [date, setDate] = useState(new Date(item.date).toISOString().split('T')[0]);
  const [cardId, setCardId] = useState(item.cardId || '');

  const isExpense = item.type === 'expense';

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!categoryId || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const fields = {
      categoryId,
      amount: parsedAmount,
      description: description.trim() || item.description,
      date: formatDateForStorage(date),
    };
    if (isExpense) fields.cardId = cardId || null;

    onSave(item.id, fields);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="transaction-edit-form">
      <div className="form-group">
        <label>Category</label>
        <div className="select-wrapper" style={{ '--select-accent': selectedCategory?.color }}>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="transaction-edit-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Amount</label>
          <input
            type="number"
            min="0.01"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Date</label>
        <DatePicker value={date} onChange={setDate} />
      </div>
      {isExpense && cards.length > 0 && (
        <div className="form-group">
          <label>Card</label>
          <div className="select-wrapper">
            <select value={cardId} onChange={(e) => setCardId(e.target.value)}>
              <option value="">No card</option>
              {cards.map(c => (
                <option key={c.id} value={c.id}>{c.name} ••{c.lastFour}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="recurring-edit-actions">
        <button type="submit" className="btn-save-cat">Save</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TransactionHistory({
  expenses, income,
  expenseCategories, incomeCategories,
  onUpdateExpense, onUpdateIncome,
  onDeleteExpense, onDeleteIncome,
  cards = [],
  onExportPDF,
  onExportYTD,
  onExportMonth,
}) {
  const [tab, setTab] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [filterCategoryId, setFilterCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [ytdLoading, setYtdLoading] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(null);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const exportMenuRef = useRef(null);
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const expenseCategoryMap = new Map(expenseCategories.map(c => [c.id, c]));
  const incomeCategoryMap = new Map(incomeCategories.map(c => [c.id, c]));

  const expenseItems = expenses.map(e => ({ ...e, type: 'expense' }));
  const incomeItems = income.map(i => ({ ...i, type: 'income' }));

  let items;
  if (tab === 'expenses') items = expenseItems;
  else if (tab === 'income') items = incomeItems;
  else items = [...expenseItems, ...incomeItems].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply category filter
  if (filterCategoryId !== 'all') {
    items = items.filter(i => i.categoryId === filterCategoryId);
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    items = items.filter(i => {
      const cat = i.type === 'income'
        ? incomeCategoryMap.get(i.categoryId)
        : expenseCategoryMap.get(i.categoryId);
      return (
        i.description?.toLowerCase().includes(q) ||
        cat?.name?.toLowerCase().includes(q)
      );
    });
  }

  const filteredExpenseTotal = items.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0);
  const filteredIncomeTotal = items.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);
  const filteredTotal = items.reduce((sum, i) => sum + i.amount, 0);

  // Clear stale edit form when its item is filtered out
  useEffect(() => {
    if (editingId && !items.find(i => `${i.type}-${i.id}` === editingId)) {
      setEditingId(null);
    }
  }, [items, editingId]);

  // Build category options for the filter dropdown based on active tab
  const filterCategories = tab === 'income'
    ? incomeCategories
    : tab === 'expenses'
      ? expenseCategories
      : [...expenseCategories, ...incomeCategories];

  const handleSave = (type, id, fields) => {
    if (type === 'income') {
      onUpdateIncome(id, fields);
    } else {
      onUpdateExpense(id, fields);
    }
    setEditingId(null);
  };

  return (
    <div className="card transaction-history">
      <div className="transaction-history-header">
        <h2>Transaction History</h2>
        <div className="export-pdf-group" ref={exportMenuRef}>
          <button className="btn-export-pdf btn-export-main" onClick={onExportPDF} title="Download this month's PDF" aria-label="Export this month as PDF">
            <span className="material-icons">download</span>
            Export PDF
          </button>
          <button
            className="btn-export-chevron"
            onClick={() => setShowExportMenu(v => !v)}
            title="More export options"
            aria-label="Export options"
          >
            <span className="material-icons">{showExportMenu ? 'expand_less' : 'expand_more'}</span>
          </button>
          {showExportMenu && (
            <div className="export-pdf-menu">
              <button className="export-pdf-menu-item" onClick={() => { onExportPDF(); setShowExportMenu(false); }}>
                <span className="material-icons">calendar_today</span>
                This Month
              </button>
              <button
                className="export-pdf-menu-item"
                disabled={ytdLoading}
                onClick={async () => {
                  setYtdLoading(true);
                  setShowExportMenu(false);
                  await onExportYTD?.();
                  setYtdLoading(false);
                }}
              >
                <span className="material-icons">date_range</span>
                {ytdLoading ? 'Generating…' : 'Year to Date'}
              </button>
              <div className="export-pdf-menu-divider" />
              <div className="export-month-picker">
                <div className="export-month-picker-header">
                  <button className="export-month-year-btn" onClick={() => setPickerYear(y => y - 1)}>
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <span className="export-month-year-label">{pickerYear}</span>
                  <button
                    className="export-month-year-btn"
                    onClick={() => setPickerYear(y => y + 1)}
                    disabled={pickerYear >= currentYear}
                  >
                    <span className="material-icons">chevron_right</span>
                  </button>
                </div>
                <div className="export-month-grid">
                  {MONTHS.map((name, idx) => {
                    const value = `${pickerYear}-${String(idx + 1).padStart(2, '0')}`;
                    const isFuture = pickerYear === currentYear && idx > currentMonthIdx;
                    const isLoading = loadingMonth === value;
                    return (
                      <button
                        key={value}
                        className="export-month-cell"
                        disabled={isFuture || isLoading}
                        onClick={async () => {
                          setLoadingMonth(value);
                          setShowExportMenu(false);
                          await onExportMonth?.(value);
                          setLoadingMonth(null);
                        }}
                      >
                        {isLoading ? '…' : name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="tab-bar history-tabs">
        <button className={`tab-btn tab-sm ${tab === 'all' ? 'active' : ''}`} onClick={() => { setTab('all'); setFilterCategoryId('all'); setSearchQuery(''); }}>All</button>
        <button className={`tab-btn tab-sm ${tab === 'expenses' ? 'active' : ''}`} onClick={() => { setTab('expenses'); setFilterCategoryId('all'); setSearchQuery(''); }}>Expenses</button>
        <button className={`tab-btn tab-sm tab-income ${tab === 'income' ? 'active' : ''}`} onClick={() => { setTab('income'); setFilterCategoryId('all'); setSearchQuery(''); }}>Income</button>
      </div>
      <div className="th-search-row">
        <span className="material-icons th-search-icon">search</span>
        <input
          className="th-search-input"
          type="text"
          placeholder="Search transactions..."
          aria-label="Search transactions"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="th-search-clear" onClick={() => setSearchQuery('')} title="Clear search" aria-label="Clear search">
            <span className="material-icons">close</span>
          </button>
        )}
      </div>
      <div className="filter-row">
        <select
          className="filter-select"
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
        >
          <option value="all">All Categories</option>
          {filterCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        {(filterCategoryId !== 'all' || searchQuery) && (
          <div className="filter-total">
            {tab === 'all' ? (
              <>
                {filteredExpenseTotal > 0 && (
                  <span className="filter-total-value">&minus;{formatCurrency(filteredExpenseTotal)}</span>
                )}
                {filteredIncomeTotal > 0 && (
                  <span className="filter-total-value income-amount">+{formatCurrency(filteredIncomeTotal)}</span>
                )}
              </>
            ) : (
              <>
                <span className="filter-total-label">
                  {tab === 'income' ? 'Total Income' : 'Total Spent'}
                </span>
                <span className={`filter-total-value ${tab === 'income' ? 'income-amount' : ''}`}>
                  {formatCurrency(tab === 'income' ? filteredIncomeTotal : filteredExpenseTotal)}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <p className="empty-message">
          {searchQuery || filterCategoryId !== 'all'
            ? 'No transactions match your filters.'
            : 'No transactions yet. Add one to get started!'}
        </p>
      ) : (
        <ul className="transactions">
          {items.map((item) => {
            const isIncome = item.type === 'income';
            const cat = isIncome
              ? incomeCategoryMap.get(item.categoryId)
              : expenseCategoryMap.get(item.categoryId);
            const itemKey = `${item.type}-${item.id}`;

            if (editingId === itemKey) {
              return (
                <li key={itemKey} className="transaction-row-edit">
                  <TransactionEditForm
                    item={item}
                    categories={isIncome ? incomeCategories : expenseCategories}
                    cards={cards}
                    onSave={(id, fields) => handleSave(item.type, id, fields)}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              );
            }

            return (
              <li key={itemKey} className="transaction-row">
                <span className="transaction-dot" style={{ backgroundColor: cat?.color }} />
                <div className="transaction-details">
                  <span className="transaction-desc">{item.description}</span>
                  <span className="transaction-meta">
                    {cat?.icon} {cat?.name} &middot; {formatDate(item.date)}
                  </span>
                </div>
                <span className={`transaction-amount ${isIncome ? 'income-amount' : ''}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                </span>
                <button
                  className="btn-edit-recurring"
                  onClick={() => setEditingId(itemKey)}
                  title="Edit"
                >
                  &#9998;
                </button>
                {((isIncome && onDeleteIncome) || (!isIncome && onDeleteExpense)) && (
                  <button
                    className="btn-delete"
                    onClick={() => isIncome ? onDeleteIncome(item.id) : onDeleteExpense(item.id)}
                    title="Delete"
                  >
                    &times;
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
