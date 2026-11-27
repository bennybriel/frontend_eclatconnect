import React, { useState, useEffect } from 'react';
import { Category, Location, Provider } from '../types';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from '../components/ImageUpload';
import { CategorySelect } from '../components/CategorySelect';
import { ArrowLeft, ArrowRight, BadgeCheck, MailCheck, Megaphone, Store, UserPlus, Users, Wallet } from 'lucide-react';
import '../styles/flows.css';

interface ProviderApplicationPageProps {
  categories: Category[];
  locations: Location[];
  existingProvider?: Provider | null;
  onSuccess: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  onNavigate: (page: string) => void;
}

export const ProviderApplicationPage: React.FC<ProviderApplicationPageProps> = ({
  categories,
  locations,
  existingProvider,
  onSuccess,
  onToast,
  onNavigate,
}) => {
  const { user, isCustomer, isVendor, isArtisan, isAdmin } = useAuth();
  const [type, setType] = useState<'BUSINESS' | 'PROFESSIONAL'>(
    user?.role === 'ARTISAN' ? 'PROFESSIONAL' : 'BUSINESS'
  );
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locationText, setLocationText] = useState('Under G, Ogbomoso');
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingProvider) {
      setType(existingProvider.type || (user?.role === 'ARTISAN' ? 'PROFESSIONAL' : 'BUSINESS'));
      setName(existingProvider.name || '');
      setCategoryId(existingProvider.category_id || '');
      setCustomCategory(existingProvider.custom_category || '');
      setLocationId(existingProvider.location_id || '');
      setLocationText(existingProvider.location || '');
      setLandmark(existingProvider.landmark || '');
      setPhone(existingProvider.phone || '');
      setWhatsapp(existingProvider.whatsapp || '');
      setImageUrl(existingProvider.image_url || '');
      setDescription(existingProvider.description || '');
    } else if (user?.role === 'ARTISAN') {
      setType('PROFESSIONAL');
    }
  }, [existingProvider, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !description.trim()) {
      onToast('Business name, phone and description are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type,
        name: name.trim(),
        category_id: categoryId || undefined,
        custom_category: customCategory.trim() || undefined,
        location_id: locationId || undefined,
        location: locationText.trim() || 'Ogbomoso',
        landmark: landmark.trim() || undefined,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        image_url: imageUrl || undefined,
        description: description.trim(),
      };

      if (existingProvider?.id) {
        await request(`/providers/${existingProvider.id}`, 'PUT', payload);
        onToast('Business profile updated successfully!', 'success');
      } else {
        await request('/providers', 'POST', payload);
        onToast('Provider application submitted! Status: PENDING review.', 'success');
      }
      onSuccess();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    const steps = [
      { icon: <UserPlus size={20} />, title: 'Create your account', text: 'Choose Vendor for a shop or store, or Artisan for a skill or trade. It is free.' },
      { icon: <MailCheck size={20} />, title: 'Activate by email', text: 'Open the link we send to your email to switch your account on.' },
      { icon: <Store size={20} />, title: 'Set up your profile', text: 'Add your name, area, photos, phone and what you offer.' },
      { icon: <BadgeCheck size={20} />, title: 'Get found', text: 'Once approved, students and residents can find you and reach out.' },
    ];
    return (
      <section className="fl" aria-labelledby="fl-provider-title">
        <header className="fl-head">
          <button type="button" className="fl-back" onClick={() => onNavigate('Home')}>
            <ArrowLeft size={16} /> Back to marketplace
          </button>
          <div className="fl-land-head">
            <div>
              <span className="fl-brand-kicker">For businesses and artisans</span>
              <h1 className="fl-head-title" id="fl-provider-title">
                Grow your business with <span style={{ color: 'var(--brand-electric)' }}>ECLAT CONNECT</span>
              </h1>
              <p className="fl-head-note">
                Put your shop, store or trade in front of students and residents around LAUTECH and Ogbomoso. Get a
                business profile, show what you sell and get requests from people nearby.
              </p>
              <div className="fl-land-actions">
                <button type="button" className="fl-btn fl-btn-lime" onClick={() => onNavigate('Auth')}>
                  Create a free account <ArrowRight size={18} />
                </button>
                <button type="button" className="fl-btn fl-btn-ghost" onClick={() => onNavigate('Auth')}>
                  I already have an account
                </button>
              </div>
            </div>
            <div className="fl-stats">
              <div className="fl-stat">
                <Users size={22} aria-hidden="true" />
                <strong>Customers near you</strong>
                <span>Students and residents searching every day.</span>
              </div>
              <div className="fl-stat">
                <Megaphone size={22} aria-hidden="true" />
                <strong>Requests come to you</strong>
                <span>See what people need and send a quote.</span>
              </div>
              <div className="fl-stat">
                <BadgeCheck size={22} aria-hidden="true" />
                <strong>A verified badge</strong>
                <span>Approved profiles earn more trust.</span>
              </div>
              <div className="fl-stat">
                <Wallet size={22} aria-hidden="true" />
                <strong>Free to join</strong>
                <span>List your business at no cost.</span>
              </div>
            </div>
          </div>
        </header>

        <div className="fl-section">
          <h2 className="fl-section-title">How to get listed</h2>
          <p className="fl-section-sub">Four quick steps. Most people finish in a few minutes.</p>
          <ol className="fl-timeline">
            {steps.map((s, i) => (
              <li key={s.title} style={{ '--fl-i': i } as React.CSSProperties}>
                <span className="fl-timeline-step" aria-hidden="true">{i + 1}</span>
                <span className="fl-timeline-num" aria-hidden="true">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="fl-cta">
            <p>
              <strong>Ready to be found?</strong>
              Create your Vendor or Artisan account and set up your profile today.
            </p>
            <button type="button" className="fl-btn fl-btn-royal" onClick={() => onNavigate('Auth')}>
              Get started <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (isCustomer && !existingProvider && !isAdmin && !isVendor) {
    return (
      <section className="form-panel" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 600, margin: '40px auto' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: 'var(--primary)', marginBottom: 12 }}>Customer Accounts Cannot Register Provider Profiles</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 24 }}>
          Your account is currently registered as a <strong>Customer</strong>. Customers use Eclat Connect to post service requests, browse campus vendors, and hire artisans.
          <br /><br />
          If you are a vendor, store owner, or skilled artisan wishing to showcase products and services, please sign in or register with a <strong>Vendor / Artisan</strong> account.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={() => onNavigate('Home')}>
            ← Back to Campus Marketplace
          </button>
          <button className="btn-lime" onClick={() => onNavigate('Post What I Need')}>
            Post a Request Instead
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="form-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>
          {existingProvider ? 'Edit Provider Profile' : 'Register Provider Profile'}
        </h1>
        <button className="btn-outline btn-sm" onClick={() => onNavigate('Account')}>
          Cancel
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 20 }}>
        Showcase your business or trade around LAUTECH campus. All vendors can manage listings; directory visibility is enabled upon verification.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Provider Structure *</label>
          <select value={type} onChange={e => setType(e.target.value as any)}>
            <option value="BUSINESS">Business (Shop, Tech Enterprise, Restaurant, Agency)</option>
            <option value="PROFESSIONAL">Professional / Solo Artisan (Electrician, Plumber, Tailor, Freelancer)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Business or Trading Name *</label>
          <input
            required
            maxLength={160}
            placeholder="e.g. Apex Tech & Electricals"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <CategorySelect
          categories={categories}
          listingType={type === 'BUSINESS' ? 'BUSINESS' : 'ARTISAN'}
          value={categoryId}
          customCategory={customCategory}
          onChange={(catId) => setCategoryId(catId)}
          onCustomCategoryChange={setCustomCategory}
          required
          label="Primary Category *"
          placeholder="Select your main trade / category"
        />

        <div className="form-group">
          <label>Campus Area *</label>
          <select
            value={locationId}
            onChange={e => {
              setLocationId(e.target.value);
              const found = locations.find(l => l.id === e.target.value);
              if (found) {
                setLocationText(`${found.area}, Ogbomoso`);
                if (found.landmark) setLandmark(found.landmark);
              }
            }}
          >
            <option value="">Select primary location zone</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.area} ({loc.landmark || 'Ogbomoso'})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Physical Address / Shop Location</label>
          <input
            placeholder="e.g. Opposite Zenith Bank, Under G gate"
            value={locationText}
            onChange={e => setLocationText(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Landmark</label>
          <input
            placeholder="e.g. Near Bovas Filling Station"
            value={landmark}
            onChange={e => setLandmark(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Contact Phone Number *</label>
          <input
            required
            placeholder="e.g. 08022334455"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>WhatsApp Business Number (For customer click-to-chat)</label>
          <input
            placeholder="e.g. 08022334455"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Business Description / Bio *</label>
          <textarea
            required
            placeholder="Describe your services, products, experience, opening hours, and why customers should choose you..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ minHeight: 110 }}
          />
        </div>

        {/* Storefront / Workshop Photo */}
        <div style={{ marginBottom: 20 }}>
          <ImageUpload
            label="Shop Front / Workshop Photo (Storefront Picture) 🏪"
            value={imageUrl}
            onChange={setImageUrl}
          />
          <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
            Upload a picture of your physical shop front, signage, or workshop to help campus buyers find and trust you.
          </small>
        </div>

        <button type="submit" className="btn-lime" style={{ width: '100%', padding: '14px' }} disabled={submitting}>
          {submitting ? 'Saving Profile...' : existingProvider ? 'Update Profile' : 'Submit Application →'}
        </button>
      </form>
    </section>
  );
};
