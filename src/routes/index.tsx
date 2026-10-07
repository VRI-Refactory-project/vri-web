import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Placeholder } from '../components/Placeholder';
import { LandingPage } from '../pages/landing/LandingPage';
import { RoleSelectionPage } from '../pages/registration/RoleSelectionPage';
import { Forgotpassword } from '../pages/registration/Forgotpassword';
import { Resetpassword } from '../pages/registration/Resetpassword';
import { SignUpInstitution } from '../pages/registration/SignUpInstitution';
import { SignInPage } from '../pages/auth/SignInPage';
import { CreateAccountPage } from '../pages/registration/CreateAccountPage';
import { PendingReviewPage } from '../pages/registration/PendingReviewPage';
import { UploadCertificationsPage } from '../pages/registration/UploadCertificationsPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/get-started', element: <RoleSelectionPage /> },
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/register/deaf', element: <CreateAccountPage /> },
  { path: '/forgot-password', element: <Forgotpassword /> },
  { path: '/reset-password', element: <Resetpassword /> },
  { path: '/recover', element: <Placeholder title="Recover access" story="V2-008" /> },
  { path: '/register/interpreter', element: <UploadCertificationsPage /> },
  {
    path: '/register/interpreter/certifications',
    element: <Navigate to="/register/interpreter" replace />,
  },
  { path: '/register/interpreter/account', element: <CreateAccountPage role="interpreter" /> },
  { path: '/register/pending', element: <PendingReviewPage /> },
  { path: '/register/institution', element: <SignUpInstitution /> },
  {
    element: <ProtectedRoute allow={['deaf']} />,
    children: [
      { path: '/dashboard/deaf', element: <Placeholder title="Deaf dashboard" story="Sprint 2" /> },
    ],
  },
  {
    element: <ProtectedRoute allow={['interpreter']} />,
    children: [
      {
        path: '/dashboard/interpreter',
        element: <Placeholder title="Interpreter dashboard" story="Sprint 2" />,
      },
    ],
  },
  {
    element: <ProtectedRoute allow={['institution']} />,
    children: [
      {
        path: '/dashboard/institution',
        element: <Placeholder title="Institution dashboard" story="V2-028" />,
      },
    ],
  },
  {
    element: <ProtectedRoute allow={['admin']} />,
    children: [
      {
        path: '/dashboard/admin',
        element: <Placeholder title="Admin dashboard" story="Sprint 2" />,
      },
      {
        path: '/admin/interpreters',
        element: <Placeholder title="Interpreter review" story="V2-045" />,
      },
    ],
  },
  { path: '*', element: <Placeholder title="Page not found" story="n/a" /> },
]);
