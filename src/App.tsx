// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignUpInstitution } from './pages/registration/SignUpInstitution';
import { Forgotpassword } from './pages/registration/Forgotpassword';
import { Resetpassword } from './pages/registration/Resetpassword';

function App() {
  return (
    <Routes>
      {/* If the user goes to the root URL, redirect them to /signup */}
      <Route path="/" element={<Navigate to="/signup" replace />} />

      {/* Define the paths for your three pages */}
      <Route path="/signup" element={<SignUpInstitution />} />
      <Route path="/forgot-password" element={<Forgotpassword />} />
      <Route path="/reset-password" element={<Resetpassword />} />
    </Routes>
  );
}

export default App;
