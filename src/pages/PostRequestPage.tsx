import React, { useState, useEffect } from 'react';
import { Category, Location, RequestKind, AvailabilityStatus } from '../types';
import { MultiImageUpload } from '../components/MultiImageUpload';
import { CategorySelect } from '../components/CategorySelect';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
  let pageSubtitle = 'Broadcast your service or artisan requirement to approved providers around LAUTECH & Ogbomoso';
  let switchOffer: { text: string; actionText: string; targetPage: string } | null = {
    text: 'Looking to buy or sell a used item instead?',
    actionText: 'Pre-owned Marketplace →',
    targetPage: 'Pre-owned',
  };

  if (isPreownedSale) {
    pageHeading = 'Sell a Pre-owned / Used Item';
    pageSubtitle = 'List your gadget, room appliance, textbook or hostel item for quick campus buyers';
    switchOffer = {
      text: 'Looking to buy a used item instead of selling?',
      actionText: 'Request a Used Item →',
      targetPage: 'Post Pre-owned Request',
    };
  } else if (isPreownedRequest) {
    pageHeading = 'Request a Pre-owned / Used Item';
    pageSubtitle = 'Tell sellers, students and residents what second-hand or used item you are looking to buy';
    switchOffer = {
      text: 'Have a used item to sell instead?',
      actionText: 'Sell Pre-owned Item →',
      targetPage: 'Sell Pre-owned Item',
    };
  } else if (isProduct) {
    pageHeading = 'Request a Product to Buy';
    pageSubtitle = 'Tell local businesses and campus shops what product you are looking to purchase';
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

  return (
    <section className="form-panel" style={{ maxWidth: 720, margin: '24px auto' }}>
      {/* Header with Title & Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--brand-purple)' }}>
            {pageHeading}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            {pageSubtitle}
          </p>
        </div>
        <button className="btn-outline btn-sm" onClick={() => onNavigate('Home')}>
          Cancel
        </button>
      </div>

      {!isAuthenticated && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 13,
          color: '#78350f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <span>You need an account to publish. Signing in first lets you add photos.</span>
          <button type="button" className="btn-outline btn-sm" onClick={saveDraftAndSignIn}>
            Sign in first
          </button>
        </div>
      )}

      {/* Subtle contextual switch link */}
      {switchOffer && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '8px 14px',
          marginBottom: 20,
          fontSize: 12.5,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <span>💡 {switchOffer.text}</span>
          <button
            type="button"
            onClick={() => onNavigate(switchOffer!.targetPage)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand-purple)',
              fontWeight: 700,
              padding: 0,
              cursor: 'pointer',
              fontSize: 12.5,
              textDecoration: 'underline',
            }}
          >
            {switchOffer.actionText}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            {isPreownedSale
              ? 'Item Name / Title *'
              : isPreownedRequest
              ? 'What used item are you looking for? (Title) *'
              : isProduct
              ? 'What product are you looking to buy? (Title) *'
              : 'What service or artisan do you need? (Title) *'}
          </label>
          <input
            required
            maxLength={100}
            placeholder={
              isPreownedSale
                ? 'e.g. Fairly Used HP Laptop Core i5 8GB RAM, Standing Fan, Cooking Gas Cylinder'
                : isPreownedRequest
                ? 'e.g. Second-hand HP Laptop Core i5, Small Refrigerator, or Standing Fan'
                : isProduct
                ? 'e.g. Brand new rechargeable fan, electric kettle, iPhone charger, or textbook'
                : 'e.g. Generator repair, hostel painting, tailoring, hair styling, or plumbing'
            }
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>Max 100 characters</small>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <CategorySelect
            categories={categories}
            listingType={isProduct || isPreownedSale || isPreownedRequest ? 'PRODUCT' : 'SERVICE'}
            value={categoryId}
            customCategory={customCategory}
            onChange={(id) => setCategoryId(id)}
            onCustomCategoryChange={setCustomCategory}
            required
            label="Category *"
            placeholder="Choose appropriate category"
          />

          {(isPreownedSale || isPreownedRequest) && (
            <div className="form-group">
              <label>{isPreownedSale ? 'Item Condition *' : 'Acceptable Condition *'}</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}>
                <option value="Used - Good Condition">Used - Good Condition</option>
                <option value="Used - Like New">Used - Like New</option>
                <option value="Fairly Used">Fairly Used</option>
                <option value="Any Working Condition">Any Working Condition</option>
                {isPreownedSale && <option value="Brand New / Sealed">Brand New / Sealed</option>}
                {isPreownedSale && <option value="For Parts or Repair">For Parts or Repair</option>}
              </select>
            </div>
          )}

          {isPreownedSale && (
            <div className="form-group">
              <label>Availability Status *</label>
              <select value={availabilityStatus} onChange={e => setAvailabilityStatus(e.target.value as AvailabilityStatus)}>
                <option value="AVAILABLE">🟢 Available (Ready to sell)</option>
                <option value="RESERVED">🟡 Reserved (Held for a buyer)</option>
                <option value="SOLD">⚪ Sold (Already purchased)</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div className="form-group">
            <label>General Area (Campus / Town) *</label>
            <select
              required
              value={locationId}
              onChange={e => {
                setLocationId(e.target.value);
                const found = locations.find(l => l.id === e.target.value);
                if (found) setGeneralArea(found.area);
              }}
            >
              <option value="">Select general area</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.area} ({loc.landmark || 'Ogbomoso'})
                </option>
              ))}
            </select>
            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Publicly visible area (e.g. Under G, Adenike, Aroje)
            </small>
          </div>

          <div className="form-group">
            <label>
              {isPreownedSale ? 'Asking Price in ₦ *' : 'Indicative Budget in ₦ (Optional)'}
            </label>
            <input
              type="number"
              min="0"
              required={isPreownedSale}
              placeholder={isPreownedSale ? 'e.g. 45000' : 'e.g. 5000'}
              value={priceOrBudget}
              onChange={e => setPriceOrBudget(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <span>Specific Hostel, Lodge or Street Address (Optional)</span>
            <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: 4, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              🔒 Private · Never displayed publicly
            </span>
          </label>
          <input
            placeholder="e.g. Flat 3, Peace Lodge, Behind Bovas, or specific street name"
            value={privateAddress}
            onChange={e => setPrivateAddress(e.target.value)}
          />
          <small style={{ color: 'var(--text-muted)', fontSize: 11.5, display: 'block', marginTop: 4 }}>
            🛡️ Kept strictly confidential. The public only sees your general area ({generalArea || 'e.g. Adenike or LAUTECH Campus'}).
          </small>
        </div>

        {isPreownedSale && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
            📞 <strong>Buyers will see your phone number</strong> so they can call or WhatsApp you
            {user?.phone ? <> (<strong>{user.phone}</strong>)</> : null}.
            {isAuthenticated && !user?.phone && ' Your account has no phone number yet, so buyers may not be able to reach you.'}
          </div>
        )}

        {/* Customer Privacy Consent Guarantee */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start'
        }}>
          <input
            type="checkbox"
            id="privacyConsent"
            checked={shareAddressAgreed}
            onChange={e => setShareAddressAgreed(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--brand-purple)', cursor: 'pointer' }}
          />
          <label htmlFor="privacyConsent" style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5, cursor: 'pointer', margin: 0 }}>
            <strong>Privacy Protection Guarantee:</strong> Only display my general location (e.g. <em>{generalArea || 'Adenike / LAUTECH Campus'}</em>) on public requests. My private contact details and precise address will remain protected and only be shared where I have explicitly agreed to connect with an approved provider.
          </label>
        </div>

        {/* Multi-Image Upload */}
        <MultiImageUpload
          label={
            isPreownedSale
              ? 'Item Photos (Up to 5 pictures of your item) 📷 *'
              : 'Optional Photos (Sample design, broken item or reference picture)'
          }
          hint={
            isPreownedSale
              ? 'Clear photos from different angles help buyers decide faster.'
              : 'Add photos so providers can see exactly what you need.'
          }
          maxImages={5}
          value={images}
          onChange={setImages}
        />

        <div className="form-group" style={{ marginTop: 14 }}>
          <label>
            {isPreownedSale ? 'Item Description & Details *' : 'Detailed Requirements *'}
          </label>
          <textarea
            required
            maxLength={2000}
            placeholder={
              isPreownedSale
                ? 'Describe features, specifications, how long used, any defects, reason for selling, and delivery/pickup preferences...'
                : isPreownedRequest
                ? 'Describe the brand, model, acceptable condition, budget range, and when you need it...'
                : isProduct
                ? 'Specify the quantity, brand/specs, preferred condition, and delivery needs...'
                : 'Give clear details about your request, desired turnaround time, model or room specifications...'
            }
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ minHeight: 120 }}
          />
        </div>

        <button
          type="submit"
          className="btn-lime"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 15,
            fontWeight: 700,
            marginTop: 8
          }}
          disabled={submitting}
        >
          {submitting
            ? 'Publishing...'
            : isPreownedSale
            ? 'Publish Pre-owned Listing →'
            : isPreownedRequest
            ? 'Submit Used Item Request →'
            : isProduct
            ? 'Submit Product Request →'
            : 'Post What I Need →'}
        </button>
      </form>
    </section>
  );
};
