import React, { useState, useEffect } from 'react';
import { Category, Location, RequestKind, AvailabilityStatus } from '../types';
import { MultiImageUpload } from '../components/MultiImageUpload';
import { getCategoriesForType } from '../components/CategorySelect';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock, Home, ImagePlus, Info, Lock, MapPin, Megaphone, Package, Phone, Plus, Search, ShoppingBag, Sparkles, Tag, Wrench } from 'lucide-react';
import '../styles/flows.css';
import '../styles/post.css';

interface PostRequestPageProps {
  categories: Category[];
  locations: Location[];
  onSuccess: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  onNavigate: (page: string) => void;
  defaultMode?: RequestKind;
  initialLookingForPreowned?: boolean;
  currentPage?: string;
}

const DRAFT_KEY = 'eclat_post_draft';
export const RETURN_TO_KEY = 'eclat_return_to';

export const PostRequestPage: React.FC<PostRequestPageProps> = ({
  categories,
  locations,
  onSuccess,
  onToast,
  onNavigate,
  defaultMode = 'SERVICE',
  initialLookingForPreowned = false,
  currentPage,
}) => {
  const { isAuthenticated, user } = useAuth();

  // Resolve request type strictly based on current page / mode
  const resolveType = (): RequestKind => {
    if (currentPage === 'Sell Pre-owned Item' || defaultMode === 'PREOWNED_SALE') return 'PREOWNED_SALE';
    if (currentPage === 'Post Pre-owned Request' || defaultMode === 'PREOWNED_REQUEST' || initialLookingForPreowned) return 'PREOWNED_REQUEST';
    if (currentPage === 'Post Product Request' || defaultMode === 'PRODUCT') return 'PRODUCT';
    return 'SERVICE';
  };

  const [requestType, setRequestType] = useState<RequestKind>(resolveType());
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [locationId, setLocationId] = useState('');
  const [generalArea, setGeneralArea] = useState('Under G');
  const [privateAddress, setPrivateAddress] = useState('');
  const [shareAddressAgreed, setShareAddressAgreed] = useState(false);
  const [priceOrBudget, setPriceOrBudget] = useState('');
  const [condition, setCondition] = useState('Used - Good Condition');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('AVAILABLE');
  const [images, setImages] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inline hint for the first missing field (presentation only; the request sent is unchanged)
  const [problem, setProblem] = useState<{ field: string; msg: string } | null>(null);
  useEffect(() => {
    setProblem(null);
  }, [title, categoryId, customCategory, description, locationId, priceOrBudget]);

  useEffect(() => {
    setRequestType(resolveType());
  }, [currentPage, defaultMode, initialLookingForPreowned]);

  // Restore a draft saved before the visitor was asked to sign in
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.page && currentPage && d.page !== currentPage) return;
      setTitle(d.title || '');
      setCategoryId(d.categoryId || '');
      setCustomCategory(d.customCategory || '');
      setLocationId(d.locationId || '');
      if (d.generalArea) setGeneralArea(d.generalArea);
      setPrivateAddress(d.privateAddress || '');
      setShareAddressAgreed(Boolean(d.shareAddressAgreed));
      setPriceOrBudget(d.priceOrBudget || '');
      if (d.condition) setCondition(d.condition);
      if (d.availabilityStatus) setAvailabilityStatus(d.availabilityStatus);
      setImages(d.images || '');
      setDescription(d.description || '');
      if (isAuthenticated) sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [currentPage, isAuthenticated]);

  const saveDraftAndSignIn = () => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          page: currentPage,
          title,
          categoryId,
          customCategory,
          locationId,
          generalArea,
          privateAddress,
          shareAddressAgreed,
          priceOrBudget,
          condition,
          availabilityStatus,
          images,
          description,
        })
      );
      if (currentPage) sessionStorage.setItem(RETURN_TO_KEY, currentPage);
    } catch {}
    onNavigate('Auth');
  };

  const isPreownedSale = requestType === 'PREOWNED_SALE';
  const isPreownedRequest = requestType === 'PREOWNED_REQUEST';
  const isProduct = requestType === 'PRODUCT';
  const isService = requestType === 'SERVICE' || requestType === 'REQUEST';

  // Dynamic Page Content unique to each page
  let pageHeading = 'Post What I Need';
  let pageSubtitle = 'Tell providers around LAUTECH and Ogbomoso what you need. They come to you with quotes.';
  let switchOffer: { text: string; actionText: string; targetPage: string } | null = {
    text: 'Looking to buy or sell a used item instead?',
    actionText: 'Pre-owned Marketplace →',
    targetPage: 'Pre-owned',
  };

  if (isPreownedSale) {
    pageHeading = 'Sell a used item';
    pageSubtitle = 'List a gadget, appliance, textbook or hostel item. Buyers nearby call or WhatsApp you.';
    switchOffer = {
      text: 'Looking to buy a used item instead of selling?',
      actionText: 'Request a Used Item →',
      targetPage: 'Post Pre-owned Request',
    };
  } else if (isPreownedRequest) {
    pageHeading = 'Find a used item';
    pageSubtitle = 'Tell students and residents what second-hand item you want to buy.';
    switchOffer = {
      text: 'Have a used item to sell instead?',
      actionText: 'Sell Pre-owned Item →',
      targetPage: 'Sell Pre-owned Item',
    };
  } else if (isProduct) {
    pageHeading = 'Find a product';
    pageSubtitle = 'Tell shops around campus what you want to buy. They reply with prices.';
    switchOffer = {
      text: 'Looking for an artisan or service instead?',
      actionText: 'Post What I Need →',
      targetPage: 'Post What I Need',
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onToast('Your details are saved. Sign in or create an account to publish.', 'info');
      saveDraftAndSignIn();
      return;
    }

    if (!title.trim() || !description.trim() || !categoryId) {
      onToast('Title, category and description are required', 'error');
      return;
    }

    const chosenCat = categories.find(c => c.id === categoryId);
    const isOthers = chosenCat?.name?.trim().toLowerCase() === 'others';
    if (isOthers && !customCategory.trim()) {
      onToast('Please specify your category in the text field', 'error');
      return;
    }

    // Extract cover image as primary image_url if images are provided
    const imageList = images.split(',').map(s => s.trim()).filter(Boolean);
    const primaryImage = imageList[0] || '';

    setSubmitting(true);
    try {
      await request('/requests', 'POST', {
        title: title.trim(),
        category_id: categoryId,
        custom_category: customCategory.trim() || undefined,
        location_id: locationId || undefined,
        location: generalArea || 'Ogbomoso',
        private_address: privateAddress.trim() || undefined,
        share_address_agreed: shareAddressAgreed,
        budget: priceOrBudget ? Number(priceOrBudget) : undefined,
        request_type: requestType,
        availability_status: isPreownedSale ? availabilityStatus : 'AVAILABLE',
        condition: (isPreownedSale || isPreownedRequest) ? condition : undefined,
        image_url: primaryImage || undefined,
        images: images || undefined,
        description: description.trim(),
      });

      if (isPreownedSale) {
        onToast('Your pre-owned item is now live for buyers across LAUTECH & Ogbomoso!', 'success');
      } else if (isPreownedRequest) {
        onToast('Your request for a pre-owned item is published! Sellers in the area will reach out.', 'success');
      } else if (isProduct) {
        onToast('Your product request has been published. Sellers can now see it and send quotes.', 'success');
      } else {
        onToast('Your request has been published. Providers can now see it and send quotes.', 'success');
      }
      onSuccess();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const relevantCategories = getCategoriesForType(
    categories,
    isProduct || isPreownedSale || isPreownedRequest ? 'PRODUCT' : 'SERVICE'
  );
  const chosenCategory = categories.find(c => c.id === categoryId);
  const isOthersCategory = chosenCategory?.name?.trim().toLowerCase() === 'others';
  const categoryLabel = isOthersCategory && customCategory.trim() ? customCategory.trim() : chosenCategory?.name;
  const previewImage = images.split(',').map(s => s.trim()).filter(Boolean)[0];
  const needsCondition = isPreownedSale || isPreownedRequest;
  const typeTag = isPreownedSale ? 'For sale' : isPreownedRequest ? 'Wanted · used' : isProduct ? 'Wanted · product' : 'Wanted · service';
  const priceText = priceOrBudget ? `₦${Number(priceOrBudget).toLocaleString('en-NG')}` : '';
  const statusText: Record<string, string> = { AVAILABLE: 'Available', RESERVED: 'Reserved', SOLD: 'Sold' };

  const step1Done = Boolean(title.trim() && categoryId && (!isOthersCategory || customCategory.trim()));
  const step2Done = Boolean(locationId) && (!isPreownedSale || Boolean(priceOrBudget));
  const step3Done = Boolean(description.trim());
  const doneCount = [step1Done, step2Done, step3Done].filter(Boolean).length;

  const suggestions = isPreownedSale
    ? ['Laptop', 'Android phone', 'Reading table', 'Gas cylinder', 'Textbooks', 'Mattress']
    : isPreownedRequest
    ? ['Used laptop', 'Small fridge', 'Reading table', 'Standing fan', 'Gas cylinder', 'Mattress']
    : isProduct
    ? ['Rechargeable fan', 'Power bank', 'Phone charger', 'Electric kettle', 'Textbook', 'Extension box']
    : ['Laundry pickup', 'Phone screen repair', 'Hair braiding', 'Tailor for an outfit', 'Generator repair', 'Plumber'];

  const tips = isPreownedSale
    ? ['How long I have used it: ', 'Any faults: ', 'Why I am selling: ', 'Pickup or delivery: ']
    : isPreownedRequest || isProduct
    ? ['Brand or model: ', 'Quantity: ', 'When I need it: ', 'Delivery: ']
    : ['What needs doing: ', 'When I need it: ', 'How urgent: ', 'Anything else: '];

  const amounts = isPreownedSale ? [5000, 10000, 20000, 50000] : [2000, 5000, 10000, 20000];

  const TYPES = [
    { kind: 'SERVICE', label: 'I need a service', sub: 'Repairs, laundry, hair…', icon: <Wrench size={18} />, page: 'Post What I Need', on: isService },
    { kind: 'PRODUCT', label: 'I want to buy', sub: 'A new product', icon: <ShoppingBag size={18} />, page: 'Post Product Request', on: isProduct },
    { kind: 'PREOWNED_REQUEST', label: 'I want a used item', sub: 'Second-hand', icon: <Search size={18} />, page: 'Post Pre-owned Request', on: isPreownedRequest },
    { kind: 'PREOWNED_SALE', label: "I'm selling", sub: 'Something I own', icon: <Tag size={18} />, page: 'Sell Pre-owned Item', on: isPreownedSale },
  ];

  /** First thing still missing, with the field to jump to. */
  const firstProblem = (): { field: string; msg: string } | null => {
    if (!title.trim()) return { field: 'title', msg: isPreownedSale ? 'Give your item a name.' : 'Tell us what you need in a few words.' };
    if (!categoryId) return { field: 'category', msg: 'Choose a category.' };
    if (isOthersCategory && !customCategory.trim()) return { field: 'category', msg: 'Type your category.' };
    if (!locationId) return { field: 'area', msg: 'Choose your area.' };
    if (isPreownedSale && !priceOrBudget) return { field: 'price', msg: 'Add your asking price.' };
    if (!description.trim()) return { field: 'desc', msg: isPreownedSale ? 'Describe your item.' : 'Add a short description.' };
    return null;
  };

  const onFormSubmit = (e: React.FormEvent) => {
    // Signed-out visitors keep their draft and go to sign in, exactly as before.
    if (isAuthenticated) {
      const p = firstProblem();
      if (p) {
        e.preventDefault();
        setProblem(p);
        const el = document.getElementById(`pw-field-${p.field}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true });
        return;
      }
    }
    handleSubmit(e);
  };

  const fieldError = (field: string) =>
    problem?.field === field ? (
      <p className="pw-error" role="alert">
        <AlertCircle size={14} aria-hidden="true" /> {problem.msg}
      </p>
    ) : null;

  const addTip = (prefix: string) => {
    setDescription(d => (d.trim() ? `${d.replace(/\s+$/, '')}\n${prefix}` : prefix));
    requestAnimationFrame(() => {
      const ta = document.getElementById('pw-desc') as HTMLTextAreaElement | null;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    });
  };

  const submitText = isPreownedSale ? 'Publish my item' : 'Post my request';

  const howSteps = isPreownedSale
    ? [
        ['You list it', 'Your item shows in Pre-owned with your general area.'],
        ['Buyers reach out', 'Interested buyers call or WhatsApp you.'],
        ['Meet and sell', 'Meet in a public place and get paid.'],
      ]
    : [
        ['You post it', 'Providers around you see your request.'],
        ['They send quotes', 'Shops and artisans reply with prices.'],
        ['You choose', 'Compare, pick one and get it done.'],
      ];

  return (
    <section className="fl pw" aria-labelledby="fl-post-title">
      <header className="fl-head pw-head">
        <button type="button" className="fl-back" onClick={() => onNavigate('Home')}>
          <ArrowLeft size={16} /> Back to home
        </button>
        <h1 className="fl-head-title" id="fl-post-title">{pageHeading}</h1>
        <p className="fl-head-note">{pageSubtitle}</p>

        <div className="pw-types" role="group" aria-label="What would you like to do?">
          {TYPES.map(t => (
            <button
              key={t.kind}
              type="button"
              className={`pw-type${t.on ? ' is-on' : ''}`}
              aria-pressed={t.on}
              onClick={() => !t.on && onNavigate(t.page)}
            >
              <span className="pw-type-icon" aria-hidden="true">{t.icon}</span>
              <span>
                <strong>{t.label}</strong>
                <span>{t.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </header>

      <form className="fl-post" onSubmit={onFormSubmit}>
        <div className="fl-steps">
          {!isAuthenticated && (
            <div className="fl-step pw-guest">
              <Info size={20} aria-hidden="true" />
              <p>
                <strong>No account yet? No problem.</strong>
                Fill this in first. When you post, we'll ask you to sign in and keep everything you typed.
              </p>
              <button type="button" className="fl-btn fl-btn-outline" onClick={saveDraftAndSignIn}>
                Sign in now
              </button>
            </div>
          )}

          {/* 1. What */}
          <div className={`fl-step${step1Done ? ' is-done' : ''}`}>
            <div className="fl-step-head">
              <span className="fl-step-num">{step1Done ? <Check size={18} strokeWidth={3} /> : '1'}</span>
              <div>
                <h2 className="fl-step-title">
                  {isPreownedSale
                    ? 'What are you selling?'
                    : isPreownedRequest
                    ? 'What used item do you want?'
                    : isProduct
                    ? 'What do you want to buy?'
                    : 'What do you need done?'}
                </h2>
                <p className="fl-step-sub">Write it in a few words, or tap one of the popular ones.</p>
              </div>
            </div>

            <div className="fl-field" id="pw-field-title">
              <div className={`fl-input pw-big${problem?.field === 'title' ? ' is-bad' : ''}`}>
                <Sparkles size={20} aria-hidden="true" />
                <input
                  id="fl-post-title-input"
                  maxLength={100}
                  aria-label="Title"
                  placeholder={
                    isPreownedSale
                      ? 'e.g. HP laptop, Core i5, 8GB RAM'
                      : isPreownedRequest
                      ? 'e.g. Small fridge for my hostel room'
                      : isProduct
                      ? 'e.g. Rechargeable standing fan'
                      : 'e.g. Fix my generator at Peace Lodge'
                  }
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <span className={`fl-counter${title.length > 85 ? ' is-near' : ''}`}>{title.length}/100</span>
              </div>
              {fieldError('title')}
              <div className="pw-chips" style={{ marginTop: 10 }}>
                <span className="pw-chips-label">Popular:</span>
                {suggestions.map(sg => (
                  <button key={sg} type="button" className={`pw-chip is-small${title === sg ? ' is-on' : ''}`} onClick={() => setTitle(sg)}>
                    {sg}
                  </button>
                ))}
              </div>
            </div>

            <div className="fl-field" id="pw-field-category">
              <div className="fl-label">Category</div>
              {relevantCategories.length > 0 ? (
                <div className="pw-chips">
                  {relevantCategories.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`pw-chip${categoryId === c.id ? ' is-on' : ''}`}
                      aria-pressed={categoryId === c.id}
                      onClick={() => setCategoryId(c.id)}
                    >
                      {categoryId === c.id && <Check size={14} strokeWidth={3} />}
                      {c.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="fl-hint">Loading categories…</p>
              )}
              {isOthersCategory && (
                <div className="fl-input" style={{ marginTop: 10 }}>
                  <Tag size={18} aria-hidden="true" />
                  <input
                    placeholder="Type your category"
                    aria-label="Your category"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                  />
                </div>
              )}
              {fieldError('category')}
            </div>

            {needsCondition && (
              <div className="fl-field">
                <div className="fl-label">{isPreownedSale ? 'Condition' : 'Condition you will accept'}</div>
                <div className="pw-chips">
                  {[
                    'Used - Like New',
                    'Used - Good Condition',
                    'Fairly Used',
                    'Any Working Condition',
                    ...(isPreownedSale ? ['Brand New / Sealed', 'For Parts or Repair'] : []),
                  ].map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`pw-chip${condition === c ? ' is-on' : ''}`}
                      aria-pressed={condition === c}
                      onClick={() => setCondition(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isPreownedSale && (
              <div className="fl-field" style={{ marginBottom: 0 }}>
                <div className="fl-label">Availability</div>
                <div className="pw-chips">
                  {(['AVAILABLE', 'RESERVED', 'SOLD'] as AvailabilityStatus[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`pw-chip${availabilityStatus === s ? ' is-on' : ''}`}
                      aria-pressed={availabilityStatus === s}
                      onClick={() => setAvailabilityStatus(s)}
                    >
                      {statusText[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Where and budget */}
          <div className={`fl-step${step2Done ? ' is-done' : ''}`}>
            <div className="fl-step-head">
              <span className="fl-step-num">{step2Done ? <Check size={18} strokeWidth={3} /> : '2'}</span>
              <div>
                <h2 className="fl-step-title">Where are you, and {isPreownedSale ? 'your price' : 'your budget'}?</h2>
                <p className="fl-step-sub">People only see your general area. Your exact address stays private.</p>
              </div>
            </div>

            <div className="fl-field" id="pw-field-area">
              <div className="fl-label">Your area</div>
              <div className="pw-areas">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    className={`pw-area${locationId === loc.id ? ' is-on' : ''}`}
                    aria-pressed={locationId === loc.id}
                    onClick={() => {
                      setLocationId(loc.id);
                      setGeneralArea(loc.area);
                    }}
                  >
                    <strong>
                      <MapPin size={14} aria-hidden="true" /> {loc.area}
                    </strong>
                    <span>{loc.landmark || 'Ogbomoso'}</span>
                  </button>
                ))}
              </div>
              {fieldError('area')}
            </div>

            <div className="fl-field" id="pw-field-price">
              <div className="fl-label">
                {isPreownedSale ? 'Asking price' : 'Budget'}
                {!isPreownedSale && <span className="fl-label-note">Optional</span>}
              </div>
              <div className="pw-money">
                <div className={`fl-input${problem?.field === 'price' ? ' is-bad' : ''}`}>
                  <span aria-hidden="true" style={{ fontWeight: 900, fontSize: 17 }}>₦</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    aria-label={isPreownedSale ? 'Asking price in naira' : 'Budget in naira'}
                    placeholder={isPreownedSale ? '45000' : '5000'}
                    value={priceOrBudget}
                    onChange={e => setPriceOrBudget(e.target.value)}
                  />
                </div>
                <div className="pw-chips">
                  {amounts.map(a => (
                    <button
                      key={a}
                      type="button"
                      className={`pw-chip is-small${Number(priceOrBudget) === a ? ' is-on' : ''}`}
                      onClick={() => setPriceOrBudget(String(a))}
                    >
                      ₦{a.toLocaleString('en-NG')}
                    </button>
                  ))}
                </div>
              </div>
              {fieldError('price')}
            </div>

            <div className="fl-field">
              <label className="fl-label" htmlFor="fl-post-address">
                <span>
                  Hostel, lodge or street <span className="fl-label-note">Optional</span>
                </span>
                <span className="fl-private">
                  <Lock size={12} aria-hidden="true" /> Private
                </span>
              </label>
              <div className="fl-input">
                <Home size={18} aria-hidden="true" />
                <input
                  id="fl-post-address"
                  placeholder="e.g. Peace Lodge, behind Bovas"
                  value={privateAddress}
                  onChange={e => setPrivateAddress(e.target.value)}
                />
              </div>
            </div>

            <label className="fl-toggle" htmlFor="privacyConsent">
              <input
                type="checkbox"
                id="privacyConsent"
                checked={shareAddressAgreed}
                onChange={e => setShareAddressAgreed(e.target.checked)}
              />
              <span className="fl-toggle-track" aria-hidden="true" />
              <span className="fl-toggle-text">
                <strong>Keep my details private</strong>
                Show only {locationId ? generalArea : 'your general area'} in public. Share my exact address and contact only with a provider
                I choose.
              </span>
            </label>

            {isPreownedSale && (
              <div className="fl-notice" style={{ margin: '14px 0 0' }}>
                <Phone size={20} />
                <div className="fl-notice-body">
                  <strong>Buyers will see your phone number</strong>
                  So they can call or WhatsApp you{user?.phone ? <> on <b>{user.phone}</b></> : null}.
                  {isAuthenticated && !user?.phone && ' Your account has no phone number yet, so buyers may not be able to reach you.'}
                </div>
              </div>
            )}
          </div>

          {/* 3. Details and photos */}
          <div className={`fl-step${step3Done ? ' is-done' : ''}`}>
            <div className="fl-step-head">
              <span className="fl-step-num">{step3Done ? <Check size={18} strokeWidth={3} /> : '3'}</span>
              <div>
                <h2 className="fl-step-title">{isPreownedSale ? 'Describe your item' : 'Give a few details'}</h2>
                <p className="fl-step-sub">
                  {isPreownedSale ? 'Honest details and clear photos sell faster.' : 'The clearer you are, the better the quotes.'}
                </p>
              </div>
            </div>

            <div className="fl-field" id="pw-field-desc">
              <div className="fl-label">
                Description
                <span className={`fl-counter${description.length > 1800 ? ' is-near' : ''}`}>{description.length}/2000</span>
              </div>
              <div className={`fl-input is-area${problem?.field === 'desc' ? ' is-bad' : ''}`}>
                <textarea
                  id="pw-desc"
                  maxLength={2000}
                  aria-label="Description"
                  placeholder={
                    isPreownedSale
                      ? 'How long you have used it, any faults, why you are selling, and pickup or delivery.'
                      : isPreownedRequest
                      ? 'Brand, model, the condition you will accept, and when you need it.'
                      : isProduct
                      ? 'Quantity, brand or specs, and whether you need delivery.'
                      : 'What needs doing, when you need it done, and anything a provider should know.'
                  }
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              {fieldError('desc')}
              <div className="pw-tips">
                <span className="pw-chips-label">Not sure what to write? Add:</span>
                {tips.map(t => (
                  <button key={t} type="button" className="pw-tip" onClick={() => addTip(t)}>
                    <Plus size={13} aria-hidden="true" /> {t.replace(/:\s*$/, '')}
                  </button>
                ))}
              </div>
            </div>

            {isAuthenticated ? (
              <MultiImageUpload
                label={isPreownedSale ? 'Photos of your item (up to 5)' : 'Photos (optional)'}
                hint={
                  isPreownedSale
                    ? 'Take photos from different angles in good light.'
                    : 'A sample design, the broken item or a reference picture helps a lot.'
                }
                maxImages={5}
                value={images}
                onChange={setImages}
              />
            ) : (
              <div className="pw-signin-photos">
                <ImagePlus size={26} aria-hidden="true" />
                <p>
                  <strong>Want to add photos?</strong>
                  Sign in first. We'll keep everything you've typed.
                </p>
                <button type="button" className="fl-btn fl-btn-outline" onClick={saveDraftAndSignIn}>
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="fl-aside" aria-label="Preview and post">
          <div className="fl-preview">
            <div className="fl-preview-label">
              <span className="fl-live" aria-hidden="true" />
              What people will see
            </div>
            <div className="fl-preview-media">
              {previewImage ? <img src={previewImage} alt="" /> : isPreownedSale ? <Package size={44} /> : <Megaphone size={44} />}
            </div>
            <div className="fl-preview-body">
              <div className="fl-preview-tags">
                <span className="fl-preview-tag">{typeTag}</span>
                {categoryLabel && <span className="fl-preview-tag is-muted">{categoryLabel}</span>}
                {needsCondition && <span className="fl-preview-tag is-muted">{condition}</span>}
                {isPreownedSale && availabilityStatus !== 'AVAILABLE' && (
                  <span className="fl-preview-tag is-muted">{statusText[availabilityStatus]}</span>
                )}
              </div>
              <h3 className={`fl-preview-title${title.trim() ? '' : ' is-empty'}`}>{title.trim() || 'Your title shows here'}</h3>
              <p className={`fl-preview-desc${description.trim() ? '' : ' is-empty'}`}>
                {description.trim() || 'Your description shows here, so people know exactly what you mean.'}
              </p>
              <div className="fl-preview-meta">
                <span>
                  <MapPin size={14} aria-hidden="true" /> {locationId ? generalArea : 'Your area'}
                </span>
                <span>
                  <Clock size={14} aria-hidden="true" /> Just now
                </span>
                {priceText && <span className="fl-preview-price">{isPreownedSale ? priceText : `Budget ${priceText}`}</span>}
              </div>
            </div>
          </div>

          <div className="fl-submit-bar pw-submit">
            <div className="pw-progress" aria-label={`${doneCount} of 3 parts done`}>
              {[step1Done, step2Done, step3Done].map((d, i) => (
                <span key={i} className={d ? 'is-done' : ''} />
              ))}
            </div>
            <button type="submit" className="fl-btn fl-btn-lime fl-btn-block" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="fl-spinner" aria-hidden="true" /> Publishing…
                </>
              ) : !isAuthenticated ? (
                <>
                  Sign in to {isPreownedSale ? 'publish' : 'post'} <ArrowRight size={18} />
                </>
              ) : (
                <>
                  {submitText} <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="fl-submit-note">
              {doneCount === 3 ? (
                <>
                  <Check size={14} aria-hidden="true" /> All set. Free to post.
                </>
              ) : (
                `${doneCount} of 3 parts done · Free to post`
              )}
            </p>
          </div>

          <div className="fl-how">
            <h3 className="fl-how-title">What happens next</h3>
            <ol>
              {howSteps.map(([t, d], i) => (
                <li key={t}>
                  <b>{i + 1}</b>
                  <span>
                    <strong>{t}</strong>
                    {d}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </form>
    </section>
  );
};
