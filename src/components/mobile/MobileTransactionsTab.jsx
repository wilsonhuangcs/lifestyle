import { useState } from 'react';
import MobileTransactionHistory from './MobileTransactionHistory';
import MobileRecurringList from './MobileRecurringList';

export default function MobileTransactionsTab({
  expenses,
  income,
  expenseCategories,
  incomeCategories,
  onDeleteExpense,
  onDeleteIncome,
  onExportPDF,
  recurringItems,
  onAddRecurring,
  darkMode,
}) {
  const [subTab, setSubTab] = useState('transactions');

  const D = darkMode ? {
    border:     'rgba(255,255,255,0.10)',
    text:       '#E8E8E8',
    dim:        'rgba(232,232,232,0.55)',
    segBg:      'rgba(0,0,0,0.25)',
    segActive:  '#22221F',
  } : {
    border:     'rgba(0,0,0,0.09)',
    text:       '#1e2038',
    dim:        'rgba(30,32,56,0.55)',
    segBg:      'rgba(0,0,0,0.05)',
    segActive:  '#FFFFFF',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 2px' }}>
      <div style={{
        display: 'flex', padding: 3, gap: 2,
        background: D.segBg,
        border: `1px solid ${D.border}`,
        borderRadius: 10,
      }}>
        {[
          { value: 'transactions', label: 'Transactions' },
          { value: 'recurring',    label: 'Recurring' },
        ].map(opt => {
          const active = opt.value === subTab;
          return (
            <button key={opt.value} onClick={() => setSubTab(opt.value)} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: 0,
              background: active ? D.segActive : 'transparent',
              color: active ? D.text : D.dim,
              fontSize: 13, fontWeight: active ? 600 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {opt.label}
            </button>
          );
        })}
      </div>

      {subTab === 'transactions' && (
        <MobileTransactionHistory
          expenses={expenses}
          income={income}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          onDeleteExpense={onDeleteExpense}
          onDeleteIncome={onDeleteIncome}
          onExportPDF={onExportPDF}
        />
      )}

      {subTab === 'recurring' && (
        <MobileRecurringList
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          recurringItems={recurringItems}
          onAddRecurring={onAddRecurring}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
