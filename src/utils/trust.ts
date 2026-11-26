// Trust labels shown on cards and detail views.
// A label is shown only when the data actually supports it:
// - "Verified" only when an administrator has granted the verification badge.
// - Pre-owned posts come from individual users, so they are labelled "Private seller".
// - Customer requests are labelled as requests, never as providers.
// When none of these apply, no trust label is shown.

export type TrustTone = 'verified' | 'neutral';

export interface TrustLabel {
  text: string;
  tone: TrustTone;
}

export function isRequestItem(item: any): boolean {
  return Boolean(item && (item.request_type || item.customer_id));
}

export function isPreownedSale(item: any): boolean {
  return Boolean(item && (item.request_type === 'PREOWNED_SALE' || item.kind === 'PREOWNED_SALE'));
}

export function getTrustLabel(item: any): TrustLabel | null {
  if (!item) return null;

  if (isPreownedSale(item)) {
    return { text: 'Private seller', tone: 'neutral' };
  }

  if (isRequestItem(item)) {
    return { text: 'Customer request', tone: 'neutral' };
  }

  if (item.verified === true || item.provider_verified === true) {
    return {
      text: item.type === 'PROFESSIONAL' ? '✓ Verified artisan' : '✓ Verified provider',
      tone: 'verified',
    };
  }

  return null;
}
