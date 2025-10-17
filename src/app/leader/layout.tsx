/**
 * Leader Dashboard Layout
 * Protects all leader routes - requires 'leader' role
 */

import { requireLeader } from '@/lib/auth/role-check';
import { redirect } from 'next/navigation';

export default async function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require leader role - will redirect if user is not a leader
  await requireLeader();

  return <>{children}</>;
}
