
import { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Receipt,
  Target,
} from 'lucide-react';
import api from '../lib/api';

const expenseCategories = [
  'Food', 'Transport', 'Shopping', 'Housing', 'Utilities',
  'Healthcare', 'Education', 'Entertainment', 'Subscriptions',
  'Travel', 'Savings', 'Other',
];

const incomeCategories = [
  'Salary', 'Freelance', 'Business', 'Investments', 'Other',
];

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const currentMonth = () => today().slice(0, 7);

const money = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

const emptyTransaction = {
  title: '',
  type: 'expense',
  amount: '',
  category: 'Food',
  date: today(),
  paymentMethod: 'UPI',
  notes: '',
};

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function FinanceStat({ title, value, icon: Icon, color, subtitle }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {money(value)}
          </h2>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
    </Card>
  );
}

export default function Finance() {
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    net: 0,
    transactionCount: 0,
    totalBudget: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactionForm, setTransactionForm] = useState(emptyTransaction);
  const [budgetForm, setBudgetForm] = useState({
    category: 'Food',
    limitAmount: '',
  });
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadFinance = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryResponse, transactionsResponse] = await Promise.all([
        api.get('/finance/summary', { params: { month } }),
        api.get('/finance/transactions', { params: { month } }),
      ]);

      setSummary(summaryResponse.data.summary);
      setBudgets(summaryResponse.data.budgets || []);
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not load your finance data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  const updateTransactionField = (event) => {
    const { name, value } = event.target;

    setTransactionForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'type'
        ? { category: value === 'income' ? 'Salary' : 'Food' }
        : {}),
    }));
  };

  const addTransaction = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/finance/transactions', {
        ...transactionForm,
        amount: Number(transactionForm.amount),
        date: new Date(`${transactionForm.date}T12:00:00`).toISOString(),
      });

      setTransactionForm(emptyTransaction);
      setShowTransactionForm(false);
      await loadFinance();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not save the transaction.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;

    try {
      await api.delete(`/finance/transactions/${id}`);
      await loadFinance();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not delete the transaction.'
      );
    }
  };

  const addBudget = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/finance/budgets', {
        ...budgetForm,
        limitAmount: Number(budgetForm.limitAmount),
        month,
      });

      setBudgetForm({ category: 'Food', limitAmount: '' });
      setShowBudgetForm(false);
      await loadFinance();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not create the budget.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteBudget = async (id) => {
    if (!window.confirm('Delete this budget?')) return;

    try {
      await api.delete(`/finance/budgets/${id}`);
      await loadFinance();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not delete the budget.'
      );
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

  const buttonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <main className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            MONEY MANAGEMENT
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Finance
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track your money, manage spending, and plan your future.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Finance month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={loadFinance}
            disabled={loading}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            aria-label="Refresh finance data"
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowTransactionForm((value) => !value)}
            className={buttonClass}
          >
            <Plus size={18} /> Add transaction
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {showTransactionForm && (
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Add transaction
            </h2>
            <button
              type="button"
              onClick={() => setShowTransactionForm(false)}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={addTransaction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Transaction name
              <input
                className={inputClass}
                name="title"
                placeholder="e.g. Monthly salary"
                value={transactionForm.title}
                onChange={updateTransactionField}
                maxLength={120}
                required
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Type
              <select className={inputClass} name="type" value={transactionForm.type} onChange={updateTransactionField}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Amount (₹)
              <input
                className={inputClass}
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                max="1000000000"
                placeholder="0.00"
                value={transactionForm.amount}
                onChange={updateTransactionField}
                required
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Category
              <select className={inputClass} name="category" value={transactionForm.category} onChange={updateTransactionField}>
                {(transactionForm.type === 'income' ? incomeCategories : expenseCategories).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Date
              <input className={inputClass} type="date" name="date" value={transactionForm.date} onChange={updateTransactionField} required />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Payment method
              <select className={inputClass} name="paymentMethod" value={transactionForm.paymentMethod} onChange={updateTransactionField}>
                {['UPI', 'Cash', 'Card', 'Bank Transfer', 'Other'].map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
              Notes (optional)
              <textarea className={inputClass} name="notes" rows={2} maxLength={500} value={transactionForm.notes} onChange={updateTransactionField} placeholder="Additional details..." />
            </label>

            <div className="sm:col-span-2 lg:col-span-3">
              <button className={buttonClass} disabled={saving}>
                {saving ? 'Saving...' : 'Save transaction'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceStat
          title="Total income"
          value={summary.income}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          subtitle="Money received this month"
        />
        <FinanceStat
          title="Total expenses"
          value={summary.expenses}
          icon={TrendingDown}
          color="bg-rose-50 text-rose-600"
          subtitle="Money spent this month"
        />
        <FinanceStat
          title="Net cash flow"
          value={summary.net}
          icon={Wallet}
          color="bg-indigo-50 text-indigo-600"
          subtitle="Income minus expenses"
        />
        <FinanceStat
          title="Planned budget"
          value={summary.totalBudget}
          icon={PiggyBank}
          color="bg-amber-50 text-amber-600"
          subtitle="Combined monthly budget limits"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Monthly cash flow
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A quick view of money coming in and going out.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {summary.transactionCount} transactions
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <ArrowUpRight size={17} className="text-emerald-600" />
                  Income
                </span>
                <strong className="text-emerald-700">{money(summary.income)}</strong>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${summary.income + summary.expenses > 0 ? (summary.income / (summary.income + summary.expenses)) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <ArrowDownRight size={17} className="text-rose-600" />
                  Expenses
                </span>
                <strong className="text-rose-700">{money(summary.expenses)}</strong>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-rose-500" style={{ width: `${summary.income + summary.expenses > 0 ? (summary.expenses / (summary.income + summary.expenses)) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Net for this month</p>
            <p className={`mt-1 text-2xl font-bold ${summary.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {money(summary.net)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {summary.net >= 0
                ? 'Your recorded income exceeds your expenses.'
                : 'Your recorded expenses exceed your income.'}
            </p>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Target size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Budget health
              </h2>
              <p className="text-sm text-slate-500">
                Spending against your category limits.
              </p>
            </div>
          </div>

          {budgets.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-center">
              <PiggyBank className="mx-auto text-slate-400" size={28} />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No budgets yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Set limits to keep your spending on track.
              </p>
              <button className={`${buttonClass} mt-4`} onClick={() => setShowBudgetForm(true)}>
                <Plus size={16} /> Create budget
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {budgets.slice(0, 5).map((budget) => {
                const percent = Math.min(
                  100,
                  (budget.spent / budget.limitAmount) * 100
                );
                const over = budget.spent > budget.limitAmount;

                return (
                  <div key={budget._id}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{budget.category}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {money(budget.spent)} of {money(budget.limitAmount)}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${over ? 'text-rose-600' : 'text-slate-500'}`}>
                        {Math.round((budget.spent / budget.limitAmount) * 100)}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${over ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {over && (
                      <p className="mt-1 text-xs font-medium text-rose-600">
                        Over budget by {money(budget.spent - budget.limitAmount)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      {showBudgetForm && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Create monthly budget
            </h2>
            <button onClick={() => setShowBudgetForm(false)} className="text-sm text-slate-500">
              Cancel
            </button>
          </div>
          <form onSubmit={addBudget} className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Category
              <select className={inputClass} value={budgetForm.category} onChange={(event) => setBudgetForm({ ...budgetForm, category: event.target.value })}>
                {expenseCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Monthly limit (₹)
              <input className={inputClass} type="number" min="0.01" max="1000000000" step="0.01" required value={budgetForm.limitAmount} onChange={(event) => setBudgetForm({ ...budgetForm, limitAmount: event.target.value })} placeholder="e.g. 5000" />
            </label>
            <div className="flex items-end">
              <button className={buttonClass} disabled={saving}>
                {saving ? 'Saving...' : 'Save budget'}
              </button>
            </div>
          </form>
          <p className="mt-3 text-xs text-slate-500">
            Budget month: {month}. Only one budget per category is allowed for each month.
          </p>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Your finances
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review transactions and manage your spending limits.
            </p>
          </div>
          <button className={buttonClass} onClick={() => setShowBudgetForm((value) => !value)}>
            <Plus size={17} /> Add budget
          </button>
        </div>

        <div className="mt-5 flex gap-5 border-b border-slate-200">
          {[
            { id: 'transactions', label: 'Transactions' },
            { id: 'budgets', label: 'All budgets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 pb-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading finance data...
          </div>
        ) : activeTab === 'transactions' ? (
          transactions.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="mx-auto text-slate-300" size={35} />
              <p className="mt-3 font-semibold text-slate-700">
                No transactions for this month
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add your first income or expense to get started.
              </p>
            </div>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center gap-3 py-4">
                  <div className={`rounded-xl p-3 ${
                    transaction.type === 'income'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}>
                    {transaction.type === 'income'
                      ? <ArrowDownRight size={20} />
                      : <ArrowUpRight size={20} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {transaction.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {transaction.category} · {transaction.paymentMethod} ·{' '}
                      {new Date(transaction.date).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  <p className={`whitespace-nowrap text-sm font-bold ${
                    transaction.type === 'income'
                      ? 'text-emerald-700'
                      : 'text-slate-900'
                  }`}>
                    {transaction.type === 'income' ? '+' : '−'}
                    {money(transaction.amount)}
                  </p>

                  <button
                    onClick={() => deleteTransaction(transaction._id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${transaction.title}`}
                    title="Delete transaction"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : budgets.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No budgets set for this month.
          </div>
        ) : (
          <div className="mt-2 divide-y divide-slate-100">
            {budgets.map((budget) => (
              <div key={budget._id} className="flex items-center gap-3 py-4">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <PiggyBank size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{budget.category}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Spent {money(budget.spent)} · Remaining {money(budget.remaining)}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {money(budget.limitAmount)}
                </p>
                <button
                  onClick={() => deleteBudget(budget._id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Delete ${budget.category} budget`}
                  title="Delete budget"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
