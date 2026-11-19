import type { CallRole } from './callConnection';

/** The tag shown under a person's name in the call. */
export const ROLE_LABEL: Record<CallRole, string> = {
  deaf: 'Deaf user',
  interpreter: 'Interpreter',
  institution: 'Institution',
  admin: 'Administrator',
  guest: 'Hearing guest',
};
