import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Flame,
  Hourglass,
  Lock,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  Wrench,
  X,
} from 'lucide-react';
import { copyText, listingUrl, whatsappShareUrl } from '../utils/share';
import { Category, Location, ServiceRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import './DirectoryPage.css';
import '../styles/requests.css';

interface RequestsPageProps {
  requests: ServiceRequest[];
  categories: Category[];
  locations: Location[];
  q: string;
  locationFilter: string;
  categoryFilter: string;
  onSearchChange: (q: string) => void;
  onLocationChange: (loc: string) => void;
  onCategoryChange: (cat: string) => void;
  onFilterSubmit: (override?: { q?: string; location_id?: string; category_id?: string }) => void;
  onResetFilters?: () => void;
  onNavigate: (page: string, params?: any) => void;
  onRespondToRequest: (req: ServiceRequest) => void;
  loading?: boolean;
}

type TypeKey = 'ALL' | 'SERVICE' | 'PRODUCT' | 'PREOWNED_REQUEST';
type SortKey = 'newest' | 'budget' | 'unanswered';

const TYPES: { key: TypeKey; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: 'All', icon: null },
  { key: 'SERVICE', label: 'Services', icon: <Wrench size={15} aria-hidden="true" /> },
  { key: 'PRODUCT', label: 'Products', icon: <ShoppingBag size={15} aria-hidden="true" /> },
  { key: 'PREOWNED_REQUEST', label: 'Used items', icon: <Package size={15} aria-hidden="true" /> },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'budget', label: 'Highest budget' },
  { key: 'unanswered', label: 'Fewest quotes' },
];

const typeOf = (r: ServiceRequest): TypeKey =>
  r.request_type === 'PRODUCT' ? 'PRODUCT' : r.request_type === 'PREOWNED_REQUEST' ? 'PREOWNED_REQUEST' : 'SERVICE';

const TYPE_LABEL: Record<Exclude<TypeKey, 'ALL'>, string> = {
  SERVICE: 'Service',
  PRODUCT: 'Product',
  PREOWNED_REQUEST: 'Used item wanted',
};

const TYPE_ICON: Record<Exclude<TypeKey, 'ALL'>, React.ReactNode> = {
  SERVICE: <Wrench size={14} aria-hidden="true" />,
  PRODUCT: <ShoppingBag size={14} aria-hidden="true" />,
  PREOWNED_REQUEST: <Package size={14} aria-hidden="true" />,
};

const dateOf = (r: ServiceRequest) => {
  const t = new Date(r.created_at).getTime();
  return Number.isFinite(t) ? t : 0;
};

function timeAgo(raw?: string): string {
  const t = raw ? new Date(raw).getTime() : NaN;
  if (!Number.isFinite(t)) return '';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(t).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/** Closes within two days: worth a provider's attention now */
function isUrgent(raw?: string): boolean {
  const t = raw ? new Date(raw).getTime() : NaN;
  if (!Number.isFinite(t)) return false;
  const left = t - Date.now();
  return left > 0 && left < 2 * 86400000;
}

const PAGE_SIZE = 12;

function expiresIn(raw?: string): string {
  const t = raw ? new Date(raw).getTime() : NaN;
  if (!Number.isFinite(t)) return '';
  const days = Math.ceil((t - Date.now()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `Open ${days} more days`;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({
  requests,
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
  onNavigate,
  onRespondToRequest,
  loading = false,
}) => {
  const { user, isVendor, isAdmin } = useAuth();
  const [type, setType] = useState<TypeKey>('ALL');
  const [sort, setSort] = useState<SortKey>('newest');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [copied, setCopied] = useState(false);

  // A request's own address: /requests?open=<id>. Back closes it; the link can be shared.
  const [openId, setOpenId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('open'));
  useEffect(() => {
    const onPop = () => setOpenId(new URLSearchParams(window.location.search).get('open'));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const openReq = (req: ServiceRequest) => {
    setOpenId(String(req.id));
    setCopied(false);
    const params = new URLSearchParams(window.location.search);
    params.set('open', String(req.id));
    window.history.pushState({ eclatRequest: true }, '', `${window.location.pathname}?${params.toString()}`);
  };
  const closeReq = () => {
    if (window.history.state?.eclatRequest) {
      window.history.back();
      return;
    }
    setOpenId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('open');
    const qs = params.toString();
    window.history.replaceState(window.history.state, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  };
  const selected = openId ? requests.find(r => String(r.id) === openId) || null : null;

  // The sheet: Escape closes it, the page behind does not scroll, focus moves inside
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeReq();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // One entry per area name
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

  const shown = useMemo(() => {
    const list = requests.filter(r => type === 'ALL' || typeOf(r) === type);
    const sorted = [...list];
    if (sort === 'budget') sorted.sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0) || dateOf(b) - dateOf(a));
    else if (sort === 'unanswered') sorted.sort((a, b) => (a.response_count || 0) - (b.response_count || 0) || dateOf(b) - dateOf(a));
    else sorted.sort((a, b) => dateOf(b) - dateOf(a));
    return sorted;
  }, [requests, type, sort]);
  useEffect(() => setVisible(PAGE_SIZE), [requests, type, sort]);

  const unanswered = requests.filter(r => !r.response_count).length;
  const isProvider = Boolean(user && (isVendor || isAdmin));
  const areaName = areas.find(a => a.id === locationFilter)?.area;
  const categoryName = categories.find(c => c.id === categoryFilter)?.name;
  const hasFilters = Boolean(q || locationFilter || categoryFilter || type !== 'ALL');
  const count = shown.length;

  // Categories that actually appear in requests come first, so the chips stay useful
  const usedCats = useMemo(() => {
    const ids = new Set(requests.map(r => r.category_id).filter(Boolean));
    const list = categories.filter(c => ids.has(c.id));
    return list.length ? list : [];
  }, [requests, categories]);

  const clearAll = () => {
    window.clearTimeout(searchTimer.current);
    setType('ALL');
    if (onResetFilters) onResetFilters();
    else {
      onSearchChange('');
      onLocationChange('');
      onCategoryChange('');
    }
  };

  const action = (req: ServiceRequest) => {
    if (user && user.id === req.customer_id) {
      return (
        <button type="button" className="dx-btn dx-btn-outline rq-cta" onClick={() => onNavigate('Responses')}>
          See quotes ({req.response_count || 0}) <ArrowRight size={16} aria-hidden="true" />
        </button>
      );
    }
    if (!user) {
      return (
        <button type="button" className="dx-btn dx-btn-outline rq-cta" onClick={() => onNavigate('Auth')}>
          Sign in to send a quote
        </button>
      );
    }
    if (isVendor || isAdmin) {
      return (
        <button type="button" className="dx-btn dx-btn-lime rq-cta" onClick={() => onRespondToRequest(req)}>
          Send a quote <ArrowRight size={16} aria-hidden="true" />
        </button>
      );
    }
    return <p className="rq-note">Registered providers can send quotes for this request.</p>;
  };

  return (
    <div className="dx rq">
      {/* Header */}
      <header className="dx-head">
        <div className="dx-head-text">
          <p className="dx-head-eyebrow">Open requests</p>
          <h1 className="dx-head-title">What people need right now</h1>
          <p className="dx-head-promise">
            Students and residents around LAUTECH and Ogbomoso post what they need. Providers reply with quotes, and they
            pick the best one.
          </p>
          <p className="dx-head-count" aria-live="polite">
            <span className="dx-head-dot" aria-hidden="true" />
            {loading
              ? 'Loading…'
              : requests.length === 0
              ? 'Be the first to post'
              : `${requests.length} open ${requests.length === 1 ? 'request' : 'requests'}${unanswered ? ` · ${unanswered} still waiting for a quote` : ''}`}
          </p>
        </div>
        <div className="dx-head-actions">
          <button type="button" className="dx-btn dx-btn-lime" onClick={() => onNavigate('Post What I Need')}>
            Post what I need <ArrowRight size={17} aria-hidden="true" />
          </button>
          {!isProvider && (
            <button type="button" className="dx-btn dx-btn-ghost" onClick={() => onNavigate('Provider Application')}>
              I'm a provider
            </button>
          )}
        </div>
        <span className="dx-head-art" aria-hidden="true">
          <Megaphone size={56} strokeWidth={1.6} />
        </span>
      </header>

      {/* Filters */}
      <div className="dx-filters" role="search">
        <label className="dx-field dx-field-search">
          <Search size={19} aria-hidden="true" />
          <span className="dx-visually-hidden">Search requests</span>
          <input
            type="search"
            placeholder="Search requests, e.g. laundry, laptop…"
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

      {/* What kind of request */}
      <div className="dx-chips" role="group" aria-label="Type of request">
        {TYPES.map(t => (
          <button
            key={t.key}
            type="button"
            className={`dx-chip${type === t.key ? ' is-on' : ''}`}
            aria-pressed={type === t.key}
            onClick={() => setType(t.key)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Areas */}
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

      {/* Categories seen in current requests */}
      {usedCats.length > 1 && (
        <div className="dx-chips dx-chips-small" role="group" aria-label="Categories">
          {usedCats.map(c => (
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

      {/* Active filters */}
      {hasFilters && !loading && (
        <div className="dx-active">
          <span className="dx-active-label">Showing:</span>
          {type !== 'ALL' && (
            <button type="button" className="dx-active-chip" onClick={() => setType('ALL')}>
              {TYPES.find(t => t.key === type)?.label} <X size={13} aria-hidden="true" />
            </button>
          )}
          {q && (
            <button type="button" className="dx-active-chip" onClick={() => runSearch('', true)}>
              “{q}” <X size={13} aria-hidden="true" />
            </button>
          )}
          {locationFilter && (
            <button type="button" className="dx-active-chip" onClick={() => onLocationChange('')}>
              {areaName || 'Area'} <X size={13} aria-hidden="true" />
            </button>
          )}
          {categoryFilter && (
            <button type="button" className="dx-active-chip" onClick={() => onCategoryChange('')}>
              {categoryName || 'Category'} <X size={13} aria-hidden="true" />
            </button>
          )}
          <button type="button" className="dx-active-clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {/* Providers: why this page matters to them */}
      {!loading && !isProvider && requests.length > 0 && (
        <div className="rq-provider">
          <span className="rq-provider-icon" aria-hidden="true"><Store size={22} /></span>
          <p>
            <strong>Run a shop or offer a skill?</strong>
            Every request here is a customer looking for someone like you. Send a quote and win the job.
          </p>
          <button
            type="button"
            className="dx-btn dx-btn-lime"
            onClick={() => onNavigate(user ? 'Provider Application' : 'Auth')}
          >
            {user ? 'List your business' : 'Join as a provider'}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <ul className="rq-grid" aria-label="Loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="rq-card rq-skel" style={{ '--dx-i': i } as React.CSSProperties}>
              <span className="dx-skel-line is-short" />
              <span className="dx-skel-line" />
              <span className="dx-skel-line is-mid" />
              <span className="dx-skel-btn" />
            </li>
          ))}
        </ul>
      )}

      {/* Toolbar */}
      {!loading && count > 0 && (
        <div className="dx-toolbar">
          <p className="dx-toolbar-count">
            {count} {count === 1 ? 'request' : 'requests'}
            <span> · {SORTS.find(s => s.key === sort)?.label}</span>
          </p>
        </div>
      )}

      {/* Requests */}
      {!loading && count > 0 && (
        <ul className="rq-grid">
          {shown.slice(0, visible).map((req, i) => {
            const t = typeOf(req);
            const quotes = req.response_count || 0;
            const area = req.location_area || req.location;
            const cat = req.custom_category || req.category || req.category_name;
            const closes = expiresIn(req.expires_at);
            return (
              <li key={req.id} className="rq-card" style={{ '--dx-i': Math.min(i, 11) } as React.CSSProperties}>
                <div className="rq-top">
                  <span className={`rq-type is-${t.toLowerCase()}`}>
                    {TYPE_ICON[t as Exclude<TypeKey, 'ALL'>]} {TYPE_LABEL[t as Exclude<TypeKey, 'ALL'>]}
                  </span>
                  {isUrgent(req.expires_at) ? (
                    <span className="rq-urgent">
                      <Flame size={13} aria-hidden="true" /> Urgent
                    </span>
                  ) : (
                    <span className="rq-time">
                      <Clock size={13} aria-hidden="true" /> {timeAgo(req.created_at)}
                    </span>
                  )}
                </div>

                <h3 className="rq-title">
                  <button type="button" className="rq-open" onClick={() => openReq(req)}>
                    {req.title}
                  </button>
                </h3>
                {req.description && <p className="rq-desc">{req.description}</p>}

                {req.image_url && <img className="rq-img" src={req.image_url} alt="" loading="lazy" />}

                <div className="rq-meta">
                  {area && (
                    <span>
                      <MapPin size={14} aria-hidden="true" /> {area}
                    </span>
                  )}
                  {cat && (
                    <span>
                      <Tag size={14} aria-hidden="true" /> {cat}
                    </span>
                  )}
                  {req.condition && <span>{req.condition}</span>}
                </div>

                <div className="rq-money">
                  <div>
                    <span className="rq-money-label">Budget</span>
                    <strong className="rq-money-value">
                      {req.budget ? `₦${Number(req.budget).toLocaleString('en-NG')}` : 'Open to offers'}
                    </strong>
                  </div>
                  {quotes === 0 ? (
                    <span className="rq-quotes is-first">
                      <Sparkles size={14} aria-hidden="true" /> Be the first to quote
                    </span>
                  ) : (
                    <span className="rq-quotes">
                      <MessageSquareQuote size={14} aria-hidden="true" /> {quotes} {quotes === 1 ? 'quote' : 'quotes'}
                    </span>
                  )}
                </div>

                <div className="rq-foot">
                  <span>
                    <Lock size={12} aria-hidden="true" /> Exact address kept private
                  </span>
                  {closes && (
                    <span>
                      <Hourglass size={12} aria-hidden="true" /> {closes}
                    </span>
                  )}
                </div>

                {action(req)}
              </li>
            );
          })}
        </ul>
      )}

      {!loading && count > visible && (
        <div className="dx-more">
          <p>Showing {visible} of {count}</p>
          <button type="button" className="dx-btn dx-btn-outline" onClick={() => setVisible(v => v + PAGE_SIZE)}>
            Show more <ChevronDown size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && count === 0 && (
        <div className="dx-empty">
          <span className="dx-empty-icon" aria-hidden="true">
            {hasFilters ? <Search size={30} strokeWidth={2} /> : <Megaphone size={30} strokeWidth={2} />}
          </span>
          <div className="dx-empty-text">
            {!hasFilters && (
              <p className="dx-empty-kicker">
                <span className="dx-head-dot" aria-hidden="true" /> Just launching
              </p>
            )}
            <h2 className="dx-empty-title">{hasFilters ? 'No requests match yet' : 'Be the first to post a request'}</h2>
            <p className="dx-empty-note">
              {hasFilters
                ? 'Try another word, area or type. Or post what you need, and providers nearby can come to you.'
                : 'Tell providers around LAUTECH and Ogbomoso what you need: laundry, a phone repair, a tailor, a used laptop. They reply with quotes.'}
            </p>
            <div className="dx-empty-actions">
              <button type="button" className="dx-btn dx-btn-lime" onClick={() => onNavigate('Post What I Need')}>
                Post what I need <ArrowRight size={17} aria-hidden="true" />
              </button>
              {hasFilters && (
                <button type="button" className="dx-btn dx-btn-outline" onClick={clearAll}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* One request, in full */}
      {selected && (() => {
        const req = selected;
        const t = typeOf(req);
        const quotes = req.response_count || 0;
        const area = req.location_area || req.location;
        const cat = req.custom_category || req.category || req.category_name;
        const closes = expiresIn(req.expires_at);
        const photos = [req.image_url, ...String(req.images || '').split(',')]
          .map(x => (x || '').trim())
          .filter((x, i, arr) => x && arr.indexOf(x) === i);
        return (
          <div className="rq-backdrop" onClick={closeReq}>
            <div
              className="rq-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rq-sheet-title"
              tabIndex={-1}
              ref={sheetRef}
              onClick={e => e.stopPropagation()}
            >
              <button type="button" className="rq-close" onClick={closeReq} aria-label="Close">
                <X size={20} aria-hidden="true" />
              </button>

              <div className="rq-top">
                <span className={`rq-type is-${t.toLowerCase()}`}>
                  {TYPE_ICON[t as Exclude<TypeKey, 'ALL'>]} {TYPE_LABEL[t as Exclude<TypeKey, 'ALL'>]}
                </span>
                {isUrgent(req.expires_at) && (
                  <span className="rq-urgent">
                    <Flame size={13} aria-hidden="true" /> Urgent
                  </span>
                )}
              </div>

              <h2 className="rq-sheet-title" id="rq-sheet-title">{req.title}</h2>
              <p className="rq-sheet-when">
                <Clock size={14} aria-hidden="true" /> Posted {timeAgo(req.created_at).toLowerCase()}
                {closes && <> · {closes}</>}
              </p>

              {photos.length > 0 && (
                <div className="rq-photos">
                  {photos.slice(0, 5).map(src => (
                    <img key={src} src={src} alt="" loading="lazy" />
                  ))}
                </div>
              )}

              {req.description && <p className="rq-sheet-desc">{req.description}</p>}

              <div className="rq-meta">
                {area && (
                  <span>
                    <MapPin size={14} aria-hidden="true" /> {area}
                  </span>
                )}
                {cat && (
                  <span>
                    <Tag size={14} aria-hidden="true" /> {cat}
                  </span>
                )}
                {req.condition && <span>{req.condition}</span>}
              </div>

              <div className="rq-money rq-sheet-money">
                <div>
                  <span className="rq-money-label">Budget</span>
                  <strong className="rq-money-value">
                    {req.budget ? `₦${Number(req.budget).toLocaleString('en-NG')}` : 'Open to offers'}
                  </strong>
                </div>
                {quotes === 0 ? (
                  <span className="rq-quotes is-first">
                    <Sparkles size={14} aria-hidden="true" /> Be the first to quote
                  </span>
                ) : (
                  <span className="rq-quotes">
                    <MessageSquareQuote size={14} aria-hidden="true" /> {quotes} {quotes === 1 ? 'quote' : 'quotes'} so far
                  </span>
                )}
              </div>

              <p className="rq-sheet-private">
                <Lock size={14} aria-hidden="true" /> The exact address is private. Only the area is shown, and contact
                details are shared once the customer chooses a provider.
              </p>

              {action(req)}

              <div className="rq-share">
                <a className="rq-share-btn is-wa" href={whatsappShareUrl(req)} target="_blank" rel="noopener noreferrer">
                  Share on WhatsApp
                </a>
                <button
                  type="button"
                  className="rq-share-btn"
                  onClick={async () => {
                    setCopied(await copyText(listingUrl(req)));
                    window.setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  {copied ? 'Link copied' : 'Copy link'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
