
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  X,
  Trash2,
  RefreshCw,
  Repeat2,
  MapPin,
  AlignLeft,
  Pencil,
} from 'lucide-react';
import api from '../lib/api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CATEGORIES = [
  'Routine',
  'Work',
  'Study',
  'Health',
  'Personal',
  'Other',
];

const COLORS = {
  indigo: 'border-indigo-500 bg-indigo-100 text-indigo-950',
  blue: 'border-blue-500 bg-blue-100 text-blue-950',
  emerald: 'border-emerald-500 bg-emerald-100 text-emerald-950',
  amber: 'border-amber-500 bg-amber-100 text-amber-950',
  rose: 'border-rose-500 bg-rose-100 text-rose-950',
  violet: 'border-violet-500 bg-violet-100 text-violet-950',
};

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'Routine',
  startDate: dateKey(new Date()),
  endDate: '',
  startTime: '09:00',
  endTime: '10:00',
  recurrence: 'none',
  weekdays: [],
  dayOfMonth: String(new Date().getDate()),
  color: 'indigo',
};

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date) {
  return addDays(date, -date.getDay());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

function formatDate(date, options = {}) {
  return date.toLocaleDateString('en-US', options);
}

function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getEventsFromResponse(response) {
  if (Array.isArray(response.data?.events)) return response.data.events;
  if (Array.isArray(response.data)) return response.data;
  return [];
}

function occursOn(event, date) {
  const key = dateKey(date);

  if (key < event.startDate) return false;
  if (event.endDate && key > event.endDate) return false;

  switch (event.recurrence) {
    case 'daily':
      return true;

    case 'weekly':
      return (event.weekdays || []).includes(date.getDay());

    case 'monthly': {
      const targetDay = Number(event.dayOfMonth);
      const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      // A date such as the 31st falls on the last day of shorter months.
      return date.getDate() === Math.min(targetDay, lastDay);
    }

    default:
      return key === event.startDate;
  }
}

function recurrenceLabel(event) {
  if (event.recurrence === 'daily') return 'Every day';

  if (event.recurrence === 'weekly') {
    return `Weekly · ${(event.weekdays || [])
      .slice()
      .sort((a, b) => a - b)
      .map((day) => DAY_NAMES[day])
      .join(', ')}`;
  }

  if (event.recurrence === 'monthly') {
    return `Monthly · Day ${event.dayOfMonth}`;
  }

  return 'Does not repeat';
}

function getTooltip(event, date) {
  return [
    event.title,
    event.description || 'No description added.',
    `${formatDate(date, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`,
    `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`,
    event.category,
    recurrenceLabel(event),
  ].join('\n');
}

function EventChip({ event, date, onClick, compact = false }) {
  const color = COLORS[event.color] || COLORS.indigo;

  return (
    <div className="group relative min-w-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(event);
        }}
        title={getTooltip(event, date)}
        className={`block w-full truncate rounded-md border-l-4 px-2 py-1 text-left text-xs font-semibold transition hover:brightness-95 ${color}`}
      >
        {!compact && (
          <span className="mr-1 font-medium">
            {formatTime(event.startTime)}
          </span>
        )}
        {event.title}
      </button>

      {/* Detailed hover card */}
      <div className="pointer-events-none absolute left-2 top-full z-50 hidden w-64 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl group-hover:block">
        <p className="break-words font-bold text-ink">{event.title}</p>

        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted">
          {event.description || 'No description added.'}
        </p>

        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs text-ink">
          <p className="flex items-center gap-2">
            <Clock3 size={14} className="shrink-0 text-brand-600" />
            {formatTime(event.startTime)} – {formatTime(event.endTime)}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays size={14} className="shrink-0 text-brand-600" />
            {formatDate(date, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="flex items-center gap-2">
            <Repeat2 size={14} className="shrink-0 text-brand-600" />
            {recurrenceLabel(event)}
          </p>
          <p className="text-muted">{event.category}</p>
        </div>
      </div>
    </div>
  );
}

function ScheduleForm({
  form,
  setForm,
  editingId,
  saving,
  onSubmit,
  onCancel,
}) {
  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  const update = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const toggleWeekday = (day) => {
    setForm((previous) => ({
      ...previous,
      weekdays: previous.weekdays.includes(day)
        ? previous.weekdays.filter((item) => item !== day)
        : [...previous.weekdays, day],
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">
            {editingId ? 'Edit schedule' : 'Add a schedule'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Plan an appointment, task, or recurring routine.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close schedule form"
          className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <label className="block text-sm font-semibold text-ink">
        Title *
        <input
          name="title"
          value={form.title}
          onChange={update}
          required
          maxLength={120}
          placeholder="e.g. Morning workout"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-semibold text-ink">
        Description
        <textarea
          name="description"
          value={form.description}
          onChange={update}
          maxLength={2000}
          rows={3}
          placeholder="What will you do during this time?"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink">
          Category
          <select
            name="category"
            value={form.category}
            onChange={update}
            className={inputClass}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-ink">
          Event color
          <select
            name="color"
            value={form.color}
            onChange={update}
            className={inputClass}
          >
            {Object.keys(COLORS).map((color) => (
              <option key={color} value={color}>
                {color[0].toUpperCase() + color.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-ink">
          Start date *
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={update}
            required
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-semibold text-ink">
          Repeat until
          <input
            type="date"
            name="endDate"
            value={form.endDate || ''}
            min={form.startDate}
            onChange={update}
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-muted">
            Leave blank for no end date.
          </span>
        </label>

        <label className="block text-sm font-semibold text-ink">
          Start time *
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={update}
            required
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-semibold text-ink">
          End time *
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={update}
            required
            className={inputClass}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-ink">
        Repeat
        <select
          name="recurrence"
          value={form.recurrence}
          onChange={update}
          className={inputClass}
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Every day</option>
          <option value="weekly">Every week</option>
          <option value="monthly">Every month</option>
        </select>
      </label>

      {form.recurrence === 'weekly' && (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">
            Repeat on *
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAY_NAMES.map((day, index) => (
              <button
                type="button"
                key={day}
                onClick={() => toggleWeekday(index)}
                aria-pressed={form.weekdays.includes(index)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  form.weekdays.includes(index)
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-ink hover:bg-slate-50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {form.recurrence === 'monthly' && (
        <label className="block text-sm font-semibold text-ink">
          Day of month *
          <select
            name="dayOfMonth"
            value={form.dayOfMonth}
            onChange={update}
            className={inputClass}
          >
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create schedule'}
        </button>
      </div>
    </form>
  );
}

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/calendar');
      setEvents(getEventsFromResponse(response));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not load calendar schedules. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const visibleDates = useMemo(() => {
    if (view === 'day') return [selectedDate];

    if (view === 'week') {
      const first = startOfWeek(selectedDate);
      return Array.from({ length: 7 }, (_, i) => addDays(first, i));
    }

    const first = startOfWeek(startOfMonth(selectedDate));
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
  }, [selectedDate, view]);

  const eventsOnDate = useCallback(
    (date) =>
      events
        .filter((event) => occursOn(event, date))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events]
  );

  const openCreate = (date = selectedDate) => {
    setEditingId(null);
    setForm({
      ...INITIAL_FORM,
      startDate: dateKey(date),
      dayOfMonth: String(date.getDate()),
    });
    setError('');
    setNotice('');
    setShowForm(true);
  };

  const openEdit = (event) => {
    setEditingId(event._id);
    setForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'Routine',
      startDate: event.startDate,
      endDate: event.endDate || '',
      startTime: event.startTime,
      endTime: event.endTime,
      recurrence: event.recurrence || 'none',
      weekdays: event.weekdays || [],
      dayOfMonth: String(event.dayOfMonth || 1),
      color: event.color || 'indigo',
    });
    setError('');
    setNotice('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const saveEvent = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (form.endTime <= form.startTime) {
      setError('End time must be later than start time.');
      return;
    }

    if (form.endDate && form.endDate < form.startDate) {
      setError('Repeat-until date cannot be before the start date.');
      return;
    }

    if (form.recurrence === 'weekly' && form.weekdays.length === 0) {
      setError('Select at least one weekday for a weekly routine.');
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      endDate: form.endDate || null,
      dayOfMonth:
        form.recurrence === 'monthly' ? Number(form.dayOfMonth) : null,
      weekdays:
        form.recurrence === 'weekly' ? form.weekdays : [],
    };

    try {
      if (editingId) {
        await api.patch(`/calendar/${editingId}`, payload);
        setNotice('Schedule updated successfully.');
      } else {
        await api.post('/calendar', payload);
        setNotice('Schedule created successfully.');
      }

      const newDate = parseDate(form.startDate);
      setSelectedDate(newDate);
      closeForm();
      await loadEvents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not save the schedule. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (event) => {
    if (
      !window.confirm(
        `Delete "${event.title}" and its recurring schedule?`
      )
    ) {
      return;
    }

    setBusyId(event._id);
    setError('');
    setNotice('');

    try {
      await api.delete(`/calendar/${event._id}`);
      setEvents((previous) =>
        previous.filter((item) => item._id !== event._id)
      );
      setNotice('Schedule deleted successfully.');

      if (editingId === event._id) closeForm();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not delete this schedule.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const navigate = (direction) => {
    if (view === 'day') {
      setSelectedDate((date) => addDays(date, direction));
    } else if (view === 'week') {
      setSelectedDate((date) => addDays(date, direction * 7));
    } else {
      setSelectedDate(
        (date) =>
          new Date(date.getFullYear(), date.getMonth() + direction, 1)
      );
    }
  };

  const goToday = () => setSelectedDate(new Date());

  const heading =
    view === 'month'
      ? formatDate(selectedDate, { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${formatDate(visibleDates[0], { month: 'short', day: 'numeric' })} – ${formatDate(
            visibleDates[6],
            { month: 'short', day: 'numeric', year: 'numeric' }
          )}`
        : formatDate(selectedDate, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });

  const dayView = view === 'day';
  const timelineDates = view === 'week' ? visibleDates : [selectedDate];

  return (
    <div className="min-h-full space-y-6 bg-surface p-4 sm:p-6 lg:p-8">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-700">
            <CalendarDays size={17} />
            Plan your time
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Calendar
          </h1>
          <p className="mt-2 text-sm text-muted">
            Every routine, appointment, and schedule in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreate(selectedDate)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus size={18} />
          Add schedule
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">
            <X size={17} />
          </button>
        </div>
      )}

      {/* Calendar controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Previous period"
              className="rounded-xl border border-slate-200 p-2 text-ink hover:bg-slate-50"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label="Next period"
              className="rounded-xl border border-slate-200 p-2 text-ink hover:bg-slate-50"
            >
              <ChevronRight size={19} />
            </button>

            <h2 className="ml-1 text-lg font-bold text-ink">{heading}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['day', 'week', 'month'].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setView(item)}
                aria-pressed={view === item}
                className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                  view === item
                    ? 'bg-brand-600 text-white'
                    : 'border border-slate-200 bg-white text-ink hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            ))}

            <button
              type="button"
              onClick={loadEvents}
              disabled={loading}
              title="Refresh schedules"
              className="rounded-xl border border-slate-200 p-2 text-ink hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>

        {loading && (
          <p className="mt-3 text-sm text-muted">Loading schedules...</p>
        )}

        {/* Month view */}
        {view === 'month' && (
          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-7 border-b border-slate-200">
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {visibleDates.map((date) => {
                  const dateEvents = eventsOnDate(date);
                  const inMonth =
                    date.getMonth() === selectedDate.getMonth();
                  const today = sameDay(date, new Date());

                  return (
                    <div
                      key={dateKey(date)}
                      onClick={() => setSelectedDate(date)}
                      className={`group relative min-h-32 cursor-pointer border-b border-r border-slate-100 p-2 transition hover:bg-brand-50/40 ${
                        !inMonth ? 'bg-slate-50/60' : 'bg-white'
                      } ${sameDay(date, selectedDate) ? 'bg-brand-50/50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                            today
                              ? 'bg-brand-600 font-bold text-white'
                              : inMonth
                                ? 'font-medium text-ink'
                                : 'text-slate-400'
                          }`}
                        >
                          {date.getDate()}
                        </span>

                        <button
                          type="button"
                          title="Add schedule on this date"
                          onClick={(event) => {
                            event.stopPropagation();
                            openCreate(date);
                          }}
                          className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-brand-100 hover:text-brand-700 group-hover:opacity-100"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <div className="mt-2 space-y-1">
                        {dateEvents.slice(0, 3).map((item) => (
                          <EventChip
                            key={item._id}
                            event={item}
                            date={date}
                            onClick={openEdit}
                            compact
                          />
                        ))}

                        {dateEvents.length > 3 && (
                          <p className="px-1 text-xs font-semibold text-muted">
                            +{dateEvents.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Week and day timeline */}
        {(view === 'week' || view === 'day') && (
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <div className={dayView ? 'min-w-[500px]' : 'min-w-[850px]'}>
              <div
                className="grid border-b border-slate-200"
                style={{
                  gridTemplateColumns: `64px repeat(${timelineDates.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="border-r border-slate-200 p-2" />

                {timelineDates.map((date) => (
                  <button
                    type="button"
                    key={dateKey(date)}
                    onClick={() => setSelectedDate(date)}
                    className={`border-r border-slate-100 px-2 py-3 text-center hover:bg-brand-50 ${
                      sameDay(date, new Date()) ? 'bg-brand-50/60' : ''
                    }`}
                  >
                    <span className="block text-xs font-semibold uppercase text-muted">
                      {formatDate(date, { weekday: 'short' })}
                    </span>
                    <span
                      className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        sameDay(date, new Date())
                          ? 'bg-brand-600 text-white'
                          : 'text-ink'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                ))}
              </div>

              <div className="max-h-[680px] overflow-y-auto">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `64px repeat(${timelineDates.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="border-r border-slate-200">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 border-b border-slate-100 pr-2 pt-1 text-right text-xs text-muted"
                      >
                        {formatTime(`${String(hour).padStart(2, '0')}:00`)}
                      </div>
                    ))}
                  </div>

                  {timelineDates.map((date) => {
                    const dateEvents = eventsOnDate(date);

                    return (
                      <div
                        key={dateKey(date)}
                        className="relative border-r border-slate-100"
                      >
                        {HOURS.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            title={`Add schedule at ${formatTime(
                              `${String(hour).padStart(2, '0')}:00`
                            )}`}
                            onClick={() => {
                              const start = `${String(hour).padStart(2, '0')}:00`;
                              const end = `${String(Math.min(hour + 1, 23)).padStart(2, '0')}:00`;

                              setEditingId(null);
                              setForm({
                                ...INITIAL_FORM,
                                startDate: dateKey(date),
                                startTime: start,
                                endTime: hour === 23 ? '23:59' : end,
                                dayOfMonth: String(date.getDate()),
                              });
                              setError('');
                              setNotice('');
                              setShowForm(true);
                            }}
                            className="block h-16 w-full border-b border-slate-100 text-left transition hover:bg-brand-50/50"
                          />
                        ))}

                        {dateEvents.map((item) => {
                          const [startHour, startMinute] =
                            item.startTime.split(':').map(Number);
                          const [endHour, endMinute] =
                            item.endTime.split(':').map(Number);

                          const top =
                            (startHour * 60 + startMinute) / 60 * 64;
                          const duration = Math.max(
                            24,
                            ((endHour * 60 + endMinute) -
                              (startHour * 60 + startMinute)) /
                              60 *
                              64
                          );

                          return (
                            <div
                              key={item._id}
                              className="absolute left-1 right-1 z-10"
                              style={{
                                top: `${top}px`,
                                height: `${duration}px`,
                              }}
                            >
                              <EventChip
                                event={item}
                                date={date}
                                onClick={openEdit}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="font-semibold text-ink">Tips:</span>
          <span>Hover over an event for its description.</span>
          <span>Click an event to edit or delete it.</span>
          <span>Click an empty time slot to create a schedule.</span>
        </div>
      </section>

      {/* Selected day agenda */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {formatDate(selectedDate, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {eventsOnDate(selectedDate).length} scheduled{' '}
              {eventsOnDate(selectedDate).length === 1 ? 'event' : 'events'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreate(selectedDate)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            <Plus size={16} />
            Add to this day
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {eventsOnDate(selectedDate).length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
              <CalendarDays size={28} className="mx-auto text-slate-400" />
              <p className="mt-3 font-semibold text-ink">
                Nothing scheduled
              </p>
              <p className="mt-1 text-sm text-muted">
                Add a routine or event to organize this day.
              </p>
            </div>
          ) : (
            eventsOnDate(selectedDate).map((event) => (
              <div
                key={event._id}
                className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
              >
                <div className="w-24 shrink-0">
                  <p className="text-sm font-bold text-ink">
                    {formatTime(event.startTime)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatTime(event.endTime)}
                  </p>
                </div>

                <div
                  className={`min-w-0 flex-1 rounded-r-lg border-l-4 p-3 ${
                    COLORS[event.color] || COLORS.indigo
                  }`}
                >
                  <h3 className="break-words font-bold">{event.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                    {event.description || 'No description added.'}
                  </p>
                  <p className="mt-2 text-xs font-medium">
                    {event.category} · {recurrenceLabel(event)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(event)}
                    title="Edit schedule"
                    className="rounded-lg p-2 text-muted hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEvent(event)}
                    disabled={busyId === event._id}
                    title="Delete schedule"
                    className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Schedule form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div className="my-4 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
            <ScheduleForm
              form={form}
              setForm={setForm}
              editingId={editingId}
              saving={saving}
              onSubmit={saveEvent}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
