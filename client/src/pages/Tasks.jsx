
import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  ListTodo,
  RefreshCw,
} from 'lucide-react';
import api from '../lib/api';

const categories = ['Personal', 'Work', 'Study'];

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [busyTaskId, setBusyTaskId] = useState(null);

  async function loadTasks() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not load tasks.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setTitle('');
    setCategory('Personal');
    setError('');
    setShowForm(true);
  }

  function openEditForm(task) {
    setEditingId(task._id);
    setTitle(task.title);
    setCategory(task.category);
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setCategory('Personal');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Enter a task title before saving.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        const response = await api.patch(`/tasks/${editingId}`, {
          title: trimmedTitle,
          category,
        });

        setTasks((current) =>
          current.map((task) =>
            task._id === editingId ? response.data.task : task
          )
        );
      } else {
        const response = await api.post('/tasks', {
          title: trimmedTitle,
          category,
        });

        setTasks((current) => [response.data.task, ...current]);
      }

      closeForm();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not save this task.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    setBusyTaskId(task._id);
    setError('');

    try {
      const response = await api.patch(`/tasks/${task._id}`, {
        completed: !task.completed,
      });

      setTasks((current) =>
        current.map((item) =>
          item._id === task._id ? response.data.task : item
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not update this task.'
      );
    } finally {
      setBusyTaskId(null);
    }
  }

  async function deleteTask(task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setBusyTaskId(task._id);
    setError('');

    try {
      await api.delete(`/tasks/${task._id}`);

      setTasks((current) =>
        current.filter((item) => item._id !== task._id)
      );

      if (editingId === task._id) {
        closeForm();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not delete this task.'
      );
    } finally {
      setBusyTaskId(null);
    }
  }

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === 'All' ||
        task.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Completed' && task.completed) ||
        (statusFilter === 'Pending' && !task.completed);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return sortBy === 'oldest'
        ? dateA - dateB
        : dateB - dateA;
    });

    return result;
  }, [tasks, search, categoryFilter, statusFilter, sortBy]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-brand-600">
            Stay organized
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            My tasks
          </h2>
          <p className="mt-2 text-sm text-muted">
            Manage your work, personal goals, and study plans.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus size={18} />
          New task
        </button>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={loadTasks}
            className="inline-flex items-center gap-2 font-semibold"
          >
            <RefreshCw size={15} />
            Reload tasks
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'All tasks', value: tasks.length },
          { label: 'Pending', value: pendingCount },
          { label: 'Completed', value: completedCount },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card"
          >
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-ink">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">
              {editingId ? 'Edit task' : 'Create a task'}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close task form"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <label
            htmlFor="task-title"
            className="mt-4 block text-sm font-medium text-slate-700"
          >
            Task title
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            maxLength={200}
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
          />

          <label
            htmlFor="task-category"
            className="mt-4 block text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id="task-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 sm:max-w-xs"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving && (
              <LoaderCircle size={16} className="animate-spin" />
            )}
            {saving
              ? 'Saving...'
              : editingId
                ? 'Save changes'
                : 'Create task'}
          </button>
        </form>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks by title..."
            aria-label="Search tasks"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="filter-category"
              className="mb-2 block text-xs font-medium text-muted"
            >
              Category
            </label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="All">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-status"
              className="mb-2 block text-xs font-medium text-muted"
            >
              Status
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="sort-tasks"
              className="mb-2 block text-xs font-medium text-muted"
            >
              Sort by
            </label>
            <select
              id="sort-tasks"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="font-semibold text-ink">
            Your task list
          </h3>
          <p className="text-xs text-muted">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted">
            <LoaderCircle
              size={20}
              className="animate-spin text-brand-600"
            />
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <ListTodo
              size={36}
              className="mx-auto text-slate-300"
            />
            <p className="mt-3 font-semibold text-ink">
              {tasks.length === 0
                ? 'No tasks yet'
                : 'No matching tasks'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {tasks.length === 0
                ? 'Create your first task to get started.'
                : 'Try changing your search or filters.'}
            </p>
            {tasks.length === 0 && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 font-semibold text-brand-600 hover:text-brand-700"
              >
                Create a task
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const busy = busyTaskId === task._id;

              return (
                <div
                  key={task._id}
                  className="flex items-center gap-3 py-4"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    disabled={busy}
                    aria-label={
                      task.completed
                        ? 'Mark task as pending'
                        : 'Mark task as completed'
                    }
                    className="shrink-0 text-brand-600 disabled:opacity-50"
                  >
                    {busy ? (
                      <LoaderCircle
                        size={21}
                        className="animate-spin"
                      />
                    ) : task.completed ? (
                      <CheckCircle2 size={21} />
                    ) : (
                      <Circle size={21} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`break-words text-sm font-medium ${
                        task.completed
                          ? 'text-slate-400 line-through'
                          : 'text-ink'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {task.category}
                      </span>
                      <span className="text-xs text-muted">
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditForm(task)}
                    disabled={busy}
                    aria-label={`Edit ${task.title}`}
                    title="Edit task"
                    className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task)}
                    disabled={busy}
                    aria-label={`Delete ${task.title}`}
                    title="Delete task"
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Tasks;
