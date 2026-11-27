import { buildUrl, pathFor, sectionPageFor } from '../routing';

/** The public address of a listing, e.g. https://…/businesses?open=<id> (see routing.ts) */
export const listingUrl = (item: any): string => {
  const path = buildUrl(pathFor(sectionPageFor(item)), { open: item?.id != null ? String(item.id) : undefined });
  return `${window.location.origin}${path}`;
};

const listingName = (item: any): string => item?.name || item?.title || 'this listing';

/** A WhatsApp link that opens a chat picker with the listing's name and address filled in */
export const whatsappShareUrl = (item: any): string => {
  const text = `Check out ${listingName(item)} on ECLAT CONNECT: ${listingUrl(item)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

/** Copies text, with a fallback for older phone browsers; resolves true when it worked */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the older method
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
};

/**
 * Shares a listing: the phone's own share sheet where available (WhatsApp, Instagram, SMS…),
 * otherwise copies the link. Resolves 'shared', 'copied' or 'failed'.
 */
export const shareListing = async (item: any): Promise<'shared' | 'copied' | 'failed'> => {
  const url = listingUrl(item);
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: listingName(item), text: `${listingName(item)} on ECLAT CONNECT`, url });
      return 'shared';
    } catch (err: any) {
      // The visitor closed the share sheet: nothing else to do
      if (err?.name === 'AbortError') return 'shared';
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed';
};
