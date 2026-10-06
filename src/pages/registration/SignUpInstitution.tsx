// src/pages/SignUpInstitution.tsx
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import './AuthPages.css'; 

export const SignUpInstitution = () => {
  const [formData, setFormData] = useState({ institution: '', email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting Step 2:', formData);
    // TODO: Connect to API later
  };

  return (
    <AuthLayout 
      title="Register your institution" 
      subtitle="Set up secure interpreting access for your organisation."
      onBack={() => console.log('Go back')}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Institution name</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Mulago Medical Center"
            value={formData.institution}
            onChange={(e) => setFormData({...formData, institution: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Work email</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
          Submit registration <ChevronRight size={18} />
        </button>
      </form>

      {/* Step Indicator */}
      <div className="step-indicator">
        <div className="step active"></div>
        <div className="step"></div>
        <div className="step"></div>
        <p className="step-text">Step 2 of 3</p>
      </div>
    </AuthLayout>
  );
};