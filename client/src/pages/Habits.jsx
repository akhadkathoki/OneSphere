
import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Flame,
  CheckCircle2,
  Circle,
  Trash2,
  RefreshCw,
  Target,
  CalendarDays,
  X,
  Trophy,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';

const CATEGORIES = [
  'Health',
  'Learning',
  'Fitness',
  'Productivity',
  'Personal',
  'Other',
];

const INITIAL_FORM = {
  name: '',
  description: '',
  category: 'Personal',
  frequency: 'daily',
};

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  'Something went wrong. Please try again.';

const getHabitsFromResponse = (response) => {
  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.habits)) return data.habits;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.habits)) return data.data.habits;

  return [];
};

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon size={21} />
        </div>
        <span className="text-sm font-medium text-muted">{description}</span>
      </div>

      <p className="mt-5 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-sm font-medium text-muted">{label}</p>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadHabits = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/habits');
      setHabits(getHabitsFromResponse(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Please enter a habit name.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/habits', {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        frequency: form.frequency,
      });

      setForm(INITIAL_FORM);
      setShowForm(false);
      setSuccess('Your new habit has been created.');

      await loadHabits();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleHabit = async (habit) => {
    setBusyId(habit._id);
    setError('');
    setSuccess('');

    try {
      const response = await api.patch(`/habits/${habit._id}/today`);

      if (response.data?.habit) {
        setHabits((previous) =>
          previous.map((item) =>
            item._id === habit._id ? response.data.habit : item
          )
        );
      } else {
        await loadHabits();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const deleteHabit = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this habit?'
    );

    if (!confirmed) return;

    setBusyId(id);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/habits/${id}`);

      setHabits((previous) =>
        previous.filter((habit) => habit._id !== id)
      );

      setSuccess('Habit deleted successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const completedCount = habits.filter(
    (habit) => habit.completedToday
  ).length;

  const completionRate = habits.length
    ? Math.round((completedCount / habits.length) * 100)
    : 0;

  const longestStreak = habits.reduce(
    (longest, habit) => Math.max(longest, habit.streak || 0),
    0
  );

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <div className="min-h-full space-y-7 bg-surface p-4 sm:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-700">
            <Sparkles size={16} />
            Personal growth
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Habit Tracker
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Build better routines, stay consistent, and turn small actions
            into lasting habits.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={loadHabits}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForm((previous) => !previous);
              setError('');
              setSuccess('');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Close form' : 'Add habit'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess('')}
            aria-label="Dismiss message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Target}
          label="Active habits"
          value={habits.length}
          description="Your routines"
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed today"
          value={`${completedCount}/${habits.length}`}
          description="Daily progress"
        />

        <StatCard
          icon={Flame}
          label="Longest current streak"
          value={`${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`}
          description="Keep going"
        />

        <StatCard
          icon={Trophy}
          label="Today's completion"
          value={`${completionRate}%`}
          description="Your progress"
        />
      </div>

      {/* Progress card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-ink">
              Today's progress
            </h2>
            <p className="mt-1 text-sm text-muted">
              {habits.length === 0
                ? 'Add a habit to start building your routine.'
                : completedCount === habits.length
                  ? 'Amazing! You have completed every habit.'
                  : `${habits.length - completedCount} ${
                      habits.length - completedCount === 1
                        ? 'habit remains'
                        : 'habits remain'
                    } for today.`}
            </p>
          </div>

          <p className="text-2xl font-bold text-brand-700">
            {completionRate}%
          </p>
        </div>

        <div
          className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Today's habit completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionRate}
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </section>

      {/* Create habit form */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-ink">
              Create a new habit
            </h2>
            <p className="mt-1 text-sm text-muted">
              Start with one small action you can repeat consistently.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Habit name">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="e.g. Read for 20 minutes"
                  maxLength={100}
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Category">
                <select
                  name="category"
                  value={form.category}
                  onChange={updateForm}
                  className={inputClass}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Description">
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  placeholder="Why is this habit important?"
                  maxLength={500}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Frequency">
                <select
                  name="frequency"
                  value={form.frequency}
                  onChange={updateForm}
                  className={inputClass}
                >
                  <option value="daily">Every day</option>
                  <option value="weekly">Weekly</option>
                </select>
              </FormField>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(INITIAL_FORM);
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={17} />
                {saving ? 'Creating...' : 'Create habit'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Habit list */}
      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">Your habits</h2>
            <p className="mt-1 text-sm text-muted">
              Check off each habit as you complete it.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink">
            {habits.length} {habits.length === 1 ? 'habit' : 'habits'}
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <RefreshCw size={28} className="animate-spin text-brand-600" />
            <p className="mt-4 font-semibold text-ink">
              Loading your habits...
            </p>
            <p className="mt-1 text-sm text-muted">
              Please wait a moment.
            </p>
          </div>
        ) : habits.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <CalendarDays size={30} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-ink">
              No habits yet
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
              Your journey starts with one small step. Create your first
              habit and begin tracking your consistency.
            </p>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Create your first habit
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {habits.map((habit) => {
              const completed = Boolean(habit.completedToday);
              const busy = busyId === habit._id;

              return (
                <article
                  key={habit._id}
                  className={`rounded-2xl border p-5 shadow-card transition ${
                    completed
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => toggleHabit(habit)}
                      disabled={busy}
                      aria-label={
                        completed
                          ? `Mark ${habit.name} incomplete`
                          : `Complete ${habit.name}`
                      }
                      className={`mt-1 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        completed
                          ? 'text-emerald-600'
                          : 'text-slate-400 hover:text-brand-600'
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 size={28} />
                      ) : (
                        <Circle size={28} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`break-words font-bold ${
                            completed
                              ? 'text-emerald-800'
                              : 'text-ink'
                          }`}
                        >
                          {habit.name}
                        </h3>

                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          {habit.category || 'Personal'}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-muted">
                        {habit.description || 'One step closer to your goals.'}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Flame
                            size={16}
                            className={
                              habit.streak > 0
                                ? 'text-orange-500'
                                : 'text-muted'
                            }
                          />
                          <span className="font-medium text-ink">
                            {habit.streak || 0}
                          </span>
                          {habit.streak === 1 ? 'day streak' : 'day streak'}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={15} />
                          {habit.frequency === 'weekly' ? 'Weekly' : 'Daily'}
                        </span>
                      </div>

                      {completed && (
                        <p className="mt-3 text-sm font-semibold text-emerald-700">
                          <CheckCircle2
                            size={15}
                            className="mr-1 inline"
                          />
                          Completed today
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteHabit(habit._id)}
                      disabled={busy}
                      aria-label={`Delete ${habit.name}`}
                      title="Delete habit"
                      className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
