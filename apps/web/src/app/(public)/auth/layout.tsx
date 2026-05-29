import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Sign in or create your Eventology account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
