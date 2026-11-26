import React, { useState, useEffect } from 'react';
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

interface BrowseTileConfig {
  title: string;
  badge: string;
  desc: string;
  icon: LucideIcon;
  target: string;
  theme: 'purple' | 'amber' | 'blue' | 'teal' | 'green' | 'lime';
}

const BROWSE_TILES: BrowseTileConfig[] = [
  {
    title: 'Businesses',
    badge: 'Shops & Brands',
    desc: 'Local storefronts, retail shops & verified campus sellers',
    icon: Store,
    target: 'Businesses',
    theme: 'purple',
  },
  {
    title: 'Products',
    badge: 'Buy New',
    desc: 'Gadgets, fashion, provisions & brand-new merchandise',
    icon: ShoppingBag,
    target: 'Products',
    theme: 'amber',
  },
  {
    title: 'Artisans',
    badge: 'Skilled Trades',
    desc: 'Tailors, stylists, electricians, plumbers & technicians',
    icon: Hammer,
    target: 'Artisans',
    theme: 'blue',
  },
  {
    title: 'Services',
    badge: 'Everyday Help',
    desc: 'Laundry, repairs, logistics & campus deliveries',
    icon: Wrench,
    target: 'Services',
    theme: 'teal',
  },
  {
    title: 'Pre-owned',
    badge: 'Student Deals',
    desc: 'Gently used electronics, furniture, books & appliances',
    icon: Recycle,
    target: 'Pre-owned',
    theme: 'green',
  },
  {
    title: 'Requests',
    badge: 'Urgent Needs',
    desc: 'See what people are looking for, or post what you need',
    icon: Megaphone,
    target: 'Requests',
    theme: 'lime',
  },
];

const STEPS = [
  {
    title: 'Search or post',
    text: 'Browse local listings, or post what you need and let providers come to you with quotes.',
  },
  {
    title: 'Contact directly',
    text: 'Call or WhatsApp the seller or artisan yourself. No middleman and no platform fees.',
  },
  {
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
      <section className="hx-section" aria-labelledby="hx-browse-title">
        <div className="hx-section-head">
          <div>
            <p className="hx-eyebrow">Browse by Category</p>
            <h2 id="hx-browse-title" className="hx-h2">What are you looking for?</h2>
            <p className="hx-section-note">Tap a category to explore verified listings near you</p>
          </div>
        </div>
        <div className="hx-tiles">
          {BROWSE_TILES.map(tile => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.title}
                type="button"
                className={`hx-tile hx-tile-${tile.theme}`}
                onClick={() => onNavigate(tile.target)}
                aria-label={`Browse ${tile.title}: ${tile.desc}`}
              >
                <span className="hx-tile-badge">{tile.badge}</span>
                <span className="hx-tile-icon"><Icon size={26} strokeWidth={2} aria-hidden="true" /></span>
                <span className="hx-tile-title">{tile.title}</span>
                <span className="hx-tile-desc">{tile.desc}</span>
                <span className="hx-tile-cta">
                  Explore <ArrowRight size={14} aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
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
          <div className="hx-empty">
            <span className="hx-empty-icon"><Store size={26} aria-hidden="true" /></span>
            <div className="hx-empty-text">
              <h3>No listings yet. Be one of the first.</h3>
              <p>
                We're welcoming the first local businesses, artisans and sellers around LAUTECH and Ogbomoso.
                Their listings will appear here as soon as they are approved.
              </p>
            </div>
            <button type="button" className="hx-btn hx-btn-primary" onClick={() => onNavigate('Provider Application')}>
              List your business free
            </button>
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
      {/* Two ways in: post a request / sell a used item                   */}
      {/* ================================================================ */}
      <section className="hx-section hx-paths" aria-label="Post or sell">
        <div className="hx-path hx-path-sage">
          <Megaphone className="hx-path-icon" size={28} aria-hidden="true" />
          <h2 className="hx-h2">Can't find it? Post what you need.</h2>
          <p>
            Describe what you're looking for and your budget. Providers around you can see your request and send you a quote.
            Your exact address stays private.
          </p>
          <button type="button" className="hx-btn hx-btn-primary" onClick={() => onNavigate('Post What I Need')}>
            Post what I need <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="hx-path hx-path-plain">
          <Recycle className="hx-path-icon" size={28} aria-hidden="true" />
          <h2 className="hx-h2">Selling something you no longer use?</h2>
          <p>
            Fans, gas cylinders, laptops, textbooks. Post your used item with photos and a price, and buyers nearby can reach you directly.
          </p>
          <button type="button" className="hx-btn hx-btn-outline" onClick={() => onNavigate('Sell Pre-owned Item')}>
            Sell a pre-owned item
          </button>
        </div>
      </section>

      {/* ================================================================ */}
      {/* How it works                                                     */}
      {/* ================================================================ */}
      <section className="hx-section" aria-labelledby="hx-how-title">
        <div className="hx-section-head">
          <div>
            <p className="hx-eyebrow">How it works</p>
            <h2 id="hx-how-title" className="hx-h2">Three steps, no middleman</h2>
          </div>
        </div>
        <ol className="hx-steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="hx-step">
              <span className="hx-step-num" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="hx-h3">{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ================================================================ */}
      {/* Hubs                                                             */}
      {/* ================================================================ */}
      {hubs.length > 0 && (
        <section className="hx-section" aria-labelledby="hx-hubs-title">
          <div className="hx-section-head">
            <div>
              <p className="hx-eyebrow">Areas</p>
              <h2 id="hx-hubs-title" className="hx-h2">Around campus and town</h2>
            </div>
            <p className="hx-section-note">Pick an area to see the businesses there.</p>
          </div>
          <div className="hx-hubs">
            {hubs.map(loc => (
              <button key={loc.id} type="button" className="hx-hub" onClick={() => openHub(loc)}>
                <MapPin size={18} aria-hidden="true" />
                <span className="hx-hub-text">
                  <span className="hx-hub-name">{loc.area}</span>
                  {loc.landmark && <span className="hx-hub-landmark">{loc.landmark}</span>}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* Safety                                                           */}
      {/* ================================================================ */}
      <section className="hx-section hx-safety" aria-labelledby="hx-safety-title">
        <div className="hx-safety-head">
          <span className="hx-safety-icon"><ShieldCheck size={26} aria-hidden="true" /></span>
          <div>
            <h2 id="hx-safety-title" className="hx-h2">Deal safely</h2>
            <p>ECLAT CONNECT doesn't handle payments, so you agree every deal directly. A few habits keep it safe.</p>
          </div>
        </div>
        <ul className="hx-safety-list">
          {SAFETY_TIPS.map(tip => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
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
