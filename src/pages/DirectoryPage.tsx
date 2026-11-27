import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Hammer,
  Heart,
  LayoutGrid,
  List,
  MapPin,
  Megaphone,
  MessageCircle,
  Recycle,
  Search,
  ShoppingBag,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  Wrench,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Category, Location, AvailabilityStatus } from '../types';
import { getCategoriesForType } from '../components/CategorySelect';
import { DirectContactButtons } from '../components/DirectContactButtons';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { TrustBadge } from '../components/TrustBadge';
import { shareListing } from '../utils/share';
import { clearRecent, readRecent } from '../utils/recent';
import './DirectoryPage.css';

interface DirectoryPageProps {
  pageTitle: string;
  items: any[];
  categories: Category[];
  locations: Location[];
  q: string;
  locationFilter: string;
  categoryFilter: string;
  onSearchChange: (q: string) => void;
  onLocationChange: (loc: string) => void;
  onCategoryChange: (cat: string) => void;
  /** Reloads the list; an override applies a value that is still being set in state */
  onFilterSubmit: (override?: { q?: string; location_id?: string; category_id?: string }) => void;
  onResetFilters?: () => void;
  onSelectItem: (item: any) => void;
  onNavigate: (page: string) => void;
  favorites?: Record<string, boolean>;
  onToggleFavorite?: (item: any) => void;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Per-page content: one template serves Businesses, Artisans, Products, Services and Pre-owned
// ---------------------------------------------------------------------------

interface PageAction {
  label: string;
  target: string;
}

interface PageConfig {
  eyebrow: string;
  title: string;
  promise: string;
  icon: LucideIcon;
  unit: [one: string, many: string];
  listingType: 'BUSINESS' | 'ARTISAN' | 'SERVICE' | 'PRODUCT' | 'ALL';
  primary: PageAction;
  secondary: PageAction;
  emptyTitle: string;
  emptyNote: string;
}

const PAGES: Record<string, PageConfig> = {
  Businesses: {
    eyebrow: 'Shops & brands',
    title: 'Businesses',
    promise: 'Local shops, stores and brands around LAUTECH and Ogbomoso. Call or WhatsApp them directly.',
    icon: Store,
    unit: ['business', 'businesses'],
    listingType: 'BUSINESS',
    primary: { label: 'List your business free', target: 'Provider Application' },
    secondary: { label: 'Post what I need', target: 'Post What I Need' },
    emptyTitle: 'The first businesses are joining now',
    emptyNote: 'Shops and brands appear here as soon as the ECLAT CONNECT team approves them. Own one? Be among the first to be found.',
  },
  'Campus Artisans': {
    eyebrow: 'Skilled trades',
    title: 'Artisans',
    promise: 'Tailors, stylists, electricians, plumbers and technicians near you. Talk to them directly.',
    icon: Hammer,
    unit: ['artisan', 'artisans'],
    listingType: 'ARTISAN',
    primary: { label: 'List your skill free', target: 'Provider Application' },
    secondary: { label: 'Post a job request', target: 'Post Service Request' },
    emptyTitle: 'The first artisans are joining now',
    emptyNote: 'Skilled people appear here as soon as the ECLAT CONNECT team approves them. Post the job you need and let them come to you.',
  },
  Products: {
    eyebrow: 'Buy new',
    title: 'Products',
    promise: 'Gadgets, fashion, provisions and brand-new items from sellers around you.',
    icon: ShoppingBag,
    unit: ['product', 'products'],
    listingType: 'PRODUCT',
    primary: { label: 'Request a product', target: 'Post Product Request' },
    secondary: { label: 'Sell on ECLAT CONNECT', target: 'Provider Application' },
    emptyTitle: 'The first products are on their way',
    emptyNote: 'Products appear here as soon as sellers are approved. Tell sellers what you are looking for and they can reach you.',
  },
  Services: {
    eyebrow: 'Everyday help',
    title: 'Services',
    promise: 'Laundry, repairs, deliveries and more from providers around campus and town.',
    icon: Wrench,
    unit: ['service', 'services'],
    listingType: 'SERVICE',
    primary: { label: 'Post a service request', target: 'Post Service Request' },
    secondary: { label: 'Offer a service', target: 'Provider Application' },
    emptyTitle: 'The first services are on their way',
    emptyNote: 'Services appear here as soon as providers are approved. Post what you need and nearby providers can send you offers.',
  },
  'Pre-owned Items': {
    eyebrow: 'Student deals',
    title: 'Pre-owned',
    promise: 'Gently used laptops, fans, books and furniture from people near you.',
    icon: Recycle,
    unit: ['item', 'items'],
    listingType: 'PRODUCT',
    primary: { label: 'Sell a pre-owned item', target: 'Sell Pre-owned Item' },
    secondary: { label: 'Request a used item', target: 'Post Pre-owned Request' },
    emptyTitle: 'No pre-owned items yet',
    emptyNote: 'Got something you no longer use? List it in a minute, or ask for the item you need.',
  },
};

const FALLBACK_PAGE: PageConfig = {
  eyebrow: 'Around you',
  title: 'Listings',
  promise: 'Listings from local providers and sellers around LAUTECH and Ogbomoso.',
  icon: Tag,
  unit: ['listing', 'listings'],
  listingType: 'ALL',
  primary: { label: 'Post what I need', target: 'Post What I Need' },
  secondary: { label: 'List your business free', target: 'Provider Application' },
  emptyTitle: 'Nothing here yet',
  emptyNote: 'Listings appear here as soon as they are approved.',
};

type SortKey = 'recommended' | 'newest' | 'rating' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: 'Best match' },
  { key: 'newest', label: 'Newest' },
  { key: 'rating', label: 'Top rated' },
  { key: 'name', label: 'A to Z' },
];

const ratingOf = (item: any) => Number(item.avg_rating || item.provider_rating || 0);
const dateOf = (item: any) => new Date(item.created_at || item.createdAt || 0).getTime() || 0;
const isVerified = (item: any) => Boolean(item.verified || item.provider_verified || item.is_verified);

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface CardProps {
  item: any;
  index: number;
  isFavorite: boolean;
  onOpen: (item: any) => void;
  onToggleFavorite?: (item: any) => void;
}

const DirectoryCard: React.FC<CardProps> = ({ item, index, isFavorite, onOpen, onToggleFavorite }) => {
  const [shared, setShared] = useState(false);
  const share = async () => {
    const result = await shareListing(item);
    if (result === 'copied') {
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  };
  const name: string = item.name || item.title || 'Listing';
  const image: string | null = item.image_url || (item.images ? String(item.images).split(',')[0].trim() : null);
  const photoCount = item.images ? String(item.images).split(',').filter(Boolean).length : image ? 1 : 0;
  const category =
    item.custom_category || item.category || item.category_name ||
    (item.type === 'PROFESSIONAL' ? 'Artisan' : item.type === 'BUSINESS' ? 'Business' : item.kind || '');
  const rating = ratingOf(item);
  const reviews = item.review_count ?? item.provider_review_count;
  const price = Number(item.price || item.budget);
  const area = item.location_area || item.location;
  const isPreowned = item.request_type === 'PREOWNED_SALE' || Boolean(item.condition);
  const isSold = (item.availability_status || '').toUpperCase() === 'SOLD';

  return (
    <li className={`dx-card${isSold ? ' is-sold' : ''}`} style={{ '--dx-i': Math.min(index, 11) } as React.CSSProperties}>
      <div className="dx-card-media">
        {image ? (
          <img src={image} alt="" loading="lazy" decoding="async" />
        ) : (
          /* No photo: the first letter on a brand tile, so every card has a face */
          <span className="dx-card-initial" aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>
        )}
        {photoCount > 1 && (
          <span className="dx-card-photos">
            <Camera size={13} aria-hidden="true" /> {photoCount}
          </span>
        )}
        <button
          type="button"
          className={`dx-card-share${shared ? ' is-done' : ''}`}
          onClick={share}
          aria-label={shared ? 'Link copied' : `Share ${name}`}
          title={shared ? 'Link copied' : 'Share'}
        >
          {shared ? <Check size={16} strokeWidth={2.6} aria-hidden="true" /> : <Share2 size={16} strokeWidth={2.2} aria-hidden="true" />}
        </button>
        {onToggleFavorite && (
          <button
            type="button"
            className={`dx-card-fav${isFavorite ? ' is-on' : ''}`}
            onClick={() => onToggleFavorite(item)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remove ${name} from saved` : `Save ${name}`}
          >
            <Heart size={17} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="dx-card-body">
        <div className="dx-card-tags">
          {category && <span className="dx-card-cat">{category}</span>}
          <TrustBadge item={item} />
          {item.kind === 'PROJECT' && <span className="dx-card-tag">Past work</span>}
          {isPreowned && <span className="dx-card-tag is-green">{item.condition || 'Pre-owned'}</span>}
          {(isPreowned || item.availability_status) && (
            <AvailabilityBadge status={item.availability_status || 'AVAILABLE'} size="sm" />
          )}
        </div>

        <h3 className="dx-card-title">
          {/* The title's button covers the whole card, so a tap anywhere opens the details */}
          <button type="button" className="dx-card-open" onClick={() => onOpen(item)}>
            {name}
          </button>
        </h3>

        {item.description && <p className="dx-card-desc">{item.description}</p>}

        <div className="dx-card-meta">
          {price > 0 && <span className="dx-card-price">₦{price.toLocaleString()}</span>}
          {rating > 0 && (
            <span className="dx-card-rating">
              <Star size={13} aria-hidden="true" /> {rating.toFixed(1)}
              {reviews != null && <span className="dx-card-reviews">({reviews})</span>}
            </span>
          )}
          {area && (
            <span className="dx-card-area">
              <MapPin size={13} aria-hidden="true" /> {area}
            </span>
          )}
        </div>

        {item.provider_name && item.provider_name !== name && (
          <p className="dx-card-by">
            by <strong>{item.provider_name}</strong>
          </p>
        )}

        <div className="dx-card-contact">
          <DirectContactButtons
            phone={item.phone || item.customer_phone}
            whatsapp={item.whatsapp || item.customer_phone || item.phone}
            listingTitle={name}
            variant="compact"
          />
        </div>
      </div>
    </li>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const DirectoryPage: React.FC<DirectoryPageProps> = ({
  pageTitle,
  items,
  categories,
  locations,
  q,
  locationFilter,
  categoryFilter,
  onSearchChange,
  onLocationChange,
  onCategoryChange,
  onFilterSubmit,
  onResetFilters,
  onSelectItem,
  onNavigate,
  favorites = {},
  onToggleFavorite,
  loading = false,
}) => {
  const config = PAGES[pageTitle] || FALLBACK_PAGE;
  const PageIcon = config.icon;
  const isPreownedPage = pageTitle === 'Pre-owned Items';

  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | AvailabilityStatus>('ALL');
  const [sort, setSort] = useState<SortKey>('recommended');

  // Grid or list, remembered on this device
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try {
      return window.localStorage.getItem('eclat_dx_view') === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });
  const chooseView = (next: 'grid' | 'list') => {
    setView(next);
    try {
      window.localStorage.setItem('eclat_dx_view', next);
    } catch {
      // ignore: the choice just won't be remembered
    }
  };

  // Recently viewed listings (any section), kept on this device
  const [recent, setRecent] = useState<any[]>(() => readRecent());
  useEffect(() => {
    const refresh = () => setRecent(readRecent());
    window.addEventListener('eclat-recent-change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('eclat-recent-change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Long lists show 12 at a time, so cheap phones stay quick
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const relevantCategories = getCategoriesForType(categories, config.listingType);

  // One entry per area name (the location list can contain the same area twice)
  const areas = useMemo(() => {
    const seen = new Set<string>();
    return locations.filter(loc => {
      const key = (loc.area || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [locations]);

  // Search runs as you type, a moment after you stop; Enter runs it straight away
  const searchTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(searchTimer.current), []);
  const runSearch = (value: string, now = false) => {
    onSearchChange(value);
    window.clearTimeout(searchTimer.current);
    if (now) onFilterSubmit({ q: value });
    else searchTimer.current = window.setTimeout(() => onFilterSubmit({ q: value }), 400);
  };

  const displayedItems = useMemo(() => {
    const filtered = items.filter(item => {
      if (!isPreownedPage || availabilityFilter === 'ALL') return true;
      return (item.availability_status || 'AVAILABLE').toUpperCase() === availabilityFilter;
    });
    const sorted = [...filtered];
    if (sort === 'newest') sorted.sort((a, b) => dateOf(b) - dateOf(a));
    else if (sort === 'rating') sorted.sort((a, b) => ratingOf(b) - ratingOf(a));
    else if (sort === 'name') sorted.sort((a, b) => String(a.name || a.title || '').localeCompare(String(b.name || b.title || '')));
    else sorted.sort((a, b) => Number(isVerified(b)) - Number(isVerified(a)) || ratingOf(b) - ratingOf(a) || dateOf(b) - dateOf(a));
    return sorted;
  }, [items, isPreownedPage, availabilityFilter, sort]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [items, sort, availabilityFilter]);
  const shownItems = displayedItems.slice(0, visibleCount);

  // Spotlight: verified or well-rated providers, when the visitor is browsing without filters
  const spotlight = useMemo(
    () => displayedItems.filter(it => isVerified(it) || ratingOf(it) >= 4).slice(0, 8),
    [displayedItems]
  );

  const areaName = areas.find(a => a.id === locationFilter)?.area || locations.find(l => l.id === locationFilter)?.area;
  const categoryName = relevantCategories.find(c => c.id === categoryFilter)?.name || categories.find(c => c.id === categoryFilter)?.name;
  const hasFilters = Boolean(q || locationFilter || categoryFilter || (isPreownedPage && availabilityFilter !== 'ALL'));
  const count = displayedItems.length;
  const countText = `${count} ${count === 1 ? config.unit[0] : config.unit[1]}`;

  const clearAll = () => {
    window.clearTimeout(searchTimer.current);
    setAvailabilityFilter('ALL');
    if (onResetFilters) onResetFilters();
    else {
      onSearchChange('');
      onLocationChange('');
      onCategoryChange('');
    }
  };

  return (
    <div className="dx">
      {/* ================================================================ */}
      {/* Page header: the hero's purple, in a compact band                */}
      {/* ================================================================ */}
      <header className="dx-head">
        <div className="dx-head-text">
          <p className="dx-head-eyebrow">{config.eyebrow}</p>
          <h1 className="dx-head-title">{config.title}</h1>
          <p className="dx-head-promise">{config.promise}</p>
          <p className="dx-head-count" aria-live="polite">
            <span className="dx-head-dot" aria-hidden="true" />
            {loading ? 'Loading…' : hasFilters ? `${countText} found` : count === 0 ? 'Just launching' : `${countText} near you`}
          </p>
        </div>
        <div className="dx-head-actions">
          <button type="button" className="dx-btn dx-btn-lime" onClick={() => onNavigate(config.primary.target)}>
            {config.primary.label} <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button type="button" className="dx-btn dx-btn-ghost" onClick={() => onNavigate(config.secondary.target)}>
            {config.secondary.label}
          </button>
        </div>
        <span className="dx-head-art" aria-hidden="true">
          <PageIcon size={56} strokeWidth={1.6} />
        </span>
      </header>

      {/* ================================================================ */}
      {/* Filters: search runs as you type; area and category apply at once */}
      {/* ================================================================ */}
      <div className="dx-filters" role="search">
        <label className="dx-field dx-field-search">
          <Search size={19} aria-hidden="true" />
          <span className="dx-visually-hidden">Search {config.title.toLowerCase()}</span>
          <input
            type="search"
            placeholder={`Search ${config.title.toLowerCase()}…`}
            value={q}
            onChange={e => runSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runSearch(q, true)}
          />
          {q && (
            <button type="button" className="dx-field-clear" onClick={() => runSearch('', true)} aria-label="Clear search">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </label>
        <label className="dx-field dx-field-select">
          <MapPin size={18} aria-hidden="true" />
          <span className="dx-visually-hidden">Area</span>
          <select value={locationFilter} onChange={e => onLocationChange(e.target.value)}>
            <option value="">All areas</option>
            {areas.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.area}</option>
            ))}
          </select>
        </label>
        <label className="dx-field dx-field-select dx-field-sort">
          <SlidersHorizontal size={18} aria-hidden="true" />
          <span className="dx-visually-hidden">Sort by</span>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            {SORTS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Areas as quick chips, since students think in areas */}
      {areas.length > 1 && (
        <div className="dx-chips dx-chips-areas" role="group" aria-label="Areas">
          <span className="dx-chips-label"><MapPin size={15} aria-hidden="true" /> Near</span>
          {areas.map(loc => (
            <button
              key={loc.id}
              type="button"
              className={`dx-chip dx-chip-area${locationFilter === loc.id ? ' is-on' : ''}`}
              aria-pressed={locationFilter === loc.id}
              onClick={() => onLocationChange(locationFilter === loc.id ? '' : loc.id)}
            >
              {loc.area}
            </button>
          ))}
        </div>
      )}

      {/* Categories as chips you can tap; they scroll sideways when there are many */}
      {relevantCategories.length > 0 && (
        <div className="dx-chips" role="group" aria-label="Categories">
          <button
            type="button"
            className={`dx-chip${!categoryFilter ? ' is-on' : ''}`}
            aria-pressed={!categoryFilter}
            onClick={() => onCategoryChange('')}
          >
            All
          </button>
          {relevantCategories.map(c => (
            <button
              key={c.id}
              type="button"
              className={`dx-chip${categoryFilter === c.id ? ' is-on' : ''}`}
              aria-pressed={categoryFilter === c.id}
              onClick={() => onCategoryChange(categoryFilter === c.id ? '' : c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Pre-owned: availability */}
      {isPreownedPage && (
        <div className="dx-chips dx-chips-small" role="group" aria-label="Availability">
          {(['ALL', 'AVAILABLE', 'RESERVED', 'SOLD'] as const).map(st => (
            <button
              key={st}
              type="button"
              className={`dx-chip${availabilityFilter === st ? ' is-on' : ''}`}
              aria-pressed={availabilityFilter === st}
              onClick={() => setAvailabilityFilter(st)}
            >
              {st === 'ALL' ? 'All items' : st === 'AVAILABLE' ? 'Available' : st === 'RESERVED' ? 'Reserved' : 'Sold'}
            </button>
          ))}
        </div>
      )}

      {/* Active filters, each removable */}
      {hasFilters && !loading && (
        <div className="dx-active">
          <span className="dx-active-label">Showing:</span>
          {q && (
            <button type="button" className="dx-active-chip" onClick={() => runSearch('', true)}>
              “{q}” <X size={13} aria-hidden="true" />
              <span className="dx-visually-hidden">Remove search</span>
            </button>
          )}
          {locationFilter && (
            <button type="button" className="dx-active-chip" onClick={() => onLocationChange('')}>
              {areaName || 'Area'} <X size={13} aria-hidden="true" />
              <span className="dx-visually-hidden">Remove area</span>
            </button>
          )}
          {categoryFilter && (
            <button type="button" className="dx-active-chip" onClick={() => onCategoryChange('')}>
              {categoryName || 'Category'} <X size={13} aria-hidden="true" />
              <span className="dx-visually-hidden">Remove category</span>
            </button>
          )}
          <button type="button" className="dx-active-clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <ul className="dx-grid dx-skeletons" aria-label="Loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="dx-skeleton" style={{ '--dx-i': i } as React.CSSProperties}>
              <span className="dx-skel-media" />
              <span className="dx-skel-line is-short" />
              <span className="dx-skel-line" />
              <span className="dx-skel-line is-mid" />
              <span className="dx-skel-btn" />
            </li>
          ))}
        </ul>
      )}

      {/* Recently viewed, on this device */}
      {!loading && !hasFilters && recent.length > 0 && (
        <section className="dx-strip" aria-labelledby="dx-recent-title">
          <div className="dx-strip-head">
            <h2 id="dx-recent-title"><Clock size={18} aria-hidden="true" /> Recently viewed</h2>
            <button type="button" className="dx-strip-clear" onClick={clearRecent}>Clear</button>
          </div>
          <ul className="dx-recent">
            {recent.slice(0, 8).map(r => {
              const rName = r.name || r.title || 'Listing';
              const rImg = r.image_url || (r.images ? String(r.images).split(',')[0].trim() : null);
              return (
                <li key={r.id}>
                  <button type="button" className="dx-recent-item" onClick={() => onSelectItem(r)}>
                    <span className="dx-recent-media">
                      {rImg ? <img src={rImg} alt="" loading="lazy" /> : rName.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="dx-recent-text">
                      <span className="dx-recent-name">{rName}</span>
                      <span className="dx-recent-meta">{r.location_area || r.location || r.category_name || ''}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Spotlight: verified and top-rated providers */}
      {!loading && !hasFilters && spotlight.length >= 2 && count > spotlight.length && (
        <section className="dx-strip dx-spotlight" aria-labelledby="dx-spot-title">
          <div className="dx-strip-head">
            <h2 id="dx-spot-title"><Sparkles size={18} aria-hidden="true" /> Verified &amp; top rated</h2>
          </div>
          <ul className="dx-spot-row">
            {spotlight.map((item, i) => (
              <DirectoryCard
                key={`spot-${item.id ?? i}`}
                item={item}
                index={i}
                isFavorite={!!favorites[item.id]}
                onOpen={onSelectItem}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Toolbar: how many, and grid or list */}
      {!loading && count > 0 && (
        <div className="dx-toolbar">
          <p className="dx-toolbar-count">
            {hasFilters ? `${countText} found` : `All ${config.unit[1]}`}
            <span> · {SORTS.find(s => s.key === sort)?.label}</span>
          </p>
          <div className="dx-view" role="group" aria-label="View">
            <button type="button" className={view === 'grid' ? 'is-on' : ''} aria-pressed={view === 'grid'} onClick={() => chooseView('grid')} title="Grid">
              <LayoutGrid size={17} aria-hidden="true" /><span className="dx-visually-hidden">Grid view</span>
            </button>
            <button type="button" className={view === 'list' ? 'is-on' : ''} aria-pressed={view === 'list'} onClick={() => chooseView('list')} title="List">
              <List size={17} aria-hidden="true" /><span className="dx-visually-hidden">List view</span>
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && count > 0 && (
        <ul className={`dx-grid${view === 'list' ? ' is-list' : ''}`}>
          {shownItems.map((item, i) => (
            <DirectoryCard
              key={item.id ?? i}
              item={item}
              index={i}
              isFavorite={!!favorites[item.id]}
              onOpen={onSelectItem}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </ul>
      )}

      {!loading && count > shownItems.length && (
        <div className="dx-more">
          <p>Showing {shownItems.length} of {count}</p>
          <button type="button" className="dx-btn dx-btn-outline" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
            Show more <ChevronDown size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Empty: nothing matches the filters, or nothing listed yet */}
      {!loading && count === 0 && (
        <div className="dx-empty">
          <span className="dx-empty-icon" aria-hidden="true">
            {hasFilters ? <Search size={30} strokeWidth={2} /> : <PageIcon size={30} strokeWidth={2} />}
          </span>
          <div className="dx-empty-text">
            {!hasFilters && (
              <p className="dx-empty-kicker">
                <span className="dx-head-dot" aria-hidden="true" /> Just launching
              </p>
            )}
            <h2 className="dx-empty-title">{hasFilters ? 'Nothing matches your search yet' : config.emptyTitle}</h2>
            <p className="dx-empty-note">
              {hasFilters
                ? 'Try another word, area or category. Or post what you need, and providers nearby can come to you.'
                : config.emptyNote}
            </p>
            <div className="dx-empty-actions">
              {hasFilters ? (
                <>
                  <button type="button" className="dx-btn dx-btn-royal" onClick={clearAll}>
                    Clear filters
                  </button>
                  <button type="button" className="dx-btn dx-btn-outline" onClick={() => onNavigate('Post What I Need')}>
                    <Megaphone size={16} aria-hidden="true" /> Post what I need
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="dx-btn dx-btn-lime" onClick={() => onNavigate(config.primary.target)}>
                    {config.primary.label} <ArrowRight size={17} aria-hidden="true" />
                  </button>
                  <button type="button" className="dx-btn dx-btn-outline" onClick={() => onNavigate(config.secondary.target)}>
                    {config.secondary.label}
                  </button>
                </>
              )}
            </div>
          </div>
          <ul className="dx-empty-perks" aria-label="Why ECLAT CONNECT">
            <li><BadgeCheck size={18} aria-hidden="true" /> Profiles reviewed before they go live</li>
            <li><MessageCircle size={18} aria-hidden="true" /> Call or WhatsApp directly, no middleman</li>
            <li><Tag size={18} aria-hidden="true" /> Free to use, no payment fees</li>
          </ul>
        </div>
      )}
    </div>
  );
};

