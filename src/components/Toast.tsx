import React, { useEffect } from 'react';

export interface ToastNotice {
  text: string;
  type?: 'info' | 'success' | 'error';
}

interface ToastProps {
  notice: ToastNotice | null;
  onClose: () => void;
}

// Messages stay long enough to read; errors stay a little longer.
const DISMISS_AFTER_MS = { info: 5000, success: 5000, error: 8000 };

export const Toast: React.FC<ToastProps> = ({ notice, onClose }) => {
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onClose, DISMISS_AFTER_MS[notice.type || 'info']);
    return () => window.clearTimeout(timer);
    // Restart the timer whenever a new message arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice]);

  if (!notice) return null;

  const isError = notice.type === 'error';

  return (
    <div
      className={`toast-notice ${notice.type || 'info'}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <span>{notice.text}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss message">
        ×
      </button>
    </div>
  );
};
