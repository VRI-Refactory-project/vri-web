import type { ReactNode } from 'react';
import { AuthShell } from './AuthShell';

// A titled form card inside the shared auth frame.

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  backTo: string;
  steps?: readonly string[];
  current?: number;
  className?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  backTo,
  steps,
  current,
  className,
}: AuthLayoutProps) {
  return (
    <AuthShell backTo={backTo} steps={steps} current={current} className={className}>
      <div className="as-card-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {children}
    </AuthShell>
  );
}
