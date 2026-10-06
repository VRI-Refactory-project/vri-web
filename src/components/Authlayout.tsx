// src/components/AuthLayout.tsx
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import './Authlayout.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  onBack: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, onBack }) => {
  return (
    <div className="auth-layout-container">
      <header className="auth-header">
        <div className="logo-container">
          <img src="/logo.png" alt="SignConnect Logo" className="brand-logo" />
        </div>
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
      </header>

      <main className="auth-card">
        <div className="auth-card-header">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
};
