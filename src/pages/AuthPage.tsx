import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/client';
import { RoleName } from '../types';
import { EclatLogo } from '../components/EclatLogo';

interface AuthPageProps {
  onSuccess: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onToast }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'recover' | 'activate'>('login');

  // Form states
  const [email, setEmail] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      onToast(`Welcome back, ${u.name}!`, 'success');
      onSuccess();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) {
      onToast('Password must be at least 10 characters long', 'error');
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
        onToast(`${role === 'ARTISAN' ? 'Artisan' : 'Vendor'} registration received! Please check your email to activate your account.`, 'success');
      } else {
        onToast(`Account created successfully as ${res.user.role}!`, 'success');
        onSuccess();
      }
    } catch (err: any) {
      onToast(err.message, 'error');
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
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
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
          return;
        }
        if (newPassword.length < 10) {
          onToast('New password must be at least 10 characters long', 'error');
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-panel" style={{ maxWidth: 540 }}>
      {/* Official Brand Emblem Header */}
      <div style={{ textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <EclatLogo size={46} />
        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
          LAUTECH & Ogbomoso Community Marketplace
        </p>
      </div>

      {/* Auth Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 20 }}>
        <button
          type="button"
          className={tab === 'login' ? 'btn-lime btn-sm' : 'btn-outline btn-sm'}
          onClick={() => setTab('login')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={tab === 'register' ? 'btn-lime btn-sm' : 'btn-outline btn-sm'}
          onClick={() => setTab('register')}
        >
          Create Account
        </button>
        <button
          type="button"
          className={tab === 'recover' ? 'btn-lime btn-sm' : 'btn-outline btn-sm'}
          onClick={() => setTab('recover')}
        >
          Reset Password
        </button>
      </div>

      {/* 1. Sign In Tab */}
      {tab === 'login' && (
        <form onSubmit={handleLogin}>
          <h2 style={{ margin: '0 0 16px 0', color: 'var(--brand-purple)' }}>Sign in to ECLAT CONNECT</h2>

          {registeredVendorInfo && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', padding: 16, borderRadius: 8, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✉️</span> {registeredVendorInfo.roleName === 'ARTISAN' ? 'Artisan' : 'Vendor'} Registration Received!
              </div>
              <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.55 }}>
                An activation link has been sent to <strong>{registeredVendorInfo.email}</strong>. Please check your email inbox (and spam folder) and click the <strong>"Activate Account"</strong> button in your email to activate your account.
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. name@example.com or yourname@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-lime" style={{ width: '100%', padding: '14px', fontSize: 15 }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In →'}
          </button>
        </form>
      )}

      {/* 2. Create Account Tab */}
      {tab === 'register' && (
        <form onSubmit={handleRegister}>
          <h2 style={{ margin: '0 0 16px 0', color: 'var(--brand-purple)' }}>Create Your Account</h2>

          <div className="form-group">
            <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Select Account Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                {
                  id: 'CUSTOMER' as RoleName,
                  emoji: '🛒',
                  title: 'Customer',
                  badge: 'Buyer & Resident',
                  desc: 'Discover shops, buy goods, hire artisans & post what I need'
                },
                {
                  id: 'VENDOR' as RoleName,
                  emoji: '🏪',
                  title: 'Vendor',
                  badge: 'Shop & Store Owner',
                  desc: 'Sell physical products, run a campus store & manage inventory'
                },
                {
                  id: 'ARTISAN' as RoleName,
                  emoji: '🛠️',
                  title: 'Artisan',
                  badge: 'Skilled Trades & Repairs',
                  desc: 'Repairs, tailoring, laundry, styling, electrical & showcase projects'
                },
              ].map(opt => {
                const isSelected = role === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setRole(opt.id)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: 12,
                      border: isSelected ? '2.5px solid var(--primary)' : '1.5px solid var(--border)',
                      background: isSelected ? 'var(--primary-light)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      boxShadow: isSelected ? '0 4px 14px rgba(76, 1, 106, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 12,
                            background: isSelected ? 'var(--primary)' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: isSelected ? 'var(--primary)' : 'var(--charcoal)' }}>
                        {opt.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: isSelected ? 'var(--primary)' : '#64748b',
                          marginTop: 2,
                          marginBottom: 6,
                        }}
                      >
                        {opt.badge}
                      </div>
                      <small style={{ color: 'var(--text-muted)', fontSize: 11.5, display: 'block', lineHeight: 1.4 }}>
                        {opt.desc}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              required
              placeholder="e.g. Olamiji Gabriel"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. yourname@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Phone Number (for SMS & WhatsApp alerts)</label>
            <input
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Nigerian format (080... or 23480...). Used for WhatsApp & SMS quote alerts.
            </small>
          </div>

          <div className="form-group">
            <label>Password (Min. 10 characters) *</label>
            <input
              type="password"
              required
              minLength={10}
              placeholder="Enter secure password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-lime"
            style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
            disabled={loading}
          >
            {loading
              ? 'Creating Account...'
              : role === 'ARTISAN'
              ? 'Register as Artisan / Professional (Requires Activation) →'
              : role === 'VENDOR'
              ? 'Register as Vendor / Store (Requires Activation) →'
              : 'Register as Customer (Instant Access) →'}
          </button>
        </form>
      )}

      {/* 3. Password Recovery Tab */}
      {tab === 'recover' && (
        <form onSubmit={handleRecover}>
          <h2 style={{ margin: '0 0 16px 0', color: 'var(--brand-purple)' }}>Password Recovery</h2>

          {tokenReceived && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', padding: 14, borderRadius: 8, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                📧 Verification Token / OTP Sent!
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                A 6-digit verification code has been dispatched to <strong>{recoverEmail}</strong>. Please check your registered email inbox (and spam folder) and supply the code below to verify your identity.
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Registered Account Email *</label>
            <input
              type="email"
              required
              disabled={tokenReceived}
              placeholder="Enter your registered email"
              value={recoverEmail}
              onChange={e => setRecoverEmail(e.target.value)}
            />
          </div>

          {tokenReceived && (
            <>
              <div className="form-group">
                <label>Verification Token / OTP (Check Your Email) *</label>
                <input
                  required
                  placeholder="Enter 6-digit code sent to your email"
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value.trim())}
                  style={{ letterSpacing: 2, fontWeight: 700, fontSize: 16 }}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                  Supply the OTP delivered to your registered email to confirm that no stranger can reset your password.
                </small>
              </div>

              <div className="form-group">
                <label>New Password (Min. 10 characters) *</label>
                <input
                  type="password"
                  required
                  minLength={10}
                  placeholder="Enter new password (min. 10 chars)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--brand-purple)', fontSize: 12.5, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    setTokenReceived(false);
                    setResetToken('');
                  }}
                >
                  Change email or re-send OTP code
                </button>
              </div>
            </>
          )}

          <button type="submit" className="btn-lime" style={{ width: '100%', padding: '14px', fontSize: 15 }} disabled={loading}>
            {loading ? 'Processing...' : tokenReceived ? 'Confirm New Password →' : 'Send Recovery Token / OTP →'}
          </button>
        </form>
      )}
    </section>
  );
};
