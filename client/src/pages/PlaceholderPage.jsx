
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

const pageNames = {
  '/tasks': 'My Tasks',
  '/calendar': 'Calendar',
  '/finance': 'Finance',
  '/notes': 'Notes',
  '/habits': 'Habits',
  '/settings': 'Settings',
  '/help': 'Help and Support',
  '/notifications': 'Notifications',
};

function PlaceholderPage() {
  const location = useLocation();
  const title = pageNames[location.pathname] || 'Page not found';

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Construction size={30} />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        This section is part of the OneSphere roadmap. We'll build it in its
        planned development phase.
      </p>

      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <ArrowLeft size={17} />
        Back to overview
      </Link>
    </section>
  );
}

export default PlaceholderPage;
