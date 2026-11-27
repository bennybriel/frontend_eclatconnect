import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MailCheck,
  MailOpen,
  MessageSquareQuote,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/client';
import { RoleName, User } from '../types';
import { EclatLogo } from '../components/EclatLogo';
import '../styles/flows.css';
import '../styles/auth.css';

interface AuthPageProps {
  onSuccess: (user?: User) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

const MIN_PASSWORD = 10;

/** Plain-language choices; each maps to an existing account role. */
const CHOICES: { id: RoleName; icon: React.ReactNode; title: string; desc: string; tag?: string; badge: string; promise: string; cta: string }[] = [
  {
    id: 'CUSTOMER',
    icon: <ShoppingBag size={22} />,
    title: 'I want to buy or hire',
    desc: 'Find shops, products and artisans, and post what you need.',
    tag: 'Most people',
    badge: 'Customer',
    promise: 'Start browsing and posting right after this step.',
    cta: 'Create my account',
  },
  {
    id: 'VENDOR',
    icon: <Store size={22} />,
    title: 'I sell products',
    desc: 'Run a shop or store? Get a business page customers can find.',
    badge: 'Vendor · shop or store',
    promise: 'Set up your account, then add your shop and products.',
    cta: 'Register my business',
  },
  {
    id: 'ARTISAN',
    icon: <Wrench size={22} />,
    title: 'I offer a skill or trade',
    desc: 'Tailor, electrician, stylist, repairs, laundry and more.',
    badge: 'Artisan · skill or trade',
    promise: 'Set up your account, then show your work and get requests.',
    cta: 'Register my skill',
  },
];

const LAST_EMAIL_KEY = 'eclat_last_email';
const readLastEmail = (): string => {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) || '';
  } catch {
    return '';
  }
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Nigerian mobile numbers: 080..., 070..., 090..., 081..., 091... or the same with 234 / +234 */
const phoneOk = (v: string) => {
  const d = v.replace(/\D/g, '');
  return /^0[789][01]\d{8}$/.test(d) || /^234[789][01]\d{8}$/.test(d);
};
/** 08012345678 -> 0801 234 5678 (display only; the number is stored without spaces) */
const formatPhone = (v: string) => {
  if (!/^0\d*$/.test(v)) return v;
  const a = v.slice(0, 4), b = v.slice(4, 7), c = v.slice(7, 11);
  return [a, b, c].filter(Boolean).join(' ');
};
/** A shortcut to the visitor's inbox, for the common email providers */
const inboxFor = (mail: string): { label: string; href: string } | null => {
  const domain = mail.split('@')[1]?.toLowerCase() || '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') return { label: 'Open Gmail', href: 'https://mail.google.com/mail/u/0/#inbox' };
  if (domain.startsWith('yahoo.')) return { label: 'Open Yahoo Mail', href: 'https://mail.yahoo.com' };
  if (/^(outlook|hotmail|live)\./.test(domain)) return { label: 'Open Outlook', href: 'https://outlook.live.com/mail/' };
  return null;
};

/** 0 = empty, 1 = too short, 2 = okay, 3 = good, 4 = strong */
function strengthOf(pw: string): number {
  if (!pw) return 0;
  if (pw.length < MIN_PASSWORD) return 1;
  let score = 2;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 16) score++;
  return Math.min(score, 4);
}

const STRENGTH_TEXT = ['', 'Too short', 'Okay', 'Good', 'Strong'];

/** A password box with a show or hide button. */
const PasswordInput: React.FC<{
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  minLength?: number;
}> = ({ id, value, onChange, placeholder, autoComplete, minLength }) => {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(Boolean(e.getModifierState?.('CapsLock')));
  return (
    <>
    <div className="fl-input">
      <Lock size={18} aria-hidden="true" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={checkCaps}
        onKeyUp={checkCaps}
        onBlur={() => setCaps(false)}
      />
      <button
        type="button"
        className="fl-eye"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {caps && (
      <p className="fl-hint is-warn" role="status">
        <AlertTriangle size={14} aria-hidden="true" /> Caps Lock is on
      </p>
    )}
    </>
  );
};

const Strength: React.FC<{ value: string }> = ({ value }) => {
  const level = strengthOf(value);
  if (!level) {
    return <p className="fl-hint">At least {MIN_PASSWORD} characters. Mix letters, numbers and symbols.</p>;
  }
  return (
    <>
      <div className="fl-strength" data-level={level} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className={`fl-hint${level >= 3 ? ' is-good' : ''}`} aria-live="polite">
        {level >= 3 && <Check size={14} />}
        {STRENGTH_TEXT[level]}
        {level === 1 && ` · ${MIN_PASSWORD - value.length} more character${MIN_PASSWORD - value.length === 1 ? '' : 's'}`}
      </p>
    </>
  );
};

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onToast }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'recover' | 'activate'>('login');

  // Form states
  const [email, setEmail] = useState(readLastEmail);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<RoleName>('CUSTOMER');

  // Recovery states
  const [recoverEmail, setRecoverEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [tokenReceived, setTokenReceived] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Activation states
  const [activationTokenInput, setActivationTokenInput] = useState('');
  const [registeredVendorInfo, setRegisteredVendorInfo] = useState<{
    email: string;
    roleName?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState<'role' | 'details'>('role');
  // Shown inside the form as well as in the toast, so the message stays next to the fields
  const [formError, setFormError] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; phone?: boolean }>({});
  // After a vendor or artisan registers: a full "check your email" screen
  const [checkEmail, setCheckEmail] = useState(false);

  // Move focus to the first field whenever the view changes, so keyboard users land in the form.
  const formRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setFormError('');
    const field = formRef.current?.querySelector<HTMLInputElement>('input:not([disabled])');
    field?.focus({ preventScroll: true });
  }, [tab, registerStep]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setFormError('');
      const u = await login(email.trim(), password);
      try {
        localStorage.setItem(LAST_EMAIL_KEY, email.trim());
      } catch {
        // private browsing: nothing to remember
      }
      onToast(`Welcome back, ${u.name}!`, 'success');
      onSuccess(u);
    } catch (err: any) {
      onToast(err.message, 'error');
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password.length < 10) {
      onToast('Password must be at least 10 characters long', 'error');
      setFormError('Your password needs at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
      });

      if (res.activation_required) {
        setRegisteredVendorInfo({
          email: res.user.email,
          roleName: res.user.role || role,
        });
        setTab('login');
        setCheckEmail(true);
        onToast(`${role === 'ARTISAN' ? 'Artisan' : 'Vendor'} registration received! Please check your email to activate your account.`, 'success');
      } else {
        onToast('Your account has been created.', 'success');
        onSuccess(res.user);
      }
    } catch (err: any) {
      onToast(err.message, 'error');
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateToken = async (e?: React.FormEvent, customToken?: string) => {
    if (e) e.preventDefault();
    const tokenToUse = customToken || activationTokenInput.trim();
    if (!tokenToUse) {
      onToast('Please enter your activation code', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await request<{ message: string }>('/auth/activate', 'POST', { token: tokenToUse });
      onToast(res.message || 'Vendor account activated successfully! You may now sign in.', 'success');
      setTab('login');
      setRegisteredVendorInfo(null);
      setActivationTokenInput('');
    } catch (err: any) {
      onToast(err.message, 'error');
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      if (!tokenReceived) {
        const res = await request<{ message: string }>('/auth/recover', 'POST', {
          email: recoverEmail.trim(),
        });
        onToast(res.message || 'Verification token sent to your registered email!', 'info');
        setTokenReceived(true);
        setResetToken(''); // Must be entered from the registered email inbox
      } else {
        if (!resetToken.trim()) {
          onToast('Please enter the verification token / OTP sent to your registered email', 'error');
          setFormError('Enter the 6-digit code from your email.');
          return;
        }
        if (newPassword.length < 10) {
          onToast('New password must be at least 10 characters long', 'error');
          setFormError('Your new password needs at least 10 characters.');
          return;
        }
        await request('/auth/reset-password', 'POST', {
          token: resetToken.trim(),
          new_password: newPassword,
        });
        onToast('Password reset successfully! Please sign in with your new password.', 'success');
        setTab('login');
        setTokenReceived(false);
        setResetToken('');
        setNewPassword('');
      }
    } catch (err: any) {
      onToast(err.message, 'error');
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isProviderRole = role === 'VENDOR' || role === 'ARTISAN';
  const roleLabel = (r?: string) => (r === 'ARTISAN' ? 'Artisan' : 'Vendor');
  const chosen = CHOICES.find(c => c.id === role) || CHOICES[0];

  const goRecover = () => {
    if (!recoverEmail && email) setRecoverEmail(email.trim());
    setTab('recover');
  };

  const openRegister = () => {
    setRegisterStep('role');
    setTab('register');
  };

  const pickRole = (r: RoleName) => {
    setRole(r);
    setRegisterStep('details');
  };

  const scene =
    tab === 'register'
      ? {
          kicker: 'Join free',
          head: (
            <>
              Your campus,
              <br />
              <span className="fl-script">connected.</span>
            </>
          ),
          lede: 'Find trusted shops and artisans around LAUTECH and Ogbomoso, or bring your own business online.',
        }
      : tab === 'login'
      ? {
          kicker: 'Welcome back',
          head: (
            <>
              Good to see
              <br />
              you <span className="fl-script">again!</span>
            </>
          ),
          lede: 'Pick up where you left off: your requests, saved listings and replies from providers.',
        }
      : {
          kicker: 'Account help',
          head: (
            <>
              We've got
              <br />
              <span className="fl-script">you.</span>
            </>
          ),
          lede: 'Only someone with access to your email inbox can make changes to your account.',
        };

  return (
    <section className="fl au" aria-label="Your account">
      <div className="au-stage">
        {/* The background: the student, the brand circles and live marketplace moments */}
        <div className="au-scene">
          <span className="au-rings" aria-hidden="true" />
          <picture className="au-photo" aria-hidden="true">
            <source media="(max-width: 900px)" type="image/webp" srcSet="/hero-student-360.webp" />
            <source type="image/webp" srcSet="/hero-student-560.webp" />
            <img src="/hero-student.png?v=20261123b" alt="" width={635} height={682} decoding="async" />
          </picture>

          <div className="au-copy">
            <EclatLogo light size={36} />
            <span className="fl-brand-kicker">{scene.kicker}</span>
            <h1 className="au-headline">{scene.head}</h1>
            <p className="au-lede">{scene.lede}</p>
          </div>

          <div className="au-float au-float-1 is-lime" aria-hidden="true">
            <span className="au-float-icon"><MessageSquareQuote size={16} /></span>
            <div>
              <strong>3 quotes received</strong>
              <span>Laundry pickup · Under G</span>
            </div>
          </div>
          <div className="au-float au-float-2" aria-hidden="true">
            <span className="au-float-icon"><BadgeCheck size={16} /></span>
            <div>
              <strong>Verified artisan</strong>
              <span>Electrician · 4.8 rating</span>
            </div>
          </div>
          <div className="au-float au-float-3" aria-hidden="true">
            <span className="au-float-icon"><Store size={16} /></span>
            <div>
              <strong>New shop nearby</strong>
              <span>Gadgets · Adenike</span>
            </div>
          </div>

          <p className="au-trust">
            <ShieldCheck size={15} aria-hidden="true" /> Made for LAUTECH and Ogbomoso
          </p>
        </div>

        {/* The form */}
        <div className="au-card">
          <div className="au-card-inner" ref={formRef}>
            {(tab === 'login' || tab === 'register') && (
              <div className="fl-tabs" role="tablist" aria-label="Sign in or create an account">
                <span className={`fl-tabs-pill${tab === 'register' ? ' is-right' : ''}`} aria-hidden="true" />
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'login'}
                  className={`fl-tab${tab === 'login' ? ' is-on' : ''}`}
                  onClick={() => setTab('login')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'register'}
                  className={`fl-tab${tab === 'register' ? ' is-on' : ''}`}
                  onClick={openRegister}
                >
                  Create account
                </button>
              </div>
            )}

            {(tab === 'recover' || tab === 'activate') && (
              <button type="button" className="fl-back" style={{ color: 'var(--brand-royal)' }} onClick={() => setTab('login')}>
                <ArrowLeft size={16} /> Back to sign in
              </button>
            )}

            {/* After registering as a vendor or artisan */}
            {tab === 'login' && checkEmail && registeredVendorInfo && (() => {
              const inbox = inboxFor(registeredVendorInfo.email);
              return (
                <div className="fl-anim au-check" key="check-email" role="status">
                  <span className="au-check-icon" aria-hidden="true">
                    <MailOpen size={34} />
                  </span>
                  <h2 className="fl-title">Check your email</h2>
                  <p className="fl-sub">
                    We sent an activation link to <b>{registeredVendorInfo.email}</b>. Your{' '}
                    {roleLabel(registeredVendorInfo.roleName).toLowerCase()} account is ready once you open it.
                  </p>
                  <ol className="au-check-steps">
                    <li><b>1</b> Open the email from ECLAT CONNECT</li>
                    <li><b>2</b> Tap <strong>Activate Account</strong></li>
                    <li><b>3</b> Come back here and sign in</li>
                  </ol>
                  {inbox && (
                    <a className="fl-btn fl-btn-lime fl-btn-block au-check-inbox" href={inbox.href} target="_blank" rel="noopener noreferrer">
                      {inbox.label} <ArrowRight size={18} />
                    </a>
                  )}
                  <button type="button" className={`fl-btn ${inbox ? 'fl-btn-outline' : 'fl-btn-lime'} fl-btn-block`} onClick={() => setCheckEmail(false)}>
                    I've activated it, sign in
                  </button>
                  <p className="fl-legal">
                    Can't find it? Check your spam folder, or{' '}
                    <button type="button" className="fl-link" onClick={() => setTab('activate')}>
                      enter a code instead
                    </button>
                  </p>
                </div>
              );
            })()}

            {/* 1. Sign in */}
            {tab === 'login' && !(checkEmail && registeredVendorInfo) && (
              <form onSubmit={handleLogin} className="fl-anim" key="login">
                <h2 className="fl-title">Sign in</h2>
                <p className="fl-sub">Use the email and password for your ECLAT CONNECT account.</p>

                {registeredVendorInfo && (
                  <div className="fl-notice is-good" role="status">
                    <MailCheck size={20} />
                    <div className="fl-notice-body">
                      <strong>Check your email to activate</strong>
                      We sent a link to <b>{registeredVendorInfo.email}</b>. Open it, tap "Activate Account", then sign in
                      here as a {roleLabel(registeredVendorInfo.roleName).toLowerCase()}.{' '}
                      <button type="button" className="fl-link" onClick={() => setTab('activate')}>
                        I have a code
                      </button>
                    </div>
                  </div>
                )}

                <div className="fl-field">
                  <label className="fl-label" htmlFor="fl-login-email">Email address</label>
                  <div className="fl-input">
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="fl-login-email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="fl-field">
                  <label className="fl-label" htmlFor="fl-login-password">
                    Password
                    <button type="button" className="fl-link" onClick={goRecover}>
                      Forgot password?
                    </button>
                  </label>
                  <PasswordInput
                    id="fl-login-password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Your password"
                    autoComplete="current-password"
                  />
                </div>

                {formError && (
                  <p className="au-error" role="alert">
                    <AlertCircle size={16} aria-hidden="true" /> {formError}
                  </p>
                )}

                <button type="submit" className="fl-btn fl-btn-lime fl-btn-block" style={{ marginTop: 6 }} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="fl-spinner" aria-hidden="true" /> Signing you in…
                    </>
                  ) : (
                    <>
                      Sign in <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="au-or">New to ECLAT CONNECT?</div>
                <button type="button" className="fl-btn fl-btn-outline fl-btn-block" onClick={openRegister}>
                  Create a free account
                </button>

                <p className="au-secure">
                  <Lock size={13} aria-hidden="true" /> Your details are private and never shown publicly.
                </p>
              </form>
            )}

            {/* 2a. Create account: what brings you here */}
            {tab === 'register' && registerStep === 'role' && (
              <div className="fl-anim" key="register-role">
                <div className="au-steps" aria-label="Step 1 of 2">
                  <span className="is-on" /><span />
                  <em>Step 1 of 2</em>
                </div>
                <h2 className="fl-title">What brings you here?</h2>
                <p className="fl-sub">Pick one to get started. It only takes a minute.</p>
                <div className="au-choices" role="list">
                  {CHOICES.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      role="listitem"
                      className="au-choice"
                      style={{ '--fl-i': i } as React.CSSProperties}
                      onClick={() => pickRole(c.id)}
                    >
                      <span className="au-choice-icon" aria-hidden="true">{c.icon}</span>
                      <span>
                        <span className="au-choice-title">
                          {c.title}
                          {c.tag && <span className="au-choice-tag">{c.tag}</span>}
                        </span>
                        <span className="au-choice-desc">{c.desc}</span>
                      </span>
                      <span className="au-choice-arrow" aria-hidden="true">
                        <ArrowRight size={16} />
                      </span>
                    </button>
                  ))}
                </div>
                <p className="fl-legal">
                  Already have an account?{' '}
                  <button type="button" className="fl-link" onClick={() => setTab('login')}>
                    Sign in
                  </button>
                </p>
              </div>
            )}

            {/* 2b. Create account: your details */}
            {tab === 'register' && registerStep === 'details' && (
              <form onSubmit={handleRegister} className="fl-anim" key="register-details">
                <div className="au-steps" aria-label="Step 2 of 2">
                  <span className="is-done" /><span className="is-on" />
                  <em>Step 2 of 2</em>
                </div>
                <div className="au-joining">
                  <span className="au-joining-icon" aria-hidden="true">{chosen.icon}</span>
                  <span className="au-joining-text">
                    Joining as
                    <strong>{chosen.badge}</strong>
                  </span>
                  <button type="button" className="au-change" onClick={() => setRegisterStep('role')}>
                    Change
                  </button>
                </div>

                <h2 className="fl-title">Create your account</h2>
                <p className="fl-sub">{chosen.promise}</p>

                <div className="au-row-2">
                  <div className="fl-field">
                    <label className="fl-label" htmlFor="fl-reg-name">Full name</label>
                    <div className="fl-input">
                      <UserIcon size={18} aria-hidden="true" />
                      <input
                        id="fl-reg-name"
                        required
                        autoComplete="name"
                        placeholder="Olamiji Gabriel"
                        value={name}
                        onChange={e => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="fl-field">
                    <label className="fl-label" htmlFor="fl-reg-phone">
                      Phone <span className="fl-label-note">{isProviderRole ? 'Recommended' : 'Optional'}</span>
                    </label>
                    <div className={`fl-input${touched.phone && phone && !phoneOk(phone) ? ' is-bad' : ''}`}>
                      <Phone size={18} aria-hidden="true" />
                      <input
                        id="fl-reg-phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="0801 234 5678"
                        value={formatPhone(phone)}
                        onChange={e => setPhone(e.target.value.replace(/\s/g, ''))}
                        onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                        aria-describedby="fl-reg-phone-hint"
                      />
                    </div>
                    {touched.phone && phone && !phoneOk(phone) ? (
                      <p className="fl-hint is-bad" id="fl-reg-phone-hint">Use a Nigerian number, e.g. 0801 234 5678</p>
                    ) : touched.phone && phone ? (
                      <p className="fl-hint is-good" id="fl-reg-phone-hint"><Check size={14} aria-hidden="true" /> Looks good</p>
                    ) : null}
                  </div>
                </div>

                <div className="fl-field">
                  <label className="fl-label" htmlFor="fl-reg-email">Email address</label>
                  <div className={`fl-input${touched.email && email && !EMAIL_RE.test(email.trim()) ? ' is-bad' : ''}`}>
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="fl-reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, email: true }))}
                    />
                  </div>
                  {touched.email && email && !EMAIL_RE.test(email.trim()) && (
                    <p className="fl-hint is-bad">That email doesn't look complete, e.g. yourname@gmail.com</p>
                  )}
                </div>

                <div className="fl-field">
                  <label className="fl-label" htmlFor="fl-reg-password">Password</label>
                  <PasswordInput
                    id="fl-reg-password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD}
                  />
                  <Strength value={password} />
                </div>

                {formError && (
                  <p className="au-error" role="alert">
                    <AlertCircle size={16} aria-hidden="true" /> {formError}
                  </p>
                )}

                <button type="submit" className="fl-btn fl-btn-lime fl-btn-block" style={{ marginTop: 4 }} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="fl-spinner" aria-hidden="true" /> Creating your account…
                    </>
                  ) : (
                    <>
                      {chosen.cta} <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="fl-legal">
                  {isProviderRole && <>We'll email you a link to activate your account. </>}
                  By continuing you agree to our{' '}
                  <a href="/terms-of-service" target="_blank" rel="noopener">Terms</a> and{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>.
                </p>
              </form>
            )}

            {/* 3. Reset password */}
            {tab === 'recover' && (
              <form onSubmit={handleRecover} className="fl-anim" key="recover">
                <h2 className="fl-title">Reset your password</h2>
                <p className="fl-sub">
                  {tokenReceived
                    ? 'Enter the code from your email and choose a new password.'
                    : "Enter the email on your account and we'll send you a code."}
                </p>

                <div className="fl-steps-mini" aria-hidden="true">
                  <span className="is-on">
                    <b>{tokenReceived ? <Check size={14} strokeWidth={3} /> : '1'}</b> Get a code
                  </span>
                  <i />
                  <span className={tokenReceived ? 'is-on' : ''}>
                    <b>2</b> New password
                  </span>
                </div>

                {tokenReceived && (
                  <div className="fl-notice is-good" role="status">
                    <MailCheck size={20} />
                    <div className="fl-notice-body">
                      <strong>Code sent</strong>
                      We sent a 6-digit code to <b>{recoverEmail}</b>. Check your inbox and spam folder.
                    </div>
                  </div>
                )}

                <div className="fl-field">
                  <label className="fl-label" htmlFor="fl-rec-email">Email on your account</label>
                  <div className={`fl-input${tokenReceived ? ' is-disabled' : ''}`}>
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="fl-rec-email"
                      type="email"
                      required
                      disabled={tokenReceived}
                      autoComplete="email"
                      inputMode="email"
                      placeholder="yourname@gmail.com"
                      value={recoverEmail}
                      onChange={e => setRecoverEmail(e.target.value)}
                    />
                  </div>
                </div>

                {tokenReceived && (
                  <>
                    <div className="fl-field">
                      <label className="fl-label" htmlFor="fl-rec-code">6-digit code</label>
                      <div className="fl-input fl-code">
                        <KeyRound size={18} aria-hidden="true" />
                        <input
                          id="fl-rec-code"
                          required
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          placeholder="••••••"
                          value={resetToken}
                          onChange={e => setResetToken(e.target.value.trim())}
                        />
                      </div>
                    </div>

                    <div className="fl-field">
                      <label className="fl-label" htmlFor="fl-rec-password">New password</label>
                      <PasswordInput
                        id="fl-rec-password"
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder={`At least ${MIN_PASSWORD} characters`}
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD}
                      />
                      <Strength value={newPassword} />
                    </div>

                    <div className="fl-row" style={{ marginTop: -4 }}>
                      <button
                        type="button"
                        className="fl-link"
                        onClick={() => {
                          setTokenReceived(false);
                          setResetToken('');
                        }}
                      >
                        Change email or send a new code
                      </button>
                    </div>
                  </>
                )}

                {formError && (
                  <p className="au-error" role="alert">
                    <AlertCircle size={16} aria-hidden="true" /> {formError}
                  </p>
                )}

                <button type="submit" className="fl-btn fl-btn-lime fl-btn-block" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="fl-spinner" aria-hidden="true" /> Please wait…
                    </>
                  ) : tokenReceived ? (
                    <>
                      Save new password <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Send me a code <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 4. Activate with a code */}
            {tab === 'activate' && (
              <form onSubmit={e => handleActivateToken(e)} className="fl-anim" key="activate">
                <h2 className="fl-title">Activate your account</h2>
                <p className="fl-sub">Paste the activation code from your email.</p>

                <div className="fl-field">
                  <label className="fl-label" htmlFor="fl-act-code">Activation code</label>
                  <div className="fl-input">
                    <KeyRound size={18} aria-hidden="true" />
                    <input
                      id="fl-act-code"
                      required
                      autoComplete="one-time-code"
                      placeholder="Your activation code"
                      value={activationTokenInput}
                      onChange={e => setActivationTokenInput(e.target.value)}
                    />
                  </div>
                </div>

                {formError && (
                  <p className="au-error" role="alert">
                    <AlertCircle size={16} aria-hidden="true" /> {formError}
                  </p>
                )}

                <button type="submit" className="fl-btn fl-btn-lime fl-btn-block" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="fl-spinner" aria-hidden="true" /> Activating…
                    </>
                  ) : (
                    <>
                      Activate account <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
