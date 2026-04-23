import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';

const fmt = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function exportBudgetPDF({
  monthLabel, mode, budget, balance,
  totalIncome, totalSpent,
  expenses, income,
  expenseCategories, incomeCategories,
  spendingByCategory, incomeByCategory,
  goals,
}) {
  try {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = 48;

  // ── Palette ──
  const C = {
    bg:       [12, 12, 18],
    accent:   [124, 92, 252],
    white:    [240, 240, 245],
    muted:    [148, 144, 170],
    green:    [34, 197, 94],
    red:      [239, 68, 68],
    surface:  [24, 22, 42],
    border:   [255, 255, 255, 0.1],
  };

  // ── Background ──
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F');

  // ── Header bar ──
  doc.setFillColor(...C.accent);
  doc.roundedRect(margin, y - 12, contentW, 52, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...C.white);
  doc.text('Budget Report', margin + 16, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(monthLabel, pageW - margin - 16, y + 14, { align: 'right' });
  y += 62;

  // ── Summary cards ──
  const isBudgetMode = mode === 'budget';
  const netSpent = totalSpent - totalIncome;
  const remaining = isBudgetMode ? budget - netSpent : balance - netSpent;

  const summaryItems = [
    { label: isBudgetMode ? 'Monthly Budget' : 'Starting Balance', value: fmt(isBudgetMode ? budget : balance), color: C.white },
    { label: 'Total Income',   value: fmt(totalIncome),  color: C.green },
    { label: 'Total Expenses', value: fmt(totalSpent),   color: C.red },
    { label: isBudgetMode ? 'Remaining' : 'Current Balance', value: fmt(Math.abs(remaining)), color: remaining >= 0 ? C.green : C.red },
  ];

  const cardW = (contentW - 12) / 4;
  summaryItems.forEach((item, i) => {
    const cx = margin + i * (cardW + 4);
    doc.setFillColor(...C.surface);
    doc.roundedRect(cx, y, cardW, 54, 6, 6, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(item.label.toUpperCase(), cx + cardW / 2, y + 16, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...item.color);
    doc.text(item.value, cx + cardW / 2, y + 36, { align: 'center' });
  });
  y += 70;

  // ── Section helper ──
  const sectionTitle = (title) => {
    doc.setFillColor(...C.surface);
    doc.roundedRect(margin, y, contentW, 24, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...C.accent);
    doc.text(title, margin + 12, y + 15);
    y += 32;
  };

  // ── Spending by Category ──
  sectionTitle('SPENDING BY CATEGORY');

  const expCatRows = expenseCategories
    .filter(c => spendingByCategory.get(c.id) > 0)
    .sort((a, b) => (spendingByCategory.get(b.id) || 0) - (spendingByCategory.get(a.id) || 0))
    .map(c => {
      const spent = spendingByCategory.get(c.id) || 0;
      const pct = totalSpent > 0 ? ((spent / totalSpent) * 100).toFixed(1) + '%' : '0%';
      return [c.name, fmt(spent), pct];
    });

  if (expCatRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount', '% of Total']],
      body: expCatRows,
      margin: { left: margin, right: margin },
      styles: {
        fillColor: C.bg, textColor: C.white, fontSize: 9,
        cellPadding: 6, lineColor: [40, 38, 58], lineWidth: 0.5,
      },
      headStyles: { fillColor: [30, 28, 50], textColor: C.muted, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [18, 16, 32] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // ── Income by Category ──
  const incCatRows = incomeCategories
    .filter(c => incomeByCategory.get(c.id) > 0)
    .sort((a, b) => (incomeByCategory.get(b.id) || 0) - (incomeByCategory.get(a.id) || 0))
    .map(c => {
      const amt = incomeByCategory.get(c.id) || 0;
      const pct = totalIncome > 0 ? ((amt / totalIncome) * 100).toFixed(1) + '%' : '0%';
      return [c.name, fmt(amt), pct];
    });

  if (incCatRows.length > 0) {
    sectionTitle('INCOME BY CATEGORY');
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount', '% of Total']],
      body: incCatRows,
      margin: { left: margin, right: margin },
      styles: {
        fillColor: C.bg, textColor: C.white, fontSize: 9,
        cellPadding: 6, lineColor: [40, 38, 58], lineWidth: 0.5,
      },
      headStyles: { fillColor: [30, 28, 50], textColor: C.muted, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [18, 16, 32] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // ── Goals ──
  if (goals && goals.length > 0) {
    sectionTitle('SAVINGS GOALS');
    const goalRows = goals.map(g => {
      const saved = g.savedAmount || 0;
      const target = g.targetAmount || 0;
      const pct = target > 0 ? Math.min((saved / target) * 100, 100).toFixed(1) + '%' : '0%';
      return [g.name, fmt(saved), fmt(target), pct, g.period || ''];
    });
    autoTable(doc, {
      startY: y,
      head: [['Goal', 'Saved', 'Target', 'Progress', 'Period']],
      body: goalRows,
      margin: { left: margin, right: margin },
      styles: {
        fillColor: C.bg, textColor: C.white, fontSize: 9,
        cellPadding: 6, lineColor: [40, 38, 58], lineWidth: 0.5,
      },
      headStyles: { fillColor: [30, 28, 50], textColor: C.muted, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [18, 16, 32] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // ── Transaction History ──
  const expCatMap = new Map(expenseCategories.map(c => [c.id, c]));
  const incCatMap = new Map(incomeCategories.map(c => [c.id, c]));

  const allTxns = [
    ...expenses.map(e => ({ ...e, type: 'Expense' })),
    ...income.map(i => ({ ...i, type: 'Income' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allTxns.length > 0) {
    sectionTitle('TRANSACTION HISTORY');
    const txnRows = allTxns.map(t => {
      const cat = t.type === 'Income'
        ? incCatMap.get(t.categoryId)
        : expCatMap.get(t.categoryId);
      return [
        fmtDate(t.date),
        t.type,
        cat?.name || '',
        t.description || '',
        (t.type === 'Income' ? '+' : '-') + fmt(t.amount),
      ];
    });
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
      body: txnRows,
      margin: { left: margin, right: margin },
      styles: {
        fillColor: C.bg, textColor: C.white, fontSize: 8,
        cellPadding: 5, lineColor: [40, 38, 58], lineWidth: 0.5,
      },
      headStyles: { fillColor: [30, 28, 50], textColor: C.muted, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [18, 16, 32] },
      columnStyles: {
        0: { cellWidth: 72 },
        1: { cellWidth: 52 },
        4: { halign: 'right', cellWidth: 70 },
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const isIncome = data.row.raw[1] === 'Income';
          data.cell.styles.textColor = isIncome ? C.green : C.red;
        }
      },
    });
  }

  // ── Footer on every page ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(...C.surface);
    doc.rect(0, ph - 28, pageW, 28, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(`Generated by Lifestyle · ${monthLabel}`, margin, ph - 10);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, ph - 10, { align: 'right' });
  }

  const filename = `budget-${monthLabel.toLowerCase().replace(/\s/g, '-')}.pdf`;
  doc.save(filename);
  } catch (err) {
    console.error('exportBudgetPDF failed:', err);
    alert('Failed to generate PDF. Please try again.');
  }
}

async function fetchTransactions(userId, startDate, endDate) {
  const [expResult, incResult] = await Promise.all([
    supabase.from('expenses').select('*').eq('user_id', userId).gte('date', startDate).lt('date', endDate).order('date', { ascending: false }),
    supabase.from('income').select('*').eq('user_id', userId).gte('date', startDate).lt('date', endDate).order('date', { ascending: false }),
  ]);
  if (expResult.error) throw new Error(`Failed to fetch expenses: ${expResult.error.message}`);
  if (incResult.error) throw new Error(`Failed to fetch income: ${incResult.error.message}`);
  return {
    expenses: (expResult.data || []).map(e => ({ ...e, categoryId: e.category_id })),
    income: (incResult.data || []).map(i => ({ ...i, categoryId: i.category_id })),
  };
}

function buildCategoryMaps(expenses, income) {
  const spendingByCategory = new Map();
  for (const e of expenses) spendingByCategory.set(e.categoryId, (spendingByCategory.get(e.categoryId) || 0) + e.amount);
  const incomeByCategory = new Map();
  for (const i of income) incomeByCategory.set(i.categoryId, (incomeByCategory.get(i.categoryId) || 0) + i.amount);
  return { spendingByCategory, incomeByCategory };
}

export async function exportMonthPDF({
  userId, month, // 'YYYY-MM'
  expenseCategories, incomeCategories,
  goals,
}) {
  try {
    const [year, mon] = month.split('-').map(Number);
    const startDate = `${month}-01T00:00:00.000Z`;
    const endDate = new Date(year, mon, 1).toISOString();
    const { expenses, income } = await fetchTransactions(userId, startDate, endDate);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = income.reduce((s, i) => s + i.amount, 0);
    const { spendingByCategory, incomeByCategory } = buildCategoryMaps(expenses, income);
    const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    exportBudgetPDF({
      monthLabel, mode: 'tracker', budget: 0, balance: 0,
      totalIncome, totalSpent, expenses, income,
      expenseCategories, incomeCategories, spendingByCategory, incomeByCategory, goals,
    });
  } catch (err) {
    console.error('exportMonthPDF failed:', err);
    alert('Failed to generate PDF. Please try again.');
  }
}

export async function exportYTDPDF({
  userId, year,
  expenseCategories, incomeCategories,
  goals,
}) {
  try {
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year + 1}-01-01T00:00:00.000Z`;
    const { expenses, income } = await fetchTransactions(userId, startDate, endDate);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = income.reduce((s, i) => s + i.amount, 0);
    const { spendingByCategory, incomeByCategory } = buildCategoryMaps(expenses, income);
    exportBudgetPDF({
      monthLabel: `Year to Date ${year}`, mode: 'tracker', budget: 0, balance: 0,
      totalIncome, totalSpent, expenses, income,
      expenseCategories, incomeCategories, spendingByCategory, incomeByCategory, goals,
    });
  } catch (err) {
    console.error('exportYTDPDF failed:', err);
    alert('Failed to generate PDF. Please try again.');
  }
}
