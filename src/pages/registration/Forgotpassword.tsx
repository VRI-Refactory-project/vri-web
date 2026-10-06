// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import './AuthPages.css';

export const Forgotpassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending reset link to:', email);
    // TODO: Connect to API later
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email and we'll send reset instructions"
      onBack={() => console.log('Go back')}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email address</label>
          <input
            type="email"
            className="form-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
          Send reset link <ChevronRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
};
