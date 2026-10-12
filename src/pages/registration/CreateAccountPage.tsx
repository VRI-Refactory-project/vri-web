import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, Award, ChevronRight } from 'lucide-react';
import logo from '../../assets/no_background_logo.png';
import backgroundImage from '../../assets/background_image.png';
import { useAuth } from '../../hooks/useAuth';
import { dashboardPathFor } from '../../features/auth/roles';
import {
  clearStagedCertificates,
  stagedCertificates,
  unstageCertificate,
} from '../../features/registration/stagedCertificates';
import { describeError } from '../../services/api';
import { uploadCertificate } from '../../services/certifications';
import {
  registerDeaf,
  registerInterpreter,
  type Specialisation,
} from '../../services/registration';
import './CreateAccountPage.css';

// V2-001 / V2-002 (deaf) and V2-003 (interpreter): the shared sign-up page.
// Deaf users: name, phone, optional email, password. Interpreters also give a required email and
// a specialisation, and arrive here after choosing their certificates, which are uploaded as
// soon as the account exists.

const SPECIALISATIONS: { value: Specialisation; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'LEGAL', label: 'Legal' },
];

function field(
  id: string,
  label: string,
  icon: ReactNode,
  input: InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <div className="ca-field">
      <label className="ca-label" htmlFor={id}>
        {label}
      </label>
      <div className="ca-input-wrap">
        <span className="ca-input-icon">{icon}</span>
        <input id={id} className="ca-input" {...input} />
      </div>
    </div>
  );
}

interface Props {
  role?: 'deaf' | 'interpreter';
}

export function CreateAccountPage({ role = 'deaf' }: Props) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isInterpreter = role === 'interpreter';
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [specialisation, setSpecialisation] = useState<Specialisation>('GENERAL');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  // Once the account exists, a retry must only upload what is left, never register again.
  const [accountCreated, setAccountCreated] = useState(false);
  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // An interpreter who has not chosen certificates (or reloaded the page) starts from that step.
  if (isInterpreter && !accountCreated && stagedCertificates().length === 0) {
    return <Navigate to="/register/interpreter" replace />;
  }

  const uploadStaged = async () => {
    for (const entry of [...stagedCertificates()]) {
      await uploadCertificate({
        file: entry.file as File,
        type: entry.type,
        organisation: entry.organisation.trim(),
      });
      unstageCertificate(entry.id);
    }
    clearStagedCertificates();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!accountCreated) {
      if (!form.name.trim() || !form.phone.trim() || !form.password) {
        setError('Enter your name, phone number and a password.');
        return;
      }
      if (isInterpreter && !form.email.trim()) {
        setError('Enter your email address. We use it to contact you about your application.');
        return;
      }
    }

    setSubmitting(true);
    // State updates are not visible inside this call, so track "created" locally for the catch.
    let created = accountCreated;
    try {
      if (!created) {
        const session = isInterpreter
          ? await registerInterpreter({ ...form, specialisation })
          : await registerDeaf(form);
        login(session);
        created = true;
        setAccountCreated(true);
        if (!isInterpreter) {
          navigate(dashboardPathFor(session.user.role), { replace: true });
          return;
        }
      }
      await uploadStaged();
      navigate('/register/pending', { replace: true });
    } catch (err) {
      const reason = describeError(err);
      setError(
        created
          ? `Your account was created, but a certificate did not upload: ${reason} Try again.`
          : reason,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ca-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <Link to="/" className="ca-logo">
        <img src={logo} alt="SignConnect" />
      </Link>

      <Link to={isInterpreter ? '/register/interpreter' : '/get-started'} className="ca-back">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="ca-card">
        <h1 className="ca-title">Create your account</h1>
        <p className="ca-subtitle">Watch the video for help in sign language.</p>

        <form onSubmit={onSubmit} noValidate>
          {field('ca-name', 'Full name', <User size={16} />, {
            type: 'text',
            autoComplete: 'name',
            placeholder: 'Your full name',
            value: form.name,
            onChange: set('name'),
            disabled: accountCreated,
          })}
          {field('ca-phone', 'Phone number', <Phone size={16} />, {
            type: 'tel',
            autoComplete: 'tel',
            placeholder: '0772 123 456',
            value: form.phone,
            onChange: set('phone'),
            disabled: accountCreated,
          })}
          {field(
            'ca-email',
            isInterpreter ? 'Email address' : 'Email address (optional)',
            <Mail size={16} />,
            {
              type: 'email',
              autoComplete: 'email',
              placeholder: 'name@example.com',
              value: form.email,
              onChange: set('email'),
              disabled: accountCreated,
            },
          )}
          {!isInterpreter && (
            <p className="ca-hint">
              An email lets you reset your password yourself. Without one you will need our help.
            </p>
          )}

          {isInterpreter && (
            <div className="ca-field">
              <label className="ca-label" htmlFor="ca-specialisation">
                Specialisation
              </label>
              <div className="ca-input-wrap">
                <span className="ca-input-icon">
                  <Award size={16} />
                </span>
                <select
                  id="ca-specialisation"
                  className="ca-input"
                  value={specialisation}
                  disabled={accountCreated}
                  onChange={(e) => setSpecialisation(e.target.value as Specialisation)}
                >
                  {SPECIALISATIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-password">
              Password
            </label>
            <div className="ca-input-wrap">
              <span className="ca-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="ca-password"
                className="ca-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                disabled={accountCreated}
              />
              <button
                type="button"
                className="ca-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="ca-terms">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
            </span>
          </label>

          {error && (
            <p className="ca-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="ca-submit" disabled={submitting}>
            {submitting ? 'Please wait...' : accountCreated ? 'Try upload again' : 'Create account'}{' '}
            <ChevronRight size={18} />
          </button>
        </form>

        <p className="ca-footer">
          Have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      </div>

      <div className="ca-welcome">
        <div className="ca-welcome-text">
          Welcome! I'll walk you through creating your account, one step at a time.
        </div>
      </div>

      <div className="ca-step">
        <div className="ca-progress">
          <span className="ca-progress-segment active" />
          <span className="ca-progress-segment active" />
          <span className={`ca-progress-segment${isInterpreter ? ' active' : ''}`} />
        </div>
        <p className="ca-step-text">Step {isInterpreter ? 3 : 2} of 3</p>
      </div>
    </div>
  );
}

// import {
//   useState,
//   useRef,
//   type FormEvent,
//   type InputHTMLAttributes,
//   type ReactNode,
// } from 'react';
// import { Link, Navigate, useNavigate } from 'react-router-dom';
// import {
//   ArrowLeft,
//   User,
//   Mail,
//   Phone,
//   Lock,
//   Eye,
//   EyeOff,
//   Award,
//   ChevronRight,
// } from 'lucide-react';
// import logo from '../../assets/no_background_logo.png';
// import backgroundImage from '../../assets/background_image.png';
// import { useAuth } from '../../hooks/useAuth';
// import { dashboardPathFor } from '../../features/auth/roles';
// import {
//   clearStagedCertificates,
//   stagedCertificates,
//   unstageCertificate,
// } from '../../features/registration/stagedCertificates';
// import { describeError } from '../../services/api';
// import { uploadCertificate } from '../../services/certifications';
// import {
//   registerDeaf,
//   registerInterpreter,
//   type Specialisation,
// } from '../../services/registration';
// import './CreateAccountPage.css';

// const SPECIALISATIONS: { value: Specialisation; label: string }[] = [
//   { value: 'GENERAL', label: 'General' },
//   { value: 'MEDICAL', label: 'Medical' },
//   { value: 'LEGAL', label: 'Legal' },
// ];

// function field(
//   id: string,
//   label: string,
//   icon: ReactNode,
//   input: InputHTMLAttributes<HTMLInputElement>,
// ) {
//   return (
//     <div className="ca-field">
//       <label className="ca-label" htmlFor={id}>
//         {label}
//       </label>
//       <div className="ca-input-wrap">
//         <span className="ca-input-icon">{icon}</span>
//         <input id={id} className="ca-input" {...input} />
//       </div>
//     </div>
//   );
// }

// function formatTime(seconds: number) {
//   if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
//   const m = Math.floor(seconds / 60);
//   const s = Math.floor(seconds % 60);
//   return `${m}:${s.toString().padStart(2, '0')}`;
// }

// interface Props {
//   role?: 'deaf' | 'interpreter';
// }

// export function CreateAccountPage({ role = 'deaf' }: Props) {
//   const navigate = useNavigate();
//   const { login } = useAuth();
//   const isInterpreter = role === 'interpreter';
//   const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
//   const [specialisation, setSpecialisation] = useState<Specialisation>('GENERAL');
//   const [showPassword, setShowPassword] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string>();
//   const [accountCreated, setAccountCreated] = useState(false);

//   // Floating placeholder-video state
//   const [videoDismissed, setVideoDismissed] = useState(false);
//   const [videoProgress, setVideoProgress] = useState(0);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const videoRef = useRef<HTMLVideoElement>(null);

//   const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
//     setForm((f) => ({ ...f, [field]: e.target.value }));

//   if (isInterpreter && !accountCreated && stagedCertificates().length === 0) {
//     return <Navigate to="/register/interpreter" replace />;
//   }

//   const uploadStaged = async () => {
//     for (const entry of [...stagedCertificates()]) {
//       await uploadCertificate({
//         file: entry.file as File,
//         type: entry.type,
//         organisation: entry.organisation.trim(),
//       });
//       unstageCertificate(entry.id);
//     }
//     clearStagedCertificates();
//   };

//   const onSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(undefined);
//     if (!accountCreated) {
//       if (!form.name.trim() || !form.phone.trim() || !form.password) {
//         setError('Enter your name, phone number and a password.');
//         return;
//       }
//       if (isInterpreter && !form.email.trim()) {
//         setError('Enter your email address. We use it to contact you about your application.');
//         return;
//       }
//     }

//     setSubmitting(true);
//     let created = accountCreated;
//     try {
//       if (!created) {
//         const session = isInterpreter
//           ? await registerInterpreter({ ...form, specialisation })
//           : await registerDeaf(form);
//         login(session);
//         created = true;
//         setAccountCreated(true);
//         if (!isInterpreter) {
//           navigate(dashboardPathFor(session.user.role), { replace: true });
//           return;
//         }
//       }
//       await uploadStaged();
//       navigate('/register/pending', { replace: true });
//     } catch (err) {
//       const reason = describeError(err);
//       setError(
//         created
//           ? `Your account was created, but a certificate did not upload: ${reason} Try again.`
//           : reason,
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const currentTime = videoRef.current?.currentTime ?? 0;

//   return (
//     <div className="ca-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
//       <Link to="/" className="ca-logo">
//         <img src={logo} alt="SignConnect" />
//       </Link>

//       <Link to={isInterpreter ? '/register/interpreter' : '/get-started'} className="ca-back">
//         <ArrowLeft size={16} /> Back
//       </Link>

//       <div className="ca-card">
//         <h1 className="ca-title">Create your account</h1>
//         <p className="ca-subtitle">Watch the video for help in sign language.</p>

//         <form onSubmit={onSubmit} noValidate>
//           {field('ca-name', 'Full name', <User size={16} />, {
//             type: 'text',
//             autoComplete: 'name',
//             placeholder: 'Your full name',
//             value: form.name,
//             onChange: set('name'),
//             disabled: accountCreated,
//           })}
//           {field('ca-phone', 'Phone number', <Phone size={16} />, {
//             type: 'tel',
//             autoComplete: 'tel',
//             placeholder: '0772 123 456',
//             value: form.phone,
//             onChange: set('phone'),
//             disabled: accountCreated,
//           })}
//           {field(
//             'ca-email',
//             isInterpreter ? 'Email address' : 'Email address (optional)',
//             <Mail size={16} />,
//             {
//               type: 'email',
//               autoComplete: 'email',
//               placeholder: 'name@example.com',
//               value: form.email,
//               onChange: set('email'),
//               disabled: accountCreated,
//             },
//           )}
//           {!isInterpreter && (
//             <p className="ca-hint">
//               An email lets you reset your password yourself. Without one you will need our help.
//             </p>
//           )}

//           {isInterpreter && (
//             <div className="ca-field">
//               <label className="ca-label" htmlFor="ca-specialisation">
//                 Specialisation
//               </label>
//               <div className="ca-input-wrap">
//                 <span className="ca-input-icon">
//                   <Award size={16} />
//                 </span>
//                 <select
//                   id="ca-specialisation"
//                   className="ca-input"
//                   value={specialisation}
//                   disabled={accountCreated}
//                   onChange={(e) => setSpecialisation(e.target.value as Specialisation)}
//                 >
//                   {SPECIALISATIONS.map((o) => (
//                     <option key={o.value} value={o.value}>
//                       {o.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           )}

//           <div className="ca-field">
//             <label className="ca-label" htmlFor="ca-password">
//               Password
//             </label>
//             <div className="ca-input-wrap">
//               <span className="ca-input-icon">
//                 <Lock size={16} />
//               </span>
//               <input
//                 id="ca-password"
//                 className="ca-input"
//                 type={showPassword ? 'text' : 'password'}
//                 placeholder="••••••••"
//                 autoComplete="new-password"
//                 value={form.password}
//                 onChange={set('password')}
//                 disabled={accountCreated}
//               />
//               <button
//                 type="button"
//                 className="ca-input-toggle"
//                 onClick={() => setShowPassword((v) => !v)}
//                 aria-label={showPassword ? 'Hide password' : 'Show password'}
//               >
//                 {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//               </button>
//             </div>
//           </div>

//           <label className="ca-terms">
//             <input type="checkbox" required />
//             <span>
//               I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
//             </span>
//           </label>

//           {error && (
//             <p className="ca-error" role="alert">
//               {error}
//             </p>
//           )}

//           <button type="submit" className="ca-submit" disabled={submitting}>
//             {submitting ? 'Please wait...' : accountCreated ? 'Try upload again' : 'Create account'}{' '}
//             <ChevronRight size={18} />
//           </button>
//         </form>

//         <p className="ca-footer">
//           Have an account? <Link to="/sign-in">Sign in</Link>
//         </p>
//       </div>

//       <div className="ca-welcome">
//         <div className="ca-welcome-text">
//           Welcome! I'll walk you through creating your account, one step at a time.
//         </div>
//       </div>

//       <div className="ca-step">
//         <div className="ca-progress">
//           <span className="ca-progress-segment active" />
//           <span className="ca-progress-segment active" />
//           <span className={`ca-progress-segment${isInterpreter ? ' active' : ''}`} />
//         </div>
//         <p className="ca-step-text">Step {isInterpreter ? 3 : 2} of 3</p>
//       </div>

//       {/* ── Floating placeholder video ───────────────────────────── */}
//       {!videoDismissed && (
//         <div className="ca-video-placeholder">
//           <button
//             type="button"
//             className="ca-video-close"
//             onClick={() => setVideoDismissed(true)}
//             aria-label="Close video"
//           >
//             ×
//           </button>

//           <video
//             ref={videoRef}
//             className="ca-video"
//             src="/videos/placeholder.mp4"
//             autoPlay
//             loop
//             muted
//             playsInline
//             onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
//             onTimeUpdate={(e) => {
//               const v = e.currentTarget;
//               if (v.duration) setVideoProgress((v.currentTime / v.duration) * 100);
//             }}
//           />

//           <div className="ca-video-controls">
//             <span className="ca-video-time">
//               {formatTime(currentTime)} / {formatTime(videoDuration)}
//             </span>
//             <div className="ca-video-progress">
//               <div
//                 className="ca-video-progress-fill"
//                 style={{ width: `${videoProgress}%` }}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
