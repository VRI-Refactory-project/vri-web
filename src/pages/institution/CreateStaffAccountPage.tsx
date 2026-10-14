// import { useState, type FormEvent } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { ChevronLeft, ChevronDown } from 'lucide-react';
// import './CreateStaffAccountPage.css';

// const DEPARTMENTS = [
//   'Healthcare',
//   'Reception',
//   'Social Services',
//   'IT Support',
//   'Administration',
// ];

// const ROLES = ['Staff', 'Manager', 'Admin'];

// export function CreateStaffAccountPage() {
//   const navigate = useNavigate();
//   const [fullName, setFullName] = useState('');
//   const [email, setEmail] = useState('');
//   const [department, setDepartment] = useState('');
//   const [role, setRole] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   const onSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     // TODO: wire up to backend once connected
//     // await createStaff({ fullName, email, department, role });
//     // Then navigate back to staff list:
//     setTimeout(() => {
//       setSubmitting(false);
//       navigate('/dashboard/institution/staff');
//     }, 800);
//   };

//   return (
//     <>
//       {/* Back link */}
//       <Link to="/dashboard/institution/staff" className="csa-back">
//         <ChevronLeft size={16} /> Back
//       </Link>

//       {/* Page header */}
//       <div className="csa-header">
//         <h1>Create staff account</h1>
//         <p>Add a new staff member and assign their department and role.</p>
//       </div>

//       {/* Form card */}
//       <div className="csa-card">
//         <form onSubmit={onSubmit} noValidate>
//           <div className="csa-field">
//             <label htmlFor="csa-name">Full name</label>
//             <input
//               id="csa-name"
//               type="text"
//               placeholder="Enter name"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//             />
//           </div>

//           <div className="csa-field">
//             <label htmlFor="csa-email">Work email</label>
//             <input
//               id="csa-email"
//               type="email"
//               placeholder="name@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//           </div>

//           <div className="csa-field">
//             <label htmlFor="csa-dept">Department</label>
//             <div className="csa-select-wrap">
//               <select
//                 id="csa-dept"
//                 value={department}
//                 onChange={(e) => setDepartment(e.target.value)}
//               >
//                 <option value="">Select department</option>
//                 {DEPARTMENTS.map((d) => (
//                   <option key={d} value={d}>
//                     {d}
//                   </option>
//                 ))}
//               </select>
//               <ChevronDown size={16} className="csa-select-icon" />
//             </div>
//           </div>

//           <div className="csa-field">
//             <label htmlFor="csa-role">Role</label>
//             <div className="csa-select-wrap">
//               <select
//                 id="csa-role"
//                 value={role}
//                 onChange={(e) => setRole(e.target.value)}
//               >
//                 <option value="">Select role</option>
//                 {ROLES.map((r) => (
//                   <option key={r} value={r}>
//                     {r}
//                   </option>
//                 ))}
//               </select>
//               <ChevronDown size={16} className="csa-select-icon" />
//             </div>
//           </div>

//           <button type="submit" className="csa-submit" disabled={submitting}>
//             {submitting ? 'Creating...' : 'Create account'}
//           </button>
//         </form>
//       </div>
//     </>
//   );
// }


import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import {
  collectErrors,
  validateEmail,
  validateName,
} from '../../lib/validation';
import './CreateStaffAccountPage.css';

const DEPARTMENTS = [
  'Healthcare',
  'Reception',
  'Social Services',
  'IT Support',
  'Administration',
];

const ROLES = ['Staff', 'Manager', 'Admin'];

type FieldName = 'fullName' | 'email' | 'department' | 'role';
const FIELD_ORDER: FieldName[] = ['fullName', 'email', 'department', 'role'];

export function CreateStaffAccountPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    department: '',
    role: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>();

  // An error shows once the person leaves the field, or tries to submit.
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (name: FieldName) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  // Uses the team's shared validators. Worked out every render so submit never reads stale state.
  const errors = collectErrors<FieldName>({
    fullName: validateName(form.fullName, 'the staff member’s full name'),
    email: validateEmail(form.email, { required: true }),
    department: form.department ? undefined : 'Select a department.',
    role: form.role ? undefined : 'Select a role.',
  });

  const shown = (name: FieldName) =>
    touched[name] || submitted ? errors[name] : undefined;
  const touch = (name: FieldName) => () =>
    setTouched((t) => ({ ...t, [name]: true }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(undefined);
    setSubmitted(true);

    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      document.getElementById(`csa-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      // TODO: replace with your real API call once the backend is connected:
      // await createStaffAccount(form);
      await new Promise((r) => setTimeout(r, 800));
      navigate('/dashboard/institution/staff');
    } catch {
      setServerError('Could not create the account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Link to="/dashboard/institution/staff" className="csa-back">
        <ChevronLeft size={16} /> Back
      </Link>

      <div className="csa-header">
        <h1>Create staff account</h1>
        <p>Add a new staff member and assign their department and role.</p>
      </div>

      <div className="csa-card">
        <form onSubmit={onSubmit} noValidate>
          {/* Full name */}
          <div className="csa-field">
            <label htmlFor="csa-fullName">Full name</label>
            <input
              id="csa-fullName"
              type="text"
              placeholder="Enter name"
              autoComplete="name"
              value={form.fullName}
              onChange={set('fullName')}
              onBlur={touch('fullName')}
              aria-invalid={shown('fullName') ? true : undefined}
              aria-describedby={shown('fullName') ? 'csa-fullName-error' : undefined}
              className={shown('fullName') ? 'csa-input csa-input--error' : 'csa-input'}
            />
            {shown('fullName') && (
              <p className="csa-field-error" id="csa-fullName-error">
                {shown('fullName')}
              </p>
            )}
          </div>

          {/* Work email */}
          <div className="csa-field">
            <label htmlFor="csa-email">Work email</label>
            <input
              id="csa-email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              onBlur={touch('email')}
              aria-invalid={shown('email') ? true : undefined}
              aria-describedby={shown('email') ? 'csa-email-error' : undefined}
              className={shown('email') ? 'csa-input csa-input--error' : 'csa-input'}
            />
            {shown('email') && (
              <p className="csa-field-error" id="csa-email-error">
                {shown('email')}
              </p>
            )}
          </div>

          {/* Department */}
          <div className="csa-field">
            <label htmlFor="csa-department">Department</label>
            <div className="csa-select-wrap">
              <select
                id="csa-department"
                value={form.department}
                onChange={set('department')}
                onBlur={touch('department')}
                aria-invalid={shown('department') ? true : undefined}
                aria-describedby={shown('department') ? 'csa-department-error' : undefined}
                className={shown('department') ? 'csa-input csa-input--error' : 'csa-input'}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="csa-select-icon" />
            </div>
            {shown('department') && (
              <p className="csa-field-error" id="csa-department-error">
                {shown('department')}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="csa-field">
            <label htmlFor="csa-role">Role</label>
            <div className="csa-select-wrap">
              <select
                id="csa-role"
                value={form.role}
                onChange={set('role')}
                onBlur={touch('role')}
                aria-invalid={shown('role') ? true : undefined}
                aria-describedby={shown('role') ? 'csa-role-error' : undefined}
                className={shown('role') ? 'csa-input csa-input--error' : 'csa-input'}
              >
                <option value="">Select role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="csa-select-icon" />
            </div>
            {shown('role') && (
              <p className="csa-field-error" id="csa-role-error">
                {shown('role')}
              </p>
            )}
          </div>

          {serverError && (
            <p className="csa-server-error" role="alert">
              {serverError}
            </p>
          )}

          <button type="submit" className="csa-submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </div>
    </>
  );
}