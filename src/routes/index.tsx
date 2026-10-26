import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ApprovedInterpreterRoute } from '../components/ApprovedInterpreterRoute';
import { GuestRoute } from '../components/Guestroute';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Placeholder } from '../components/Placeholder';
import { LandingPage } from '../pages/landing/LandingPage';
import { SplashPage } from '../pages/landing/SplashPage';
import { RoleSelectionPage } from '../pages/registration/RoleSelectionPage';
import { Forgotpassword } from '../pages/registration/Forgotpassword';
import { Resetpassword } from '../pages/registration/Resetpassword';
import { SignUpInstitution } from '../pages/registration/SignUpInstitution';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { SignInPage } from '../pages/auth/SignInPage';
import { CreateAccountPage } from '../pages/registration/CreateAccountPage';
import { PendingReviewPage } from '../pages/registration/PendingReviewPage';
import { WelcomePage } from '../pages/registration/WelcomePage';
import { UploadCertificationsPage } from '../pages/registration/UploadCertificationsPage';
import { InterpreterLayout } from '../components/interpreter/InterpreterLayout';
import { InterpreterHomePage } from '../pages/interpreter/InterpreterHomePage';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { deafNavigation } from '../features/dashboard/navigation';
import { DashboardPage } from '../pages/dashboards/DHH_dashboard';
import { AdminLayout } from '../features/admin/AdminLayout';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { CredentialReviewPage } from '../pages/admin/CredentialReviewPage';
import { VerificationsPage } from '../pages/admin/VerificationsPage';
import { InstitutionAccountsPage } from '../pages/admin/InstitutionAccountsPage';
import { AvailabilityPage } from '../pages/interpreter/AvailabilityPage';
import { InstitutionLayout } from '../features/institution/InstitutionLayout';
import { StaffManagementPage } from '../pages/institution/StaffManagementPage';
import { ProfilePage as DeafProfilePage } from '../pages/deaf/ProfilePage';
import { StartSessionPage } from '../pages/deaf/StartSessionPage';
import { SessionsHubPage } from '../pages/deaf/SessionsHubPage';
import { SessionHistoryPage } from '../pages/deaf/SessionHistoryPage';
import { AccessibilityPage } from '../pages/deaf/AccessibilityPage';
import { WalletPage } from '../pages/deaf/WalletPage';
import { MessagesPage } from '../pages/deaf/MessagesPage';
import { SchedulePage } from '../pages/deaf/SchedulePage';
import { SettingsPage as DeafSettingsPage } from '../pages/deaf/SettingsPage';
import { LiveSessionPage } from '../pages/session/LiveSessionPage';
import { ProfilePage as InterpreterProfilePage } from '../pages/interpreter/ProfilePage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { AdminProfilePage } from '../pages/admin/AdminProfilePage';
import { CreateStaffAccountPage } from '../pages/institution/CreateStaffAccountPage';
import { OfflinePage } from '../pages/OfflinePage';
import { StaffAccountCreatedPage } from '../pages/institution/StaffAccountCreatedPage';
import { InstitutionDashboardPage } from '../pages/institution/InstitutionDashboardPage';
import RequestsPage from '../pages/interpreter/RequestsPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { InstitutionProfilePage } from '../pages/institution/InstitutionProfilePage';
import { SessionsPage } from '../pages/admin/SessionsPage';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { InstitutionSettingsPage } from '../pages/institution/InstitutionSettingsPage';
import { InstitutionAnalyticsPage } from '../pages/institution/InstitutionAnalyticsPage';
import { InstitutionSessionsPage } from '../pages/institution/InstitutionSessionsPage';

export const router = createBrowserRouter([
  {
    // Public entry pages: signed-in users should return to their dashboard.
    element: <GuestRoute />,
    children: [
      { path: '/', element: <SplashPage /> },
      { path: '/landing', element: <LandingPage /> },
      { path: '/get-started', element: <RoleSelectionPage /> },
    ],
  },
  {
    // Registration pages: allow a newly registered user to finish the sign-up flow.
    element: <GuestRoute allowSessionCreatedDuringRoute />,
    children: [
      { path: '/register/deaf', element: <CreateAccountPage /> },
      { path: '/register/interpreter', element: <CreateAccountPage role="interpreter" /> },
      { path: '/register/institution', element: <SignUpInstitution /> },
    ],
  },

  // The sign-in page already sends a signed-in person to their dashboard by itself.
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/offline', element: <OfflinePage /> },
  { path: '/forgot-password', element: <Forgotpassword /> },
  { path: '/reset-password', element: <Resetpassword /> },
  { path: '/recover', element: <Placeholder title="Recover access" story="V2-008" /> },
  {
    path: '/register/interpreter/account',
    element: <Navigate to="/register/interpreter" replace />,
  },
  {
    // Certificates are uploaded right after the account exists and before the email is confirmed.
    element: <ProtectedRoute allow={['interpreter']} requireVerifiedEmail={false} />,
    children: [
      { path: '/register/interpreter/certifications', element: <UploadCertificationsPage /> },
    ],
  },
  { path: '/register/pending', element: <PendingReviewPage /> },
  {
    element: <ProtectedRoute allow={['deaf']} />,
    children: [{ path: '/live/deaf/:id', element: <LiveSessionPage viewerRole="deaf" /> }],
  },
  {
    element: <ProtectedRoute allow={['interpreter']} />,
    children: [
      { path: '/live/interpreter/:id', element: <LiveSessionPage viewerRole="interpreter" /> },
    ],
  },
  {
    element: <ProtectedRoute allow={['deaf']} />,
    children: [{ path: '/register/welcome', element: <WelcomePage /> }],
  },

  {
    element: <ProtectedRoute allow={['deaf']} />,
    children: [
      {
        path: '/dashboard/deaf',
        element: (
          <DashboardLayout
            links={deafNavigation}
            navLabel="Deaf dashboard"
            accountTo="/dashboard/deaf/profile"
          />
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'sessions', element: <SessionsHubPage /> },
          { path: 'sessions/history', element: <SessionHistoryPage /> },
          { path: 'sessions/new', element: <StartSessionPage /> },
          {
            path: 'schedule',
            element: <SchedulePage />,
          },
          {
            path: 'accessibility',
            element: <AccessibilityPage />,
          },
          { path: 'messages', element: <MessagesPage /> },
          { path: 'wallet', element: <WalletPage /> },
          { path: 'profile', element: <DeafProfilePage /> },
          { path: 'settings', element: <DeafSettingsPage /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allow={['interpreter']} />,
    children: [
      {
        // Nothing past this point opens until an admin has approved the interpreter.
        element: <ApprovedInterpreterRoute />,
        children: [
          {
            path: '/dashboard/interpreter',
            element: <InterpreterLayout />,
            children: [
              { index: true, element: <InterpreterHomePage /> },
              { path: 'requests', element: <RequestsPage /> },
              { path: 'sessions', element: <Placeholder title="Sessions" story="Sprint 2" /> },
              { path: 'availability', element: <AvailabilityPage /> },
              { path: 'wallet', element: <Placeholder title="Wallet" story="Not scheduled" /> },
              { path: 'profile', element: <InterpreterProfilePage /> },
              { path: 'settings', element: <Placeholder title="Settings" story="Sprint 2" /> },
            ],
          },
        ],
      },
    ],
  },

  {
    // element: <ProtectedRoute allow={['institution']} />,
    children: [
      {
        path: '/dashboard/institution',
        element: <InstitutionLayout />,
        children: [
          { index: true, element: <InstitutionDashboardPage /> },
          { path: 'staff', element: <StaffManagementPage /> },
          { path: 'staff/new', element: <CreateStaffAccountPage /> },
          { path: 'staff/created', element: <StaffAccountCreatedPage /> },
          { path: 'sessions', element: <InstitutionSessionsPage /> },
          { path: 'analytics', element: <InstitutionAnalyticsPage /> },
          { path: 'settings', element: <InstitutionSettingsPage /> },
          { path: 'profile', element: <InstitutionProfilePage /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allow={['admin']} />,
    children: [
      {
        path: '/dashboard/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'verifications', element: <VerificationsPage /> },
          { path: 'verifications/:id', element: <CredentialReviewPage /> },
          { path: 'institutions', element: <InstitutionAccountsPage /> },
          { path: 'sessions', element: <SessionsPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'audit-logs', element: <Placeholder title="Audit Logs" story="V2-064" /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'profile', element: <AdminProfilePage /> },
        ],
      },

      {
        path: '/admin/interpreters',
        element: <Placeholder title="Interpreter review" story="V2-045" />,
      },
    ],
  },

  {
    path: '/admin/interpreters',
    element: <Placeholder title="Interpreter review" story="V2-045" />,
  },

  {
    path: '*',
    element: <Placeholder title="Page not found" message="We could not find this page." />,
  },
]);
