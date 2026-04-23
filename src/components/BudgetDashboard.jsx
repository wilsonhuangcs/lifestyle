import { Suspense, lazy } from 'react';
import BudgetHeader from './BudgetHeader';
import { exportBudgetPDF, exportYTDPDF, exportMonthPDF } from '../utils/exportPDF';
import SpendingCalendar from './SpendingCalendar';
import CardManager from './CardManager';
import GoalCards from './GoalCards';
import AddTransaction from './AddTransaction';
import TransactionHistory from './TransactionHistory';
import RecurringManager from './RecurringManager';
import CategoryList from './CategoryList';

const SpendingCharts = lazy(() => import('./SpendingCharts'));

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

      {/* ── Lower section: 2-col grid, row 1 = cards|charts (same height), row 2 = recurring|categories ── */}
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
    </>
  );
}
