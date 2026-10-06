import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Placeholder } from '../components/Placeholder';
import { Forgotpassword } from '../pages/registration/Forgotpassword';
import { SignInPage } from '../pages/auth/SignInPage';

export const router = createBrowserRouter([
  { path: '/', element: <Forgotpassword /> },
  { path: '/login', element: <SignInPage /> },
  { path: '/recover', element: <Placeholder title="Recover access" story="V2-008" /> },
  {
    path: '/register/deaf',
    element: <Placeholder title="Deaf user registration" story="V2-001 / V2-002" />,
  },
  {
    path: '/register/interpreter',
    element: <Placeholder title="Interpreter registration (3 steps)" story="V2-003" />,
  },
  {
    path: '/register/institution',
    element: <Placeholder title="Institution registration" story="V2-005 (Sprint 2)" />,
  },
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
