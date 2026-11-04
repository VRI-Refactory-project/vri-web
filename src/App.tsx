import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthProvider';
import { router } from './routes';

function PageLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Manrope, sans-serif',
        color: '#6b46c1',
      }}
    >
      Loading page…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoading />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}
