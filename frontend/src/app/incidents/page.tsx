import type { Metadata } from 'next';
import IncidentsDirectoryClient from '@/components/incidents/IncidentsDirectoryClient';

export const metadata: Metadata = {
  title: 'Incidents Directory — OPSMIND',
  description: 'Registry and audit history of operational incidents and AI investigations.',
};

export default function IncidentsPage() {
  return <IncidentsDirectoryClient />;
}

