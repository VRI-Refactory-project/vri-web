// src/pages/ResetPassword.tsx
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import './AuthPages.css';

export const Resetpassword = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Resetting password:', formData);
    // TODO: Connect to API later
  };

  return (
    <AuthLayout
      title="Select a new password"
      subtitle="Choose a strong password you haven't used before"
      onBack={() => console.log('Go back')}
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
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
          Reset password <ChevronRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
};
