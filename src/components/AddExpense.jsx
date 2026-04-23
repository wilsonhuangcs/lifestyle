import { useState } from 'react';

export default function AddExpense({ categories, onAddExpense }) {
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!categoryId || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddExpense({
      categoryId,
      amount: parsedAmount,
      description: description.trim() || categories.find(c => c.id === categoryId).name,
    });

    setAmount('');
    setDescription('');
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="card add-expense">
      <h2>Add Expense</h2>
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
            step="0.01"
            min="0.01"
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
            placeholder="What was it for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-add">Add Expense</button>
      </form>
    </div>
  );
}
