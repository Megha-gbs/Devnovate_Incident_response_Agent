import type { Metadata } from 'next';
import Link from 'next/link';
import IncidentWorkspace from '@/components/incident/IncidentWorkspace';

interface PageProps {
  params: { incidentId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Incident ${params.incidentId} — OPSMIND`,
  };
}

export default function IncidentPage({ params }: PageProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Back nav */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Incidents
        </Link>
      </nav>

      <IncidentWorkspace incidentId={params.incidentId} />
    </div>
  );
}
