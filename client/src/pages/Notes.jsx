
import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X, Save, LoaderCircle } from 'lucide-react';
import api from '../lib/api';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadNotes() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/notes');
      setNotes(response.data.notes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load notes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  function newNote() {
    setSelected(null);
    setTitle('');
    setContent('');
    setError('');
  }

  function openNote(note) {
    setSelected(note);
    setTitle(note.title);
    setContent(note.content || '');
    setError('');
  }

  async function saveNote(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Please enter a note title.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = { title: title.trim(), content };

      if (selected) {
        const response = await api.patch(`/notes/${selected._id}`, payload);

        setNotes((current) =>
          current.map((note) =>
            note._id === selected._id ? response.data.note : note
          )
        );
        setSelected(response.data.note);
      } else {
        const response = await api.post('/notes', payload);

        setNotes((current) => [response.data.note, ...current]);
        setSelected(response.data.note);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save note.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(note) {
    if (!window.confirm(`Delete "${note.title}"?`)) return;

    setError('');

    try {
      await api.delete(`/notes/${note._id}`);
      setNotes((current) => current.filter((item) => item._id !== note._id));

      if (selected?._id === note._id) newNote();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete note.');
    }
  }

  const filteredNotes = notes.filter((note) =>
    `${note.title} ${note.content || ''}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-brand-600">Your ideas, organized</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">My notes</h2>
          <p className="mt-2 text-sm text-muted">
            Capture thoughts, save information, and revisit your ideas.
          </p>
        </div>

        <button
          type="button"
          onClick={newNote}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus size={18} /> New note
        </button>
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid min-h-[500px] gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:col-span-2">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes..."
              aria-label="Search notes"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
            All notes · {filteredNotes.length}
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoaderCircle className="animate-spin text-brand-600" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {notes.length ? 'No matching notes.' : 'Create your first note.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map((note) => (
                <button
                  key={note._id}
                  type="button"
                  onClick={() => openNote(note)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected?._id === note._id
                      ? 'border-brand-200 bg-brand-50'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-ink">{note.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                    {note.content || 'No additional content'}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-3">
          <form onSubmit={saveNote} className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {selected ? 'Edit note' : 'New note'}
              </p>
              {selected && (
                <button
                  type="button"
                  onClick={newNote}
                  aria-label="Close note"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Note title"
              maxLength={150}
              required
              aria-label="Note title"
              className="border-0 border-b border-slate-100 px-0 py-3 text-xl font-bold text-ink outline-none placeholder:text-slate-300 focus:border-brand-500"
            />

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Start writing your thoughts..."
              maxLength={20000}
              aria-label="Note content"
              className="mt-4 min-h-[300px] flex-1 resize-y border-0 px-0 py-2 text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-300"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs text-muted">{content.length}/20000 characters</span>
              <div className="flex gap-2">
                {selected && (
                  <button
                    type="button"
                    onClick={() => deleteNote(selected)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save note'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Notes;
