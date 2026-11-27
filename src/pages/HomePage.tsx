import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Camera,
  Hammer,
  Heart,
  House,
  MapPin,
  Megaphone,
  MessageCircle,
  Recycle,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Truck,
  UtensilsCrossed,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Category, Location } from '../types';
import { DirectContactButtons } from '../components/DirectContactButtons';
import { request } from '../api/client';
import { DirectoryCardsSkeleton } from '../components/SkeletonLoader';
import { TrustBadge } from '../components/TrustBadge';
import { HomeHero, HeroStats, SearchScope, SearchSuggestion } from '../components/HomeHero';
import './HomePage.css';

interface HomePageProps {
  categories: Category[];
  locations: Location[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  onNavigate: (page: string) => void;
  onSearch?: (searchQuery: string, catId?: string, locId?: string) => void;
  onSelectItem?: (item: any) => void;
  favorites?: Record<string, boolean>;
  onToggleFavorite?: (item: any) => void;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

/** Which part of the marketplace a browse tile counts and opens */
type BrowseKey = 'businesses' | 'products' | 'artisans' | 'services' | 'preowned';

interface BrowseTileConfig {
  key: BrowseKey;
  title: string;
  badge: string;
  desc: string;
  icon: LucideIcon;
  /** Page the tile opens, and the section its quick links search in */
  target: SearchScope;
  /** Word used with the live count, e.g. "12 artisans" */
  unit: [one: string, many: string];
  /** Popular searches shown as quick links on the tile */
  quick: string[];
}

const BROWSE_TILES: BrowseTileConfig[] = [
  {
    key: 'businesses',
    title: 'Businesses',
    badge: 'Shops & brands',
    desc: 'Local storefronts, retail shops and verified campus sellers',
    icon: Store,
    target: 'Businesses',
    unit: ['business', 'businesses'],
    quick: ['Supermarket', 'Pharmacy', 'Printing'],
  },
  {
    key: 'products',
    title: 'Products',
    badge: 'Buy new',
    desc: 'Gadgets, fashion, provisions and brand-new merchandise',
    icon: ShoppingBag,
    target: 'Products',
    unit: ['product', 'products'],
    quick: ['Phone charger', 'Textbooks', 'Shoes'],
  },
  {
    key: 'artisans',
    title: 'Artisans',
    badge: 'Skilled trades',
    desc: 'Tailors, stylists, electricians, plumbers and technicians',
    icon: Hammer,
    target: 'Artisans',
    unit: ['artisan', 'artisans'],
    quick: ['Tailor', 'Barber', 'Electrician'],
  },
  {
    key: 'services',
    title: 'Services',
    badge: 'Everyday help',
    desc: 'Laundry, repairs, logistics and campus deliveries',
    icon: Wrench,
    target: 'Services',
    unit: ['service', 'services'],
    quick: ['Laundry', 'Phone repair', 'Delivery'],
  },
  {
    key: 'preowned',
    title: 'Pre-owned',
    badge: 'Student deals',
    desc: 'Gently used electronics, furniture, books and appliances',
    icon: Recycle,
    target: 'Pre-owned',
    unit: ['item', 'items'],
    quick: ['Used laptop', 'Fan', 'Mattress'],
  },
];

/** Shown on the Requests tile when there are no live requests yet; clearly labelled as examples */
const EXAMPLE_REQUESTS = ['Laundry pickup this weekend', 'Cracked phone screen fix', 'A tailor for an event outfit'];

/** "5m ago", "3h ago", "2d ago"; empty when the date is missing or invalid */
const timeAgo = (raw?: string): string => {
  const time = raw ? new Date(raw).getTime() : NaN;
  if (!Number.isFinite(time)) return '';
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : '';
};

/** Which browse tile a loaded item belongs to; null for customer requests */
const browseKeyOf = (it: any): BrowseKey | null => {
  if (it.request_type === 'PREOWNED_SALE') return 'preowned';
  if (it.request_type) return null;
  if (it.type === 'PROFESSIONAL') return 'artisans';
  if (it.type === 'BUSINESS') return 'businesses';
  if (it.kind === 'SERVICE') return 'services';
  return 'products';
};

const STEPS: { title: string; text: string; icon: LucideIcon }[] = [
  {
    icon: Megaphone,
    title: 'Search or post',
    text: 'Browse local listings, or post what you need and let providers come to you with quotes.',
  },
  {
    icon: MessageCircle,
    title: 'Contact directly',
    text: 'Call or WhatsApp the seller or artisan yourself. No middleman and no platform fees.',
  },
  {
    icon: BadgeCheck,
    title: 'Deal and review',
    text: 'Agree the price and details together, then leave a review to help the next person.',
  },
];

const SAFETY_TIPS = [
  'Meet in a public place, such as near a campus gate or a busy shop.',
  'Inspect the item or agree the job details before you pay.',
  'Never pay an advance "deposit" to someone you have not met.',
  'Report any listing or person that seems suspicious.',
];

/** Lucide icon for a category name, so sections never rely on emoji. */
const categoryIconFor = (categoryName: string): LucideIcon => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('electrical') || name.includes('solar')) return Zap;
  if (name.includes('electr') || name.includes('gadget') || name.includes('phone') || name.includes('laptop')) return Smartphone;
  if (name.includes('food') || name.includes('grocer') || name.includes('snack')) return UtensilsCrossed;
  if (name.includes('hair') || name.includes('barb') || name.includes('salon') || name.includes('beauty')) return Scissors;
  if (name.includes('fashion') || name.includes('cloth') || name.includes('tailor') || name.includes('shoe')) return Shirt;
  if (name.includes('repair') || name.includes('plumb') || name.includes('carpent') || name.includes('trade')) return Wrench;
  if (name.includes('home') || name.includes('hostel') || name.includes('lifestyle')) return House;
  if (name.includes('clean') || name.includes('laundry')) return Sparkles;
  if (name.includes('transport') || name.includes('deliver') || name.includes('dispatch')) return Truck;
  if (name.includes('educat') || name.includes('book') || name.includes('tutor')) return BookOpen;
  if (name.includes('photo') || name.includes('media') || name.includes('creative')) return Camera;
  if (name.includes('pre-owned') || name.includes('used')) return Recycle;
  if (name.includes('request')) return Megaphone;
  return Tag;
};

/** The brand's sweeping arc, drawn as a decorative band. */
const BrandArc: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 600 220" aria-hidden="true" focusable="false" preserveAspectRatio="none">
    <path d="M0 220 C 170 150, 380 110, 600 10 L 600 70 C 400 150, 200 185, 40 220 Z" />
    <path d="M140 220 C 300 175, 470 140, 600 95 L 600 125 C 480 170, 330 200, 230 220 Z" opacity="0.55" />
  </svg>
);

// ---------------------------------------------------------------------------
// Listing card
// ---------------------------------------------------------------------------

interface ListingCardProps {
  item: any;
  icon: LucideIcon;
  isFavorite: boolean;
  onOpen?: (item: any) => void;
  onToggleFavorite?: (item: any) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ item, icon: Icon, isFavorite, onOpen, onToggleFavorite }) => {
  const image: string | null = item.image_url || (item.images ? item.images.split(',')[0].trim() : null);
  const isWantedRequest = Boolean(item.request_type && item.request_type !== 'PREOWNED_SALE');
  const price = Number(item.price);

  return (
    <article className="hx-card">
      <button type="button" className="hx-card-open" onClick={() => onOpen?.(item)} aria-label={`View ${item.name}`}>
        <div className="hx-card-media">
          {image ? <img src={image} alt="" loading="lazy" /> : <Icon className="hx-card-placeholder" size={40} strokeWidth={1.6} aria-hidden="true" />}
        </div>
        <div className="hx-card-body">
          <div className="hx-card-badges">
            <TrustBadge item={item} />
          </div>
          <h3 className="hx-card-title">{item.name}</h3>
          {price > 0 && (
            <p className="hx-card-price">
              {isWantedRequest && <span className="hx-card-price-label">Budget</span>}₦{price.toLocaleString()}
            </p>
          )}
          <p className="hx-card-meta">
            <MapPin size={14} aria-hidden="true" />
            <span>{item.location_area || item.location || 'Ogbomoso'}</span>
            {item.provider_name && <span className="hx-card-seller">· {item.provider_name}</span>}
          </p>
        </div>
      </button>

      {onToggleFavorite && (
        <button
          type="button"
          className={`hx-card-fav${isFavorite ? ' is-active' : ''}`}
          onClick={() => onToggleFavorite(item)}
          aria-label={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
          aria-pressed={isFavorite}
        >
          <Heart size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}

      {!isWantedRequest && (item.phone || item.whatsapp) && (
        <div className="hx-card-actions">
          <DirectContactButtons phone={item.phone} whatsapp={item.whatsapp} listingTitle={item.name} variant="compact" />
        </div>
      )}
      {isWantedRequest && (
        <div className="hx-card-actions hx-card-note">Providers reply to this request with quotes</div>
      )}
    </article>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  locations,
  onSelectCategory,
  onNavigate,
  onSearch,
  onSelectItem,
  favorites = {},
  onToggleFavorite,
}) => {
  // Live listings, requests and provider profiles
  const [uploadedItems, setUploadedItems] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  // Counts for the hero's live line, worked out from the same responses (no extra requests)
  const [liveCounts, setLiveCounts] = useState<Omit<HeroStats, 'areas'> | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      request<any[]>('/public/listings').catch(() => []),
      request<any[]>('/public/requests').catch(() => []),
      request<any[]>('/public/providers').catch(() => []),
    ]).then(([listingsData, requestsData, providersData]) => {
      if (!isMounted) return;

      // Products, services and past work published by approved providers
      const normalizedListings = (Array.isArray(listingsData) ? listingsData : []).map(item => ({
        ...item,
        id: item.id,
        name: item.name || item.title,
        kind: item.kind || 'PRODUCT',
        price: item.price ?? null,
        location: item.location_area || item.location || 'Ogbomoso',
        category_name: item.category_name || item.category || item.custom_category || 'General',
        category_id: item.category_id,
        provider_name: item.provider_name || item.name,
        phone: item.phone,
        whatsapp: item.whatsapp || item.phone,
        image_url: item.image_url || (item.images ? item.images.split(',')[0].trim() : null),
        images: item.images,
        description: item.description,
        availability_status: item.availability_status || 'AVAILABLE',
      }));

      // Customer requests and pre-owned items posted by users
      const normalizedRequests = (Array.isArray(requestsData) ? requestsData : []).map(req => ({
        ...req,
        id: req.id,
        name: req.title || req.name,
        kind: req.request_type === 'PREOWNED_SALE' ? 'PREOWNED_SALE' : (req.request_type || 'REQUEST'),
        price: req.budget ?? null,
        location: req.location_area || req.location || 'Ogbomoso',
        category_name: req.category || req.category_name || req.custom_category || (req.request_type === 'PREOWNED_SALE' ? 'Pre-owned Items' : 'Customer Requests'),
        category_id: req.category_id,
        provider_name: undefined,
        // Only pre-owned sellers are contacted directly; wanted requests are answered with quotes.
        phone: req.request_type === 'PREOWNED_SALE' ? (req.phone || req.customer_phone) : undefined,
        whatsapp: req.request_type === 'PREOWNED_SALE' ? (req.whatsapp || req.phone || req.customer_phone) : undefined,
        image_url: req.image_url || (req.images ? req.images.split(',')[0].trim() : null),
        images: req.images,
        description: req.description,
        availability_status: req.availability_status || 'AVAILABLE',
      }));

      // Business and artisan profiles
      const normalizedProviders = (Array.isArray(providersData) ? providersData : []).map(prov => ({
        ...prov,
        id: prov.id,
        name: prov.name,
        kind: prov.type === 'PROFESSIONAL' ? 'ARTISAN' : 'BUSINESS',
        price: null,
        location: prov.location_area || prov.location || 'Ogbomoso',
        category_name: prov.category || prov.category_name || prov.custom_category || (prov.type === 'PROFESSIONAL' ? 'Campus Artisans' : 'Campus Businesses'),
        category_id: prov.category_id,
        provider_name: prov.name,
        phone: prov.phone,
        whatsapp: prov.whatsapp || prov.phone,
        image_url: prov.image_url,
        description: prov.description,
        type: prov.type,
      }));

      // "New today": anything published in the last 24 hours that carries a creation date
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const isNew = (it: any) => {
        const raw = it.created_at || it.createdAt || it.date_created;
        const time = raw ? new Date(raw).getTime() : NaN;
        return Number.isFinite(time) && time >= dayAgo;
      };
      const preowned = normalizedRequests.filter(r => r.request_type === 'PREOWNED_SALE');
      setLiveCounts({
        providers: normalizedProviders.length,
        listings: normalizedListings.length,
        preowned: preowned.length,
        newToday: [...normalizedListings, ...preowned, ...normalizedProviders].filter(isNew).length,
      });

      setUploadedItems([...normalizedListings, ...normalizedRequests, ...normalizedProviders]);
      setLoadingListings(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  /** For "Everything" searches, pick the section with the most matches on this page's data. */
  const bestScopeFor = (q: string): string => {
    const term = q.trim().toLowerCase();
    if (!term) return 'Products';
    const counts: Record<string, number> = { Products: 0, Services: 0, Artisans: 0, Businesses: 0, 'Pre-owned': 0 };
    uploadedItems.forEach(it => {
      const haystack = `${it.name || ''} ${it.description || ''} ${it.category_name || ''}`.toLowerCase();
      if (!haystack.includes(term)) return;
      if (it.request_type === 'PREOWNED_SALE') counts['Pre-owned'] += 1;
      else if (it.request_type) return;
      else if (it.type === 'PROFESSIONAL') counts.Artisans += 1;
      else if (it.type === 'BUSINESS') counts.Businesses += 1;
      else if (it.kind === 'SERVICE') counts.Services += 1;
      else counts.Products += 1;
    });
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : 'Products';
  };

  const runSearch = (q: string, scope: SearchScope, locationId: string) => {
    onSelectCategory('');
    onSearch?.(q.trim(), undefined, locationId || undefined);
    onNavigate(scope === 'ALL' ? bestScopeFor(q) : scope);
  };

  const handleViewMoreCategory = (cat: { id?: string; name: string; target_type?: string }) => {
    if (cat.id && !cat.id.startsWith('custom-')) {
      onSelectCategory(cat.id);
      onSearch?.('', cat.id, undefined);
    } else {
      onSearch?.(cat.name, undefined, undefined);
    }

    const pageTarget =
      cat.target_type === 'ARTISAN' || cat.name === 'Campus Artisans'
        ? 'Artisans'
        : cat.target_type === 'SERVICE'
        ? 'Services'
        : cat.target_type === 'BUSINESS' || cat.name === 'Campus Businesses'
        ? 'Businesses'
        : cat.name === 'Pre-owned Items'
        ? 'Pre-owned'
        : cat.name === 'Customer Requests'
        ? 'Requests'
        : 'Products';

    onNavigate(pageTarget);
  };

  const openHub = (loc: Location) => {
    onSelectCategory('');
    onSearch?.('', undefined, loc.id);
    onNavigate('Businesses');
  };

  // Group live items into category sections, largest first
  const categorySections = React.useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; target_type?: string; items: any[] }>();

    categories.forEach(cat => {
      if (!cat.name || cat.name.toLowerCase() === 'others') return;
      const key = cat.name.trim().toLowerCase();
      if (!groupMap.has(key)) {
        groupMap.set(key, { id: cat.id, name: cat.name.trim(), target_type: cat.target_type, items: [] });
      }
    });

    uploadedItems.forEach(item => {
      const rawCatName = (item.category_name || item.category || item.custom_category || '').trim();
      const normCatName = rawCatName ? rawCatName.toLowerCase() : 'other listings';

      let matchedGroup = item.category_id ? Array.from(groupMap.values()).find(g => g.id === item.category_id) : undefined;
      if (!matchedGroup && groupMap.has(normCatName)) matchedGroup = groupMap.get(normCatName);

      if (!matchedGroup) {
        matchedGroup = {
          id: item.category_id || `custom-${normCatName.replace(/[^a-z0-9]/g, '-')}`,
          name: rawCatName || 'Other listings',
          target_type: item.kind === 'SERVICE' ? 'SERVICE' : item.kind === 'ARTISAN' ? 'ARTISAN' : 'PRODUCT',
          items: [],
        };
        groupMap.set(normCatName, matchedGroup);
      }
      matchedGroup.items.push(item);
    });

    return Array.from(groupMap.values())
      .filter(g => g.items.length > 0)
      .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
  }, [categories, uploadedItems]);

  // One entry per area name (the location list can contain the same area twice)
  const hubs = React.useMemo(() => {
    const seen = new Set<string>();
    return locations.filter(loc => {
      const key = (loc.area || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [locations]);

  // What the hero search box can suggest: categories, live listings and areas (no extra requests)
  const searchSuggestions = React.useMemo<SearchSuggestion[]>(() => {
    const scopeForTarget = (target?: string): SearchScope => {
      switch ((target || '').toUpperCase()) {
        case 'PRODUCT': return 'Products';
        case 'BUSINESS': return 'Businesses';
        case 'ARTISAN': return 'Artisans';
        case 'SERVICE': return 'Services';
        default: return 'ALL';
      }
    };
    const sectionName = (scope: SearchScope) => (scope === 'ALL' ? 'Category' : scope);
    const list: SearchSuggestion[] = [];
    const seen = new Set<string>();
    const add = (s: SearchSuggestion) => {
      const key = `${s.type}:${s.scope}:${s.label.toLowerCase()}`;
      if (!s.label || seen.has(key)) return;
      seen.add(key);
      list.push(s);
    };

    categories.forEach(c => {
      if (!c.name || c.name.trim().toLowerCase() === 'others') return;
      const scope = scopeForTarget(c.target_type);
      add({ label: c.name.trim(), type: 'category', scope, hint: sectionName(scope) });
    });

    uploadedItems.slice(0, 300).forEach(it => {
      const isRequest = Boolean(it.request_type && it.request_type !== 'PREOWNED_SALE');
      if (isRequest || !it.name) return;
      const scope: SearchScope =
        it.request_type === 'PREOWNED_SALE' ? 'Pre-owned'
          : it.type === 'PROFESSIONAL' ? 'Artisans'
          : it.type === 'BUSINESS' ? 'Businesses'
          : it.kind === 'SERVICE' ? 'Services'
          : 'Products';
      add({ label: String(it.name).trim(), type: 'listing', scope, hint: scope });
    });

    hubs.forEach(loc => {
      add({ label: loc.area, type: 'area', scope: 'ALL', locationId: loc.id, hint: loc.landmark });
    });

    return list;
  }, [categories, uploadedItems, hubs]);

  // Live counts and up to three listing photos for each browse tile, from the listings this page
  // already loaded, plus the newest customer requests for the Requests tile
  const browseData = React.useMemo(() => {
    if (loadingListings) return null;
    const counts: Record<BrowseKey, number> = { businesses: 0, products: 0, artisans: 0, services: 0, preowned: 0 };
    const photos: Record<BrowseKey, string[]> = { businesses: [], products: [], artisans: [], services: [], preowned: [] };
    const requests: any[] = [];
    uploadedItems.forEach(it => {
      const key = browseKeyOf(it);
      if (!key) {
        requests.push(it);
        return;
      }
      counts[key] += 1;
      if (it.image_url && photos[key].length < 3) photos[key].push(it.image_url);
    });
    const dateOf = (it: any) => new Date(it.created_at || it.createdAt || 0).getTime() || 0;
    const latestRequests = requests.sort((a, b) => dateOf(b) - dateOf(a)).slice(0, 3);
    return { counts, photos, latestRequests, requestCount: requests.length };
  }, [loadingListings, uploadedItems]);

  // The tiles rise in one after another the first time the section scrolls into view.
  // Without JavaScript, or with reduced motion, they are simply shown.
  const tilesRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = tilesRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('is-armed');
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          el.classList.add('is-in');
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // How many listings sit in each area, matched by area name
  const hubCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    uploadedItems.forEach(it => {
      if (it.request_type && it.request_type !== 'PREOWNED_SALE') return;
      const key = String(it.location || '').trim().toLowerCase();
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [uploadedItems]);

  // Short answers to what new visitors ask first; the areas come from the live list
  const faqs = React.useMemo(() => {
    const areaNames = hubs.map(h => h.area).filter(Boolean);
    const areas = areaNames.length > 0 ? `, including ${areaNames.slice(0, 6).join(', ')}` : '';
    return [
      {
        q: 'Is ECLAT CONNECT free to use?',
        a: 'Yes. Browsing, posting what you need and listing your business are all free. There is no checkout and no payment fee: you pay the seller or artisan directly.',
      },
      {
        q: 'How do I contact a seller or artisan?',
        a: 'Open any listing and tap Call or WhatsApp. You talk to them directly and agree the price and details together.',
      },
      {
        q: 'How do I post what I need?',
        a: 'Tap "Post what I need", describe it and add your budget. Providers around you see your request and send you offers. Your exact address stays private.',
      },
      {
        q: 'How do I list my business, skill or service?',
        a: 'Tap "List your business free" and fill in a short profile. The ECLAT CONNECT team reviews it before it goes live, so customers can trust what they see.',
      },
      {
        q: 'Where does ECLAT CONNECT work?',
        a: `Around LAUTECH and across Ogbomoso${areas}. More areas are added as people join.`,
      },
      {
        q: 'How do I stay safe?',
        a: 'Meet in a public place, check the item or agree the job before you pay, and never send an advance "deposit" to someone you have not met. Report anything suspicious from the listing.',
      },
    ];
  }, [hubs]);

  // The launch band's sample cards deal in, fanning out, the first time they scroll into view
  const launchRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = launchRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('is-armed');
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          el.classList.add('is-in');
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingListings, categorySections.length]);

  const heroStats = React.useMemo<HeroStats | null>(
    () => (liveCounts ? { ...liveCounts, areas: hubs.length } : null),
    [liveCounts, hubs.length]
  );

  return (
    <div className="hx">
      <HomeHero
        areas={hubs}
        suggestions={searchSuggestions}
        stats={heroStats}
        onSearch={runSearch}
        onNavigate={onNavigate}
      />

      {/* ================================================================ */}
      {/* Browse                                                           */}
      {/* ================================================================ */}
      <section className="hx-section hx-frame hx-browse" aria-labelledby="hx-browse-title">
        <div className="hx-section-head">
          <div>
            <p className="hx-eyebrow">Browse by category</p>
            <h2 id="hx-browse-title" className="hx-h2">What are you looking for?</h2>
            <p className="hx-section-note">
              Pick a category, tap a popular search, or post what you need and let providers come to you.
            </p>
          </div>
        </div>

        <ul className="hx-bento" ref={tilesRef}>
          {/* Requests: the post-a-need path, drawn like a small hero, with the newest real requests */}
          <li className="hx-bento-item hx-bento-requests" style={{ '--hx-i': 0 } as React.CSSProperties}>
            <div className="hx-req">
              <div className="hx-req-top">
                <span className="hx-req-icon" aria-hidden="true"><Megaphone size={24} strokeWidth={2.2} /></span>
                {browseData && browseData.requestCount > 0 && (
                  <span className="hx-req-live">
                    <span className="hx-req-live-dot" aria-hidden="true" />
                    {browseData.requestCount} open {browseData.requestCount === 1 ? 'request' : 'requests'}
                  </span>
                )}
              </div>
              <h3 className="hx-req-title">
                Need something? <span className="hx-script">Post it</span> and let providers come to you.
              </h3>

              {browseData && browseData.latestRequests.length > 0 ? (
                <>
                  <p className="hx-req-label">Latest requests</p>
                  <ul className="hx-req-list">
                    {browseData.latestRequests.map((req, i) => {
                      const meta = [req.location, req.price ? `Budget ₦${Number(req.price).toLocaleString()}` : '', timeAgo(req.created_at || req.createdAt)]
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <li key={req.id ?? i} className="hx-req-row" style={{ '--hx-j': i } as React.CSSProperties}>
                          <span className="hx-req-row-title">{req.name}</span>
                          {meta && <span className="hx-req-row-meta">{meta}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <>
                  <p className="hx-req-label">For example</p>
                  <ul className="hx-req-list">
                    {EXAMPLE_REQUESTS.map((text, i) => (
                      <li key={text} className="hx-req-row is-example" style={{ '--hx-j': i } as React.CSSProperties}>
                        <span className="hx-req-row-title">“{text}”</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <ol className="hx-req-steps" aria-label="How requests work">
                <li>
                  <span className="hx-req-step-num" aria-hidden="true">1</span>
                  <span><strong>Post your need</strong> Say what you need and your budget</span>
                </li>
                <li>
                  <span className="hx-req-step-num" aria-hidden="true">2</span>
                  <span><strong>Get offers</strong> Providers nearby send you a quote</span>
                </li>
                <li>
                  <span className="hx-req-step-num" aria-hidden="true">3</span>
                  <span><strong>Chat on WhatsApp</strong> Agree the price and details directly</span>
                </li>
              </ol>

              <div className="hx-req-actions">
                <button type="button" className="hx-req-post" onClick={() => onNavigate('Post What I Need')}>
                  <Megaphone size={16} strokeWidth={2.4} aria-hidden="true" /> Post what I need
                </button>
                <button type="button" className="hx-req-all" onClick={() => onNavigate('Requests')}>
                  See all requests <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>

          {BROWSE_TILES.map((tile, i) => {
            const Icon = tile.icon;
            const count = browseData?.counts[tile.key] ?? 0;
            const photos = browseData?.photos[tile.key] ?? [];
            const countText = count > 0 ? `${count} ${count === 1 ? tile.unit[0] : tile.unit[1]}` : null;
            return (
              <li key={tile.key} className="hx-bento-item" style={{ '--hx-i': i + 1 } as React.CSSProperties}>
                <div className="hx-tile">
                  <div className="hx-tile-top">
                    <span className="hx-tile-icon" aria-hidden="true"><Icon size={24} strokeWidth={2} /></span>
                    {photos.length > 0 ? (
                      <span className="hx-tile-photos" aria-hidden="true">
                        {photos.map(src => (
                          <img key={src} src={src} alt="" loading="lazy" decoding="async" />
                        ))}
                      </span>
                    ) : (
                      <span className="hx-tile-badge">{tile.badge}</span>
                    )}
                  </div>
                  <h3 className="hx-tile-title">
                    {/* The title's button covers the whole tile, so a tap anywhere opens the category */}
                    <button type="button" className="hx-tile-link" onClick={() => onNavigate(tile.target)}>
                      {tile.title}
                    </button>
                  </h3>
                  <p className="hx-tile-desc">{tile.desc}</p>
                  <div className="hx-tile-quick" aria-label={`Popular in ${tile.title}`}>
                    {tile.quick.map(q => (
                      <button key={q} type="button" className="hx-tile-chip" onClick={() => runSearch(q, tile.target, '')}>
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="hx-tile-foot">
                    <span className="hx-tile-count">
                      {countText ? (
                        <>
                          <span className="hx-tile-dot" aria-hidden="true" />
                          {countText}
                        </>
                      ) : (
                        'Explore'
                      )}
                    </span>
                    <span className="hx-tile-go" aria-hidden="true"><ArrowRight size={16} strokeWidth={2.4} /></span>
                  </div>
                </div>
              </li>
            );
          })}

          {/* The other side of the marketplace: people who sell or offer a service */}
          <li className="hx-bento-item hx-bento-list" style={{ '--hx-i': BROWSE_TILES.length + 1 } as React.CSSProperties}>
            <div className="hx-tile hx-tile-list">
              <div className="hx-tile-top">
                <span className="hx-tile-icon" aria-hidden="true"><BadgeCheck size={24} strokeWidth={2} /></span>
                <span className="hx-tile-badge">Free</span>
              </div>
              <h3 className="hx-tile-title">
                <button type="button" className="hx-tile-link" onClick={() => onNavigate('Provider Application')}>
                  Sell or offer a service?
                </button>
              </h3>
              <p className="hx-tile-desc">List your business, skill or service free and get found by students and residents.</p>
              <div className="hx-tile-foot">
                <span className="hx-tile-count">List it free</span>
                <span className="hx-tile-go" aria-hidden="true"><ArrowRight size={16} strokeWidth={2.4} /></span>
              </div>
            </div>
          </li>
        </ul>
      </section>

      {/* ================================================================ */}
      {/* Latest listings                                                  */}
      {/* ================================================================ */}
      <section className="hx-section" aria-labelledby="hx-latest-title">
        <div className="hx-section-head">
          <div>
            <p className="hx-eyebrow">Around campus</p>
            <h2 id="hx-latest-title" className="hx-h2">Latest on ECLAT CONNECT</h2>
          </div>
        </div>

        {loadingListings && <DirectoryCardsSkeleton count={4} />}

        {!loadingListings && categorySections.length === 0 && (
          /* No approved listings yet: an honest launch message instead of an empty strip */
          <div className="hx-launch">
            <div className="hx-launch-text">
              <p className="hx-launch-kicker">
                <span className="hx-launch-dot" aria-hidden="true" /> Just launching
              </p>
              <h3 className="hx-launch-title">
                The first listings around LAUTECH are <span className="hx-script">on their way.</span>
              </h3>
              <p className="hx-launch-note">
                Local businesses, artisans and sellers are joining now. Their listings appear here as soon as the
                ECLAT CONNECT team approves them. Be one of the first to be found.
              </p>
              <div className="hx-launch-actions">
                <button type="button" className="hx-btn hx-btn-primary" onClick={() => onNavigate('Provider Application')}>
                  Be the first to list <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button type="button" className="hx-launch-secondary" onClick={() => onNavigate('Post What I Need')}>
                  Or post what you need
                </button>
              </div>
            </div>
            {/* Three sample cards show where listings will appear; they are clearly placeholders */}
            <ul className="hx-launch-cards" aria-hidden="true" ref={launchRef}>
              {[
                { icon: Store, label: 'Your shop here', meta: 'Businesses' },
                { icon: Hammer, label: 'Your skill here', meta: 'Artisans' },
                { icon: Recycle, label: 'Your item here', meta: 'Pre-owned' },
              ].map(({ icon: CardIcon, label, meta }, i) => (
                <li key={label} className="hx-launch-card" style={{ '--hx-k': i } as React.CSSProperties}>
                  <span className="hx-launch-card-tick"><BadgeCheck size={14} strokeWidth={2.6} /> Listed</span>
                  <span className="hx-launch-card-img"><CardIcon size={28} strokeWidth={1.8} /></span>
                  <span className="hx-launch-card-title">{label}</span>
                  <span className="hx-launch-card-meta">{meta}</span>
                  <span className="hx-launch-card-bar" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loadingListings && categorySections.length > 1 && (
          <nav className="hx-jump" aria-label="Jump to a category">
            {categorySections.map(cat => {
              const Icon = categoryIconFor(cat.name);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="hx-chip hx-chip-light"
                  onClick={() => document.getElementById(`hx-cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <Icon size={15} aria-hidden="true" /> {cat.name} <span className="hx-chip-count">{cat.items.length}</span>
                </button>
              );
            })}
          </nav>
        )}

        {!loadingListings &&
          categorySections.map(cat => {
            const Icon = categoryIconFor(cat.name);
            return (
              <div key={cat.id} id={`hx-cat-${cat.id}`} className="hx-rail-block">
                <div className="hx-rail-head">
                  <h3 className="hx-h3">
                    <span className="hx-h3-icon"><Icon size={18} aria-hidden="true" /></span>
                    {cat.name}
                    <span className="hx-count">{cat.items.length}</span>
                  </h3>
                  <button type="button" className="hx-link" onClick={() => handleViewMoreCategory(cat)}>
                    See all <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="hx-rail">
                  {cat.items.slice(0, 8).map(item => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      icon={Icon}
                      isFavorite={!!favorites[item.id]}
                      onOpen={onSelectItem}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </section>

      {/* ================================================================ */}
      {/* How it works, with staying safe beside it                        */}
      {/* ================================================================ */}
      <section className="hx-section hx-how" aria-labelledby="hx-how-title">
        <div className="hx-section-head">
          <div>
            <p className="hx-eyebrow">How it works</p>
            <h2 id="hx-how-title" className="hx-h2">Three steps, no middleman</h2>
          </div>
        </div>
        <div className="hx-how-grid">
          <ol className="hx-steps">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <li key={step.title} className="hx-step">
                  <span className="hx-step-num" aria-hidden="true">{i + 1}</span>
                  <span className="hx-step-icon" aria-hidden="true"><StepIcon size={22} strokeWidth={2} /></span>
                  <h3 className="hx-h3">{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              );
            })}
          </ol>
          <aside className="hx-safe" aria-labelledby="hx-safety-title">
            <span className="hx-safe-icon" aria-hidden="true"><ShieldCheck size={24} /></span>
            <h3 id="hx-safety-title" className="hx-safe-title">Deal safely</h3>
            <p className="hx-safe-note">
              ECLAT CONNECT doesn't handle payments, so you agree every deal directly. A few habits keep it safe.
            </p>
            <ul className="hx-safe-list">
              {SAFETY_TIPS.map(tip => (
                <li key={tip}>
                  <BadgeCheck size={18} aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Areas                                                            */}
      {/* ================================================================ */}
      {hubs.length > 0 && (
        <section className="hx-section" aria-labelledby="hx-hubs-title">
          <div className="hx-section-head">
            <div>
              <p className="hx-eyebrow">Areas</p>
              <h2 id="hx-hubs-title" className="hx-h2">Around campus and town</h2>
            </div>
            <p className="hx-section-note">Pick an area to see who's there.</p>
          </div>
          <div className="hx-hubs">
            {hubs.map(loc => {
              const count = hubCounts[(loc.area || '').trim().toLowerCase()] || 0;
              return (
                <button key={loc.id} type="button" className="hx-hub" onClick={() => openHub(loc)}>
                  <span className="hx-hub-pin" aria-hidden="true"><MapPin size={18} /></span>
                  <span className="hx-hub-text">
                    <span className="hx-hub-name">{loc.area}</span>
                    {loc.landmark && <span className="hx-hub-landmark">{loc.landmark}</span>}
                  </span>
                  {count > 0 && (
                    <span className="hx-hub-count">
                      {count} {count === 1 ? 'listing' : 'listings'}
                    </span>
                  )}
                  <ArrowRight className="hx-hub-arrow" size={16} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* Questions                                                        */}
      {/* ================================================================ */}
      <section className="hx-section hx-faq" aria-labelledby="hx-faq-title">
        <div className="hx-faq-head">
          <p className="hx-eyebrow">Questions</p>
          <h2 id="hx-faq-title" className="hx-h2">Good to know</h2>
          <p className="hx-section-note">
            Still unsure? Write to <a href="mailto:support@eclatconnect.com">support@eclatconnect.com</a>.
          </p>
        </div>
        <div className="hx-faq-list">
          {faqs.map((item, i) => (
            <details key={item.q} className="hx-faq-item" open={i === 0}>
              <summary>
                <span>{item.q}</span>
                <span className="hx-faq-plus" aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        {/* Lets search engines show these answers directly in results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map(item => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            }),
          }}
        />
      </section>

      {/* ================================================================ */}
      {/* For businesses and artisans                                      */}
      {/* ================================================================ */}
      <section className="hx-business" aria-labelledby="hx-biz-title">
        <BrandArc className="hx-business-arc" />
        <div className="hx-business-inner">
          <div>
            <p className="hx-eyebrow hx-eyebrow-light">For businesses and artisans</p>
            <h2 id="hx-biz-title" className="hx-business-title">
              Get found by students and residents <span className="hx-script">nearby.</span>
            </h2>
            <ul className="hx-business-points">
              <li><BadgeCheck size={18} aria-hidden="true" /> Free profile for your shop or trade</li>
              <li><MessageCircle size={18} aria-hidden="true" /> Customers call or WhatsApp you directly</li>
              <li><Megaphone size={18} aria-hidden="true" /> See requests from people who need your service</li>
            </ul>
          </div>
          <div className="hx-business-cta">
            <button type="button" className="hx-btn hx-btn-primary hx-btn-lg" onClick={() => onNavigate('Provider Application')}>
              List your business free <ArrowRight size={18} aria-hidden="true" />
            </button>
            <p>Profiles are reviewed by the ECLAT CONNECT team before they go live.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
