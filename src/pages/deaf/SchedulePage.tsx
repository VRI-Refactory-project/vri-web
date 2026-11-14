// import { CalendarDays, ChevronLeft, Clock } from 'lucide-react';
// import { useRef, useState, type FormEvent } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   validateSchedule,
//   type ScheduleErrors,
//   type ScheduleForm,
// } from '../../features/schedule/validateSchedule';
// import { extrasMocked } from '../../services/deafExtras';
// import './DeafExtras.css';

// const EMPTY: ScheduleForm = {
//   date: '',
//   time: '',
//   duration: '',
//   sessionType: '',
// };

// export function SchedulePage() {
//   const [form, setForm] = useState<ScheduleForm>(EMPTY);
//   const [errors, setErrors] = useState<ScheduleErrors>({});
//   const [result, setResult] = useState<'saved' | 'unavailable' | null>(null);

//   // State for the custom "Other" session type
//   const [customSessionType, setCustomSessionType] = useState('');

//   const dateInputRef = useRef<HTMLInputElement>(null);
//   const timeInputRef = useRef<HTMLInputElement>(null);

//   const set = (patch: Partial<ScheduleForm>) => setForm((f) => ({ ...f, ...patch }));

//   const submit = (e: FormEvent) => {
//     e.preventDefault();

//     // Optional custom validation for the "Other" text field
//     if (form.sessionType === 'other' && !customSessionType.trim()) {
//       setErrors({ ...errors, sessionType: 'Please specify your session type.' });
//       return;
//     }

//     const found = validateSchedule(form);
//     setErrors(found);
//     setResult(null);
//     if (Object.keys(found).length > 0) return;
//     setResult(extrasMocked() ? 'saved' : 'unavailable');
//   };

//   const field = (key: keyof ScheduleForm) => (errors[key] ? { 'aria-invalid': true } : {});

//   return (
//     <div className="dx-page">
//       <Link to="/dashboard/deaf/sessions" className="dx-back">
//         <ChevronLeft size={18} aria-hidden /> Back
//       </Link>
//       <header className="dx-header">
//         <h1>Schedule VRI session</h1>
//         <p>Choose when and where you need support.</p>
//       </header>

//       {/* 2-Column Layout */}
//       <div className="dx-schedule-layout">
//         {/* LEFT COLUMN: The Form */}
//         <form className="dx-card dx-form" onSubmit={submit} noValidate>
//           {/* Date */}
//           <label>
//             Date
//             <span className={`dx-input ${errors.date ? 'dx-input--error' : ''}`}>
//               <input
//                 ref={dateInputRef}
//                 type={form.date ? 'date' : 'text'}
//                 placeholder={form.date ? undefined : 'Select a date'}
//                 value={form.date}
//                 onChange={(e) => set({ date: e.target.value })}
//                 onFocus={(e) => (e.target.type = 'date')}
//                 onBlur={(e) => {
//                   if (!e.target.value) e.target.type = 'text';
//                 }}
//                 {...field('date')}
//               />
//               <span
//                 className="dx-icon-clickable"
//                 onClick={() => {
//                   if (dateInputRef.current) {
//                     dateInputRef.current.type = 'date';
//                     dateInputRef.current.showPicker();
//                   }
//                 }}
//               >
//                 <CalendarDays size={18} aria-hidden />
//               </span>
//             </span>
//             {errors.date && <em role="alert">{errors.date}</em>}
//           </label>

//           {/* Time */}
//           <label>
//             Time
//             <span className={`dx-input ${errors.time ? 'dx-input--error' : ''}`}>
//               <input
//                 ref={timeInputRef}
//                 type={form.time ? 'time' : 'text'}
//                 placeholder={form.time ? undefined : 'Select a time'}
//                 value={form.time}
//                 onChange={(e) => set({ time: e.target.value })}
//                 onFocus={(e) => (e.target.type = 'time')}
//                 onBlur={(e) => {
//                   if (!e.target.value) e.target.type = 'text';
//                 }}
//                 {...field('time')}
//               />
//               <span
//                 className="dx-icon-clickable"
//                 onClick={() => {
//                   if (timeInputRef.current) {
//                     timeInputRef.current.type = 'time';
//                     timeInputRef.current.showPicker();
//                   }
//                 }}
//               >
//                 <Clock size={18} aria-hidden />
//               </span>
//             </span>
//             {errors.time && <em role="alert">{errors.time}</em>}
//           </label>

//           {/* Duration */}
//           <label>
//             Duration
//             <span className={`dx-input ${errors.duration ? 'dx-input--error' : ''}`}>
//               <select
//                 value={form.duration}
//                 onChange={(e) => set({ duration: e.target.value })}
//                 {...field('duration')}
//               >
//                 <option value="" disabled hidden>
//                   Select duration
//                 </option>
//                 <option value="15">15 minutes</option>
//                 <option value="30">30 minutes</option>
//                 <option value="45">45 minutes</option>
//                 <option value="60">1 hour</option>
//               </select>
//             </span>
//             {errors.duration && <em role="alert">{errors.duration}</em>}
//           </label>

//           {/* Session Type */}
//           <label>
//             Session Type
//             <span className={`dx-input ${errors.sessionType ? 'dx-input--error' : ''}`}>
//               {form.sessionType === 'other' ? (
//                 <input
//                   type="text"
//                   placeholder="Please type your session type"
//                   value={customSessionType}
//                   onChange={(e) => setCustomSessionType(e.target.value)}
//                   autoFocus
//                 />
//               ) : (
//                 <select
//                   value={form.sessionType}
//                   onChange={(e) => set({ sessionType: e.target.value })}
//                   {...field('sessionType')}
//                 >
//                   <option value="" disabled hidden>
//                     Select session type
//                   </option>
//                   <option value="medical">Medical / Healthcare</option>
//                   <option value="legal">Legal / Court</option>
//                   <option value="education">Education / School</option>
//                   <option value="social">Social services/community</option>
//                   <option value="media">Media/broadcast</option>
//                   <option value="conferences">Conferences/events</option>
//                   <option value="religious">Religious/church or mosque</option>
//                   <option value="police">Police/security</option>
//                   <option value="other">Other (please specify)</option>
//                 </select>
//               )}
//             </span>
//             {errors.sessionType && <em role="alert">{errors.sessionType}</em>}
//             {form.sessionType === 'other' && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   set({ sessionType: '' });
//                   setCustomSessionType('');
//                 }}
//                 style={{
//                   background: 'none',
//                   border: 'none',
//                   color: '#382c77',
//                   fontSize: '12px',
//                   cursor: 'pointer',
//                   textAlign: 'left',
//                   marginTop: '4px',
//                   fontWeight: 600,
//                 }}
//               >
//                 Back to list
//               </button>
//             )}
//           </label>

//           {result === 'saved' && (
//             <p className="dx-ok" role="status">
//               Session saved (sample mode).
//             </p>
//           )}
//           {result === 'unavailable' && (
//             <p className="dx-notice" role="status">
//               Scheduling is not live yet, so this session was not saved. You can still start one
//               now.
//             </p>
//           )}

//           <button type="submit" className="dx-primary">
//             Save Session
//           </button>
//         </form>

//         {/* RIGHT COLUMN: Booking Summary */}
//         <aside className="dx-card dx-summary">
//           <h2>Booking Summary</h2>
//           <p>Please review your session details before saving.</p>

//           <div className="dx-summary-list">
//             <div className="dx-summary-item">
//               <span>Date</span>
//               <strong>{form.date || 'Not selected'}</strong>
//             </div>
//             <div className="dx-summary-item">
//               <span>Time</span>
//               <strong>{form.time || 'Not selected'}</strong>
//             </div>
//             <div className="dx-summary-item">
//               <span>Duration</span>
//               <strong>{form.duration ? `${form.duration} minutes` : 'Not selected'}</strong>
//             </div>
//             <div className="dx-summary-item">
//               <span>Session Type</span>
//               <strong>
//                 {form.sessionType === 'other'
//                   ? customSessionType || 'Custom'
//                   : form.sessionType || 'Not selected'}
//               </strong>
//             </div>
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }

import { CalendarDays, ChevronLeft, Clock } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useRequesterPaths } from '../../features/dashboard/requesterPaths';
import {
  validateSchedule,
  type ScheduleErrors,
  type ScheduleForm,
} from '../../features/schedule/validateSchedule';
import { api } from '../../services/api';
import './DeafExtras.css';

const EMPTY: ScheduleForm = {
  date: '',
  time: '',
  duration: '',
  sessionType: '',
};

export function SchedulePage() {
  const paths = useRequesterPaths();
  const [form, setForm] = useState<ScheduleForm>(EMPTY);
  const [errors, setErrors] = useState<ScheduleErrors>({});
  const [result, setResult] = useState<'saved' | 'unavailable' | null>(null);

  // State for the custom "Other" session type
  const [customSessionType, setCustomSessionType] = useState('');

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<ScheduleForm>) => setForm((f) => ({ ...f, ...patch }));

  // 👇 UPDATED: Real API call to the backend
  const submit = async (e: FormEvent) => {
    e.preventDefault();

    // Custom validation for the "Other" text field
    if (form.sessionType === 'other' && !customSessionType.trim()) {
      setErrors({ ...errors, sessionType: 'Please specify your session type.' });
      return;
    }

    const found = validateSchedule(form);
    setErrors(found);
    setResult(null);
    if (Object.keys(found).length > 0) return;

    try {
      await api('/api/v1/interpreters/schedule/', {
        method: 'POST',
        body: JSON.stringify({
          date: form.date,
          time: form.time,
          duration: Number(form.duration),
          session_type: form.sessionType,
          custom_session_type: form.sessionType === 'other' ? customSessionType : '',
        }),
      });

      setResult('saved');
      setForm(EMPTY);
      setCustomSessionType('');
    } catch (error) {
      console.error('Failed to save session', error);
      setResult('unavailable');
    }
  };

  const field = (key: keyof ScheduleForm) => (errors[key] ? { 'aria-invalid': true } : {});

  return (
    <div className="dx-page">
      <Link to={paths.scheduleBack} className="dx-back">
        <ChevronLeft size={18} aria-hidden /> Back
      </Link>
      <header className="dx-header">
        <h1>Schedule VRI session</h1>
        <p>Choose when and where you need support.</p>
      </header>

      {/* 2-Column Layout */}
      <div className="dx-schedule-layout">
        {/* LEFT COLUMN: The Form */}
        <form className="dx-card dx-form" onSubmit={submit} noValidate>
          {/* Date */}
          <label>
            Date
            <span className={`dx-input ${errors.date ? 'dx-input--error' : ''}`}>
              <input
                ref={dateInputRef}
                type={form.date ? 'date' : 'text'}
                placeholder={form.date ? undefined : 'Select a date'}
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = 'text';
                }}
                {...field('date')}
              />
              <span
                className="dx-icon-clickable"
                onClick={() => {
                  if (dateInputRef.current) {
                    dateInputRef.current.type = 'date';
                    dateInputRef.current.showPicker();
                  }
                }}
              >
                <CalendarDays size={18} aria-hidden />
              </span>
            </span>
            {errors.date && <em role="alert">{errors.date}</em>}
          </label>

          {/* Time */}
          <label>
            Time
            <span className={`dx-input ${errors.time ? 'dx-input--error' : ''}`}>
              <input
                ref={timeInputRef}
                type={form.time ? 'time' : 'text'}
                placeholder={form.time ? undefined : 'Select a time'}
                value={form.time}
                onChange={(e) => set({ time: e.target.value })}
                onFocus={(e) => (e.target.type = 'time')}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = 'text';
                }}
                {...field('time')}
              />
              <span
                className="dx-icon-clickable"
                onClick={() => {
                  if (timeInputRef.current) {
                    timeInputRef.current.type = 'time';
                    timeInputRef.current.showPicker();
                  }
                }}
              >
                <Clock size={18} aria-hidden />
              </span>
            </span>
            {errors.time && <em role="alert">{errors.time}</em>}
          </label>

          {/* Duration */}
          <label>
            Duration
            <span className={`dx-input ${errors.duration ? 'dx-input--error' : ''}`}>
              <select
                value={form.duration}
                onChange={(e) => set({ duration: e.target.value })}
                {...field('duration')}
              >
                <option value="" disabled hidden>
                  Select duration
                </option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </span>
            {errors.duration && <em role="alert">{errors.duration}</em>}
          </label>

          {/* Session Type */}
          <label>
            Session Type
            <span className={`dx-input ${errors.sessionType ? 'dx-input--error' : ''}`}>
              {form.sessionType === 'other' ? (
                <input
                  type="text"
                  placeholder="Please type your session type"
                  value={customSessionType}
                  onChange={(e) => setCustomSessionType(e.target.value)}
                  autoFocus
                />
              ) : (
                <select
                  value={form.sessionType}
                  onChange={(e) => set({ sessionType: e.target.value })}
                  {...field('sessionType')}
                >
                  <option value="" disabled hidden>
                    Select session type
                  </option>
                  <option value="medical">Medical / Healthcare</option>
                  <option value="legal">Legal / Court</option>
                  <option value="education">Education / School</option>
                  <option value="social">Social services/community</option>
                  <option value="media">Media/broadcast</option>
                  <option value="conferences">Conferences/events</option>
                  <option value="religious">Religious/church or mosque</option>
                  <option value="police">Police/security</option>
                  <option value="other">Other (please specify)</option>
                </select>
              )}
            </span>
            {errors.sessionType && <em role="alert">{errors.sessionType}</em>}
            {form.sessionType === 'other' && (
              <button
                type="button"
                onClick={() => {
                  set({ sessionType: '' });
                  setCustomSessionType('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#382c77',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginTop: '4px',
                  fontWeight: 600,
                }}
              >
                Back to list
              </button>
            )}
          </label>

          {result === 'saved' && (
            <p className="dx-ok" role="status">
              Session saved successfully!
            </p>
          )}
          {result === 'unavailable' && (
            <p className="dx-notice" role="status">
              We could not save your session. Please try again.
            </p>
          )}

          <button type="submit" className="dx-primary">
            Save Session
          </button>
        </form>

        {/* RIGHT COLUMN: Booking Summary */}
        <aside className="dx-card dx-summary">
          <h2>Booking Summary</h2>
          <p>Please review your session details before saving.</p>

          <div className="dx-summary-list">
            <div className="dx-summary-item">
              <span>Date</span>
              <strong>{form.date || 'Not selected'}</strong>
            </div>
            <div className="dx-summary-item">
              <span>Time</span>
              <strong>{form.time || 'Not selected'}</strong>
            </div>
            <div className="dx-summary-item">
              <span>Duration</span>
              <strong>{form.duration ? `${form.duration} minutes` : 'Not selected'}</strong>
            </div>
            <div className="dx-summary-item">
              <span>Session Type</span>
              <strong>
                {form.sessionType === 'other'
                  ? customSessionType || 'Custom'
                  : form.sessionType || 'Not selected'}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
