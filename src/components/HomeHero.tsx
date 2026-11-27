import React, { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Recycle,
  Star,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Location } from '../types';
import { HeroSearch } from './HeroSearch';
import type { SearchScope, SearchSuggestion } from './HeroSearch';
import './HomeHero.css';

export { SEARCH_SCOPES } from './HeroSearch';
export type { SearchScope, SearchSuggestion } from './HeroSearch';

/** Phrases that cycle in the headline: "Find ___ near you." */
const ROTATING_PHRASES = ['skilled artisans', 'local businesses', 'everyday services', 'pre-owned items'];
const ROTATE_EVERY_MS = 2600;

/** How often to check whether a circling card is passing her phone */
const PING_CHECK_MS = 120;
/** A card counts as passing the phone within this share of the stage width, and as gone past 1.4x it */
const PING_NEAR = 0.2;
const PING_FAR = PING_NEAR * 1.4;

interface OrbitCardConfig {
  label: string;
  icon: LucideIcon;
  tone: 'white' | 'lime' | 'whatsapp';
  targetPage?: string;
  searchScope?: SearchScope;
}

/** Cards that circle the photo. Each names something ECLAT CONNECT lets you do. */
const ORBIT_CARDS: OrbitCardConfig[] = [
  { label: 'Chat on WhatsApp', icon: MessageCircle, tone: 'whatsapp', searchScope: 'Services' },
  { label: 'Post a request', icon: Megaphone, tone: 'lime', targetPage: 'Post What I Need' },
  { label: 'Call sellers directly', icon: Phone, tone: 'white', searchScope: 'Businesses' },
  { label: 'Rate providers', icon: Star, tone: 'white', searchScope: 'Artisans' },
  { label: 'Sell used items', icon: Recycle, tone: 'lime', targetPage: 'Sell Pre-owned Item' },
  { label: 'Providers near you', icon: MapPin, tone: 'white', searchScope: 'ALL' },
];

/** Staggered entrance delay for an element */
const delay = (ms: number) => ({ '--hh-delay': `${ms}ms` } as React.CSSProperties);

/** True when the visitor's device asks for reduced motion */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Live marketplace numbers shown under the intro text */
export interface HeroStats {
  providers: number;
  listings: number;
  preowned: number;
  areas: number;
  newToday: number;
}

/** Short form for large numbers: 1250 -> "1.2k" */
const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));

/** Counts up from 0 to `value` once, easing out; shows the final number straight away for reduced motion */
const CountUp: React.FC<{ value: number }> = ({ value }) => {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{formatCount(shown)}</>;
};

interface HomeHeroProps {
  /** Areas for the location filter (one entry per area) */
  areas: Location[];
  /** Categories, listings and areas the search box can suggest */
  suggestions: SearchSuggestion[];
  /** Live numbers for the line under the intro; null while they load */
  stats?: HeroStats | null;
  onSearch: (query: string, scope: SearchScope, locationId: string) => void;
  onNavigate?: (page: string) => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ areas, suggestions, stats = null, onSearch, onNavigate }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Each time a circling card passes her phone, the phone glows once (the counter restarts the glow)
  const [pingCount, setPingCount] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // Cycle the headline phrase (skipped entirely for reduced motion)
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setPhraseIndex(i => (i + 1) % ROTATING_PHRASES.length);
    }, ROTATE_EVERY_MS);
    return () => window.clearInterval(timer);
  }, []);

  // Watch the circling cards and flash the phone when one reaches it. Reading the cards' positions
  // keeps this in step with the orbit, even while it is paused on hover. It only runs while the
  // hero is on screen and the tab is visible, and not at all for reduced motion.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) return;
    const signal = stage.querySelector<HTMLElement>('.hh-phone-signal');
    const cards = Array.from(stage.querySelectorAll<HTMLElement>('.hh-orbit-card'));
    if (!signal || cards.length === 0) return;

    const near = new Set<HTMLElement>();
    let timer: number | undefined;

    const check = () => {
      if (document.hidden) return;
      const size = stage.getBoundingClientRect().width;
      const p = signal.getBoundingClientRect();
      const px = p.left + p.width / 2;
      const py = p.top + p.height / 2;
      cards.forEach(card => {
        const r = card.getBoundingClientRect();
        const distance = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py) / size;
        if (distance < PING_NEAR && !near.has(card)) {
          near.add(card);
          setPingCount(c => c + 1);
        } else if (distance > PING_FAR) {
          near.delete(card);
        }
      });
    };

    const start = () => {
      if (timer === undefined) timer = window.setInterval(check, PING_CHECK_MS);
    };
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };

    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    observer.observe(stage);
    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const liveItems = stats
    ? [
        { key: 'providers', value: stats.providers, label: plural(stats.providers, 'provider', 'providers') },
        { key: 'listings', value: stats.listings, label: plural(stats.listings, 'listing', 'listings') },
        { key: 'preowned', value: stats.preowned, label: plural(stats.preowned, 'pre-owned item', 'pre-owned items') },
        { key: 'areas', value: stats.areas, label: plural(stats.areas, 'area', 'areas') },
        { key: 'new', value: stats.newToday, label: 'new today', highlight: true },
      ].filter(item => item.value > 0)
    : [];

  return (
    <section className="hh" aria-labelledby="hh-title">
      <div className="hh-grid">
        {/* The Eclat brand swoosh: sweeps up from the bottom corner, behind the photo */}
        <svg className="hh-swoosh hh-anim" style={delay(200)} viewBox="0 0 800 260" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path className="hh-swoosh-back" d="M190 260 C 420 238, 630 178, 800 104 L 800 150 C 650 212, 470 252, 340 260 Z" />
          <path className="hh-swoosh-front" d="M0 260 C 250 236, 520 160, 800 22 L 800 86 C 560 196, 300 252, 110 260 Z" />
        </svg>

        <div className="hh-copy">
          <p className="hh-eyebrow hh-anim" style={delay(0)}>
            LAUTECH · Ogbomoso<span className="hh-eyebrow-more"> local marketplace</span>
          </p>

          <h1 id="hh-title" className="hh-title hh-anim" style={delay(60)}>
            <span className="hh-sr-only">
              Buy, sell and hire. Find skilled artisans, local businesses, everyday services and pre-owned items near you.
            </span>
            <span aria-hidden="true">
              <span className="hh-title-line">Buy, sell and hire.</span>
              <span className="hh-title-line">
                Find{' '}
                <span className="hh-rotator">
                  {ROTATING_PHRASES.map((phrase, i) => (
                    <span
                      key={phrase}
                      className={`hh-rotator-word${i === phraseIndex ? ' is-current' : ''}${
                        i === (phraseIndex - 1 + ROTATING_PHRASES.length) % ROTATING_PHRASES.length ? ' is-leaving' : ''
                      }`}
                    >
                      {phrase}
                    </span>
                  ))}
                </span>
              </span>
              <span className="hh-title-line">near you.</span>
            </span>
          </h1>

          <p className="hh-lead hh-anim" style={delay(120)}>
            <span className="hh-lead-full">
              Discover local businesses, products, artisans, services and pre-owned items across LAUTECH and the wider
              Ogbomoso community. Connect directly via call or WhatsApp. No checkout or payment fees.
            </span>
            {/* Phones: the same promise in two lines, so the search fits on the first screen */}
            <span className="hh-lead-short">Shops, artisans, services and pre-owned items around LAUTECH and Ogbomoso.</span>
          </p>

          {/* Live numbers: proof the marketplace is active. The line keeps its height while loading,
              so the search below never jumps. Zero counts are left out. */}
          <p className={`hh-live hh-anim${stats && liveItems.length === 0 ? ' is-empty' : ''}`} style={delay(150)}>
            {liveItems.length > 0 && (
              <>
                <span className="hh-live-dot" aria-hidden="true" />
                <span className="hh-live-items" aria-hidden="true">
                  {liveItems.map((item, i) => (
                    <span key={item.key} className={`hh-live-item hh-live-${item.key}${item.highlight ? ' is-new' : ''}`} style={{ '--hh-i': i } as React.CSSProperties}>
                      <strong><CountUp value={item.value} /></strong> {item.label}
                    </span>
                  ))}
                </span>
                <span className="hh-sr-only">
                  Live on ECLAT CONNECT: {liveItems.map(item => `${item.value} ${item.label}`).join(', ')}.
                </span>
              </>
            )}
          </p>

          <HeroSearch
            areas={areas}
            suggestions={suggestions}
            onSearch={onSearch}
            onNavigate={onNavigate}
            style={delay(180)}
          />
        </div>

        {/* Visual: the student on a double circle, with feature cards circling her; her phone glows as each card passes */}
        <div className="hh-visual hh-anim" style={delay(120)}>
          <div className="hh-stage" ref={stageRef}>
            <div className="hh-ring" aria-hidden="true" />
            <div className="hh-disc" aria-hidden="true" />

            {/* A glow on the phone in her hand that flashes when a circling card passes it */}
            <div className="hh-phone-signal" aria-hidden="true">
              {pingCount > 0 && <span key={pingCount} className="hh-phone-glow" />}
            </div>

            <picture className="hh-photo" aria-hidden="true">
              <source media="(max-width: 959px)" type="image/webp" srcSet="/hero-student-360.webp" />
              <source type="image/webp" srcSet="/hero-student-560.webp" />
              <img src="/hero-student.png?v=20261123b" alt="" width={635} height={682} decoding="async" />
            </picture>

            {/* For screen readers: what the picture and cards stand for */}
            <p className="hh-sr-only">
              How it works: post a request, receive offers from providers, chat on WhatsApp to agree the price, then rate your provider.
            </p>

            <div className="hh-orbit">
              {ORBIT_CARDS.map((card, i) => {
                const Icon = card.icon;
                const handleClick = () => {
                  if (card.targetPage && onNavigate) {
                    onNavigate(card.targetPage);
                  } else if (card.searchScope) {
                    onSearch('', card.searchScope, '');
                  }
                };
                return (
                  <div
                    key={card.label}
                    className="hh-orbit-slot"
                    style={{ '--hh-angle': `${(360 / ORBIT_CARDS.length) * i}deg` } as React.CSSProperties}
                  >
                    <button type="button" className={`hh-orbit-card hh-tone-${card.tone}`} onClick={handleClick}>
                      <span className="hh-orbit-icon" aria-hidden="true"><Icon size={16} strokeWidth={2.4} /></span>
                      {card.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ul className="hh-facts">
        <li><BadgeCheck size={18} aria-hidden="true" /> Free to use</li>
        <li><MessageCircle size={18} aria-hidden="true" /> Call or WhatsApp sellers directly</li>
        <li><Wallet size={18} aria-hidden="true" /> No checkout or payment fees</li>
        <li><MapPin size={18} aria-hidden="true" /> Built for LAUTECH and Ogbomoso</li>
      </ul>
    </section>
  );
};
