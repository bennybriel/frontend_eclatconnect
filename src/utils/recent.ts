/**
 * "Recently viewed" listings, kept only on the visitor's own device (localStorage).
 * Each entry is a small copy of the listing, enough to show it again and to reopen it.
 */

const KEY = 'eclat_recent_listings';
const MAX = 8;

const FIELDS = [
  'id', 'name', 'title', 'image_url', 'images', 'category', 'category_name', 'custom_category', 'kind', 'type',
  'request_type', 'price', 'budget', 'location', 'location_area', 'landmark', 'phone', 'whatsapp', 'customer_phone',
  'provider_id', 'provider_name', 'description', 'verified', 'provider_verified', 'avg_rating', 'provider_rating',
  'review_count', 'provider_review_count', 'availability_status', 'condition', 'created_at',
];

const pick = (item: any) => {
  const out: Record<string, unknown> = {};
  FIELDS.forEach(f => {
    if (item?.[f] !== undefined && item?.[f] !== null) out[f] = item[f];
  });
  return out;
};

export const readRecent = (): any[] => {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const recordRecent = (item: any): void => {
  if (!item || item.id == null) return;
  try {
    const list = readRecent().filter(it => String(it.id) !== String(item.id));
    list.unshift(pick(item));
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new Event('eclat-recent-change'));
  } catch {
    // Storage can be blocked (private mode); "recently viewed" is a nicety, so skip it
  }
};

export const clearRecent = (): void => {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('eclat-recent-change'));
  } catch {
    // ignore
  }
};
