// The screens in each sign-up flow, in order. The step list on every auth screen is drawn from
// these, so adding or removing a step is a change to this one file.
export const FLOWS = {
  deaf: ['Choose your role', 'Create your account'],
  interpreter: ['Choose your role', 'Verify certificates', 'Create your account'],
  institution: ['Choose your role', 'Register your institution'],
} as const;

/** Shown before a role is picked, when the length of the flow is not known yet. */
export const ROLE_STEP = ['Choose your role'] as const;
