import { useState } from 'react';
import DatePicker from './DatePicker';
import { formatDateForStorage } from '../shared/utils';

export default function AddTransaction({ expenseCategories, incomeCategories, onAddExpense, onAddIncome, cards = [] }) {
  const [tab, setTab] = useState('expense');
  const categories = tab === 'expense' ? expenseCategories : incomeCategories;
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cardId, setCardId] = useState(null);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    const newCategories = newTab === 'expense' ? expenseCategories : incomeCategories;
    setCategoryId(newCategories[0].id);
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCardId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!categoryId || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const payload = {
      categoryId,
      amount: parsedAmount,
      description: description.trim() || categories.find(c => c.id === categoryId).name,
      date: formatDateForStorage(date),
    };

    if (tab === 'expense') {
      onAddExpense({ ...payload, cardId: cardId || undefined });
    } else {
      onAddIncome(payload);
    }

    setAmount('');
    setDescription('');
    setCardId(null);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const isIncome = tab === 'income';

  return (
    <div className="add-expense">
      <div className="tab-bar">
        <button
          className={`tab-btn ${!isIncome ? 'active' : ''}`}
          onClick={() => handleTabChange('expense')}
        >
          Expense
        </button>
        <button
          className={`tab-btn tab-income ${isIncome ? 'active' : ''}`}
          onClick={() => handleTabChange('income')}
        >
          Income
        </button>
      </div>
      <form onSubmit={handleSubmit}>
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
          <label>Amount</label>
          <input
            type="number"
            min="0.01"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            placeholder={isIncome ? 'Where did it come from?' : 'What was it for?'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {!isIncome && cards.length > 0 && (
          <div className="form-group">
            <label>Card (optional)</label>
            <div className="select-wrapper">
              <select value={cardId || ''} onChange={(e) => setCardId(e.target.value || null)}>
                <option value="">No card</option>
                {cards.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ••{c.lastFour}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="form-group">
          <label>Date</label>
          <DatePicker value={date} onChange={setDate} />
        </div>
        <button type="submit" className={`btn-add ${isIncome ? 'btn-income' : ''}`}>
          {isIncome ? 'Add Income' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}
