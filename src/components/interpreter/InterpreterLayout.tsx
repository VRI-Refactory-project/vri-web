import { INTERPRETER_BASE, INTERPRETER_NAV } from '../../features/interpreter/navigation';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { VerifyEmailModal } from '../VerifyEmailModal';
import { IncomingRequestModal } from './IncomingRequestModal';
import { PendingVerificationModal } from './PendingVerificationModal';

export function InterpreterLayout() {
  return (
    <>
      <DashboardLayout
        links={INTERPRETER_NAV}
        navLabel="Interpreter"
        accountTo={`${INTERPRETER_BASE}/profile`}
      />
      <VerifyEmailModal />
      <PendingVerificationModal />
      <IncomingRequestModal />
    </>
  );
}
