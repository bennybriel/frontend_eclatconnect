import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, History, LayoutGrid, MapPin, Megaphone, Search, Tag, TrendingUp, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Location } from '../types';
import './HeroSearch.css';

/** Sections a search can target. "ALL" lets the page choose the best-matching section. */
export const SEARCH_SCOPES = [
  { value: 'ALL', label: 'All' },
  { value: 'Businesses', label: 'Businesses' },
  { value: 'Products', label: 'Products' },
  { value: 'Artisans', label: 'Artisans' },
  { value: 'Services', label: 'Services' },
  { value: 'Pre-owned', label: 'Pre-owned' },
] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number]['value'];

/** Something the search box can suggest while the visitor types */
export interface SearchSuggestion {
  label: string;
  type: 'category' | 'listing' | 'area' | 'popular';
  scope: SearchScope;
  /** For areas: the location to filter by */
  locationId?: string;
  /** A short second line, e.g. the section or a landmark */
  hint?: string;
}

/** Popular searches for each tab, so the chips teach what each section is for */
const POPULAR_BY_SCOPE: Record<SearchScope, string[]> = {
  ALL: ['Phone repair', 'Laundry', 'Hair braiding', 'Tailoring', 'Used laptop'],
  Businesses: ['Supermarket', 'Pharmacy', 'Printing', 'Restaurant', 'Phone accessories'],
  Products: ['Phone charger', 'Rechargeable fan', 'Textbooks', 'Shoes', 'Gas cylinder'],
  Artisans: ['Tailor', 'Barber', 'Electrician', 'Plumber', 'Carpenter'],
  Services: ['Laundry', 'Phone repair', 'Delivery', 'Photography', 'Cleaning'],
  'Pre-owned': ['Used laptop', 'Fan', 'Gas cylinder', 'Mattress', 'Reading table'],
};

/** Which section each "All" popular search belongs to */
const POPULAR_ALL_SCOPE: Record<string, SearchScope> = {
  'Phone repair': 'Services',
  Laundry: 'Services',
  'Hair braiding': 'Artisans',
  Tailoring: 'Artisans',
  'Used laptop': 'Pre-owned',
};

/** Examples typed into the empty search box, one after another */
const PLACEHOLDER_EXAMPLES = ['laundry', 'phone repair', 'a barber', 'a used laptop', 'a tailor', 'textbooks'];
const DEFAULT_PLACEHOLDER = 'What are you looking for?';

const RECENT_KEY = 'eclat_recent_searches';
const MAX_RECENT = 3;
const MAX_SUGGESTIONS = 7;

const TYPE_ICON: Record<SearchSuggestion['type'], LucideIcon> = {
  category: LayoutGrid,
  listing: Tag,
  area: MapPin,
  popular: TrendingUp,
};

const TYPE_LABEL: Record<SearchSuggestion['type'], string> = {
  category: 'Category',
  listing: 'Listing',
  area: 'Area',
  popular: 'Popular',
};

const TYPE_ORDER: Record<SearchSuggestion['type'], number> = { category: 0, popular: 1, listing: 2, area: 3 };

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Recent searches live only on this device; storage can be unavailable, so every access is guarded */
const readRecent = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const writeRecent = (list: string[]) => {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: recent searches simply aren't remembered */
  }
};

/** The label with the matching part wrapped in <mark> */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
};

interface HeroSearchProps {
  areas: Location[];
  suggestions: SearchSuggestion[];
  onSearch: (query: string, scope: SearchScope, locationId: string) => void;
  onNavigate?: (page: string) => void;
  /** Delay for the entrance animation */
  style?: React.CSSProperties;
}

type Option =
  | { kind: 'suggestion'; item: SearchSuggestion }
  | { kind: 'recent'; text: string };

export const HeroSearch: React.FC<HeroSearchProps> = ({ areas, suggestions, onSearch, onNavigate, style }) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('ALL');
  const [locationId, setLocationId] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => (typeof window === 'undefined' ? [] : readRecent()));
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);

  const inputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  // True while some tabs are hidden past the right edge (small screens): the row fades out there
  const [tabsMore, setTabsMore] = useState(false);

  // ---- Sliding pill under the active tab ----
  useLayoutEffect(() => {
    const place = () => {
      const row = tabsRef.current;
      const active = row?.querySelector<HTMLButtonElement>('.hs-tab.is-active');
      if (!row || !active) return;
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
      // Keep the chosen tab in view when the row scrolls sideways
      const right = active.offsetLeft + active.offsetWidth;
      if (right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: right - row.clientWidth + 24, behavior: 'smooth' });
      else if (active.offsetLeft < row.scrollLeft) row.scrollTo({ left: Math.max(0, active.offsetLeft - 24), behavior: 'smooth' });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [scope]);

  // ---- Fade at the right edge while more tabs are hidden there ----
  useEffect(() => {
    const row = tabsRef.current;
    if (!row) return;
    const update = () => setTabsMore(row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
    update();
    row.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      row.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // ---- "/" jumps to the search box (desktop habit) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const typing = t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
      if (typing) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ---- Placeholder types out example searches while the box is empty and idle ----
  useEffect(() => {
    if (focused || query || prefersReducedMotion()) {
      setPlaceholder(DEFAULT_PLACEHOLDER);
      return;
    }
    let example = 0;
    let chars = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const word = PLACEHOLDER_EXAMPLES[example];
      chars += deleting ? -1 : 1;
      // At least one letter, so the box never shows empty quotes between words; trimEnd so a
      // half-typed word ("a used ") never shows a gap before the closing quote
      setPlaceholder(`Try "${word.slice(0, Math.max(chars, 1)).trimEnd()}"`);
      let wait = deleting ? 35 : 70;
      if (!deleting && chars >= word.length) {
        deleting = true;
        wait = 1500;
      } else if (deleting && chars <= 1) {
        deleting = false;
        example = (example + 1) % PLACEHOLDER_EXAMPLES.length;
        wait = 350;
      }
      timer = window.setTimeout(tick, wait);
    };
    timer = window.setTimeout(tick, 1200);
    return () => window.clearTimeout(timer);
  }, [focused, query]);

  // ---- What the dropdown shows ----
  const q = query.trim().toLowerCase();

  const options: Option[] = useMemo(() => {
    if (!q) return recent.map(text => ({ kind: 'recent' as const, text }));

    const popular: SearchSuggestion[] = Object.entries(POPULAR_BY_SCOPE).flatMap(([s, labels]) =>
      labels.map(label => ({
        label,
        type: 'popular' as const,
        scope: s === 'ALL' ? POPULAR_ALL_SCOPE[label] ?? 'ALL' : (s as SearchScope),
      }))
    );

    const seen = new Set<string>();
    const ranked = [...suggestions, ...popular]
      .map(item => {
        const label = item.label.toLowerCase();
        const score = label.startsWith(q) ? 0 : label.split(/\s+/).some(w => w.startsWith(q)) ? 1 : label.includes(q) ? 2 : -1;
        // Results in the chosen section come first
        const inScope = scope === 'ALL' || item.scope === scope || item.type === 'area' ? 0 : 1;
        return { item, score, inScope };
      })
      .filter(r => r.score >= 0)
      .sort((a, b) => a.inScope - b.inScope || a.score - b.score || TYPE_ORDER[a.item.type] - TYPE_ORDER[b.item.type] || a.item.label.length - b.item.label.length)
      .filter(r => {
        const key = `${r.item.type === 'popular' ? 'category' : r.item.type}:${r.item.label.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_SUGGESTIONS);

    return ranked.map(r => ({ kind: 'suggestion' as const, item: r.item }));
  }, [q, recent, suggestions, scope]);

  const showDropdown = open && focused && options.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
  }, [q, scope]);

  // ---- Actions ----
  const remember = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const next = [t, ...recent.filter(r => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
    setRecent(next);
    writeRecent(next);
  };

  const runSearch = (text: string, searchScope: SearchScope = scope, loc: string = locationId) => {
    remember(text);
    setOpen(false);
    onSearch(text, searchScope, loc);
  };

  const choose = (option: Option) => {
    if (option.kind === 'recent') {
      setQuery(option.text);
      runSearch(option.text);
      return;
    }
    const { item } = option;
    if (item.type === 'area' && item.locationId) {
      // Choosing an area sets the location filter and keeps the visitor in the search box
      setLocationId(item.locationId);
      setQuery('');
      setOpen(false);
      inputRef.current?.focus();
      return;
    }
    setQuery(item.label);
    runSearch(item.label, scope === 'ALL' ? item.scope : scope);
  };

  const clearRecent = () => {
    setRecent([]);
    writeRecent([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showDropdown && activeIndex >= 0) {
      choose(options[activeIndex]);
      return;
    }
    runSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(i => (options.length ? (i + 1) % options.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1));
    } else if (e.key === 'Escape') {
      if (showDropdown) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  const optionId = (i: number) => `hs-option-${i}`;
  const scopeLabel = SEARCH_SCOPES.find(s => s.value === scope)?.label ?? 'All';
  const popularChips = POPULAR_BY_SCOPE[scope];

  return (
    <div className="hs hh-anim" style={style}>
      <form className="hh-search hs-card" role="search" onSubmit={handleSubmit}>
        {/* Section tabs with a pill that slides to the chosen one */}
        <div className={`hh-tabs hs-tabs${tabsMore ? ' has-more' : ''}`} role="group" aria-label="Search in" ref={tabsRef}>
          {indicator && (
            <span
              className="hs-tab-indicator"
              aria-hidden="true"
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
            />
          )}
          {SEARCH_SCOPES.map(s => (
            <button
              key={s.value}
              type="button"
              className={`hs-tab${scope === s.value ? ' is-active' : ''}`}
              aria-pressed={scope === s.value}
              onClick={() => setScope(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="hh-row">
          <div className="hh-query hs-query">
            <Search className="hh-query-icon" size={22} aria-hidden="true" />
            <label htmlFor="hh-q" className="hh-sr-only">What are you looking for?</label>
            <input
              ref={inputRef}
              id="hh-q"
              type="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
              aria-controls="hs-listbox"
              aria-activedescendant={showDropdown && activeIndex >= 0 ? optionId(activeIndex) : undefined}
              placeholder={placeholder}
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setFocused(true);
                setOpen(true);
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              enterKeyHint="search"
            />
            {!query && !focused && (
              <kbd className="hs-kbd" aria-hidden="true" title="Press / to search">/</kbd>
            )}
            {query && (
              <button
                type="button"
                className="hs-clear"
                aria-label="Clear search"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            )}

            {/* Suggestions */}
            {showDropdown && (
              <div className="hs-dropdown">
                <p className="hs-dropdown-title">
                  {q ? (
                    <>Suggestions{scope !== 'ALL' && <> · <span>{scopeLabel} first</span></>}</>
                  ) : (
                    <>
                      Recent searches
                      <button type="button" className="hs-link-btn" onMouseDown={e => e.preventDefault()} onClick={clearRecent}>
                        Clear
                      </button>
                    </>
                  )}
                </p>
                <ul id="hs-listbox" role="listbox" aria-label={q ? 'Search suggestions' : 'Recent searches'}>
                  {options.map((option, i) => {
                    const Icon = option.kind === 'recent' ? History : TYPE_ICON[option.item.type];
                    const label = option.kind === 'recent' ? option.text : option.item.label;
                    const meta =
                      option.kind === 'recent'
                        ? 'Recent'
                        : option.item.type === 'area'
                        ? 'Set as area'
                        : option.item.hint || TYPE_LABEL[option.item.type];
                    return (
                      <li
                        key={`${option.kind}-${label}-${i}`}
                        id={optionId(i)}
                        role="option"
                        aria-selected={i === activeIndex}
                        className={`hs-option${i === activeIndex ? ' is-active' : ''}`}
                        style={{ '--hs-i': i } as React.CSSProperties}
                        onMouseDown={e => e.preventDefault()}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => choose(option)}
                      >
                        <span className={`hs-option-icon hs-type-${option.kind === 'recent' ? 'recent' : option.item.type}`} aria-hidden="true">
                          <Icon size={16} strokeWidth={2.3} />
                        </span>
                        <span className="hs-option-label">
                          <Highlight text={label} query={q} />
                        </span>
                        <span className="hs-option-meta">{meta}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="hs-dropdown-foot" aria-hidden="true">
                  <kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to choose · <kbd>Esc</kbd> to close
                </p>
              </div>
            )}
          </div>

          <div className="hh-location">
            <MapPin className="hh-location-icon" size={20} aria-hidden="true" />
            <label htmlFor="hh-area" className="hh-sr-only">Area</label>
            <select id="hh-area" value={locationId} onChange={e => setLocationId(e.target.value)}>
              <option value="">All areas</option>
              {areas.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.area}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="hh-submit hs-submit">
            <Search size={20} strokeWidth={2.4} aria-hidden="true" />
            Search
          </button>
        </div>
      </form>

      {/* Recent searches (this device only) */}
      {recent.length > 0 && (
        <div className="hh-popular hs-recent">
          <span className="hh-popular-label" id="hs-recent-label">
            <History size={14} aria-hidden="true" /> Recent:
          </span>
          <ul aria-labelledby="hs-recent-label">
            {recent.map(r => (
              <li key={r}>
                <button type="button" className="hh-chip hs-chip" onClick={() => { setQuery(r); runSearch(r); }}>
                  {r}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popular searches change with the chosen tab */}
      <div className="hh-popular">
        <span className="hh-popular-label" id="hs-popular-label">
          <TrendingUp size={14} aria-hidden="true" /> Popular{scope !== 'ALL' ? ` in ${scopeLabel}` : ''}:
        </span>
        <ul key={scope} aria-labelledby="hs-popular-label">
          {popularChips.map((label, i) => (
            <li key={label} style={{ '--hs-i': i } as React.CSSProperties} className="hs-chip-item">
              <button
                type="button"
                className="hh-chip hs-chip"
                onClick={() => {
                  setQuery(label);
                  runSearch(label, scope === 'ALL' ? POPULAR_ALL_SCOPE[label] ?? 'ALL' : scope);
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* The request flow, right where people search */}
      {onNavigate && (
        <button type="button" className="hs-post" onClick={() => onNavigate('Post What I Need')}>
          <span className="hs-post-icon" aria-hidden="true"><Megaphone size={16} strokeWidth={2.4} /></span>
          <span className="hs-post-text">
            <strong>Can't find it?</strong> Post what you need<span className="hs-post-more"> and let providers come to you</span>
          </span>
          <ArrowRight className="hs-post-arrow" size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
