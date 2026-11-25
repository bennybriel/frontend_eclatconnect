import React from 'react';

export interface ToastNotice {
  text: string;
  type?: 'info' | 'success' | 'error';
}

interface ToastProps {
  notice: ToastNotice | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notice, onClose }) => {
  if (!notice) return null;

  return (
    <div className={`toast-notice ${notice.type || 'info'}`} role="alert">
      <span>{notice.text}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
};
