import React from 'react';
import { useEscapeToClose } from './useEscapeToClose';

interface SignInPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}

export const SignInPromptModal: React.FC<SignInPromptModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onRegister,
}) => {
  useEscapeToClose(onClose, isOpen);
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          maxWidth: 440,
          width: '100%',
          padding: '28px 24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          textAlign: 'center',
          animation: 'fadeInScale 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            cursor: 'pointer',
            fontSize: 15,
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            fontSize: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          ❤️
        </div>

        <h3 style={{ margin: '0 0 10px', fontSize: 20, color: 'var(--charcoal)', fontWeight: 700 }}>
          Sign in to save favourites
        </h3>

        <p
          style={{
            fontSize: 14,
            color: '#475569',
            lineHeight: 1.5,
            margin: '0 0 20px',
          }}
        >
          <strong>Save listings you are interested in so you can easily find them later.</strong>
          <br />
          <span style={{ fontSize: 13, color: '#64748b', marginTop: 6, display: 'inline-block' }}>
            Sign in or create a free account to keep your saved items across all your devices and never lose track of what you need.
          </span>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            className="btn-lime"
            style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700 }}
            onClick={() => {
              onClose();
              onSignIn();
            }}
          >
            Sign In to Continue
          </button>

          <button
            type="button"
            className="btn-outline"
            style={{ width: '100%', padding: '11px', fontSize: 14, fontWeight: 600 }}
            onClick={() => {
              onClose();
              onRegister();
            }}
          >
            Create a Free Account
          </button>

          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
              marginTop: 4,
              padding: 6,
            }}
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
