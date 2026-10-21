import { INTERPRETER_BASE, INTERPRETER_NAV } from '../../features/interpreter/navigation';
import { useInterpreterHome } from '../../features/interpreter/homeData';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { VerifyEmailModal } from '../VerifyEmailModal';
import { IncomingRequestModal } from './IncomingRequestModal';
import { PendingVerificationModal } from './PendingVerificationModal';

export function InterpreterLayout() {
  const { data } = useInterpreterHome();
  return (
    <>
      <DashboardLayout
        links={INTERPRETER_NAV}
        navLabel="Interpreter"
        badges={{ requests: data.availableRequests }}
        accountTo={`${INTERPRETER_BASE}/profile`}
      />
      <VerifyEmailModal />
      <PendingVerificationModal />
      <IncomingRequestModal />
    </>
  );
}
