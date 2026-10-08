// src/hooks/useValidation.ts

export const useValidation = () => {
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.startsWith('07')) {
      if (!/^\d{10}$/.test(cleanPhone)) return 'Format: 07XXXXXXXX (10 digits)';
      return null;
    }
    if (cleanPhone.startsWith('+256')) {
      if (!/^\+256\d{9}$/.test(cleanPhone)) return 'Format: +256XXXXXXXXX';
      return null;
    }
    return 'Must start with 07 or +256';
  };

  const validateName = (name: string): string | null => {
    if (!name) return 'Name is required';
    if (!/^[A-Za-z\s]+$/.test(name)) return 'Name can only contain letters';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Must contain at least one number';
    return null;
  };

  const validateConfirmPassword = (
    password: string,
    confirmPassword: string,
  ): string | null => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  return {
    validateEmail,
    validatePhone,
    validateName,
    validatePassword,
    validateConfirmPassword,
  };
};