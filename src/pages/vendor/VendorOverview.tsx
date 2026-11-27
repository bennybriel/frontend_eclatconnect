import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Box,
  Briefcase,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Hourglass,
  Images,
  Lightbulb,
  Lock,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  Package,
  Pencil,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { Listing, NotificationItem, Provider, Review, ServiceRequest } from '../../types';

export type VendorTab = 'dashboard' | 'products' | 'services' | 'projects' | 'upload' | 'leads' | 'reviews' | 'settings';

interface VendorOverviewProps {
  provider: Provider;
  userName: string;
  isArtisan: boolean;
  isApproved: boolean;
  statusNotice: { title: string; badge: string; text: string };
  needsUpdate: boolean;
  listings: Listing[];
  reviews: Review[];
  avgRating: string;
  leads: ServiceRequest[];
  isMatchingLead: (r: ServiceRequest) => boolean;
  myRequests: ServiceRequest[];
  quotesReceived: number;
  notifications: NotificationItem[];
  unreadCount: number;
  onTab: (tab: VendorTab) => void;
  onAdd: (kind: 'PRODUCT' | 'SERVICE' | 'PROJECT') => void;
  onNavigate: (page: string) => void;
  onOpenPublicProfile: () => void;
  onRespondToRequest: (req: ServiceRequest) => void;
}

const DAY = 86400000;

const timeOf = (raw?: string) => {
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
};

function ago(raw?: string): string {
  const t = timeOf(raw);
  if (!t) return '';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(t).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

const naira = (n?: number | null) => (n ? `₦${Number(n).toLocaleString('en-NG')}` : '');

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const VENDOR_TIPS = [
  { title: 'Add more photos to your listings', text: 'Clear photos from different angles help customers decide faster.' },
  { title: 'Reply to requests quickly', text: 'Customers usually pick one of the first providers who send a quote.' },
  { title: 'Keep prices up to date', text: 'Listings with a clear price get more calls and WhatsApp messages.' },
  { title: 'Ask happy customers for a review', text: 'Good reviews move you up in search and build trust with new customers.' },
];

const ARTISAN_TIPS = [
  { title: 'Show your past work', text: 'Add photos of jobs you have done to your portfolio. Customers love proof.' },
  { title: 'Respond to requests quickly', text: 'The first artisans to quote usually win the job.' },
  { title: 'Keep your services clear', text: 'Say what you do, where you work and roughly what it costs.' },
  { title: 'Collect reviews from your clients', text: 'Every good review helps the next customer choose you.' },
];

/** A small, dependency-free line chart */
const LineChart: React.FC<{ series: number[]; labels: string[] }> = ({ series, labels }) => {
  const W = 600;
  const H = 180;
  const pad = { l: 30, r: 26, t: 12, b: 26 };
  const max = Math.max(1, ...series);
  const step = (W - pad.l - pad.r) / Math.max(1, series.length - 1);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const pts = series.map((v, i) => [pad.l + i * step, y(v)] as const);
  const line = pts.map(([x, yy], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${yy.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - pad.b} L${pad.l},${H - pad.b} Z`;
  const ticks = [0, Math.round(max / 2), max];
  return (
    <svg className="vd-chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Requests per day over the last 30 days">
      <defs>
        <linearGradient id="vd-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4C016A" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#4C016A" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map(t => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#ece8f0" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="vd-chart-tick">{t}</text>
        </g>
      ))}
      <path d={area} fill="url(#vd-area)" />
      <path d={line} fill="none" stroke="#4C016A" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, yy], i) =>
        series[i] > 0 ? <circle key={i} cx={x} cy={yy} r="3.5" fill="#fff" stroke="#4C016A" strokeWidth="2" /> : null
      )}
      {labels.map((l, i) =>
        l ? (
          <text key={i} x={pad.l + i * step} y={H - 6} textAnchor="middle" className="vd-chart-tick">{l}</text>
        ) : null
      )}
    </svg>
  );
};

export const VendorOverview: React.FC<VendorOverviewProps> = ({
  provider,
  userName,
  isArtisan,
  isApproved,
  statusNotice,
  needsUpdate,
  listings,
  reviews,
  avgRating,
  leads,
  isMatchingLead,
  myRequests,
  quotesReceived,
  notifications,
  unreadCount,
  onTab,
  onAdd,
  onNavigate,
  onOpenPublicProfile,
  onRespondToRequest,
}) => {
  const [tip, setTip] = useState(0);
  const [chartMode, setChartMode] = useState<'all' | 'mine'>('all');

  const firstName = (userName || provider.name || '').trim().split(/\s+/)[0] || 'there';
  const products = listings.filter(l => l.kind === 'PRODUCT');
  const services = listings.filter(l => l.kind === 'SERVICE');
  const projects = listings.filter(l => l.kind === 'PROJECT');
  const active = listings.filter(l => l.status === 'ACTIVE').length;
  const matching = leads.filter(isMatchingLead);
  const myOpen = myRequests.filter(r => r.request_type !== 'PREOWNED_SALE' && (!r.status || r.status === 'OPEN'));
  const mySales = myRequests.filter(r => r.request_type === 'PREOWNED_SALE');
  const roleLabel = isArtisan ? 'Professional' : 'Vendor';
  const area = provider.location_area || provider.location;
  const category = provider.category_name || provider.category || provider.custom_category;
  const reviewCount = reviews.length || provider.review_count || 0;
  const hasRating = reviewCount > 0;
  const tips = isArtisan ? ARTISAN_TIPS : VENDOR_TIPS;

  // ---------- Profile completion, from the real profile ----------
  const checks = [
    { done: Boolean(provider.name && (provider.category_id || provider.custom_category) && (provider.description || '').trim().length >= 30), label: 'Name, category and a short description', go: () => onTab('settings') },
    { done: Boolean(provider.phone && provider.whatsapp), label: 'Phone and WhatsApp number', go: () => onTab('settings') },
    { done: Boolean(provider.location && provider.landmark), label: 'Location and a landmark', go: () => onTab('settings') },
    { done: Boolean(provider.image_url), label: isArtisan ? 'A photo of you or your work' : 'A photo of your shop or logo', go: () => onTab('settings') },
    { done: (isArtisan ? services.length : products.length + services.length) > 0, label: isArtisan ? 'Your first service' : 'Your first product or service', go: () => onAdd(isArtisan ? 'SERVICE' : 'PRODUCT') },
    { done: projects.length > 0, label: isArtisan ? 'Past work in your portfolio' : 'A showcase of your work (optional)', go: () => onAdd('PROJECT') },
  ];
  const doneCount = checks.filter(c => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const nextCheck = checks.find(c => !c.done);

  // ---------- Requests per day, last 30 days (real data) ----------
  const chart = useMemo(() => {
    const source = chartMode === 'mine' ? matching : leads;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime() - 29 * DAY;
    const series = Array.from({ length: 30 }, () => 0);
    source.forEach(r => {
      const t = timeOf(r.created_at);
      if (t >= start) series[Math.min(29, Math.floor((t - start) / DAY))]++;
    });
    const labels = series.map((_, i) =>
      i % 6 === 0 || i === 29 ? new Date(start + i * DAY).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''
    );
    return { series, labels, total: series.reduce((a, b) => a + b, 0) };
  }, [leads, matching, chartMode]);

  // ---------- Recent activity: notifications, reviews, quotes, listings ----------
  const activity = useMemo(() => {
    const items: { key: string; icon: React.ReactNode; title: string; text: string; at: number; isNew?: boolean }[] = [];
    notifications.slice(0, 12).forEach(n =>
      items.push({ key: `n${n.id}`, icon: <Bell size={18} />, title: 'Update', text: n.message, at: timeOf(n.created_at), isNew: !n.read_at })
    );
    reviews.slice(0, 6).forEach(r =>
      items.push({
        key: `r${r.id}`,
        icon: <Star size={18} />,
        title: `New review: ${r.rating}★`,
        text: r.comment ? `“${r.comment}”` : `From ${r.customer_name || 'a customer'}`,
        at: timeOf(r.created_at),
      })
    );
    listings.slice(0, 6).forEach(l =>
      items.push({
        key: `l${l.id}`,
        icon: l.kind === 'PROJECT' ? <Images size={18} /> : l.kind === 'SERVICE' ? <Wrench size={18} /> : <Box size={18} />,
        title: l.kind === 'PROJECT' ? 'Portfolio updated' : 'Listing added',
        text: l.name,
        at: timeOf(l.created_at),
      })
    );
    matching.slice(0, 4).forEach(r =>
      items.push({ key: `m${r.id}`, icon: <Megaphone size={18} />, title: 'New request in your category', text: r.title, at: timeOf(r.created_at) })
    );
    return items.filter(i => i.at).sort((a, b) => b.at - a.at).slice(0, 5);
  }, [notifications, reviews, listings, matching]);

  const ACTIONS = [
    ...(isArtisan
      ? [
          { label: 'Add service', icon: <Wrench size={22} />, run: () => onAdd('SERVICE'), locked: !isApproved, primary: true },
          { label: 'Add past work', icon: <Camera size={22} />, run: () => onAdd('PROJECT'), locked: !isApproved },
        ]
      : [
          { label: 'Add product', icon: <Plus size={22} />, run: () => onAdd('PRODUCT'), locked: !isApproved, primary: true },
          { label: 'Add service', icon: <Briefcase size={22} />, run: () => onAdd('SERVICE'), locked: !isApproved },
        ]),
    { label: 'Sell a used item', icon: <Tag size={22} />, run: () => onNavigate('Sell Pre-owned Item') },
    { label: 'Post what I need', icon: <Send size={22} />, run: () => onNavigate('Post What I Need') },
    { label: 'Find products & services', icon: <Search size={22} />, run: () => onNavigate('Products') },
    { label: 'Buy used items', icon: <ShoppingCart size={22} />, run: () => onNavigate('Pre-owned') },
  ];

  const STATS = [
    {
      icon: <Package size={20} />,
      value: active,
      label: 'Active listings',
      note: isArtisan ? `${services.length} services · ${projects.length} past work` : `${products.length} products · ${services.length} services`,
      go: () => onTab(isArtisan ? 'services' : 'products'),
    },
    { icon: <Megaphone size={20} />, value: matching.length, label: 'Requests for you', note: `${leads.length} open near you`, go: () => onTab('leads'), tone: 'lime' },
    {
      icon: <Star size={20} />,
      value: hasRating ? avgRating : 'New',
      suffix: hasRating ? '/5' : '',
      label: 'Average rating',
      note: hasRating ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}` : 'No reviews yet',
      go: () => onTab('reviews'),
    },
    { icon: <MessageSquareQuote size={20} />, value: quotesReceived, label: 'Quotes received', note: 'On things you need', go: () => onNavigate('Responses') },
    { icon: <Send size={20} />, value: myOpen.length, label: 'My open requests', note: 'Things you need', go: () => onNavigate('My Requests') },
    { icon: <Bell size={20} />, value: unreadCount, label: 'Unread updates', note: 'Notifications', go: () => onNavigate('Notifications') },
  ];

  return (
    <div className="vd-overview">
      {/* Welcome */}
      <section className="vd-hero">
        <div className="vd-hero-avatar">
          {provider.image_url ? <img src={provider.image_url} alt="" /> : <span>{(provider.name || 'E').charAt(0).toUpperCase()}</span>}
        </div>
        <div className="vd-hero-text">
          <h1 className="vd-hero-title">
            {greeting()}, {firstName}! <span className="vd-wave" aria-hidden="true">👋</span>
          </h1>
          <p className="vd-hero-name">
            <strong>{provider.name}</strong>
            {provider.verified && <BadgeCheck size={18} className="vd-verified" aria-label="Verified" />}
          </p>
          <p className="vd-hero-meta">
            {category && <span><Tag size={14} aria-hidden="true" /> {category}</span>}
            {area && <span><MapPin size={14} aria-hidden="true" /> {area}</span>}
            {hasRating && (
              <span>
                <Star size={14} aria-hidden="true" className="vd-star" /> {avgRating} ({reviewCount})
              </span>
            )}
          </p>
        </div>
        <div className="vd-hero-side">
          <span className={`vd-status${isApproved ? ' is-ok' : ' is-wait'}`}>
            {isApproved ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : <Hourglass size={15} aria-hidden="true" />}
            {isApproved ? `Approved ${roleLabel}` : statusNotice.badge}
          </span>
          <button type="button" className="vd-btn vd-btn-outline" onClick={onOpenPublicProfile} disabled={!isApproved}>
            View public profile <ExternalLink size={15} aria-hidden="true" />
          </button>
          <button type="button" className="vd-btn vd-btn-royal" onClick={() => onTab('settings')}>
            <Pencil size={15} aria-hidden="true" /> Edit {isArtisan ? 'profile' : 'business profile'}
          </button>
        </div>
      </section>

      {!isApproved && (
        <section className="vd-notice" role="status">
          <span className="vd-notice-icon" aria-hidden="true"><AlertCircle size={22} /></span>
          <div>
            <strong>{statusNotice.title}</strong>
            <p>{statusNotice.text}</p>
          </div>
          {needsUpdate && (
            <button type="button" className="vd-btn vd-btn-royal" onClick={() => onNavigate('Provider Application')}>
              Update my profile
            </button>
          )}
        </section>
      )}

      {/* Numbers */}
      <section className="vd-stats" aria-label="Your numbers">
        {STATS.map(s => (
          <button key={s.label} type="button" className={`vd-stat${s.tone === 'lime' ? ' is-lime' : ''}`} onClick={s.go}>
            <span className="vd-stat-icon" aria-hidden="true">{s.icon}</span>
            <span className="vd-stat-value">
              {s.value}
              {s.suffix && <small>{s.suffix}</small>}
            </span>
            <span className="vd-stat-label">{s.label}</span>
            <span className="vd-stat-note">{s.note}</span>
          </button>
        ))}
      </section>

      {/* Actions + completion */}
      <div className="vd-row vd-row-a">
        <section className="vd-card">
          <header className="vd-card-head">
            <h2><Sparkles size={19} aria-hidden="true" /> Quick actions</h2>
          </header>
          <div className="vd-actions">
            {ACTIONS.map(a => (
              <button
                key={a.label}
                type="button"
                className={`vd-action${a.primary ? ' is-primary' : ''}${a.locked ? ' is-locked' : ''}`}
                onClick={a.run}
                title={a.locked ? 'Available once your profile is approved' : undefined}
              >
                <span className="vd-action-icon" aria-hidden="true">{a.icon}</span>
                <span>{a.label}</span>
                {a.locked && <Lock size={13} className="vd-action-lock" aria-label="Locked until approved" />}
              </button>
            ))}
          </div>
        </section>

        <section className="vd-card vd-complete">
          <header className="vd-card-head">
            <h2>Profile completion</h2>
            <span className="vd-pct">{pct}%</span>
          </header>
          <div className="vd-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
            <span style={{ width: `${pct}%` }} />
          </div>
          <ul className="vd-checks">
            {checks.map(c => (
              <li key={c.label} className={c.done ? 'is-done' : ''}>
                <span className="vd-check-dot" aria-hidden="true">{c.done && <Check size={12} strokeWidth={3.5} />}</span>
                {c.done ? c.label : <button type="button" className="vd-link" onClick={c.go}>{c.label}</button>}
              </li>
            ))}
          </ul>
          {nextCheck ? (
            <button type="button" className="vd-btn vd-btn-outline vd-btn-block" onClick={nextCheck.go}>
              Complete your profile
            </button>
          ) : (
            <p className="vd-complete-done"><Check size={16} aria-hidden="true" /> Your profile is complete. Great work!</p>
          )}
        </section>
      </div>

      {/* Insights + activity */}
      <div className="vd-row vd-row-b">
        <section className="vd-card">
          <header className="vd-card-head">
            <h2><TrendingUp size={19} aria-hidden="true" /> Requests near you <small>Last 30 days</small></h2>
          </header>
          <div className="vd-tabs" role="tablist" aria-label="Which requests">
            <button type="button" role="tab" aria-selected={chartMode === 'all'} className={chartMode === 'all' ? 'is-on' : ''} onClick={() => setChartMode('all')}>
              All requests
            </button>
            <button type="button" role="tab" aria-selected={chartMode === 'mine'} className={chartMode === 'mine' ? 'is-on' : ''} onClick={() => setChartMode('mine')}>
              In your category
            </button>
          </div>
          <div className="vd-chart">
            <LineChart series={chart.series} labels={chart.labels} />
            {chart.total === 0 && (
              <p className="vd-chart-empty">No requests {chartMode === 'mine' ? 'in your category ' : ''}in the last 30 days yet.</p>
            )}
          </div>
          <p className="vd-chart-foot">
            <strong>{chart.total}</strong> {chart.total === 1 ? 'request' : 'requests'} in 30 days ·{' '}
            <button type="button" className="vd-link" onClick={() => onTab('leads')}>See them all</button>
          </p>
        </section>

        <section className="vd-card">
          <header className="vd-card-head">
            <h2><Clock size={19} aria-hidden="true" /> Recent activity</h2>
            <button type="button" className="vd-link" onClick={() => onNavigate('Notifications')}>View all</button>
          </header>
          {activity.length ? (
            <ul className="vd-feed">
              {activity.map(a => (
                <li key={a.key}>
                  <span className="vd-feed-icon" aria-hidden="true">{a.icon}</span>
                  <div>
                    <strong>{a.title}</strong>
                    <p>{a.text}</p>
                    <span>{ago(new Date(a.at).toISOString())}</span>
                  </div>
                  {a.isNew && <span className="vd-new">New</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="vd-empty">Your latest reviews, listings and updates will show here.</p>
          )}
        </section>
      </div>

      {/* Lists */}
      <div className="vd-row vd-row-c">
        <section className="vd-card">
          <header className="vd-card-head">
            <h2><Megaphone size={19} aria-hidden="true" /> {matching.length ? 'Requests for you' : 'Requests near you'}</h2>
            <button type="button" className="vd-link" onClick={() => onTab('leads')}>View all <ArrowRight size={14} aria-hidden="true" /></button>
          </header>
          {(matching.length ? matching : leads).slice(0, 3).map(r => (
            <div key={r.id} className="vd-item">
              <span className="vd-item-thumb" aria-hidden="true"><Megaphone size={18} /></span>
              <div className="vd-item-text">
                <strong>{r.title}</strong>
                <span>{[r.location_area || r.location, ago(r.created_at), naira(r.budget)].filter(Boolean).join(' · ')}</span>
              </div>
              <button
                type="button"
                className="vd-pill-btn"
                onClick={() => (isApproved ? onRespondToRequest(r) : onTab('leads'))}
              >
                {isApproved ? 'Quote' : 'View'}
              </button>
            </div>
          ))}
          {leads.length === 0 && <p className="vd-empty">No open requests right now. New ones will appear here.</p>}
        </section>

        <section className="vd-card">
          <header className="vd-card-head">
            <h2><Send size={19} aria-hidden="true" /> My requests</h2>
            <button type="button" className="vd-link" onClick={() => onNavigate('My Requests')}>View all <ArrowRight size={14} aria-hidden="true" /></button>
          </header>
          {myOpen.slice(0, 3).map(r => (
            <div key={r.id} className="vd-item">
              <span className="vd-item-thumb" aria-hidden="true"><Send size={18} /></span>
              <div className="vd-item-text">
                <strong>{r.title}</strong>
                <span>{[r.category_name || r.custom_category, `Posted ${ago(r.created_at)}`].filter(Boolean).join(' · ')}</span>
              </div>
              <span className="vd-tag is-open">{r.response_count ? `${r.response_count} quotes` : 'Open'}</span>
            </div>
          ))}
          {myOpen.length === 0 && (
            <div className="vd-empty">
              <p>Need something for your {isArtisan ? 'work' : 'business'} or yourself?</p>
              <button type="button" className="vd-btn vd-btn-outline" onClick={() => onNavigate('Post What I Need')}>Post what I need</button>
            </div>
          )}
        </section>

        <section className="vd-card">
          <header className="vd-card-head">
            <h2><ShoppingCart size={19} aria-hidden="true" /> My used items for sale</h2>
            <button type="button" className="vd-link" onClick={() => onNavigate('My Requests')}>View all <ArrowRight size={14} aria-hidden="true" /></button>
          </header>
          {mySales.slice(0, 3).map(r => (
            <div key={r.id} className="vd-item">
              <span className="vd-item-thumb" aria-hidden="true">
                {r.image_url ? <img src={r.image_url} alt="" /> : <Tag size={18} />}
              </span>
              <div className="vd-item-text">
                <strong>{r.title}</strong>
                <span>{naira(r.budget) || 'Price on request'}</span>
              </div>
              <span className={`vd-tag is-${(r.availability_status || 'AVAILABLE').toLowerCase()}`}>
                {r.availability_status === 'SOLD' ? 'Sold' : r.availability_status === 'RESERVED' ? 'Reserved' : 'Available'}
              </span>
            </div>
          ))}
          {mySales.length === 0 && (
            <div className="vd-empty">
              <p>Have something you no longer use? Sell it to people nearby.</p>
              <button type="button" className="vd-btn vd-btn-outline" onClick={() => onNavigate('Sell Pre-owned Item')}>Sell a used item</button>
            </div>
          )}
        </section>
      </div>

      {/* Tips */}
      <section className="vd-tips" aria-label="Tips to grow">
        <span className="vd-tips-icon" aria-hidden="true"><Lightbulb size={24} /></span>
        <div className="vd-tips-text" aria-live="polite">
          <p className="vd-tips-kicker">Tips to grow your {isArtisan ? 'work' : 'business'}</p>
          <strong>{tips[tip].title}</strong>
          <span>{tips[tip].text}</span>
        </div>
        <div className="vd-tips-nav">
          <span>{tip + 1} of {tips.length}</span>
          <button type="button" aria-label="Previous tip" onClick={() => setTip(t => (t + tips.length - 1) % tips.length)}><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Next tip" onClick={() => setTip(t => (t + 1) % tips.length)}><ChevronRight size={18} /></button>
        </div>
      </section>

      {/* A quiet reminder of what the space is for */}
      <p className="vd-foot-note">
        <Store size={14} aria-hidden="true" /> Your dashboard brings together what you offer and what you need, in one place.
      </p>
    </div>
  );
};
