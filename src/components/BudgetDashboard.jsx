import { Suspense, lazy, useState } from 'react';
import BudgetHeader from './BudgetHeader';
import { exportBudgetPDF, exportYTDPDF, exportMonthPDF } from '../utils/exportPDF';
import SpendingCalendar from './SpendingCalendar';
import CardManager from './CardManager';
import GoalCards from './GoalCards';
import AddTransaction from './AddTransaction';
import TransactionHistory from './TransactionHistory';
import RecurringManager from './RecurringManager';
import CategoryList from './CategoryList';
import MobileCardView from './mobile/MobileCardView';
import MobileTransactionHistory from './mobile/MobileTransactionHistory';
import MobileOverview from './mobile/MobileOverview';
import MobileGoalCards from './mobile/MobileGoalCards';

const SpendingCharts = lazy(() => import('./SpendingCharts'));

const MOBILE_TABS = [
  { id: 'overview',     icon: 'dashboard',      label: 'Overview'     },
  { id: 'transactions', icon: 'receipt_long',   label: 'Transactions' },
  { id: 'goals',        icon: 'flag',           label: 'Goals'        },
  { id: 'analytics',    icon: 'bar_chart',      label: 'Analytics'    },
  { id: 'cards',        icon: 'credit_card',    label: 'Cards'        },
];

export default function BudgetDashboard({
  mode, onSetMode, budget, onSetBudget, balance, onSetBalance,
  totalIncome, totalSpent, monthLabel, isCurrentMonth, onPrevMonth, onNextMonth,
  month,
  cards, onAddCard, onUpdateCard, onDeleteCard, profile,
  userId,
  expenses, income,
  onAddExpense, onUpdateExpense, onDeleteExpense,
  onAddIncome, onUpdateIncome, onDeleteIncome,
  expenseCategories, incomeCategories,
  spendingByCategory, incomeByCategory, effectiveBudget,
  onUpdateCategory, onDeleteCategory, onAddCategory,
  recurringItems, onAddRecurring, onUpdateRecurring, onToggleRecurring, onDeleteRecurring,
  goals, onAddGoal, onUpdateGoal, onDeleteGoal,
}) {
  const [mobileTab, setMobileTab] = useState('overview');
  const [showAddSheet, setShowAddSheet] = useState(false);

  const handleExportMonth = (month) => exportMonthPDF({
    userId,
    month,
    expenseCategories,
    incomeCategories,
    goals,
  });

  const handleExportYTD = () => exportYTDPDF({
    userId,
    year: new Date().getFullYear(),
    expenseCategories,
    incomeCategories,
    goals,
  });

  const handleExportPDF = () => exportBudgetPDF({
    monthLabel, mode, budget, balance,
    totalIncome, totalSpent,
    expenses, income,
    expenseCategories, incomeCategories,
    spendingByCategory, incomeByCategory,
    goals,
  });

  return (
    <>
      <BudgetHeader
        mode={mode} onSetMode={onSetMode}
        budget={budget} onSetBudget={onSetBudget}
        balance={balance} onSetBalance={onSetBalance}
        totalIncome={totalIncome} totalSpent={totalSpent}
        monthLabel={monthLabel} isCurrentMonth={isCurrentMonth}
        onPrevMonth={onPrevMonth} onNextMonth={onNextMonth}
      />

      {/* ── Mobile tab bar (hidden on desktop) ── */}
      <div className="budget-mobile-tabs">
        {MOBILE_TABS.map(tab => (
          <button
            key={tab.id}
            className={`budget-mobile-tab ${mobileTab === tab.id ? 'active' : ''}`}
            onClick={() => setMobileTab(tab.id)}
          >
            <span className="material-icons">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Mobile tab content (hidden on desktop) ── */}
      <div className="budget-mobile-content">
        {mobileTab === 'overview' && (
          <MobileOverview
            mode={mode}
            budget={budget}
            balance={balance}
            totalSpent={totalSpent}
            totalIncome={totalIncome}
            expenses={expenses}
            income={income}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            month={month}
            onSetBudget={onSetBudget}
            onSetBalance={onSetBalance}
            onGoToTransactions={() => setMobileTab('transactions')}
            effectiveBudget={effectiveBudget}
            userId={userId}
          />
        )}

        {mobileTab === 'transactions' && (
          <>
            <MobileTransactionHistory
              expenses={expenses}
              income={income}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onDeleteExpense={onDeleteExpense}
              onDeleteIncome={onDeleteIncome}
              onExportPDF={handleExportPDF}
            />
          </>
        )}

        {mobileTab === 'goals' && (
          <MobileGoalCards
            goals={goals}
            onAddGoal={onAddGoal}
            onUpdateGoal={onUpdateGoal}
            onDeleteGoal={onDeleteGoal}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            expenses={expenses}
            income={income}
            month={month}
          />
        )}

        {mobileTab === 'analytics' && (
          <>
            <Suspense fallback={null}>
              <SpendingCharts
                expenses={expenses}
                income={income}
                expenseCategories={expenseCategories}
                incomeCategories={incomeCategories}
                totalSpent={totalSpent}
                totalIncome={totalIncome}
                transactions={expenses}
                incomeTransactions={income}
              />
            </Suspense>
            <div className="analytics-row">
              <CategoryList
                title="Spending by Category"
                categories={expenseCategories}
                spendingByCategory={spendingByCategory}
                transactions={expenses}
                budget={effectiveBudget}
                onUpdate={onUpdateCategory}
                onDelete={onDeleteCategory}
                onAdd={(cat) => onAddCategory('expense', cat)}
              />
              <CategoryList
                title="Income by Category"
                categories={incomeCategories}
                spendingByCategory={incomeByCategory}
                transactions={income}
                budget={totalIncome || 1}
                onUpdate={onUpdateCategory}
                onDelete={onDeleteCategory}
                onAdd={(cat) => onAddCategory('income', cat)}
              />
            </div>
            {isCurrentMonth && (
              <RecurringManager
                recurring={recurringItems}
                expenseCategories={expenseCategories}
                incomeCategories={incomeCategories}
                onAdd={onAddRecurring}
                onUpdate={onUpdateRecurring}
                onToggle={onToggleRecurring}
                onDelete={onDeleteRecurring}
                onUpdateCategory={onUpdateCategory}
              />
            )}
          </>
        )}

        {mobileTab === 'cards' && (
          <MobileCardView
            cards={cards}
            expenses={expenses}
            expenseCategories={expenseCategories}
            profile={profile}
            onAddCard={onAddCard}
            onDeleteCard={onDeleteCard}
          />
        )}
      </div>

      {/* ── Mobile FAB ── */}
      <button className="budget-fab" onClick={() => setShowAddSheet(true)}>
        <span className="material-icons">add</span>
        <span>Add Transaction</span>
      </button>

      {/* ── Add Transaction bottom sheet ── */}
      {showAddSheet && (
        <div className="budget-sheet-overlay" onClick={() => setShowAddSheet(false)}>
          <div className="budget-sheet" onClick={e => e.stopPropagation()}>
            <div className="budget-sheet-handle" />
            <div className="budget-sheet-header">
              <span className="budget-sheet-title">Add Transaction</span>
              <button className="budget-sheet-close" onClick={() => setShowAddSheet(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <AddTransaction
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onAddExpense={(e) => { onAddExpense(e); setShowAddSheet(false); }}
              onAddIncome={(i) => { onAddIncome(i); setShowAddSheet(false); }}
              cards={cards}
            />
          </div>
        </div>
      )}

      {/* ── Desktop layout (hidden on mobile) ── */}
      <div className="budget-desktop-only">
        {/* ── Top paired row: calendar+add aligns with goals+history ── */}
        <div className="budget-top-pair">
          <div className="card calendar-add-container">
            <SpendingCalendar
              expenses={expenses}
              income={income}
              effectiveBudget={effectiveBudget}
              month={month}
              expenseCategories={expenseCategories}
              userId={userId}
            />
            <div className="calendar-add-divider" />
            <AddTransaction
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onAddExpense={onAddExpense}
              onAddIncome={onAddIncome}
              cards={cards}
            />
          </div>
          <div className="budget-top-right">
            <GoalCards
              goals={goals}
              onAddGoal={onAddGoal}
              onUpdateGoal={onUpdateGoal}
              onDeleteGoal={onDeleteGoal}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              expenses={expenses}
              income={income}
              userId={userId}
              month={month}
            />
            <TransactionHistory
              expenses={expenses}
              income={income}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onUpdateExpense={onUpdateExpense}
              onUpdateIncome={onUpdateIncome}
              onDeleteExpense={onDeleteExpense}
              onDeleteIncome={onDeleteIncome}
              cards={cards}
              onExportPDF={handleExportPDF}
              onExportYTD={handleExportYTD}
              onExportMonth={handleExportMonth}
            />
          </div>
        </div>

        {/* ── Lower section: 2-col grid ── */}
        <div className="budget-lower-grid">
          <CardManager
            cards={cards}
            expenses={expenses}
            onAddCard={onAddCard}
            onDeleteCard={onDeleteCard}
            profile={profile}
          />
          <Suspense fallback={null}>
            <SpendingCharts
              expenses={expenses}
              income={income}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              totalSpent={totalSpent}
              totalIncome={totalIncome}
              transactions={expenses}
              incomeTransactions={income}
            />
          </Suspense>
          {isCurrentMonth && (
            <RecurringManager
              recurring={recurringItems}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onAdd={onAddRecurring}
              onUpdate={onUpdateRecurring}
              onToggle={onToggleRecurring}
              onDelete={onDeleteRecurring}
              onUpdateCategory={onUpdateCategory}
            />
          )}
          <div className="analytics-row budget-lower-categories">
            <CategoryList
              title="Spending by Category"
              categories={expenseCategories}
              spendingByCategory={spendingByCategory}
              transactions={expenses}
              budget={effectiveBudget}
              onUpdate={onUpdateCategory}
              onDelete={onDeleteCategory}
              onAdd={(cat) => onAddCategory('expense', cat)}
            />
            <CategoryList
              title="Income by Category"
              categories={incomeCategories}
              spendingByCategory={incomeByCategory}
              transactions={income}
              budget={totalIncome || 1}
              onUpdate={onUpdateCategory}
              onDelete={onDeleteCategory}
              onAdd={(cat) => onAddCategory('income', cat)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
