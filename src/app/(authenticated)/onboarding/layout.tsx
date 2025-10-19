// Force this entire route to be dynamic
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
