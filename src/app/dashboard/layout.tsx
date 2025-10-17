/**
 * Follower Dashboard Layout
 * Protects follower dashboard - requires 'follower' role
 */

import { requireFollower } from '@/lib/auth/role-check';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require follower role - will redirect if user is not a follower
  await requireFollower();

  return <>{children}</>;
}
