// import { useState, useRef, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { User, Mail, Lock, Eye, EyeOff, Award, ChevronRight } from 'lucide-react';
// import { AuthShell } from '../../components/AuthShell';
// import { PhoneField } from '../../components/PhoneField';
// import { FLOWS } from '../../features/registration/flows';
// import { useAuth } from '../../hooks/useAuth';
// import {
//   collectErrors,
//   validateEmail,
//   validateName,
//   validatePassword,
//   validatePhoneNumber,
// } from '../../lib/validation';
// import { describeError } from '../../services/api';
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
//   { value: 'EDUCATION', label: 'Education' },
//   { value: 'RELIGIOUS', label: 'Religious' },
//   { value: 'SECURITY', label: 'Security' },
//   { value: 'OTHER', label: 'Other (please specify)' }, 
// ];

// type FieldName = 'firstname' | 'lastname' | 'phone' | 'email' | 'password' | 'terms';
// const FIELD_ORDER: FieldName[] = ['firstname', 'lastname', 'phone', 'email', 'password', 'terms'];

// function field(
//   id: string,
//   label: string,
//   icon: ReactNode,
//   input: InputHTMLAttributes<HTMLInputElement>,
//   error?: string,
// ) {
//   const errorId = `${id}-error`;
//   return (
//     <div className="ca-field">
//       <label className="ca-label" htmlFor={id}>
//         {label}
//       </label>
//       <div className="ca-input-wrap">
//         <span className="ca-input-icon">{icon}</span>
//         <input
//           id={id}
//           className={error ? 'ca-input ca-input--error' : 'ca-input'}
//           aria-invalid={error ? true : undefined}
//           aria-describedby={error ? errorId : undefined}
//           {...input}
//         />
//       </div>
//       {error && (
//         <p className="field-error" id={errorId}>
//           {error}
//         </p>
//       )}
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
//   const [form, setForm] = useState({
//     firstname: '',
//     lastname: '',
//     phone: '',
//     email: '',
//     password: '',
//   });
//   const [agreed, setAgreed] = useState(false);
//   const [specialisation, setSpecialisation] = useState<Specialisation>('GENERAL');
//     const [customSpecialisation, setCustomSpecialisation] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string>();
//   const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
//   const [submitted, setSubmitted] = useState(false);

//   const [videoDismissed, setVideoDismissed] = useState(false);
//   const [videoProgress, setVideoProgress] = useState(0);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [currentTime, setCurrentTime] = useState(0);
//   const videoRef = useRef<HTMLVideoElement>(null);

//   const set = (name: keyof typeof form) => (e: { target: { value: string } }) =>
//     setForm((f) => ({ ...f, [name]: e.target.value }));

//   const errors = collectErrors<FieldName>({
//     firstname: validateName(form.firstname, 'your first name'),
//     lastname: validateName(form.lastname, 'your last name'),
//     phone: validatePhoneNumber(form.phone),
//     email: validateEmail(form.email, { required: true }),
//     password: validatePassword(form.password),
//     terms: agreed ? undefined : 'Accept the Terms and Privacy Policy to continue.',
//   });
//   const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);
//   const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

//   const onSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(undefined);
//     setSubmitted(true);
//     const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
//     if (firstInvalid) {
//       document.getElementById(`ca-${firstInvalid}`)?.focus();
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const registrationData = {
//         name: `${form.firstname.trim()} ${form.lastname.trim()}`,
//         phone: form.phone,
//         email: form.email,
//         password: form.password,
//       };

//        // Determine what to send for specialisation
//       const finalSpecialisation = specialisation === 'OTHER' 
//         ? customSpecialisation.trim() 
//         : specialisation;

//       const session = isInterpreter
//         ? await registerInterpreter({ ...registrationData, specialisation })
//         : await registerDeaf(registrationData);
//       login(session);
//       navigate(isInterpreter ? '/register/interpreter/certifications' : '/register/welcome', {
//         replace: true,
//       });
//     } catch (err) {
//       setError(describeError(err));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <AuthShell
//       backTo="/get-started"
//       steps={isInterpreter ? FLOWS.interpreter : FLOWS.deaf}
//       current={2}
//     >
//       {!videoDismissed && (
//         <div className="ca-video-widget">
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
//               setCurrentTime(v.currentTime);
//             }}
//           />
//           <div className="ca-video-caption">Watch the video for help in sign language</div>
//           <div className="ca-video-controls">
//             <span className="ca-video-time">
//               {formatTime(currentTime)} / {formatTime(videoDuration)}
//             </span>
//             <div className="ca-video-progress">
//               <div className="ca-video-progress-fill" style={{ width: `${videoProgress}%` }} />
//             </div>
//           </div>
//         </div>
//       )}

//       <h1 className="ca-title">Create your account</h1>
//       <p className="ca-subtitle">Watch the video for help in sign language.</p>

//       <form onSubmit={onSubmit} noValidate className="ca-form">
//         {/* Row: First name | Last name */}
//         <div className="ca-row">
//           {field(
//             'ca-firstname',
//             'First name',
//             <User size={16} />,
//             {
//               type: 'text',
//               autoComplete: 'given-name',
//               placeholder: 'Your first name',
//               value: form.firstname,
//               onChange: set('firstname'),
//               onBlur: touch('firstname'),
//             },
//             shown('firstname'),
//           )}

//           {field(
//             'ca-lastname',
//             'Last name',
//             <User size={16} />,
//             {
//               type: 'text',
//               autoComplete: 'family-name',
//               placeholder: 'Your last name',
//               value: form.lastname,
//               onChange: set('lastname'),
//               onBlur: touch('lastname'),
//             },
//             shown('lastname'),
//           )}
//         </div>

//         {/* Row: Phone | Email */}
//         <div className="ca-row">
//           <div className="ca-field">
//             <label className="ca-label" htmlFor="ca-phone">
//               Phone number
//             </label>
//             <PhoneField
//               id="ca-phone"
//               value={form.phone}
//               onChange={(phone) => setForm((f) => ({ ...f, phone }))}
//               onBlur={touch('phone')}
//               invalid={Boolean(shown('phone'))}
//               errorId={shown('phone') ? 'ca-phone-error' : undefined}
//             />
//             {shown('phone') && (
//               <p className="field-error" id="ca-phone-error">
//                 {shown('phone')}
//               </p>
//             )}
//           </div>

//           {field(
//             'ca-email',
//             'Email address',
//             <Mail size={16} />,
//             {
//               type: 'email',
//               autoComplete: 'email',
//               placeholder: 'name@example.com',
//               value: form.email,
//               onChange: set('email'),
//               onBlur: touch('email'),
//             },
//             shown('email'),
//           )}
//         </div>

//         {isInterpreter && (
//           <div className="ca-field">
//             <label className="ca-label" htmlFor="ca-specialisation">
//               Specialisation
//             </label>
//             <div className="ca-input-wrap">
//               <span className="ca-input-icon">
//                 <Award size={16} />
//               </span>
//               <select
//                 id="ca-specialisation"
//                 className="ca-input"
//                 value={specialisation}
//                 onChange={(e) => setSpecialisation(e.target.value as Specialisation)}
//               >
//                 {SPECIALISATIONS.map((o) => (
//                   <option key={o.value} value={o.value}>
//                     {o.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* NEW: Show this input only if "Other" is selected */}
//             {specialisation === 'OTHER' && (
//               <div className="ca-field" style={{ marginTop: '-10px' }}>
//                 <label className="ca-label" htmlFor="ca-custom-specialisation">
//                   Please specify your specialisation
//                 </label>
//                 <div className="ca-input-wrap">
//                   <span className="ca-input-icon">
//                     <Award size={16} />
//                   </span>
//                   <input
//                     id="ca-custom-specialisation"
//                     type="text"
//                     className="ca-input"
//                     placeholder="e.g. Veterinary, Legal Aid..."
//                     value={customSpecialisation}
//                     onChange={(e) => setCustomSpecialisation(e.target.value)}
//                     required
//                   />
//                 </div>
//               </div>
//             )}

//         )}
        

//         <div className="ca-field">
//           <label className="ca-label" htmlFor="ca-password">
//             Password
//           </label>
//           <div className="ca-input-wrap">
//             <span className="ca-input-icon">
//               <Lock size={16} />
//             </span>
//             <input
//               id="ca-password"
//               className={shown('password') ? 'ca-input ca-input--error' : 'ca-input'}
//               type={showPassword ? 'text' : 'password'}
//               placeholder="••••••••"
//               autoComplete="new-password"
//               aria-invalid={shown('password') ? true : undefined}
//               aria-describedby={shown('password') ? 'ca-password-error' : undefined}
//               value={form.password}
//               onChange={set('password')}
//               onBlur={touch('password')}
//             />
//             <button
//               type="button"
//               className="ca-input-toggle"
//               onClick={() => setShowPassword((v) => !v)}
//               aria-label={showPassword ? 'Hide password' : 'Show password'}
//             >
//               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//           {shown('password') && (
//             <p className="field-error" id="ca-password-error">
//               {shown('password')}
//             </p>
//           )}
//         </div>

//         <div className="ca-field">
//           <label className="ca-terms">
//             <input
//               id="ca-terms"
//               type="checkbox"
//               checked={agreed}
//               aria-invalid={shown('terms') ? true : undefined}
//               aria-describedby={shown('terms') ? 'ca-terms-error' : undefined}
//               onChange={(e) => setAgreed(e.target.checked)}
//               onBlur={touch('terms')}
//             />
//             <span>
//               I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
//             </span>
//           </label>
//           {shown('terms') && (
//             <p className="field-error" id="ca-terms-error">
//               {shown('terms')}
//             </p>
//           )}
//         </div>

//         {error && (
//           <p className="form-error" role="alert">
//             {error}
//           </p>
//         )}

//         <button type="submit" className="ca-submit" disabled={submitting}>
//           {submitting ? 'Please wait...' : 'Create account'} <ChevronRight size={18} />
//         </button>
//       </form>

//       <p className="ca-footer">
//         Have an account? <Link to="/sign-in">Sign in</Link>
//       </p>
//     </AuthShell>
//   );
// }



// import { useState, useRef, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { User, Mail, Lock, Eye, EyeOff, Award, ChevronRight } from 'lucide-react';
// import { AuthShell } from '../../components/AuthShell';
// import { PhoneField } from '../../components/PhoneField';
// import { FLOWS } from '../../features/registration/flows';
// import { useAuth } from '../../hooks/useAuth';
// import {
//   collectErrors,
//   validateEmail,
//   validateName,
//   validatePassword,
//   validatePhoneNumber,
// } from '../../lib/validation';
// import { describeError } from '../../services/api';
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
//   { value: 'EDUCATION', label: 'Education' },
//   { value: 'RELIGIOUS', label: 'Religious' },
//   { value: 'SECURITY', label: 'Security' },
//   { value: 'OTHER', label: 'Other (please specify)' }, 
// ];

// type FieldName = 'firstname' | 'lastname' | 'phone' | 'email' | 'password' | 'terms';
// const FIELD_ORDER: FieldName[] = ['firstname', 'lastname', 'phone', 'email', 'password', 'terms'];

// function field(
//   id: string,
//   label: string,
//   icon: ReactNode,
//   input: InputHTMLAttributes<HTMLInputElement>,
//   error?: string,
// ) {
//   const errorId = `${id}-error`;
//   return (
//     <div className="ca-field">
//       <label className="ca-label" htmlFor={id}>
//         {label}
//       </label>
//       <div className="ca-input-wrap">
//         <span className="ca-input-icon">{icon}</span>
//         <input
//           id={id}
//           className={error ? 'ca-input ca-input--error' : 'ca-input'}
//           aria-invalid={error ? true : undefined}
//           aria-describedby={error ? errorId : undefined}
//           {...input}
//         />
//       </div>
//       {error && (
//         <p className="field-error" id={errorId}>
//           {error}
//         </p>
//       )}
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
//   const [form, setForm] = useState({
//     firstname: '',
//     lastname: '',
//     phone: '',
//     email: '',
//     password: '',
//   });
//   const [agreed, setAgreed] = useState(false);
//   const [specialisation, setSpecialisation] = useState<Specialisation>('GENERAL');
//   const [customSpecialisation, setCustomSpecialisation] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string>();
//   const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
//   const [submitted, setSubmitted] = useState(false);

//   const [videoDismissed, setVideoDismissed] = useState(false);
//   const [videoProgress, setVideoProgress] = useState(0);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [currentTime, setCurrentTime] = useState(0);
//   const videoRef = useRef<HTMLVideoElement>(null);

//   const set = (name: keyof typeof form) => (e: { target: { value: string } }) =>
//     setForm((f) => ({ ...f, [name]: e.target.value }));

//   const errors = collectErrors<FieldName>({
//     firstname: validateName(form.firstname, 'your first name'),
//     lastname: validateName(form.lastname, 'your last name'),
//     phone: validatePhoneNumber(form.phone),
//     email: validateEmail(form.email, { required: true }),
//     password: validatePassword(form.password),
//     terms: agreed ? undefined : 'Accept the Terms and Privacy Policy to continue.',
//   });
//   const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);
//   const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

//   const onSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(undefined);
//     setSubmitted(true);
//     const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
//     if (firstInvalid) {
//       document.getElementById(`ca-${firstInvalid}`)?.focus();
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const registrationData = {
//         name: `${form.firstname.trim()} ${form.lastname.trim()}`,
//         phone: form.phone,
//         email: form.email,
//         password: form.password,
//       };

//       // Determine what to send for specialisation
//       const finalSpecialisation = specialisation === 'OTHER' 
//         ? customSpecialisation.trim() 
//         : specialisation;

//       const session = isInterpreter
//         ? await registerInterpreter({ ...registrationData,  specialisation: finalSpecialisation as Specialisation })
//         : await registerDeaf(registrationData);
        
//       login(session);
//       navigate(isInterpreter ? '/register/interpreter/certifications' : '/register/welcome', {
//         replace: true,
//       });
//     } catch (err) {
//       setError(describeError(err));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <AuthShell
//       backTo="/get-started"
//       steps={isInterpreter ? FLOWS.interpreter : FLOWS.deaf}
//       current={2}
//     >
//       {!videoDismissed && (
//         <div className="ca-video-widget">
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
//               setCurrentTime(v.currentTime);
//             }}
//           />
//           <div className="ca-video-caption">Watch the video for help in sign language</div>
//           <div className="ca-video-controls">
//             <span className="ca-video-time">
//               {formatTime(currentTime)} / {formatTime(videoDuration)}
//             </span>
//             <div className="ca-video-progress">
//               <div className="ca-video-progress-fill" style={{ width: `${videoProgress}%` }} />
//             </div>
//           </div>
//         </div>
//       )}

//       <h1 className="ca-title">Create your account</h1>
//       <p className="ca-subtitle">Watch the video for help in sign language.</p>

//       <form onSubmit={onSubmit} noValidate className="ca-form">
//         {/* Row: First name | Last name */}
//         <div className="ca-row">
//           {field(
//             'ca-firstname',
//             'First name',
//             <User size={16} />,
//             {
//               type: 'text',
//               autoComplete: 'given-name',
//               placeholder: 'Your first name',
//               value: form.firstname,
//               onChange: set('firstname'),
//               onBlur: touch('firstname'),
//             },
//             shown('firstname'),
//           )}

//           {field(
//             'ca-lastname',
//             'Last name',
//             <User size={16} />,
//             {
//               type: 'text',
//               autoComplete: 'family-name',
//               placeholder: 'Your last name',
//               value: form.lastname,
//               onChange: set('lastname'),
//               onBlur: touch('lastname'),
//             },
//             shown('lastname'),
//           )}
//         </div>

//         {/* Row: Phone | Email */}
//         <div className="ca-row">
//           <div className="ca-field">
//             <label className="ca-label" htmlFor="ca-phone">
//               Phone number
//             </label>
//             <PhoneField
//               id="ca-phone"
//               value={form.phone}
//               onChange={(phone) => setForm((f) => ({ ...f, phone }))}
//               onBlur={touch('phone')}
//               invalid={Boolean(shown('phone'))}
//               errorId={shown('phone') ? 'ca-phone-error' : undefined}
//             />
//             {shown('phone') && (
//               <p className="field-error" id="ca-phone-error">
//                 {shown('phone')}
//               </p>
//             )}
//           </div>

//           {field(
//             'ca-email',
//             'Email address',
//             <Mail size={16} />,
//             {
//               type: 'email',
//               autoComplete: 'email',
//               placeholder: 'name@example.com',
//               value: form.email,
//               onChange: set('email'),
//               onBlur: touch('email'),
//             },
//             shown('email'),
//           )}
//         </div>

//         {isInterpreter && (
//           <>
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

//             {/* NEW: Show this input only if "Other" is selected */}
//             {specialisation === 'OTHER' && (
//               <div className="ca-field" style={{ marginTop: '-10px' }}>
//                 <label className="ca-label" htmlFor="ca-custom-specialisation">
//                   Please specify your specialisation
//                 </label>
//                 <div className="ca-input-wrap">
//                   <span className="ca-input-icon">
//                     <Award size={16} />
//                   </span>
//                   <input
//                     id="ca-custom-specialisation"
//                     type="text"
//                     className="ca-input"
//                     placeholder="e.g. Veterinary, Legal Aid..."
//                     value={customSpecialisation}
//                     onChange={(e) => setCustomSpecialisation(e.target.value)}
//                     required
//                   />
//                 </div>
//               </div>
//             )}
//           </>
//         )}

//         <div className="ca-field">
//           <label className="ca-label" htmlFor="ca-password">
//             Password
//           </label>
//           <div className="ca-input-wrap">
//             <span className="ca-input-icon">
//               <Lock size={16} />
//             </span>
//             <input
//               id="ca-password"
//               className={shown('password') ? 'ca-input ca-input--error' : 'ca-input'}
//               type={showPassword ? 'text' : 'password'}
//               placeholder="••••••••"
//               autoComplete="new-password"
//               aria-invalid={shown('password') ? true : undefined}
//               aria-describedby={shown('password') ? 'ca-password-error' : undefined}
//               value={form.password}
//               onChange={set('password')}
//               onBlur={touch('password')}
//             />
//             <button
//               type="button"
//               className="ca-input-toggle"
//               onClick={() => setShowPassword((v) => !v)}
//               aria-label={showPassword ? 'Hide password' : 'Show password'}
//             >
//               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//           {shown('password') && (
//             <p className="field-error" id="ca-password-error">
//               {shown('password')}
//             </p>
//           )}
//         </div>

//         <div className="ca-field">
//           <label className="ca-terms">
//             <input
//               id="ca-terms"
//               type="checkbox"
//               checked={agreed}
//               aria-invalid={shown('terms') ? true : undefined}
//               aria-describedby={shown('terms') ? 'ca-terms-error' : undefined}
//               onChange={(e) => setAgreed(e.target.checked)}
//               onBlur={touch('terms')}
//             />
//             <span>
//               I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
//             </span>
//           </label>
//           {shown('terms') && (
//             <p className="field-error" id="ca-terms-error">
//               {shown('terms')}
//             </p>
//           )}
//         </div>

//         {error && (
//           <p className="form-error" role="alert">
//             {error}
//           </p>
//         )}

//         <button type="submit" className="ca-submit" disabled={submitting}>
//           {submitting ? 'Please wait...' : 'Create account'} <ChevronRight size={18} />
//         </button>
//       </form>

//       <p className="ca-footer">
//         Have an account? <Link to="/sign-in">Sign in</Link>
//       </p>
//     </AuthShell>
//   );
// }

// import { useState, useRef, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { User, Mail, Lock, Eye, EyeOff, Award, ChevronRight, ChevronDown } from 'lucide-react';
// import { AuthShell } from '../../components/AuthShell';
// import { PhoneField } from '../../components/PhoneField';
// import { FLOWS } from '../../features/registration/flows';
// import { useAuth } from '../../hooks/useAuth';
// import {
//   collectErrors,
//   validateEmail,
//   validateName,
//   validatePassword,
//   validatePhoneNumber,
// } from '../../lib/validation';
// import { describeError } from '../../services/api';
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
//   { value: 'EDUCATION', label: 'Education' },
//   { value: 'RELIGIOUS', label: 'Religious' },
//   { value: 'SECURITY', label: 'Security' },
//   { value: 'OTHER', label: 'Other (please specify)' }, 
// ];

// type FieldName = 'firstname' | 'lastname' | 'phone' | 'email' | 'password' | 'terms';
// const FIELD_ORDER: FieldName[] = ['firstname', 'lastname', 'phone', 'email', 'password', 'terms'];

// function field(
//   id: string,
//   label: string,
//   icon: ReactNode,
//   input: InputHTMLAttributes<HTMLInputElement>,
//   error?: string,
// ) {
//   const errorId = `${id}-error`;
//   return (
//     <div className="ca-field">
//       <label className="ca-label" htmlFor={id}>
//         {label}
//       </label>
//       <div className="ca-input-wrap">
//         <span className="ca-input-icon">{icon}</span>
//         <input
//           id={id}
//           className={error ? 'ca-input ca-input--error' : 'ca-input'}
//           aria-invalid={error ? true : undefined}
//           aria-describedby={error ? errorId : undefined}
//           {...input}
//         />
//       </div>
//       {error && (
//         <p className="field-error" id={errorId}>
//           {error}
//         </p>
//       )}
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
//   const [form, setForm] = useState({
//     firstname: '',
//     lastname: '',
//     phone: '',
//     email: '',
//     password: '',
//   });
//   const [agreed, setAgreed] = useState(false);
//   const [specialisation, setSpecialisation] = useState<Specialisation>('GENERAL');
//   const [customSpecialisation, setCustomSpecialisation] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string>();
//   const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
//   const [submitted, setSubmitted] = useState(false);

//   const [videoDismissed, setVideoDismissed] = useState(false);
//   const [videoProgress, setVideoProgress] = useState(0);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [currentTime, setCurrentTime] = useState(0);
//   const videoRef = useRef<HTMLVideoElement>(null);

//   const set = (name: keyof typeof form) => (e: { target: { value: string } }) =>
//     setForm((f) => ({ ...f, [name]: e.target.value }));

//   const errors = collectErrors<FieldName>({
//     firstname: validateName(form.firstname, 'your first name'),
//     lastname: validateName(form.lastname, 'your last name'),
//     phone: validatePhoneNumber(form.phone),
//     email: validateEmail(form.email, { required: true }),
//     password: validatePassword(form.password),
//     terms: agreed ? undefined : 'Accept the Terms and Privacy Policy to continue.',
//   });
//   const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);
//   const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

//   const onSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(undefined);
//     setSubmitted(true);

//     // 1. Check if they selected "Other" but forgot to type anything
//     if (isInterpreter && specialisation === 'OTHER' && !customSpecialisation.trim()) {
//       setError('Please specify your specialisation.');
//       return;
//     }

//     const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
//     if (firstInvalid) {
//       document.getElementById(`ca-${firstInvalid}`)?.focus();
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const registrationData = {
//         name: `${form.firstname.trim()} ${form.lastname.trim()}`,
//         phone: form.phone,
//         email: form.email,
//         password: form.password,
//       };

//       // 2. Determine what to send
//       const finalSpecialisation = specialisation === 'OTHER' 
//         ? customSpecialisation.trim() 
//         : specialisation;

//       const session = isInterpreter
//         // 3. Tell TypeScript to accept it as a Specialisation
//         ? await registerInterpreter({ ...registrationData, specialisation: finalSpecialisation as Specialisation })
//         : await registerDeaf(registrationData);
        
//       login(session);
//       navigate(isInterpreter ? '/register/interpreter/certifications' : '/register/welcome', {
//         replace: true,
//       });
//     } catch (err) {
//       setError(describeError(err));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <AuthShell
//       backTo="/get-started"
//       steps={isInterpreter ? FLOWS.interpreter : FLOWS.deaf}
//       current={2}
//     >
//       {!videoDismissed && (
//         <div className="ca-video-widget">
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
//               setCurrentTime(v.currentTime);
//             }}
//           />
//           <div className="ca-video-caption">Watch the video for help in sign language</div>
//           <div className="ca-video-controls">
//             <span className="ca-video-time">
//               {formatTime(currentTime)} / {formatTime(videoDuration)}
//             </span>
//             <div className="ca-video-progress">
//               <div className="ca-video-progress-fill" style={{ width: `${videoProgress}%` }} />
//             </div>
//           </div>
//         </div>
//       )}

//       <h1 className="ca-title">Create your account</h1>
//       <p className="ca-subtitle">Watch the video for help in sign language.</p>

//       <form onSubmit={onSubmit} noValidate className="ca-form">
//         {/* Row: First name | Last name */}
//         <div className="ca-row">
//           {field(
//             'ca-firstname',
//             'First name',
//             <User size={16} />,
//             {
//               type: 'text',
//               autoComplete: 'given-name',
//               placeholder: 'Your first name',
//               value: form.firstname,
//               onChange: set('firstname'),
//               onBlur: touch('firstname'),
//             },
//             shown('firstname'),
//           )}

//           {field(
//             'ca-lastname',
//             'Last name',
//             <User size={16} />,
//             {
//               type: 'text',
//               autoComplete: 'family-name',
//               placeholder: 'Your last name',
//               value: form.lastname,
//               onChange: set('lastname'),
//               onBlur: touch('lastname'),
//             },
//             shown('lastname'),
//           )}
//         </div>

//         {/* Row: Phone | Email */}
//         <div className="ca-row">
//           <div className="ca-field">
//             <label className="ca-label" htmlFor="ca-phone">
//               Phone number
//             </label>
//             <PhoneField
//               id="ca-phone"
//               value={form.phone}
//               onChange={(phone) => setForm((f) => ({ ...f, phone }))}
//               onBlur={touch('phone')}
//               invalid={Boolean(shown('phone'))}
//               errorId={shown('phone') ? 'ca-phone-error' : undefined}
//             />
//             {shown('phone') && (
//               <p className="field-error" id="ca-phone-error">
//                 {shown('phone')}
//               </p>
//             )}
//           </div>

//           {field(
//             'ca-email',
//             'Email address',
//             <Mail size={16} />,
//             {
//               type: 'email',
//               autoComplete: 'email',
//               placeholder: 'name@example.com',
//               value: form.email,
//               onChange: set('email'),
//               onBlur: touch('email'),
//             },
//             shown('email'),
//           )}
//         </div>

//         {isInterpreter && (
//           <div className="ca-field">
//             <label className="ca-label" htmlFor="ca-specialisation">
//               Specialisation
//             </label>
            
//             {/* Added position: relative to the wrapper */}
//             <div className="ca-input-wrap" style={{ position: 'relative' }}>
//               <span className="ca-input-icon">
//                 <Award size={16} />
//               </span>

//               {specialisation === 'OTHER' ? (
//                 /* If "Other" is selected, show the text input */
//                 <input
//                   id="ca-specialisation"
//                   type="text"
//                   className="ca-input"
//                   placeholder="Type your specialisation..."
//                   value={customSpecialisation}
//                   onChange={(e) => setCustomSpecialisation(e.target.value)}
//                   autoFocus
//                 />
//               ) : (
//                 /* Otherwise, show the normal dropdown */
//                 <select
//                   id="ca-specialisation"
//                   className="ca-input"
//                   value={specialisation}
//                   onChange={(e) => {
//                     const val = e.target.value as Specialisation;
//                     setSpecialisation(val);
//                     if (val !== 'OTHER') setCustomSpecialisation(''); 
//                   }}
//                 >
//                   {SPECIALISATIONS.map((o) => (
//                     <option key={o.value} value={o.value}>
//                       {o.label}
//                     </option>
//                   ))}
//                 </select>
//               )}

//               {/* This icon is OUTSIDE the if/else, so it ALWAYS shows on the right */}
//               <div 
//                 style={{ 
//                   position: 'absolute', 
//                   right: '16px', 
//                   top: '50%', 
//                   transform: 'translateY(-50%)', 
//                   pointerEvents: 'none', 
//                   color: '#6b7280' 
//                 }}
//               >
//                 <ChevronDown size={16} />
//               </div>
//             </div>
            
//             {/* The small "Cancel" link */}
//             {specialisation === 'OTHER' && (
//               <button
//                 type="button"
//                 onClick={() => setSpecialisation('GENERAL')}
//                 style={{ background: 'none', border: 'none', color: 'purple', fontSize: '12px', cursor: 'pointer', textAlign: 'left', marginTop: '4px' }}
//               >
//                 Back to list
//               </button>
//             )}
//           </div>
//         )}

//         <div className="ca-field">
//           <label className="ca-label" htmlFor="ca-password">
//             Password
//           </label>
//           <div className="ca-input-wrap">
//             <span className="ca-input-icon">
//               <Lock size={16} />
//             </span>
//             <input
//               id="ca-password"
//               className={shown('password') ? 'ca-input ca-input--error' : 'ca-input'}
//               type={showPassword ? 'text' : 'password'}
//               placeholder="••••••••"
//               autoComplete="new-password"
//               aria-invalid={shown('password') ? true : undefined}
//               aria-describedby={shown('password') ? 'ca-password-error' : undefined}
//               value={form.password}
//               onChange={set('password')}
//               onBlur={touch('password')}
//             />
//             <button
//               type="button"
//               className="ca-input-toggle"
//               onClick={() => setShowPassword((v) => !v)}
//               aria-label={showPassword ? 'Hide password' : 'Show password'}
//             >
//               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//           {shown('password') && (
//             <p className="field-error" id="ca-password-error">
//               {shown('password')}
//             </p>
//           )}
//         </div>

//         <div className="ca-field">
//           <label className="ca-terms">
//             <input
//               id="ca-terms"
//               type="checkbox"
//               checked={agreed}
//               aria-invalid={shown('terms') ? true : undefined}
//               aria-describedby={shown('terms') ? 'ca-terms-error' : undefined}
//               onChange={(e) => setAgreed(e.target.checked)}
//               onBlur={touch('terms')}
//             />
//             <span>
//               I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
//             </span>
//           </label>
//           {shown('terms') && (
//             <p className="field-error" id="ca-terms-error">
//               {shown('terms')}
//             </p>
//           )}
//         </div>

//         {error && (
//           <p className="form-error" role="alert">
//             {error}
//           </p>
//         )}

//         <button type="submit" className="ca-submit" disabled={submitting}>
//           {submitting ? 'Please wait...' : 'Create account'} <ChevronRight size={18} />
//         </button>
//       </form>

//       <p className="ca-footer">
//         Have an account? <Link to="/sign-in">Sign in</Link>
//       </p>
//     </AuthShell>
//   );
// }



// import { useState, useRef, useEffect, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { User, Mail, Lock, Eye, EyeOff, Award, ChevronRight, ChevronDown } from 'lucide-react';
// import { AuthShell } from '../../components/AuthShell';
// import { PhoneField } from '../../components/PhoneField';
// import { FLOWS } from '../../features/registration/flows';
// import { useAuth } from '../../hooks/useAuth';
// import {
//   collectErrors,
//   validateEmail,
//   validateName,
//   validatePassword,
//   validatePhoneNumber,
// } from '../../lib/validation';
// import { describeError } from '../../services/api';
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
//   { value: 'EDUCATION', label: 'Education' },
//   { value: 'RELIGIOUS', label: 'Religious' },
//   { value: 'SECURITY', label: 'Security' },
//   { value: 'OTHER', label: 'Other (please specify)' }, 
// ];

// type FieldName = 'firstname' | 'lastname' | 'phone' | 'email' | 'password' | 'terms';
// const FIELD_ORDER: FieldName[] = ['firstname', 'lastname', 'phone', 'email', 'password', 'terms'];

// function field(
//   id: string,
//   label: string,
//   icon: ReactNode,
//   input: InputHTMLAttributes<HTMLInputElement>,
//   error?: string,
// ) {
//   const errorId = `${id}-error`;
//   return (
//     <div className="ca-field">
//       <label className="ca-label" htmlFor={id}>
//         {label}
//       </label>
//       <div className="ca-input-wrap">
//         <span className="ca-input-icon">{icon}</span>
//         <input
//           id={id}
//           className={error ? 'ca-input ca-input--error' : 'ca-input'}
//           aria-invalid={error ? true : undefined}
//           aria-describedby={error ? errorId : undefined}
//           {...input}
//         />
//       </div>
//       {error && (
//         <p className="field-error" id={errorId}>
//           {error}
//         </p>
//       )}
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
  
//   const [form, setForm] = useState({
//     firstname: '',
//     lastname: '',
//     phone: '',
//     email: '',
//     password: '',
//   });
//   const [agreed, setAgreed] = useState(false);
  
//   // Multi-select State
//   const [specialisations, setSpecialisations] = useState<Specialisation[]>([]);
//   const [customSpecialisation, setCustomSpecialisation] = useState('');
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
  
//   const [showPassword, setShowPassword] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string>();
//   const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
//   const [submitted, setSubmitted] = useState(false);

//   const [videoDismissed, setVideoDismissed] = useState(false);
//   const [videoProgress, setVideoProgress] = useState(0);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [currentTime, setCurrentTime] = useState(0);
//   const videoRef = useRef<HTMLVideoElement>(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsDropdownOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const set = (name: keyof typeof form) => (e: { target: { value: string } }) =>
//     setForm((f) => ({ ...f, [name]: e.target.value }));

//   const toggleSpecialisation = (value: Specialisation) => {
//     setSpecialisations((prev) => 
//       prev.includes(value) 
//         ? prev.filter((s) => s !== value) 
//         : [...prev, value]
//     );
//   };

//   const errors = collectErrors<FieldName>({
//     firstname: validateName(form.firstname, 'your first name'),
//     lastname: validateName(form.lastname, 'your last name'),
//     phone: validatePhoneNumber(form.phone),
//     email: validateEmail(form.email, { required: true }),
//     password: validatePassword(form.password),
//     terms: agreed ? undefined : 'Accept the Terms and Privacy Policy to continue.',
//   });
//   const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);
//   const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

//   const onSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(undefined);
//     setSubmitted(true);

//     if (isInterpreter && specialisations.length === 0) {
//       setError('Please select at least one specialisation.');
//       return;
//     }

//     if (isInterpreter && specialisations.includes('OTHER') && !customSpecialisation.trim()) {
//       setError('Please specify your other specialisation.');
//       return;
//     }

//     const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
//     if (firstInvalid) {
//       document.getElementById(`ca-${firstInvalid}`)?.focus();
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const registrationData = {
//         name: `${form.firstname.trim()} ${form.lastname.trim()}`,
//         phone: form.phone,
//         email: form.email,
//         password: form.password,
//       };

//       // Format selected options as a comma-separated string
//       const finalSpecialisation = specialisations
//         .map((s) => (s === 'OTHER' ? customSpecialisation.trim() : s))
//         .join(', ');

//       const session = isInterpreter
//         ? await registerInterpreter({ ...registrationData, specialisation: finalSpecialisation as Specialisation })
//         : await registerDeaf(registrationData);
        
//       login(session);
//       navigate(isInterpreter ? '/register/interpreter/certifications' : '/register/welcome', {
//         replace: true,
//       });
//     } catch (err) {
//       setError(describeError(err));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Get the text to show inside the dropdown box
//   const getSelectedLabel = () => {
//     if (specialisations.length === 0) return 'Select specialisation(s)...';
//     return SPECIALISATIONS
//       .filter((o) => specialisations.includes(o.value))
//       .map((o) => o.label)
//       .join(', ');
//   };

//   return (
//     <AuthShell
//       backTo="/get-started"
//       steps={isInterpreter ? FLOWS.interpreter : FLOWS.deaf}
//       current={2}
//     >
//       {!videoDismissed && (
//         <div className="ca-video-widget">
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
//               setCurrentTime(v.currentTime);
//             }}
//           />
//           <div className="ca-video-caption">Watch the video for help in sign language</div>
//           <div className="ca-video-controls">
//             <span className="ca-video-time">
//               {formatTime(currentTime)} / {formatTime(videoDuration)}
//             </span>
//             <div className="ca-video-progress">
//               <div className="ca-video-progress-fill" style={{ width: `${videoProgress}%` }} />
//             </div>
//           </div>
//         </div>
//       )}

//       <h1 className="ca-title">Create your account</h1>
//       <p className="ca-subtitle">Watch the video for help in sign language.</p>

//       <form onSubmit={onSubmit} noValidate className="ca-form">
//         {/* Row: First name | Last name */}
//         <div className="ca-row">
//           {field(
//             'ca-firstname',
//             'First name',
//             <User size={16} />,
//             {
//               type: 'text',
//               autoComplete: 'given-name',
//               placeholder: 'Your first name',
//               value: form.firstname,
//               onChange: set('firstname'),
//               onBlur: touch('firstname'),
//             },
//             shown('firstname'),
//           )}

//           {field(
//             'ca-lastname',
//             'Last name',
//             <User size={16} />,
//             {
//               type: 'text',
//               autoComplete: 'family-name',
//               placeholder: 'Your last name',
//               value: form.lastname,
//               onChange: set('lastname'),
//               onBlur: touch('lastname'),
//             },
//             shown('lastname'),
//           )}
//         </div>

//         {/* Row: Phone | Email */}
//         <div className="ca-row">
//           <div className="ca-field">
//             <label className="ca-label" htmlFor="ca-phone">
//               Phone number
//             </label>
//             <PhoneField
//               id="ca-phone"
//               value={form.phone}
//               onChange={(phone) => setForm((f) => ({ ...f, phone }))}
//               onBlur={touch('phone')}
//               invalid={Boolean(shown('phone'))}
//               errorId={shown('phone') ? 'ca-phone-error' : undefined}
//             />
//             {shown('phone') && (
//               <p className="field-error" id="ca-phone-error">
//                 {shown('phone')}
//               </p>
//             )}
//           </div>

//           {field(
//             'ca-email',
//             'Email address',
//             <Mail size={16} />,
//             {
//               type: 'email',
//               autoComplete: 'email',
//               placeholder: 'name@example.com',
//               value: form.email,
//               onChange: set('email'),
//               onBlur: touch('email'),
//             },
//             shown('email'),
//           )}
//         </div>

//         {/* CUSTOM MULTI-SELECT DROPDOWN */}
//         {isInterpreter && (
//           <div className="ca-field" ref={dropdownRef} style={{ position: 'relative' }}>
//             <label className="ca-label">
//               Specialisation(s)
//             </label>
            
//             {/* The Box that looks like an input */}
//             <div 
//               className="ca-input-wrap" 
//               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//               style={{ cursor: 'pointer' }}
//             >
//               <span className="ca-input-icon">
//                 <Award size={16} />
//               </span>
//               <div 
//                 className="ca-input" 
//                 style={{ 
//                   display: 'flex', 
//                   alignItems: 'center', 
//                   justifyContent: 'space-between',
//                   whiteSpace: 'nowrap',
//                   overflow: 'hidden',
//                   textOverflow: 'ellipsis'
//                 }}
//               >
//                 <span style={{ color: specialisations.length === 0 ? '#9ca3af' : '#111827' }}>
//                   {getSelectedLabel()}
//                 </span>
//                 <ChevronDown size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
//               </div>
//             </div>

//             {/* The Dropdown Menu (Hidden by default, shows when clicked) */}
//             {isDropdownOpen && (
//               <div style={{
//                 position: 'absolute',
//                 top: '100%',
//                 left: 0,
//                 right: 0,
//                 backgroundColor: 'white',
//                 border: '1px solid #d1d5db',
//                 borderRadius: '8px',
//                 marginTop: '4px',
//                 padding: '8px',
//                 zIndex: 50,
//                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//                 maxHeight: '200px',
//                 overflowY: 'auto'
//               }}>
//                 {SPECIALISATIONS.map((o) => (
//                   <div 
//                     key={o.value} 
//                     onClick={() => toggleSpecialisation(o.value)}
//                     style={{ 
//                       display: 'flex', 
//                       alignItems: 'center', 
//                       padding: '10px 12px',
//                       cursor: 'pointer', 
//                       fontSize: '14px',
//                       color: '#374151',
//                       borderRadius: '4px',
//                       backgroundColor: specialisations.includes(o.value) ? '#f3f4f6' : 'transparent',
//                       fontWeight: specialisations.includes(o.value) ? '600' : 'normal'
//                     }}
//                   >
//                     {o.label}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* The custom text box for "Other" */}
//             {specialisations.includes('OTHER') && (
//               <div className="ca-input-wrap" style={{ position: 'relative', marginTop: '12px' }}>
//                 <span className="ca-input-icon">
//                   <Award size={16} />
//                 </span>
//                 <input
//                   type="text"
//                   className="ca-input"
//                   placeholder="Please specify your other specialisation..."
//                   value={customSpecialisation}
//                   onChange={(e) => setCustomSpecialisation(e.target.value)}
//                   autoFocus
//                 />
//               </div>
//             )}
//           </div>
//         )}

//         <div className="ca-field">
//           <label className="ca-label" htmlFor="ca-password">
//             Password
//           </label>
//           <div className="ca-input-wrap">
//             <span className="ca-input-icon">
//               <Lock size={16} />
//             </span>
//             <input
//               id="ca-password"
//               className={shown('password') ? 'ca-input ca-input--error' : 'ca-input'}
//               type={showPassword ? 'text' : 'password'}
//               placeholder="••••••••"
//               autoComplete="new-password"
//               aria-invalid={shown('password') ? true : undefined}
//               aria-describedby={shown('password') ? 'ca-password-error' : undefined}
//               value={form.password}
//               onChange={set('password')}
//               onBlur={touch('password')}
//             />
//             <button
//               type="button"
//               className="ca-input-toggle"
//               onClick={() => setShowPassword((v) => !v)}
//               aria-label={showPassword ? 'Hide password' : 'Show password'}
//             >
//               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//           {shown('password') && (
//             <p className="field-error" id="ca-password-error">
//               {shown('password')}
//             </p>
//           )}
//         </div>

//         <div className="ca-field">
//           <label className="ca-terms">
//             <input
//               id="ca-terms"
//               type="checkbox"
//               checked={agreed}
//               aria-invalid={shown('terms') ? true : undefined}
//               aria-describedby={shown('terms') ? 'ca-terms-error' : undefined}
//               onChange={(e) => setAgreed(e.target.checked)}
//               onBlur={touch('terms')}
//             />
//             <span>
//               I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
//             </span>
//           </label>
//           {shown('terms') && (
//             <p className="field-error" id="ca-terms-error">
//               {shown('terms')}
//             </p>
//           )}
//         </div>

//         {error && (
//           <p className="form-error" role="alert">
//             {error}
//           </p>
//         )}

//         <button type="submit" className="ca-submit" disabled={submitting}>
//           {submitting ? 'Please wait...' : 'Create account'} <ChevronRight size={18} />
//         </button>
//       </form>

//       <p className="ca-footer">
//         Have an account? <Link to="/sign-in">Sign in</Link>
//       </p>
//     </AuthShell>
//   );
// }


import { useState, useRef, useEffect, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Award, ChevronRight, ChevronDown } from 'lucide-react';
import { AuthShell } from '../../components/AuthShell';
import { PhoneField } from '../../components/PhoneField';
import { FLOWS } from '../../features/registration/flows';
import { useAuth } from '../../hooks/useAuth';
import {
  collectErrors,
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneNumber,
} from '../../lib/validation';
import { describeError } from '../../services/api';
import {
  registerDeaf,
  registerInterpreter,
  type Specialisation,
} from '../../services/registration';
import './CreateAccountPage.css';

const SPECIALISATIONS: { value: Specialisation; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'RELIGIOUS', label: 'Religious' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'OTHER', label: 'Other (please specify)' }, 
];

type FieldName = 'firstname' | 'lastname' | 'phone' | 'email' | 'password' | 'terms';
const FIELD_ORDER: FieldName[] = ['firstname', 'lastname', 'phone', 'email', 'password', 'terms'];

function field(
  id: string,
  label: string,
  icon: ReactNode,
  input: InputHTMLAttributes<HTMLInputElement>,
  error?: string,
) {
  const errorId = `${id}-error`;
  return (
    <div className="ca-field">
      <label className="ca-label" htmlFor={id}>
        {label}
      </label>
      <div className="ca-input-wrap">
        <span className="ca-input-icon">{icon}</span>
        <input
          id={id}
          className={error ? 'ca-input ca-input--error' : 'ca-input'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...input}
        />
      </div>
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  role?: 'deaf' | 'interpreter';
}

export function CreateAccountPage({ role = 'deaf' }: Props) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isInterpreter = role === 'interpreter';
  
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    password: '',
  });
  const [agreed, setAgreed] = useState(false);
  
  // Multi-select State
  const [specialisations, setSpecialisations] = useState<Specialisation[]>([]);
  const [customSpecialisation, setCustomSpecialisation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const [videoDismissed, setVideoDismissed] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const set = (name: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  const toggleSpecialisation = (value: Specialisation) => {
    setSpecialisations((prev) => 
      prev.includes(value) 
        ? prev.filter((s) => s !== value) 
        : [...prev, value]
    );
  };

  const errors = collectErrors<FieldName>({
    firstname: validateName(form.firstname, 'your first name'),
    lastname: validateName(form.lastname, 'your last name'),
    phone: validatePhoneNumber(form.phone),
    email: validateEmail(form.email, { required: true }),
    password: validatePassword(form.password),
    terms: agreed ? undefined : 'Accept the Terms and Privacy Policy to continue.',
  });
  const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);
  const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitted(true);

    if (isInterpreter && specialisations.length === 0) {
      setError('Please select at least one specialisation.');
      return;
    }

    if (isInterpreter && specialisations.includes('OTHER') && !customSpecialisation.trim()) {
      setError('Please specify your other specialisation.');
      return;
    }

    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      document.getElementById(`ca-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const registrationData = {
        name: `${form.firstname.trim()} ${form.lastname.trim()}`,
        phone: form.phone,
        email: form.email,
        password: form.password,
      };

      // Format selected options as a comma-separated string
      const finalSpecialisation = specialisations
        .map((s) => (s === 'OTHER' ? customSpecialisation.trim() : s))
        .join(', ');

      const session = isInterpreter
        ? await registerInterpreter({ ...registrationData, specialisation: finalSpecialisation as Specialisation })
        : await registerDeaf(registrationData);
        
      login(session);
      navigate(isInterpreter ? '/register/interpreter/certifications' : '/register/welcome', {
        replace: true,
      });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Get the text to show inside the dropdown box
  const getSelectedLabel = () => {
    if (specialisations.length === 0) return 'Select specialisation(s)...';
    return SPECIALISATIONS
      .filter((o) => specialisations.includes(o.value))
      .map((o) => o.label)
      .join(', ');
  };

  return (
    <AuthShell
      backTo="/get-started"
      steps={isInterpreter ? FLOWS.interpreter : FLOWS.deaf}
      current={2}
    >
      {!videoDismissed && (
        <div className="ca-video-widget">
          <button
            type="button"
            className="ca-video-close"
            onClick={() => setVideoDismissed(true)}
            aria-label="Close video"
          >
            ×
          </button>
          <video
            ref={videoRef}
            className="ca-video"
            src="/videos/placeholder.mp4"
            autoPlay
            loop
            muted
            playsInline
            onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setVideoProgress((v.currentTime / v.duration) * 100);
              setCurrentTime(v.currentTime);
            }}
          />
          <div className="ca-video-caption">Watch the video for help in sign language</div>
          <div className="ca-video-controls">
            <span className="ca-video-time">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>
            <div className="ca-video-progress">
              <div className="ca-video-progress-fill" style={{ width: `${videoProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      <h1 className="ca-title">Create your account</h1>
      <p className="ca-subtitle">Watch the video for help in sign language.</p>

      <form onSubmit={onSubmit} noValidate className="ca-form">
        {/* Row: First name | Last name */}
        <div className="ca-row">
          {field(
            'ca-firstname',
            'First name',
            <User size={16} />,
            {
              type: 'text',
              autoComplete: 'given-name',
              placeholder: 'Your first name',
              value: form.firstname,
              onChange: set('firstname'),
              onBlur: touch('firstname'),
            },
            shown('firstname'),
          )}

          {field(
            'ca-lastname',
            'Last name',
            <User size={16} />,
            {
              type: 'text',
              autoComplete: 'family-name',
              placeholder: 'Your last name',
              value: form.lastname,
              onChange: set('lastname'),
              onBlur: touch('lastname'),
            },
            shown('lastname'),
          )}
        </div>

        {/* Row: Phone | Email */}
        <div className="ca-row">
          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-phone">
              Phone number
            </label>
            <PhoneField
              id="ca-phone"
              value={form.phone}
              onChange={(phone) => setForm((f) => ({ ...f, phone }))}
              onBlur={touch('phone')}
              invalid={Boolean(shown('phone'))}
              errorId={shown('phone') ? 'ca-phone-error' : undefined}
            />
            {shown('phone') && (
              <p className="field-error" id="ca-phone-error">
                {shown('phone')}
              </p>
            )}
          </div>

          {field(
            'ca-email',
            'Email address',
            <Mail size={16} />,
            {
              type: 'email',
              autoComplete: 'email',
              placeholder: 'name@example.com',
              value: form.email,
              onChange: set('email'),
              onBlur: touch('email'),
            },
            shown('email'),
          )}
        </div>

        {/* CUSTOM MULTI-SELECT DROPDOWN */}
        {isInterpreter && (
          <div className="ca-field" ref={dropdownRef} style={{ position: 'relative' }}>
            <label className="ca-label">
              Specialisation(s)
            </label>
            
            {/* The Box that looks like an input */}
            <div 
              className="ca-input-wrap" 
              onClick={() => {
                // Only open the dropdown if we are not currently typing in "Other"
                if (!specialisations.includes('OTHER')) {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <span className="ca-input-icon">
                <Award size={16} />
              </span>
              
              {specialisations.includes('OTHER') ? (
                /* IF "OTHER" IS SELECTED: Show the text input inside the box */
                <input
                  type="text"
                  className="ca-input"
                  placeholder="Type your specialisation..."
                  value={customSpecialisation}
                  onChange={(e) => setCustomSpecialisation(e.target.value)}
                  autoFocus
                  style={{ paddingRight: '40px' }} // Make room for the icon
                />
              ) : (
                /* OTHERWISE: Show the normal dropdown text */
                <div 
                  className="ca-input" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ color: specialisations.length === 0 ? '#9ca3af' : '#111827' }}>
                    {getSelectedLabel()}
                  </span>
                </div>
              )}

              {/* The Chevron Icon (Always visible on the right) */}
              <div 
                style={{ 
                  position: 'absolute', 
                  right: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  pointerEvents: 'none', 
                  color: '#6b7280' 
                }}
              >
                <ChevronDown size={16} />
              </div>
            </div>

            {/* The Dropdown Menu (Only shows if NOT in "Other" mode) */}
            {isDropdownOpen && !specialisations.includes('OTHER') && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginTop: '4px',
                  padding: '8px',
                  zIndex: 50,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()} 
              >
                {SPECIALISATIONS.map((o) => (
                  <div 
                    key={o.value} 
                    onClick={() => {
                      toggleSpecialisation(o.value);
                      // If they click "Other", close the menu so they can type in the box
                      if (o.value === 'OTHER') setIsDropdownOpen(false); 
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px 12px',
                      cursor: 'pointer', 
                      fontSize: '14px',
                      color: '#374151',
                      borderRadius: '4px',
                      backgroundColor: specialisations.includes(o.value) ? '#f3f4f6' : 'transparent',
                      fontWeight: specialisations.includes(o.value) ? '600' : 'normal'
                    }}
                  >
                    {o.label}
                  </div>
                ))}
              </div>
            )}

            {/* A small button to go back to the list if they made a mistake */}
            {specialisations.includes('OTHER') && (
              <button
                type="button"
                onClick={() => {
                  setSpecialisations(prev => prev.filter(s => s !== 'OTHER'));
                  setCustomSpecialisation('');
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#382c77', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  textAlign: 'left', 
                  marginTop: '4px',
                  fontWeight: 600
                }}
              >
                Back to list
              </button>
            )}
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
              className={shown('password') ? 'ca-input ca-input--error' : 'ca-input'}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={shown('password') ? true : undefined}
              aria-describedby={shown('password') ? 'ca-password-error' : undefined}
              value={form.password}
              onChange={set('password')}
              onBlur={touch('password')}
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
          {shown('password') && (
            <p className="field-error" id="ca-password-error">
              {shown('password')}
            </p>
          )}
        </div>

        <div className="ca-field">
          <label className="ca-terms">
            <input
              id="ca-terms"
              type="checkbox"
              checked={agreed}
              aria-invalid={shown('terms') ? true : undefined}
              aria-describedby={shown('terms') ? 'ca-terms-error' : undefined}
              onChange={(e) => setAgreed(e.target.checked)}
              onBlur={touch('terms')}
            />
            <span>
              I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
            </span>
          </label>
          {shown('terms') && (
            <p className="field-error" id="ca-terms-error">
              {shown('terms')}
            </p>
          )}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="ca-submit" disabled={submitting}>
          {submitting ? 'Please wait...' : 'Create account'} <ChevronRight size={18} />
        </button>
      </form>

      <p className="ca-footer">
        Have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </AuthShell>
  );
}