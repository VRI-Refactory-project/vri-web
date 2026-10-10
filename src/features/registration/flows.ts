// The screens in each sign-up flow, in order. The step list on every auth screen is drawn from
// these, so adding or removing a step is a change to this one file. Every path has three steps so
// the counter reads the same however a person joins.
export const FLOWS = {
  deaf: ['Choose your role', 'Create your account', "You're all set"],
  interpreter: ['Choose your role', 'Verify certificates', 'Create your account'],
  institution: ['Choose your role', 'Register your institution', 'Under review'],
} as const;

/** Shown before a role is picked, when the exact steps are not known yet. Every path has three. */
export const ROLE_STEP = ['Choose your role', 'Your details', 'Finish'] as const;
