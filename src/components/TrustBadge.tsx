import React from 'react';
import { getTrustLabel } from '../utils/trust';

interface TrustBadgeProps {
  item: any;
}

// Shows a trust label only when the item's data supports it (see utils/trust.ts).
export const TrustBadge: React.FC<TrustBadgeProps> = ({ item }) => {
  const label = getTrustLabel(item);
  if (!label) return null;
  return (
    <span className={label.tone === 'verified' ? 'verified-pill' : 'neutral-pill'}>
      {label.text}
    </span>
  );
};
