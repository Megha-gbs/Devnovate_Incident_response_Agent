import type { Metadata } from 'next';
import Link from 'next/link';
import CreateIncidentForm from '@/components/incidents/CreateIncidentForm';

export const metadata: Metadata = {
  title: 'Create Incident — OPSMIND',
};

export default function NewIncidentPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </Link>
      </nav>

      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Create Incident</h1>
        <p className="text-gray-400 text-sm">
          Provide the details needed to begin an AI-assisted investigation.
        </p>
      </header>

      {/* Form card */}
      <div className="card p-6">
        <CreateIncidentForm />
      </div>
    </div>
  );
}
