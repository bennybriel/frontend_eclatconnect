import React from 'react';
import { AvailabilityStatus } from '../types';

interface AvailabilityBadgeProps {
  status?: AvailabilityStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  interactive?: boolean;
  onStatusChange?: (newStatus: AvailabilityStatus) => void;
  disabled?: boolean;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  status = 'AVAILABLE',
  size = 'md',
  showIcon = true,
  interactive = false,
  onStatusChange,
  disabled = false,
}) => {
  const normStatus = (status || 'AVAILABLE').toUpperCase() as AvailabilityStatus;

  const config = {
    AVAILABLE: {
      label: 'Available',
      icon: '🟢',
      bg: '#dcfce7',
      text: '#15803d',
      border: '#86efac',
      hint: 'Ready for purchase or inquiries',
    },
    RESERVED: {
      label: 'Reserved',
      icon: '🟡',
      bg: '#fef3c7',
      text: '#b45309',
      border: '#fde68a',
      hint: 'A buyer is currently concluding purchase',
    },
    SOLD: {
      label: 'Sold',
      icon: '⚪',
      bg: '#f1f5f9',
      text: '#64748b',
      border: '#cbd5e1',
      hint: 'Item has been purchased',
    },
  }[normStatus] || {
    label: normStatus,
    icon: '🏷️',
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
    hint: '',
  };

  const padding = size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 14px' : '4px 10px';
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 14 : 12;

  if (interactive && onStatusChange) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <select
          value={normStatus}
          disabled={disabled}
          onChange={e => onStatusChange(e.target.value as AvailabilityStatus)}
          style={{
            background: config.bg,
            color: config.text,
            border: `1.5px solid ${config.border}`,
            borderRadius: 6,
            padding,
            fontSize,
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
          title={`Update availability: currently ${config.label}`}
        >
          <option value="AVAILABLE">🟢 Available</option>
          <option value="RESERVED">🟡 Reserved</option>
          <option value="SOLD">⚪ Sold</option>
        </select>
      </div>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        borderRadius: 6,
        padding,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.2,
      }}
      title={config.hint}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};
