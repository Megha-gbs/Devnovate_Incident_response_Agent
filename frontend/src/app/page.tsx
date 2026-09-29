import type { Metadata } from 'next';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard — OPSMIND',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
