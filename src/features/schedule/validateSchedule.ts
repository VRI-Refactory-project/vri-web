export interface ScheduleForm {
  date: string;
  time: string;
  location: string;
  specialisation: string;
}

export type ScheduleErrors = Partial<Record<keyof ScheduleForm, string>>;

export const SPECIALISATIONS = ['General', 'Medical', 'Legal'];

/** What is wrong with the form, field by field. The date and time must be in the future. */
export function validateSchedule(form: ScheduleForm, now = new Date()): ScheduleErrors {
  const errors: ScheduleErrors = {};
  if (!form.date) errors.date = 'Choose a date.';
  if (!form.time) errors.time = 'Choose a time.';
  if (form.date && form.time) {
    const when = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) {
      errors.date = 'Choose a date and time in the future.';
    }
  }
  if (!form.location.trim()) errors.location = 'Say where you need support.';
  if (!SPECIALISATIONS.includes(form.specialisation))
    errors.specialisation = 'Choose a specialisation.';
  return errors;
}
