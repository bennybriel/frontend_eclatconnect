import React, { useState } from 'react';
import { Category, Location, Provider } from '../types';
import { ImageUpload } from '../components/ImageUpload';
import { CategorySelect } from '../components/CategorySelect';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface NewListingPageProps {
  categories: Category[];
  locations: Location[];
  myProviders: Provider[];
  onSuccess: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  onNavigate: (page: string) => void;
}

export const NewListingPage: React.FC<NewListingPageProps> = ({
  categories,
  locations,
  myProviders,
  onSuccess,
  onToast,
  onNavigate,
}) => {
  const { isCustomer, isVendor, isAdmin } = useAuth();
  const approvedProviders = myProviders.filter(p => p.status === 'APPROVED');
  const [providerId, setProviderId] = useState(approvedProviders[0]?.id || myProviders[0]?.id || '');
  const [kind, setKind] = useState<'PRODUCT' | 'SERVICE'>('SERVICE');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locationText, setLocationText] = useState('Under G, Ogbomoso');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) {
      onToast('You must select or create a provider profile first', 'error');
      return;
    }

    if (!name.trim()) {
      onToast('Listing name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await request('/listings', 'POST', {
        provider_id: providerId,
        kind,
        name: name.trim(),
        price: price ? Number(price) : undefined,
        category_id: categoryId || undefined,
        custom_category: customCategory.trim() || undefined,
        location_id: locationId || undefined,
        location: locationText.trim() || 'Ogbomoso',
        image_url: imageUrl || undefined,
        description: description.trim(),
      });
      onToast('Listing published successfully!', 'success');
      onSuccess();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isCustomer && myProviders.length === 0 && !isAdmin && !isVendor) {
    return (
      <section className="form-panel" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 600, margin: '40px auto' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: 'var(--primary)', marginBottom: 12 }}>Customer Accounts Cannot Publish Listings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 24 }}>
          Publishing products and services is reserved for approved Vendors and Campus Artisans.
        </p>
        <button className="btn-lime" onClick={() => onNavigate('Home')}>
          ← Back to Campus Marketplace
        </button>
      </section>
    );
  }

  return (
    <section className="form-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Publish New Listing</h1>
        <button className="btn-outline btn-sm" onClick={() => onNavigate('Vendor Workspace')}>
          Cancel
        </button>
      </div>

      {myProviders.length === 0 ? (
        <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, color: '#92400e', marginBottom: 20 }}>
          ⚠️ You must register your business profile before publishing listings.
          <button
            className="btn-lime btn-sm"
            style={{ marginLeft: 12 }}
            onClick={() => onNavigate('Provider Application')}
          >
            Create Profile Now
          </button>
        </div>
      ) : approvedProviders.length === 0 ? (
        <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', padding: '18px 20px', borderRadius: 10, color: '#92400e', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⏳</span> Waiting for Final Approval
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#78350f', lineHeight: 1.55 }}>
            The ECLAT CONNECT team is reviewing your profile. You can add products and services as soon as it is approved.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Provider Profile *</label>
          <select required value={providerId} onChange={e => setProviderId(e.target.value)}>
            <option value="">Select profile</option>
            {myProviders.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Listing Type *</label>
          <select value={kind} onChange={e => setKind(e.target.value as any)}>
            <option value="SERVICE">Service (Repairs, Laundry, Haircut, Delivery, Tech Service)</option>
            <option value="PRODUCT">Product (Physical item, food, gadget, hostel item)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Title / Name *</label>
          <input
            required
            maxLength={160}
            placeholder="e.g. Laptop Screen & Battery Replacement or Fast Laundry Wash"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Price in ₦ (Optional - leave blank if variable)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 15000"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>

        <CategorySelect
          categories={categories}
          listingType={kind === 'PRODUCT' ? 'PRODUCT' : 'SERVICE'}
          value={categoryId}
          customCategory={customCategory}
          onChange={(id) => setCategoryId(id)}
          onCustomCategoryChange={setCustomCategory}
          required={false}
          label="Category"
          placeholder="Choose category"
        />

        <div className="form-group">
          <label>Campus Area *</label>
          <select
            value={locationId}
            onChange={e => {
              setLocationId(e.target.value);
              const found = locations.find(l => l.id === e.target.value);
              if (found) setLocationText(`${found.area}, Ogbomoso`);
            }}
          >
            <option value="">Select location area</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.area} ({loc.landmark || 'Ogbomoso'})
              </option>
            ))}
          </select>
        </div>

        <ImageUpload
          label="Listing Photo (Product photo or sample of completed work)"
          value={imageUrl}
          onChange={setImageUrl}
        />

        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Explain features, warranty, package deals, or pricing options..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ minHeight: 90 }}
          />
        </div>

        <button
          type="submit"
          className="btn-lime"
          style={{ width: '100%', padding: '14px', opacity: approvedProviders.length === 0 ? 0.6 : 1, cursor: approvedProviders.length === 0 ? 'not-allowed' : 'pointer' }}
          disabled={submitting || approvedProviders.length === 0}
        >
          {approvedProviders.length === 0 ? '🔒 Waiting for Final Approval' : submitting ? 'Publishing...' : 'Publish Listing →'}
        </button>
      </form>
    </section>
  );
};
