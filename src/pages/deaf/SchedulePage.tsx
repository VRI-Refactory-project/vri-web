import { CalendarDays, ChevronLeft, Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  SPECIALISATIONS,
  validateSchedule,
  type ScheduleErrors,
  type ScheduleForm,
} from '../../features/schedule/validateSchedule';
import { extrasMocked } from '../../services/deafExtras';
import './DeafExtras.css';

const EMPTY: ScheduleForm = { date: '', time: '', location: '', specialisation: 'General' };

export function SchedulePage() {
  const [form, setForm] = useState<ScheduleForm>(EMPTY);
  const [errors, setErrors] = useState<ScheduleErrors>({});
  const [result, setResult] = useState<'saved' | 'unavailable' | null>(null);

  const set = (patch: Partial<ScheduleForm>) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateSchedule(form);
    setErrors(found);
    setResult(null);
    if (Object.keys(found).length > 0) return;
    // Scheduling has no API yet, so nothing is sent: say so instead of pretending it was saved.
    setResult(extrasMocked() ? 'saved' : 'unavailable');
  };

  const field = (key: keyof ScheduleForm) => (errors[key] ? { 'aria-invalid': true } : {});

  return (
    <div className="dx-page">
      <Link to="/dashboard/deaf/sessions" className="dx-back">
        <ChevronLeft size={18} aria-hidden /> Back
      </Link>
      <header className="dx-header">
        <h1>Schedule VRI session</h1>
        <p>Choose when and where you need support.</p>
      </header>

      <form className="dx-card dx-form" onSubmit={submit} noValidate>
        <label>
          Date
          <span className="dx-input">
            <input
              type="date"
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
              {...field('date')}
            />
            <CalendarDays size={18} aria-hidden />
          </span>
          {errors.date && <em role="alert">{errors.date}</em>}
        </label>
        <label>
          Time
          <span className="dx-input">
            <input
              type="time"
              value={form.time}
              onChange={(e) => set({ time: e.target.value })}
              {...field('time')}
            />
            <Clock size={18} aria-hidden />
          </span>
          {errors.time && <em role="alert">{errors.time}</em>}
        </label>
        <label>
          Location
          <span className="dx-input">
            <input
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
              {...field('location')}
            />
          </span>
          {errors.location && <em role="alert">{errors.location}</em>}
        </label>
        <label>
          Specialization
          <span className="dx-input">
            <select
              value={form.specialisation}
              onChange={(e) => set({ specialisation: e.target.value })}
            >
              {SPECIALISATIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </span>
        </label>

        {result === 'saved' && (
          <p className="dx-ok" role="status">
            Session saved (sample mode).
          </p>
        )}
        {result === 'unavailable' && (
          <p className="dx-notice" role="status">
            Scheduling is not live yet, so this session was not saved. You can still start one now.
          </p>
        )}
        <button type="submit" className="dx-primary">
          Save Session
        </button>
      </form>
    </div>
  );
}
