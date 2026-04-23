import { useMemo, memo, useState, useRef } from 'react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(amount);

function DonutChart({ pieData, total, transactions }) {
  const [hoveredName, setHoveredName] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const clearTimer = useRef(null);

  if (pieData.length === 0) return null;

  const hoveredEntry = pieData.find(e => e.name === hoveredName);
  const catTransactions = hoveredEntry
    ? (transactions?.filter(t => t.categoryId === hoveredEntry.catId) || [])
    : [];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleSectorEnter = (data) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setHoveredName(data.name);
  };

  const handleSectorLeave = () => {
    clearTimer.current = setTimeout(() => setHoveredName(null), 80);
  };

  const handlePanelLeave = () => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setHoveredName(null);
  };

  return (
    <div className="donut-panel" style={{ position: 'relative' }} onMouseMove={handleMouseMove} onMouseLeave={handlePanelLeave}>
      <div className="donut-layout">
        <div className="donut-chart-wrap">
          <div className="donut-chart-container">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart onMouseLeave={handleSectorLeave}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={65}
                  paddingAngle={5}
                  cornerRadius={3}
                  stroke="none"
                  labelLine={false}
                  activeShape={(props) => <Sector {...props} outerRadius={props.outerRadius} innerRadius={props.innerRadius} />}
                  onMouseEnter={handleSectorEnter}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center-label">
              <span className="donut-center-amount">{formatCurrency(total)}</span>
              <span className="donut-center-text">Total</span>
            </div>
          </div>
        </div>

        <ul className="donut-legend">
          {pieData.map((entry, i) => (
            <li
              key={i}
              className="donut-legend-item"
              onMouseEnter={() => { if (clearTimer.current) clearTimeout(clearTimer.current); setHoveredName(entry.name); }}
              onMouseLeave={handleSectorLeave}
            >
              <span className="donut-legend-dot" style={{ background: entry.color }} />
              <span className="donut-legend-name">{entry.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {hoveredName && hoveredEntry && (
        <div
          className="category-tooltip"
          style={{ position: 'absolute', left: Math.max(4, mousePos.x - 234), top: Math.max(4, mousePos.y), width: 220 }}
        >
          <div className="category-tooltip-header">
            {hoveredEntry.name} — {formatCurrency(hoveredEntry.value)}
          </div>
          <ul className="category-tooltip-list">
            {catTransactions.map(t => (
              <li key={t.id} className="category-tooltip-item">
                <span className="category-tooltip-desc">{t.description}</span>
                <span className="category-tooltip-amt">{formatCurrency(t.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SpendingCharts({ expenses, income, expenseCategories, incomeCategories, totalSpent, totalIncome }) {
  const expCategoryMap = useMemo(() => {
    const map = new Map();
    for (const c of expenseCategories) map.set(c.id, c);
    return map;
  }, [expenseCategories]);

  const incCategoryMap = useMemo(() => {
    const map = new Map();
    for (const c of incomeCategories) map.set(c.id, c);
    return map;
  }, [incomeCategories]);

  const pieData = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
    }
    return Array.from(map.entries())
      .map(([catId, value]) => {
        const cat = expCategoryMap.get(catId);
        return {
          catId,
          name: cat?.name || catId,
          value,
          color: cat?.color || '#ccc',
          percent: totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, expCategoryMap, totalSpent]);

  const incomePieData = useMemo(() => {
    const map = new Map();
    for (const e of income) {
      map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
    }
    return Array.from(map.entries())
      .map(([catId, value]) => {
        const cat = incCategoryMap.get(catId);
        return {
          catId,
          name: cat?.name || catId,
          value,
          color: cat?.color || '#ccc',
          percent: totalIncome > 0 ? Math.round((value / totalIncome) * 100) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [income, incCategoryMap, totalIncome]);

  return (
    <div className="analytics-row">
      {pieData.length > 0 && (
        <div className="card chart-section-card">
          <h2>Spending Analytics</h2>
          <DonutChart pieData={pieData} total={totalSpent} transactions={expenses} />
        </div>
      )}
      {incomePieData.length > 0 && (
        <div className="card chart-section-card">
          <h2>Income Analytics</h2>
          <DonutChart pieData={incomePieData} total={totalIncome} transactions={income} />
        </div>
      )}
    </div>
  );
}

export default memo(SpendingCharts);
