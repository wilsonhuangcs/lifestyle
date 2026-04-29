import { useState } from 'react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(amount);

const PRESET_COLORS = [
  '#FF6B6B', '#e74c3c', '#E91E63', '#FF6F00',
  '#F0B27A', '#F7DC6F', '#FFEAA7', '#2ecc71',
  '#27ae60', '#00b894', '#4ECDC4', '#1abc9c',
  '#45B7D1', '#3498db', '#2980b9', '#BB8FCE',
  '#9b59b6', '#DDA0DD', '#8e44ad', '#1a1a2e',
  '#555555', '#95a5a6', '#B0BEC5', '#34495e',
];

const PRESET_ICONS = [
  '🍔', '🍕', '☕', '🛒', '📱', '💻', '🎮', '🚗',
  '🏠', '🎬', '🏥', '💡', '💰', '🚌', '🛍️', '📦',
  '💼', '📈', '🏘️', '🛠️', '🎁', '🔄', '💵', '✈️',
  '🎵', '📚', '👕', '💪', '🐾', '🍷', '💇', '🎓',
];

export default function CategoryList({
  title,
  categories,
  spendingByCategory,
  budget,
  onUpdate,
  onDelete,
  onAdd,
}) {
  const [editing, setEditing] = useState(false);
  const [colorPickerId, setColorPickerId] = useState(null);
  const [iconPickerId, setIconPickerId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#4ECDC4');
  const [newIcon, setNewIcon] = useState('');
  const [addError, setAddError] = useState('');

  const handleRenameStart = (cat) => {
    setRenamingId(cat.id);
    setRenameValue(cat.name);
    setRenameError('');
    setColorPickerId(null);
  };

  const handleRenameSubmit = async (id) => {
    if (renameValue.trim()) {
      const result = await onUpdate(id, { name: renameValue.trim() });
      if (result?.error) { setRenameError(result.error); return; }
    }
    setRenamingId(null);
    setRenameError('');
  };

  const handleColorPick = (id, color) => {
    onUpdate(id, { color });
    setColorPickerId(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const result = await onAdd({ name: newName.trim(), color: newColor, icon: newIcon.trim() });
    if (result?.error) { setAddError(result.error); return; }
    setNewName('');
    setNewColor('#4ECDC4');
    setNewIcon('');
    setAddError('');
    setShowAddForm(false);
  };

  return (
    <div className="card category-list">
      <div className="recurring-header">
        <h2>{title || 'Spending by Category'}</h2>
        <button
          className="btn-add-recurring"
          onClick={() => { setEditing(!editing); setColorPickerId(null); setRenamingId(null); setShowAddForm(false); }}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {!editing && budget === 0 && (
        <p className="empty-message">Set your budget to see progress bars.</p>
      )}

      {!editing && [...categories].filter(c => (spendingByCategory?.get(c.id) || 0) > 0).length === 0 && (
        <p className="empty-message">No transactions yet.</p>
      )}

      <div className="categories">
        {(editing ? categories : [...categories]
          .filter(c => (spendingByCategory?.get(c.id) || 0) > 0)
          .sort((a, b) => (spendingByCategory?.get(b.id) || 0) - (spendingByCategory?.get(a.id) || 0))
        ).map((cat) => {
          const spent = spendingByCategory ? (spendingByCategory.get(cat.id) || 0) : 0;
          const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

          return (
            <div key={cat.id} className="category-row">
              <div className="category-info">
                {editing ? (
                  <span
                    className="color-swatch-sm"
                    style={{ backgroundColor: cat.color }}
                    onClick={() => setColorPickerId(colorPickerId === cat.id ? null : cat.id)}
                  />
                ) : (
                  <span className="category-dot" style={{ backgroundColor: cat.color }} />
                )}
                {editing ? (
                  <span
                    className="icon-picker-trigger"
                    onClick={() => { setIconPickerId(iconPickerId === cat.id ? null : cat.id); setColorPickerId(null); }}
                    title="Change icon"
                  >
                    {cat.icon || '➕'}
                  </span>
                ) : (
                  cat.icon && <span className="category-icon">{cat.icon}</span>
                )}
                {editing && renamingId === cat.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <input
                      className="rename-input"
                      value={renameValue}
                      onChange={(e) => { setRenameValue(e.target.value); setRenameError(''); }}
                      onBlur={() => handleRenameSubmit(cat.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(cat.id)}
                      autoFocus
                    />
                    {renameError && <span className="cat-name-error">{renameError}</span>}
                  </div>
                ) : (
                  <span
                    className={`category-name ${editing ? 'editable' : ''}`}
                    onClick={() => editing && handleRenameStart(cat)}
                  >
                    {cat.name}
                  </span>
                )}
                {!editing && (
                  <span className="category-amount">
                    {formatCurrency(spent)}
                  </span>
                )}
                {editing && (
                  <button className="btn-delete" onClick={() => onDelete(cat.id)} title="Remove">
                    &times;
                  </button>
                )}
              </div>

              {editing && iconPickerId === cat.id && (
                <div className="icon-picker-inline">
                  <div className="icon-presets">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        className={`icon-preset ${icon === cat.icon ? 'active' : ''}`}
                        onClick={() => { onUpdate(cat.id, { icon }); setIconPickerId(null); }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className="color-custom-row">
                    <input
                      className="emoji-input"
                      value={cat.icon || ''}
                      onChange={(e) => {
                        const first = [...e.target.value][0] ?? '';
                        onUpdate(cat.id, { icon: first });
                      }}
                      placeholder="Type emoji"
                    />
                    <span className="color-custom-label">Custom emoji</span>
                  </div>
                </div>
              )}

              {editing && colorPickerId === cat.id && (
                <div className="color-picker-inline">
                  <div className="color-presets">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`color-preset ${c === cat.color ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => handleColorPick(cat.id, c)}
                      />
                    ))}
                  </div>
                  <div className="color-custom-row">
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => handleColorPick(cat.id, e.target.value)}
                      className="color-input-native"
                    />
                    <span className="color-custom-label">Custom color</span>
                  </div>
                </div>
              )}

              {!editing && (
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="add-category-section">
          {showAddForm ? (
            <form onSubmit={handleAdd} className="add-category-form">
              <span
                className="color-swatch-sm"
                style={{ backgroundColor: newColor }}
                onClick={() => setColorPickerId(colorPickerId === '__new' ? null : '__new')}
              />
              <span
                className="icon-picker-trigger"
                onClick={() => setIconPickerId(iconPickerId === '__new' ? null : '__new')}
                title="Pick icon"
              >
                {newIcon || '➕'}
              </span>
              <input
                className="rename-input flex-1"
                placeholder="Category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-save-cat">Add</button>
              <button type="button" className="btn-delete" onClick={() => { setShowAddForm(false); setAddError(''); }}>&times;</button>
              {addError && <span className="cat-name-error full-width">{addError}</span>}
              {iconPickerId === '__new' && (
                <div className="icon-picker-inline full-width">
                  <div className="icon-presets">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-preset ${icon === newIcon ? 'active' : ''}`}
                        onClick={() => { setNewIcon(icon); setIconPickerId(null); }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className="color-custom-row">
                    <input
                      className="emoji-input"
                      value={newIcon}
                      onChange={(e) => setNewIcon([...e.target.value][0] ?? '')}
                      placeholder="Type emoji"
                    />
                    <span className="color-custom-label">Custom emoji</span>
                  </div>
                </div>
              )}
              {colorPickerId === '__new' && (
                <div className="color-picker-inline full-width">
                  <div className="color-presets">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`color-preset ${c === newColor ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => { setNewColor(c); setColorPickerId(null); }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <button className="btn-add-category" onClick={() => setShowAddForm(true)}>
              + Add Category
            </button>
          )}
        </div>
      )}
    </div>
  );
}
