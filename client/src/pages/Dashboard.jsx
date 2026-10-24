import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  CalendarDays,
  TrendingUp,
  Plus,
  X,
  Trash2,
  LoaderCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Repeat2,
} from "lucide-react";
import api from "../lib/api";

const pad = (value) => String(value).padStart(2, "0");

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value) {
  if (!value) return null;

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function formatTime(value) {
  if (!value) return "Time not set";

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function occursOn(event, date) {
  const start = parseDateKey(event.startDate);
  const end = parseDateKey(event.endDate);

  if (!start || date < start) return false;
  if (end && date > end) return false;

  switch (event.recurrence || "none") {
    case "none":
      return toDateKey(start) === toDateKey(date);

    case "daily":
      return true;

    case "weekly":
      return (event.weekdays || []).includes(date.getDay());

    case "monthly": {
      const requestedDay = Number(event.dayOfMonth || start.getDate());
      const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getDate();

      return date.getDate() === Math.min(requestedDay, lastDay);
    }

    default:
      return false;
  }
}

function getEventColor(color) {
  const colors = {
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    rose: "bg-rose-100 text-rose-800 border-rose-200",
    violet: "bg-violet-100 text-violet-800 border-violet-200",
  };

  return colors[color] || colors.indigo;
}

function Dashboard() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");

  const [error, setError] = useState("");
  const [calendarError, setCalendarError] = useState("");

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const todayKey = toDateKey(new Date());

  async function fetchTasks() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/tasks");
      setTasks(response.data.tasks || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your tasks. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvents() {
    setCalendarLoading(true);
    setCalendarError("");

    try {
      const response = await api.get("/calendar");
      setEvents(response.data.events || []);
    } catch (err) {
      setCalendarError(
        err.response?.data?.message ||
          "Unable to load calendar events. Check that the calendar API is registered.",
      );
    } finally {
      setCalendarLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
    fetchEvents();
  }, []);

  async function addTask(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please enter a task name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await api.post("/tasks", {
        title: trimmedTitle,
        category,
      });

      setTasks((currentTasks) => [response.data.task, ...currentTasks]);
      setTitle("");
      setCategory("Personal");
      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create the task. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    setUpdatingTaskId(task._id);
    setError("");

    try {
      const response = await api.patch(`/tasks/${task._id}`, {
        completed: !task.completed,
      });

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask._id === task._id ? response.data.task : currentTask,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the task. Please try again.",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function deleteTask(taskId) {
    setDeletingTaskId(taskId);
    setError("");

    try {
      await api.delete(`/tasks/${taskId}`);

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task._id !== taskId),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete the task. Please try again.",
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  const today = new Date();
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  const monthDays = useMemo(() => {
    const firstDay = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
    );

    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  const upcomingEvents = useMemo(() => {
    const results = [];

    for (let offset = 0; offset < 90; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      events.forEach((event) => {
        if (event.isActive !== false && occursOn(event, date)) {
          results.push({
            event,
            date,
            key: `${event._id}-${toDateKey(date)}`,
          });
        }
      });
    }

    return results
      .sort((a, b) => {
        const dateDifference = toDateKey(a.date).localeCompare(
          toDateKey(b.date),
        );

        return (
          dateDifference ||
          String(a.event.startTime || "").localeCompare(
            String(b.event.startTime || ""),
          )
        );
      })
      .slice(0, 5);
  }, [events, todayKey]);

  const selectedEvents = useMemo(
    () =>
      events
        .filter(
          (event) => event.isActive !== false && occursOn(event, selectedDate),
        )
        .sort((a, b) =>
          String(a.startTime || "").localeCompare(String(b.startTime || "")),
        ),
    [events, selectedDate],
  );

  const stats = [
    {
      label: "Tasks completed",
      value: completedCount,
      detail: "Completed tasks",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Tasks remaining",
      value: pendingCount,
      detail: "Still on your list",
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Upcoming events",
      value: upcomingEvents.length,
      detail: "Next scheduled occurrences",
      icon: CalendarDays,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Task progress",
      value: tasks.length
        ? `${Math.round((completedCount / tasks.length) * 100)}%`
        : "0%",
      detail: "Based on your task list",
      icon: TrendingUp,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Dashboard heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-brand-600">
            Your personal workspace
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Welcome back!
          </h2>
          <p className="mt-2 text-sm text-muted">
            Here&apos;s a snapshot of what&apos;s happening in your world.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/calendar")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-300 hover:text-brand-700"
          >
            <CalendarDays size={17} />
            Open calendar
            <ArrowUpRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Cancel" : "Add a task"}
          </button>
        </div>
      </section>

      {/* Task error */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchTasks}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-2 font-semibold hover:text-red-900 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Reload tasks
          </button>
        </div>
      )}

      {/* Add task form */}
      {showForm && (
        <form
          onSubmit={addTask}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
        >
          <h3 className="font-semibold text-ink">Create a task</h3>

          <label
            htmlFor="task-title"
            className="mt-4 block text-sm font-medium text-slate-700"
          >
            Task name
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
            <option>Personal</option>
            <option>Work</option>
            <option>Study</option>
          </select>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <LoaderCircle size={16} className="animate-spin" />}
            {saving ? "Saving..." : "Save task"}
          </button>
        </form>
      )}

      {/* Dashboard statistics */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon, color }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
            >
              <Icon size={21} />
            </div>
            <p className="mt-5 text-sm text-muted">{label}</p>
            <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{detail}</p>
          </article>
        ))}
      </section>

      {/* Tasks and upcoming events */}
      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">My tasks</h3>
              <p className="mt-1 text-sm text-muted">
                Update or remove tasks from your workspace.
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
              {pendingCount} left
            </span>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted">
                <LoaderCircle
                  size={20}
                  className="animate-spin text-brand-600"
                />
                Loading your tasks...
              </div>
            ) : (
              <>
                {tasks.map((task) => (
                  <div key={task._id} className="flex items-center gap-3 py-4">
                    <input
                      id={`task-${task._id}`}
                      type="checkbox"
                      checked={task.completed}
                      disabled={
                        updatingTaskId === task._id ||
                        deletingTaskId === task._id
                      }
                      onChange={() => toggleTask(task)}
                      aria-label={`Mark ${task.title} as ${
                        task.completed ? "incomplete" : "complete"
                      }`}
                      className="h-4 w-4 shrink-0 accent-indigo-600"
                    />

                    <label
                      htmlFor={`task-${task._id}`}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <p
                        className={`break-words text-sm font-medium ${
                          task.completed
                            ? "text-slate-400 line-through"
                            : "text-ink"
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">{task.category}</p>
                    </label>

                    {updatingTaskId === task._id && (
                      <LoaderCircle
                        size={17}
                        className="animate-spin text-brand-600"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => deleteTask(task._id)}
                      disabled={
                        deletingTaskId === task._id ||
                        updatingTaskId === task._id
                      }
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingTaskId === task._id ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                ))}

                {tasks.length === 0 && (
                  <div className="py-10 text-center">
                    <CheckCircle2
                      size={30}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 text-sm font-medium text-ink">
                      No tasks yet
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Add your first task to get started.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <CalendarDays size={22} className="text-brand-600" />
            <div>
              <h3 className="text-lg font-bold text-ink">Upcoming events</h3>
              <p className="text-sm text-muted">Your next scheduled routines</p>
            </div>
          </div>

          {calendarError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <p>{calendarError}</p>
              <button
                type="button"
                onClick={fetchEvents}
                className="mt-2 inline-flex items-center gap-2 font-semibold"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {calendarLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
                <LoaderCircle
                  size={18}
                  className="animate-spin text-brand-600"
                />
                Loading events...
              </div>
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map(({ event, date, key }) => (
                <button
                  type="button"
                  key={key}
                  title={event.description || event.title}
                  onClick={() => {
                    setSelectedDate(date);
                    setVisibleMonth(
                      new Date(date.getFullYear(), date.getMonth(), 1),
                    );
                  }}
                  className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-[48px] rounded-lg bg-slate-50 px-2 py-2 text-center">
                      <span className="block text-xs font-medium text-muted">
                        {date.toLocaleDateString(undefined, {
                          month: "short",
                        })}
                      </span>
                      <span className="block text-lg font-bold text-ink">
                        {date.getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {event.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatTime(event.startTime)}
                        {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getEventColor(event.color)}`}
                        >
                          {event.category || "Routine"}
                        </span>
                        {event.recurrence && event.recurrence !== "none" && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                            <Repeat2 size={12} />
                            {event.recurrence}
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-center">
                <CalendarDays size={28} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  Nothing scheduled yet
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Add a routine or event to your calendar to see it here.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/calendar")}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            Manage calendar
            <ArrowUpRight size={16} />
          </button>
        </article>
      </section>

      {/* Mini calendar and selected-day agenda */}
      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card xl:col-span-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-ink">Calendar overview</h3>
              <p className="mt-1 text-sm text-muted">
                Select a date to preview its schedule.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/calendar")}
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Full calendar
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth(
                  (month) =>
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                )
              }
              className="rounded-lg border border-slate-200 p-2 text-muted hover:bg-slate-50 hover:text-ink"
            >
              <ChevronLeft size={18} />
            </button>

            <h4 className="font-semibold text-ink">
              {visibleMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </h4>

            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth(
                  (month) =>
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                )
              }
              className="rounded-lg border border-slate-200 p-2 text-muted hover:bg-slate-50 hover:text-ink"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 text-xs font-semibold text-muted">
                {day}
              </div>
            ))}

            {monthDays.map((date) => {
              const key = toDateKey(date);
              const inMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = key === toDateKey(selectedDate);
              const isToday = key === todayKey;

              const eventsForDate = events.filter(
                (event) => event.isActive !== false && occursOn(event, date),
              );
              const hasEvents = eventsForDate.length > 0;

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedDate(date)}
                  title={
                    hasEvents
                      ? `${eventsForDate.length} scheduled event(s)`
                      : date.toLocaleDateString()
                  }
                  className={`relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-xl text-sm transition ${
                    isSelected
                      ? "bg-brand-600 font-semibold text-white"
                      : isToday
                        ? "border border-brand-300 bg-brand-50 font-semibold text-brand-700"
                        : inMonth
                          ? "text-ink hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {date.getDate()}
                  {hasEvents && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        isSelected ? "bg-white" : "bg-brand-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              Scheduled events
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full border border-brand-400 bg-brand-50" />
              Today
            </span>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <div>
            <p className="text-sm font-medium text-brand-600">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
              })}
            </p>
            <h3 className="mt-1 text-xl font-bold text-ink">
              {selectedDate.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Schedule for the selected date
            </p>
          </div>

          {calendarLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
              <LoaderCircle size={18} className="animate-spin text-brand-600" />
              Loading schedule...
            </div>
          ) : selectedEvents.length > 0 ? (
            <div className="mt-5 space-y-3">
              {selectedEvents.map((event) => (
                <div
                  key={event._id}
                  title={event.description || event.title}
                  className={`rounded-xl border p-3 ${getEventColor(event.color)}`}
                >
                  <div className="flex items-start gap-2">
                    <Clock3 size={15} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">
                        {event.title}
                      </p>
                      <p className="mt-1 text-xs">
                        {formatTime(event.startTime)}
                        {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
                      </p>
                      {event.description && (
                        <p className="mt-2 text-xs leading-5 opacity-90">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
              <CalendarDays size={25} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-ink">
                No events on this date
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Choose another date or add an event.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/calendar")}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-300 hover:text-brand-700"
          >
            <Plus size={16} />
            Add or edit routine
          </button>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
