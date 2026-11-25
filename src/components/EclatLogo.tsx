import React from 'react';

interface EclatLogoProps {
  size?: number;
  light?: boolean;
  showText?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Official ECLAT CONNECT Brand Emblem & Typography
 * Used consistently across Desktop/Mobile Header, Drawers, Footers, and Auth Modals.
 */
export const EclatLogo: React.FC<EclatLogoProps> = ({
  size = 38,
  light = false,
  showText = true,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`brand-wrapper ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        textDecoration: 'none',
      }}
    >
      <img
        src="/logo-transparent.png?v=20261123b"
        alt="ECLAT CONNECT Official Emblem"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
        }}
      />
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 900,
              fontSize: Math.round(size * 0.45),
              letterSpacing: 0.5,
              color: light ? '#FFFFFF' : 'var(--brand-purple)',
            }}
          >
            ECLAT
          </span>
          <span
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 800,
              fontSize: Math.round(size * 0.35),
              letterSpacing: 1.5,
              color: light ? '#F3E8FF' : 'var(--brand-purple)',
            }}
          >
            CONNECT
          </span>
        </div>
      )}
    </div>
  );
};
