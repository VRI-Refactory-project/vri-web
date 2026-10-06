// src/pages/auth/SignInPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import './SignInPages.css';

export const SignInPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging in with:', formData);
    // TODO: Connect to your backend API later
  };

  return (
    <div className="login-page-container">
      {/* Floating Logo in top-left corner */}
      <div className="login-logo-floating">
        <img src="/logo.png" alt="SignConnect Logo" />
      </div>

      {/* Back button in top-right corner */}
      <button className="login-back-button" onClick={() => window.history.back()}>
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>

      <div className="login-card-wrapper">
        <AuthLayout
          title="Welcome Back"
          subtitle="Sign In to continue to SignConnect."
          onBack={() => console.log('Do nothing here')}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
              Login <ChevronRight size={18} />
            </button>
          </form>

          <Link to="/forgot-password" className="login-forgot-link">
            Forgot Password?
          </Link>

          {/* Step Indicator matching the design */}
          <div className="step-indicator" style={{ marginTop: '32px' }}>
            <div className="step active"></div>
            <div className="step active"></div>
            <div className="step active"></div>
            <p className="step-text">Step 3 of 3</p>
          </div>
        </AuthLayout>
      </div>
    </div>
  );
};
