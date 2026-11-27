/**
 * Routing: every page of the app has its own web address.
 *
 * ECLAT CONNECT is a single-page application (SPA): the browser loads index.html once and React
 * swaps the page content without reloading. "Single page" describes how the app is delivered, not
 * how many addresses it has. Each screen should still have its own URL, so that:
 *   - links can be shared (a WhatsApp link to /artisans?q=tailor opens Artisans, not the home page),
 *   - refresh and the browser's Back and Forward buttons work as people expect,
 *   - search engines can index the sections (/businesses, /services, ...).
 *
 * This module is the single source of truth for those addresses. The app still names pages with
 * the same strings it always used ('Businesses', 'Post What I Need', ...); routing turns a page
 * name into a path and a path back into a page name, using the browser's History API
 * (pushState / popstate). No page reload happens, which keeps the SPA speed.
 *
 * The server must answer every unknown path with index.html so a shared deep link loads the app.
 * nginx.conf already does this with `try_files $uri $uri/ /index.html;`, and Vite's dev server does
 * the same, so no server change is needed.
 */

import type { MouseEvent as ReactMouseEvent } from 'react';

export const NOT_FOUND = 'Not Found';

interface RouteDef {
  /** The page name the app uses internally */
  page: string;
  /** The canonical address */
  path: string;
  /** Older or alternative addresses that should open the same page */
  aliases?: string[];
  /** Browser tab title; the home page uses the full site title */
  title: string;
}

const ROUTES: RouteDef[] = [
  { page: 'Home', path: '/', title: '' },

  // Marketplace sections
  { page: 'Businesses', path: '/businesses', title: 'Businesses' },
  { page: 'Products', path: '/products', title: 'Products' },
  { page: 'Artisans', path: '/artisans', aliases: ['/professionals'], title: 'Artisans' },
  { page: 'Services', path: '/services', title: 'Services' },
  { page: 'Pre-owned', path: '/pre-owned', title: 'Pre-owned items' },
  { page: 'Requests', path: '/requests', title: 'Requests' },

  // Posting and selling
  { page: 'Post What I Need', path: '/post', title: 'Post what I need' },
  { page: 'Post Product Request', path: '/post/product', title: 'Request a product' },
  { page: 'Post Service Request', path: '/post/service', title: 'Request a service' },
  { page: 'Post Pre-owned Request', path: '/post/pre-owned', title: 'Request a used item' },
  { page: 'Sell Pre-owned Item', path: '/sell', title: 'Sell a pre-owned item' },

  // Account
  { page: 'Auth', path: '/sign-in', aliases: ['/login', '/signin'], title: 'Sign in' },
  { page: 'Account', path: '/account', title: 'My account' },
  { page: 'My Requests', path: '/account/requests', title: 'My requests' },
  { page: 'Responses', path: '/account/offers', title: 'Offers on my requests' },
  { page: 'My Reviews', path: '/account/reviews', title: 'My reviews' },
  { page: 'Favourites', path: '/saved', aliases: ['/favourites', '/favorites'], title: 'Saved' },
  { page: 'Notifications', path: '/notifications', title: 'Notifications' },

  // Providers
  { page: 'Provider Application', path: '/list-your-business', title: 'List your business free' },
  { page: 'Vendor Workspace', path: '/workspace', aliases: ['/vendor'], title: 'My workspace' },
  { page: 'New Listing', path: '/workspace/new-listing', title: 'New listing' },

  // Admin
  { page: 'Admin', path: '/admin', title: 'Admin' },

  // Legal
  { page: 'Privacy Policy', path: '/privacy-policy', aliases: ['/privacy'], title: 'Privacy policy' },
  { page: 'Terms of Service', path: '/terms-of-service', aliases: ['/terms'], title: 'Terms of service' },
];

/** Page names that are other names for a page above */
const PAGE_ALIASES: Record<string, string> = {
  Professionals: 'Artisans',
  'Vendor Dashboard': 'Vendor Workspace',
};

const SITE_TITLE = 'ECLAT CONNECT — LAUTECH & Ogbomoso Local Marketplace';

/** Lower-case, no trailing slash (except the root), no ".html" */
const normalisePath = (pathname: string): string => {
  let p = (pathname || '/').toLowerCase().replace(/\.html$/, '');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
};

const routeForPage = (page: string): RouteDef | undefined => {
  const name = PAGE_ALIASES[page] || page;
  return ROUTES.find(r => r.page === name);
};

/** The address for a page name, e.g. 'Businesses' -> '/businesses' */
export const pathFor = (page: string): string => routeForPage(page)?.path ?? '/';

/** The page name for an address, e.g. '/businesses' -> 'Businesses'; unknown addresses -> NOT_FOUND */
export const pageFor = (pathname: string): string => {
  const p = normalisePath(pathname);
  const match = ROUTES.find(r => r.path === p || r.aliases?.includes(p));
  return match ? match.page : NOT_FOUND;
};

/** The browser tab title for a page */
export const titleFor = (page: string): string => {
  if (page === NOT_FOUND) return `Page not found · ECLAT CONNECT`;
  const route = routeForPage(page);
  return route && route.title ? `${route.title} · ECLAT CONNECT` : SITE_TITLE;
};

/** Pages whose search filters live in the address, e.g. /artisans?q=tailor&area=...&category=... */
export const FILTER_PAGES = ['Businesses', 'Products', 'Artisans', 'Professionals', 'Services', 'Pre-owned', 'Requests'];

export interface UrlFilters {
  q: string;
  area: string;
  category: string;
}

/** Search filters from an address's query string */
export const filtersFrom = (search: string): UrlFilters => {
  const params = new URLSearchParams(search);
  return { q: params.get('q') || '', area: params.get('area') || '', category: params.get('category') || '' };
};

/** Builds an address with query parameters, leaving out empty ones */
export const buildUrl = (path: string, params: Record<string, string | undefined>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
};

/**
 * The section a listing belongs to, so a shared listing link opens on the right page:
 * /businesses?open=<id>, /pre-owned?open=<id>, ...
 */
export const sectionPageFor = (item: any): string => {
  if (!item) return 'Products';
  if (item.request_type === 'PREOWNED_SALE') return 'Pre-owned';
  if (item.request_type) return 'Requests';
  if (item.type === 'PROFESSIONAL') return 'Artisans';
  if (item.type === 'BUSINESS') return 'Businesses';
  if (item.kind === 'SERVICE') return 'Services';
  return 'Products';
};

/**
 * For <a href> links handled inside the app: a normal click navigates without a reload, while
 * Ctrl/Cmd/Shift-click and middle-click keep their usual browser behaviour (open in a new tab).
 */
export const handleLinkClick = (event: ReactMouseEvent, navigate: () => void): void => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate();
};
