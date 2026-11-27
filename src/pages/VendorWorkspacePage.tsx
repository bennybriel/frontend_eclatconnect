import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bell,
  Box,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Globe,
  Hourglass,
  Images,
  LayoutDashboard,
  LifeBuoy,
  Lightbulb,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquareQuote,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { VendorOverview } from './vendor/VendorOverview';
import '../styles/vendor.css';
import { Provider, Listing, ServiceRequest, Category, Location, ListingKind, Review, AvailabilityStatus, NotificationItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/client';
import { ImageUpload } from '../components/ImageUpload';
import { MultiImageUpload } from '../components/MultiImageUpload';
import { EclatLogo } from '../components/EclatLogo';
import { CategorySelect } from '../components/CategorySelect';
import { AvailabilityBadge } from '../components/AvailabilityBadge';

interface VendorWorkspacePageProps {
  myProviders: Provider[];
  myListings: Listing[];
  openRequests: ServiceRequest[];
  categories: Category[];
  locations: Location[];
  unreadCount?: number;
  notifications?: NotificationItem[];
  onRefresh: () => void;
  onNavigate: (page: string) => void;
  onRespondToRequest: (req: ServiceRequest) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const VendorWorkspacePage: React.FC<VendorWorkspacePageProps> = ({
  myProviders,
  myListings,
  openRequests: allOpenRequests,
  categories,
  locations,
  unreadCount = 0,
  notifications = [],
  onRefresh,
  onNavigate,
  onRespondToRequest,
  onToast,
}) => {
  const { user, logout } = useAuth();

  // Portal Navigation Tabs: Dashboard is the primary portal home
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'services' | 'projects' | 'upload' | 'leads' | 'reviews' | 'settings'>('dashboard');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');

  // Phone menu, and the provider's own requests (what they need) for the overview
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [quotesReceived, setQuotesReceived] = useState(0);
  useEffect(() => {
    request<ServiceRequest[]>('/me/requests')
      .then(d => setMyRequests(Array.isArray(d) ? d : []))
      .catch(() => setMyRequests([]));
    request<any[]>('/me/responses')
      .then(d => setQuotesReceived(Array.isArray(d) ? d.length : 0))
      .catch(() => setQuotesReceived(0));
  }, []);
  const myOpenRequestCount = myRequests.filter(r => r.request_type !== 'PREOWNED_SALE' && (!r.status || r.status === 'OPEN')).length;

  // Reviews State
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewFilterRating, setReviewFilterRating] = useState<'ALL' | number>('ALL');

  // Primary Provider
  const primaryProvider = myProviders[0] || null;
  const isArtisan = primaryProvider?.type === 'PROFESSIONAL';
  const isApproved = primaryProvider?.status === 'APPROVED' && primaryProvider?.active !== false;

  // Plain-language explanation of where the provider's application stands
  const providerStatus = primaryProvider?.status;
  const statusNotice =
    providerStatus === 'MORE_INFO'
      ? {
          title: 'More information needed',
          badge: 'Action needed',
          text: 'The ECLAT CONNECT team needs a little more information before approving your profile. Check your notifications for details, then update your profile.',
        }
      : providerStatus === 'REJECTED'
      ? {
          title: 'Application not approved',
          badge: 'Not approved',
          text: 'Your profile was not approved. Check your notifications for the reason. You can update your profile or contact support@eclatconnect.com.',
        }
      : providerStatus === 'SUSPENDED' || primaryProvider?.active === false
      ? {
          title: 'Profile paused',
          badge: 'Paused',
          text: 'Your profile is currently not visible to customers. Please contact support@eclatconnect.com for help.',
        }
      : {
          title: 'Your profile is being reviewed',
          badge: 'Under review',
          text: 'The ECLAT CONNECT team is reviewing your profile. Once it is approved you can add products, services and past work, and customers will be able to find you.',
        };

  // New Item Upload Form State
  const [itemKind, setItemKind] = useState<ListingKind>('PRODUCT');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemCustomCategory, setItemCustomCategory] = useState('');
  const [itemLocationId, setItemLocationId] = useState('');
  const [itemLocationText, setItemLocationText] = useState('Under G, Ogbomoso');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemImages, setItemImages] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit Item Modal State
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editKind, setEditKind] = useState<ListingKind>('PRODUCT');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editPriceOnRequest, setEditPriceOnRequest] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editLocationId, setEditLocationId] = useState('');
  const [editLocationText, setEditLocationText] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImages, setEditImages] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'HIDDEN'>('ACTIVE');
  const [editAvailabilityStatus, setEditAvailabilityStatus] = useState<AvailabilityStatus>('AVAILABLE');
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile Settings Form State
  const [profileName, setProfileName] = useState(primaryProvider?.name || user?.name || '');
  const [profileDescription, setProfileDescription] = useState(primaryProvider?.description || '');
  const [profilePhone, setProfilePhone] = useState(primaryProvider?.phone || user?.phone || '');
  const [profileWhatsapp, setProfileWhatsapp] = useState(primaryProvider?.whatsapp || primaryProvider?.phone || user?.phone || '');
  const [profileLocation, setProfileLocation] = useState(primaryProvider?.location || 'Under G / Adenike, Ogbomoso');
  const [profileLandmark, setProfileLandmark] = useState(primaryProvider?.landmark || 'Near LAUTECH Second Gate');
  const [profileCategoryId, setProfileCategoryId] = useState(primaryProvider?.category_id || '');
  const [profileCustomCategory, setProfileCustomCategory] = useState(primaryProvider?.custom_category || '');
  const [profileLocationId, setProfileLocationId] = useState(primaryProvider?.location_id || '');
  const [profileImageUrl, setProfileImageUrl] = useState(primaryProvider?.image_url || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load reviews received by vendor
  const loadProviderReviews = async () => {
    if (!primaryProvider) return;
    setLoadingReviews(true);
    try {
      const data = await request<Review[]>('/me/provider-reviews');
      setProviderReviews(data);
    } catch {
      try {
        const data = await request<Review[]>(`/public/providers/${primaryProvider.id}/reviews`);
        setProviderReviews(data);
      } catch {
        setProviderReviews([]);
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadProviderReviews();
  }, [primaryProvider?.id]);

  // Metrics calculations
  const productListings = myListings.filter(l => l.kind === 'PRODUCT');
  const serviceListings = myListings.filter(l => l.kind === 'SERVICE');
  const projectListings = myListings.filter(l => l.kind === 'PROJECT');
  const productCount = productListings.length;
  const serviceCount = serviceListings.length;
  const projectCount = projectListings.length;
  const activeCount = myListings.filter(l => l.status === 'ACTIVE').length;
  const hiddenCount = myListings.filter(l => l.status === 'HIDDEN').length;

  const totalReviewsCount = providerReviews.length;
  const avgProviderRating = totalReviewsCount > 0
    ? (providerReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : (primaryProvider?.avg_rating && Number(primaryProvider.avg_rating) > 0 ? Number(primaryProvider.avg_rating).toFixed(1) : '5.0');

  // Filter listings
  const filteredListings = myListings.filter(item => {
    if (activeTab === 'products' && item.kind !== 'PRODUCT') return false;
    if (activeTab === 'services' && item.kind !== 'SERVICE') return false;
    if (activeTab === 'projects' && item.kind !== 'PROJECT') return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchCat = (item.category_name || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Open Edit Modal
  const handleOpenEdit = (item: Listing) => {
    if (!isApproved) {
      onToast('Your profile needs to be approved before you can update items, services, or projects.', 'error');
      return;
    }
    setEditingListing(item);
    setEditKind(item.kind);
    setEditName(item.name);
    setEditPrice(item.price ? String(item.price) : '');
    setEditPriceOnRequest(!item.price);
    setEditCategoryId(item.category_id || '');
    setEditCustomCategory(item.custom_category || '');
    setEditLocationId(item.location_id || '');
    setEditLocationText(item.location || 'Ogbomoso');
    setEditImageUrl(item.image_url || '');
    setEditImages(item.images || item.image_url || '');
    setEditDescription(item.description || '');
    setEditStatus(item.status);
    setEditAvailabilityStatus(item.availability_status || 'AVAILABLE');
  };

  const handleUpdateItemAvailability = async (listingId: string, newStatus: AvailabilityStatus) => {
    try {
      await request(`/listings/${listingId}/availability`, 'PATCH', { availability_status: newStatus });
      const label = newStatus === 'SOLD' ? 'Sold' : newStatus === 'RESERVED' ? 'Reserved' : 'Available';
      onToast(`Item status set to: ${label}!`, 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  // Submit Upload Item
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved) {
      onToast('Your profile needs to be approved before you can upload or add items, services, or projects.', 'error');
      return;
    }
    if (!primaryProvider) {
      onToast('You must have an approved profile before publishing items', 'error');
      return;
    }
    if (!itemName.trim()) {
      onToast('Title is required', 'error');
      return;
    }

    const imageList = itemImages.split(',').map(s => s.trim()).filter(Boolean);
    const primaryImg = imageList[0] || itemImageUrl || undefined;

    setIsUploading(true);
    try {
      await request('/listings', 'POST', {
        provider_id: primaryProvider.id,
        kind: itemKind,
        name: itemName.trim(),
        price: priceOnRequest || !itemPrice ? null : Number(itemPrice),
        category_id: itemCategoryId || undefined,
        custom_category: itemCustomCategory.trim() || undefined,
        location_id: itemLocationId || undefined,
        location: itemLocationText.trim() || 'Ogbomoso',
        image_url: primaryImg,
        images: itemImages || undefined,
        description: itemDescription.trim(),
      });

      const kindLabel = itemKind === 'PRODUCT' ? 'Product item' : itemKind === 'SERVICE' ? 'Service' : 'Project portfolio';
      onToast(`🎉 ${kindLabel} added successfully to your catalog!`, 'success');
      setItemName('');
      setItemPrice('');
      setPriceOnRequest(false);
      setItemImageUrl('');
      setItemImages('');
      setItemDescription('');
      setItemCustomCategory('');
      onRefresh();
      setActiveTab(itemKind === 'PRODUCT' ? 'products' : itemKind === 'SERVICE' ? 'services' : 'projects');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Edit Item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved) {
      onToast('Your profile needs to be approved before you can update items, services, or projects.', 'error');
      return;
    }
    if (!editingListing) return;
    if (!editName.trim()) {
      onToast('Title is required', 'error');
      return;
    }

    const editImageList = editImages.split(',').map(s => s.trim()).filter(Boolean);
    const primaryEditImg = editImageList[0] || editImageUrl || undefined;

    setIsUpdating(true);
    try {
      await request(`/listings/${editingListing.id}`, 'PUT', {
        kind: editKind,
        name: editName.trim(),
        price: editPriceOnRequest || !editPrice ? null : Number(editPrice),
        category_id: editCategoryId || undefined,
        custom_category: editCustomCategory.trim() || undefined,
        location_id: editLocationId || undefined,
        location: editLocationText.trim() || 'Ogbomoso',
        image_url: primaryEditImg,
        images: editImages || undefined,
        description: editDescription.trim(),
        status: editStatus,
      });

      if (editAvailabilityStatus !== editingListing.availability_status) {
        await request(`/listings/${editingListing.id}/availability`, 'PATCH', {
          availability_status: editAvailabilityStatus,
        });
      }

      onToast('✓ Updated successfully!', 'success');
      setEditingListing(null);
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle Item Visibility (Active <-> Hidden)
  const handleToggleStatus = async (item: Listing) => {
    if (!isApproved) {
      onToast('Your profile needs to be approved before you can update items.', 'error');
      return;
    }
    const newStatus = item.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    try {
      await request(`/listings/${item.id}`, 'PATCH', { status: newStatus });
      onToast(`Listing marked as ${newStatus}`, 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!isApproved) {
      onToast('Your profile needs to be approved before you can remove items.', 'error');
      return;
    }
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await request(`/listings/${itemToDelete.id}`, 'DELETE');
      onToast('✓ Item removed from your catalog', 'success');
      setItemToDelete(null);
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Store Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryProvider) return;
    if (!profileName.trim()) {
      onToast('Store name is required', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      await request(`/providers/${primaryProvider.id}`, 'PUT', {
        name: profileName.trim(),
        description: profileDescription.trim(),
        phone: profilePhone.trim(),
        whatsapp: profileWhatsapp.trim(),
        location: profileLocation.trim(),
        landmark: profileLandmark.trim(),
        category_id: profileCategoryId || undefined,
        custom_category: profileCustomCategory.trim() || undefined,
        location_id: profileLocationId || undefined,
        image_url: profileImageUrl || undefined,
      });

      onToast('✓ Store profile updated successfully!', 'success');
      onRefresh();
      setActiveTab('dashboard');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Leads: open requests from other people, excluding pre-owned items for sale.
  // Requests in the provider's own category are listed first and marked.
  const [onlyMatchingLeads, setOnlyMatchingLeads] = useState(false);
  const providerCategoryName = (primaryProvider?.category_name || primaryProvider?.category || primaryProvider?.custom_category || '')
    .trim()
    .toLowerCase();
  const isMatchingLead = (r: ServiceRequest): boolean =>
    Boolean(
      (primaryProvider?.category_id && r.category_id === primaryProvider.category_id) ||
        (providerCategoryName &&
          [r.category_name, r.category, r.custom_category].some(n => (n || '').trim().toLowerCase() === providerCategoryName))
    );
  const leadPool = allOpenRequests
    .filter(r => r.request_type !== 'PREOWNED_SALE' && (!r.status || r.status === 'OPEN') && r.customer_id !== user?.id)
    .sort((a, b) => Number(isMatchingLead(b)) - Number(isMatchingLead(a)));
  const matchingLeadCount = leadPool.filter(isMatchingLead).length;
  const openRequests = onlyMatchingLeads ? leadPool.filter(isMatchingLead) : leadPool;

  // A vendor or artisan who has not yet created a provider profile
  if (!primaryProvider) {
    return (
      <section className="form-panel" style={{ maxWidth: 640, margin: '32px auto', padding: '36px 28px' }}>
        <EclatLogo size={36} />
        <h1 style={{ margin: '18px 0 8px', fontSize: 24, color: 'var(--brand-purple)' }}>
          Set up your {user?.role === 'ARTISAN' ? 'artisan' : 'business'} profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 20px' }}>
          Before customers can find you, tell us about your {user?.role === 'ARTISAN' ? 'trade' : 'business'}: what you offer,
          where you are, and how customers can reach you. It takes about five minutes.
        </p>
        <ol style={{ margin: '0 0 24px', paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: 'var(--charcoal)' }}>
          <li>Fill in your profile and add a photo of your shop or work.</li>
          <li>The ECLAT CONNECT team reviews it.</li>
          <li>Once approved, add your products, services and past work.</li>
        </ol>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn-lime" onClick={() => onNavigate(user ? 'Provider Application' : 'Auth')}>
            {user ? 'Create my profile →' : 'Sign in to continue →'}
          </button>
          <button type="button" className="btn-outline" onClick={() => onNavigate('Home')}>
            Back to marketplace
          </button>
        </div>
      </section>
    );
  }

  const onAdd = (kind: 'PRODUCT' | 'SERVICE' | 'PROJECT') => {
    if (!isApproved) {
      onToast('Your profile needs to be approved before you can add products, services or past work.', 'error');
      return;
    }
    setItemKind(kind);
    setActiveTab('upload');
    setDrawerOpen(false);
  };
  const goTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  };
  const goPage = (page: string) => {
    setDrawerOpen(false);
    onNavigate(page);
  };
  // The public page for this provider: /businesses?open=<id> or /artisans?open=<id>
  const openPublicProfile = () => {
    const url = `/${isArtisan ? 'artisans' : 'businesses'}?open=${encodeURIComponent(primaryProvider.id)}`;
    window.history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  const tabTitle: Record<string, string> = {
    products: 'My products',
    services: 'My services',
    projects: isArtisan ? 'Portfolio and past work' : 'Showcase of my work',
    upload: itemKind === 'PRODUCT' ? 'Add a product' : itemKind === 'SERVICE' ? 'Add a service' : 'Add past work',
    leads: 'Customer requests',
    reviews: 'Reviews and ratings',
    settings: isArtisan ? 'My professional profile' : 'My business profile',
  };
  const initial = (primaryProvider.name || 'E').charAt(0).toUpperCase();
  const NavBtn: React.FC<{ tab?: typeof activeTab; page?: string; icon: React.ReactNode; label: string; count?: number }> = ({ tab, page, icon, label, count }) => (
    <button
      type="button"
      className={`vd-nav${tab && activeTab === tab ? ' is-on' : ''}`}
      aria-current={tab && activeTab === tab ? 'page' : undefined}
      onClick={() => (tab ? goTab(tab) : page ? goPage(page) : undefined)}
    >
      {icon}
      <span>{label}</span>
      {count ? <span className="vd-nav-count">{count > 99 ? '99+' : count}</span> : null}
    </button>
  );

  return (
    <div className="vd">
      {/* ======================================================== */}
      {/* SIDEBAR (a slide-out menu on phones)                     */}
      {/* ======================================================== */}
      <aside className={`vd-side${drawerOpen ? ' is-open' : ''}`} aria-label="Dashboard menu">
        <div className="vd-side-logo" onClick={() => goPage('Home')} role="link" tabIndex={0} onKeyDown={e => e.key === 'Enter' && goPage('Home')}>
          <EclatLogo light={true} size={34} />
        </div>

        <div className="vd-side-card">
          <span className="vd-side-avatar">
            {primaryProvider.image_url ? <img src={primaryProvider.image_url} alt="" /> : initial}
          </span>
          <div style={{ minWidth: 0 }}>
            <span className="vd-side-name">{primaryProvider.name}</span>
            <span className={`vd-side-badge${isApproved ? '' : ' is-wait'}`}>
              {isApproved ? <Check size={11} strokeWidth={3.5} aria-hidden="true" /> : <Hourglass size={11} aria-hidden="true" />}
              {isApproved ? `Approved ${isArtisan ? 'Professional' : 'Vendor'}` : statusNotice.badge}
            </span>
          </div>
        </div>

        <nav aria-label="Overview">
          <NavBtn tab="dashboard" icon={<LayoutDashboard size={19} />} label="Overview" />
        </nav>

        <p className="vd-side-label">What I offer</p>
        <nav aria-label="What I offer">
          <NavBtn tab="settings" icon={<Store size={19} />} label={isArtisan ? 'My professional profile' : 'My business profile'} />
          {(!isArtisan || productCount > 0) && <NavBtn tab="products" icon={<Box size={19} />} label="My products" count={productCount} />}
          <NavBtn tab="services" icon={<Wrench size={19} />} label="My services" count={serviceCount} />
          <NavBtn tab="projects" icon={<Images size={19} />} label={isArtisan ? 'Portfolio / past work' : 'Work showcase'} count={projectCount} />
          <NavBtn page="Sell Pre-owned Item" icon={<Tag size={19} />} label="Sell a used item" />
        </nav>

        <p className="vd-side-label">What I need</p>
        <nav aria-label="What I need">
          <NavBtn page="Products" icon={<Search size={19} />} label="Find products & services" />
          <NavBtn page="Pre-owned" icon={<ShoppingCart size={19} />} label="Buy used items" />
          <NavBtn page="My Requests" icon={<Send size={19} />} label="My requests" count={myOpenRequestCount} />
          <NavBtn page="Responses" icon={<MessageSquareQuote size={19} />} label="Quotes I received" count={quotesReceived} />
        </nav>

        <p className="vd-side-label">Customers</p>
        <nav aria-label="Customers">
          <NavBtn tab="leads" icon={<Megaphone size={19} />} label="Customer requests" count={matchingLeadCount} />
          <NavBtn tab="reviews" icon={<Star size={19} />} label="Reviews & ratings" count={totalReviewsCount} />
          <NavBtn page="Notifications" icon={<Bell size={19} />} label="Notifications" count={unreadCount} />
        </nav>

        <div className="vd-side-foot">
          <nav aria-label="More">
            <NavBtn page="Home" icon={<Globe size={19} />} label="Back to marketplace" />
            <a className="vd-nav-a" href="mailto:support@eclatconnect.com">
              <LifeBuoy size={19} aria-hidden="true" /> <span>Help & support</span>
            </a>
            <NavBtn page="Account" icon={<Settings size={19} />} label="Account settings" />
            <button
              type="button"
              className="vd-nav"
              onClick={() => {
                logout();
                onToast('You are signed out', 'info');
                onNavigate('Home');
              }}
            >
              <LogOut size={19} />
              <span>Log out</span>
            </button>
          </nav>
        </div>
      </aside>
      {drawerOpen && <div className="vd-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}

      <div className="vd-body">
        {/* ======================================================== */}
        {/* TOP BAR                                                  */}
        {/* ======================================================== */}
        <header className="vd-top">
          <button type="button" className="vd-top-menu" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="vd-top-logo">
            <EclatLogo light={true} size={30} />
          </span>
          <label className="vd-search">
            <Search size={18} aria-hidden="true" />
            <span className="vd-sr">Search your listings</span>
            <input
              type="search"
              placeholder="Search your products, services and work…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !['products', 'services', 'projects'].includes(activeTab)) {
                  setActiveTab(isArtisan ? 'services' : 'products');
                }
              }}
            />
          </label>
          <div className="vd-top-right">
            <button type="button" className="vd-icon-btn" onClick={() => onNavigate('Notifications')} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="vd-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <span className="vd-user">
              <span className="vd-side-avatar">{(user?.name || initial).charAt(0).toUpperCase()}</span>
              <strong>{user?.name || primaryProvider.name}</strong>
            </span>
          </div>
        </header>

        <main className="vd-main">
          {activeTab !== 'dashboard' && (
            <div className="vd-page-head">
              <button type="button" className="vd-link" onClick={() => goTab('dashboard')}>
                <ChevronLeft size={16} aria-hidden="true" /> Overview
              </button>
              <h1 className="vd-page-title">{tabTitle[activeTab]}</h1>
            </div>
          )}

          {activeTab !== 'dashboard' && !isApproved && (
            <section className="vd-notice" role="status" style={{ marginBottom: 18 }}>
              <span className="vd-notice-icon" aria-hidden="true"><Hourglass size={22} /></span>
              <div>
                <strong>{statusNotice.title}</strong>
                <p>{statusNotice.text}</p>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* OVERVIEW                                                 */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <VendorOverview
              provider={primaryProvider}
              userName={user?.name || ''}
              isArtisan={isArtisan}
              isApproved={isApproved}
              statusNotice={statusNotice}
              needsUpdate={providerStatus === 'MORE_INFO' || providerStatus === 'REJECTED'}
              listings={myListings}
              reviews={providerReviews}
              avgRating={avgProviderRating}
              leads={leadPool}
              isMatchingLead={isMatchingLead}
              myRequests={myRequests}
              quotesReceived={quotesReceived}
              notifications={notifications}
              unreadCount={unreadCount}
              onTab={goTab}
              onAdd={onAdd}
              onNavigate={onNavigate}
              onOpenPublicProfile={openPublicProfile}
              onRespondToRequest={onRespondToRequest}
            />
          )}

        {/* ======================================================== */}
        {/* PRODUCTS, SERVICES AND PAST WORK                         */}
        {/* ======================================================== */}
        {['products', 'services', 'projects'].includes(activeTab) && (() => {
          const kindOfTab: ListingKind = activeTab === 'services' ? 'SERVICE' : activeTab === 'projects' ? 'PROJECT' : 'PRODUCT';
          const word = activeTab === 'services' ? 'service' : activeTab === 'projects' ? 'past work' : 'product';
          const subTabs = [
            ...(!isArtisan || productCount > 0 ? [{ tab: 'products' as const, label: 'Products', count: productCount, icon: <Box size={16} /> }] : []),
            { tab: 'services' as const, label: 'Services', count: serviceCount, icon: <Wrench size={16} /> },
            { tab: 'projects' as const, label: isArtisan ? 'Past work' : 'Showcase', count: projectCount, icon: <Images size={16} /> },
          ];
          return (
            <div className="vd-view">
              <div className="vd-subtabs" role="tablist" aria-label="What you list">
                {subTabs.map(t => (
                  <button
                    key={t.tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === t.tab}
                    className={activeTab === t.tab ? 'is-on' : ''}
                    onClick={() => setActiveTab(t.tab)}
                  >
                    {t.icon} {t.label} <span>{t.count}</span>
                  </button>
                ))}
              </div>

              <div className="vd-toolbar">
                <label className="vd-field-inline">
                  <Search size={18} aria-hidden="true" />
                  <span className="vd-sr">Search</span>
                  <input
                    type="search"
                    placeholder={`Search your ${activeTab === 'projects' ? 'past work' : activeTab}…`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </label>
                <div className="vd-seg" role="group" aria-label="Show">
                  {(['ALL', 'ACTIVE', 'HIDDEN'] as const).map(st => (
                    <button key={st} type="button" className={filterStatus === st ? 'is-on' : ''} aria-pressed={filterStatus === st} onClick={() => setFilterStatus(st)}>
                      {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Live' : 'Hidden'}
                    </button>
                  ))}
                </div>
                <button type="button" className="vd-btn vd-btn-lime" onClick={() => onAdd(kindOfTab)}>
                  {isApproved ? <Plus size={17} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />} Add {word}
                </button>
              </div>

              {filteredListings.length > 0 ? (
                <ul className="vd-listings">
                  {filteredListings.map(item => {
                    const thumb = item.image_url || (item.images ? String(item.images).split(',')[0].trim() : '');
                    return (
                      <li key={item.id} className={`vd-listing${item.status === 'HIDDEN' ? ' is-hidden' : ''}`}>
                        <div className="vd-listing-media">
                          {thumb ? (
                            <img src={thumb} alt="" loading="lazy" />
                          ) : (
                            <span aria-hidden="true">
                              {item.kind === 'SERVICE' ? <Wrench size={34} /> : item.kind === 'PROJECT' ? <Images size={34} /> : <Box size={34} />}
                            </span>
                          )}
                          <span className={`vd-live${item.status === 'ACTIVE' ? '' : ' is-off'}`}>
                            {item.status === 'ACTIVE' ? 'Live' : 'Hidden'}
                          </span>
                        </div>
                        <div className="vd-listing-body">
                          <p className="vd-listing-meta">
                            {[item.category_name || item.custom_category, item.location_area].filter(Boolean).join(' · ') || (item.kind === 'SERVICE' ? 'Service' : item.kind === 'PROJECT' ? 'Past work' : 'Product')}
                          </p>
                          <h3 className="vd-listing-title">{item.name}</h3>
                          {item.description && <p className="vd-listing-desc">{item.description}</p>}
                          <div className="vd-listing-row">
                            <strong className="vd-listing-price">
                              {item.kind === 'PROJECT' ? 'Portfolio' : item.price ? `₦${Number(item.price).toLocaleString('en-NG')}` : 'Price on request'}
                            </strong>
                            {item.kind !== 'PROJECT' && (
                              <AvailabilityBadge
                                status={item.availability_status || 'AVAILABLE'}
                                size="sm"
                                interactive
                                onStatusChange={newStatus => handleUpdateItemAvailability(item.id, newStatus)}
                              />
                            )}
                          </div>
                        </div>
                        <div className="vd-listing-actions">
                          <button type="button" onClick={() => handleToggleStatus(item)} title={isApproved ? undefined : 'Available once your profile is approved'}>
                            {item.status === 'ACTIVE' ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                            {item.status === 'ACTIVE' ? 'Hide' : 'Show'}
                          </button>
                          <button type="button" onClick={() => handleOpenEdit(item)}>
                            <Pencil size={16} aria-hidden="true" /> Edit
                          </button>
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => {
                              if (!isApproved) {
                                onToast('Your profile needs to be approved before you can delete items.', 'error');
                                return;
                              }
                              setItemToDelete(item);
                            }}
                          >
                            <Trash2 size={16} aria-hidden="true" /> Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="vd-empty-card">
                  <span className="vd-empty-icon" aria-hidden="true">
                    {activeTab === 'services' ? <Wrench size={30} /> : activeTab === 'projects' ? <Images size={30} /> : <Box size={30} />}
                  </span>
                  <h2>{searchQuery || filterStatus !== 'ALL' ? `No ${word} matches` : `No ${activeTab === 'projects' ? 'past work' : activeTab} yet`}</h2>
                  <p>
                    {searchQuery || filterStatus !== 'ALL'
                      ? 'Try another word, or show all.'
                      : activeTab === 'projects'
                      ? 'Photos of jobs you have done help customers trust you and choose you.'
                      : `Add your first ${word} so customers around LAUTECH and Ogbomoso can find it.`}
                  </p>
                  {searchQuery || filterStatus !== 'ALL' ? (
                    <button type="button" className="vd-btn vd-btn-outline" onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }}>
                      Show all
                    </button>
                  ) : (
                    <button type="button" className="vd-btn vd-btn-lime" onClick={() => onAdd(kindOfTab)}>
                      {isApproved ? <Plus size={17} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />} Add your first {word}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* ADD A PRODUCT, SERVICE OR PAST WORK                      */}
        {/* ======================================================== */}
        {activeTab === 'upload' && (
          !isApproved ? (
            <div className="vd-empty-card">
              <span className="vd-empty-icon is-wait" aria-hidden="true"><Hourglass size={30} /></span>
              <h2>{statusNotice.title}</h2>
              <p>{statusNotice.text}</p>
              <button type="button" className="vd-btn vd-btn-outline" onClick={() => goTab('dashboard')}>Back to overview</button>
            </div>
          ) : (
            <div className="vd-form-wrap">
              <form className="vd-card vd-form" onSubmit={handleUploadSubmit}>
                <div className="vd-field">
                  <span className="vd-label">What are you adding?</span>
                  <div className="vd-kinds" role="radiogroup" aria-label="What are you adding">
                    {([
                      { k: 'PRODUCT', icon: <Box size={22} />, t: 'A product', d: 'Phones, books, food, clothes, gadgets' },
                      { k: 'SERVICE', icon: <Wrench size={22} />, t: 'A service', d: 'Repairs, laundry, tailoring, hair, wiring' },
                      { k: 'PROJECT', icon: <Images size={22} />, t: 'Past work', d: 'Photos of jobs you have finished' },
                    ] as const).map(o => (
                      <button
                        key={o.k}
                        type="button"
                        role="radio"
                        aria-checked={itemKind === o.k}
                        className={`vd-kind${itemKind === o.k ? ' is-on' : ''}`}
                        onClick={() => setItemKind(o.k)}
                      >
                        <span className="vd-kind-icon" aria-hidden="true">{o.icon}</span>
                        <strong>{o.t}</strong>
                        <span>{o.d}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="vd-field">
                  <label className="vd-label" htmlFor="vd-item-name">
                    {itemKind === 'PRODUCT' ? 'Product name' : itemKind === 'SERVICE' ? 'Service name' : 'Title of the job'}
                  </label>
                  <input
                    id="vd-item-name"
                    className="vd-input"
                    required
                    placeholder={
                      itemKind === 'PRODUCT'
                        ? 'e.g. Casio fx-991EX scientific calculator'
                        : itemKind === 'SERVICE'
                        ? 'e.g. Hostel wiring and fan installation'
                        : 'e.g. Solar inverter setup at a hostel in Adenike'
                    }
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                  />
                </div>

                <div className="vd-grid-2">
                  <CategorySelect
                    categories={categories}
                    listingType={itemKind === 'PRODUCT' ? 'PRODUCT' : 'SERVICE'}
                    value={itemCategoryId}
                    customCategory={itemCustomCategory}
                    onChange={id => setItemCategoryId(id)}
                    onCustomCategoryChange={setItemCustomCategory}
                    required={false}
                    label="Category"
                    placeholder="Choose a category"
                  />
                  <div className="form-group">
                    <label htmlFor="vd-item-area">Area</label>
                    <select id="vd-item-area" value={itemLocationId} onChange={e => setItemLocationId(e.target.value)}>
                      <option value="">Choose your area</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.area} ({loc.landmark || 'Ogbomoso'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {itemKind !== 'PROJECT' && (
                  <div className="vd-field">
                    <label className="vd-label" htmlFor="vd-item-price">Price</label>
                    <div className="vd-price">
                      <div className={`vd-input-icon${priceOnRequest ? ' is-off' : ''}`}>
                        <span aria-hidden="true">₦</span>
                        <input
                          id="vd-item-price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="15000"
                          disabled={priceOnRequest}
                          value={priceOnRequest ? '' : itemPrice}
                          onChange={e => setItemPrice(e.target.value)}
                        />
                      </div>
                      <label className="vd-switch">
                        <input type="checkbox" checked={priceOnRequest} onChange={e => setPriceOnRequest(e.target.checked)} />
                        <span className="vd-switch-track" aria-hidden="true" />
                        Price on request
                      </label>
                    </div>
                  </div>
                )}

                <div className="vd-field">
                  <MultiImageUpload
                    label={itemKind === 'PRODUCT' ? 'Photos of the product (up to 5)' : itemKind === 'PROJECT' ? 'Photos of the finished job (up to 5)' : 'Photos of your work (up to 5)'}
                    hint={
                      itemKind === 'PRODUCT'
                        ? 'The first photo is the cover. Show it from different angles in good light.'
                        : itemKind === 'PROJECT'
                        ? 'Before and after photos work really well.'
                        : 'Show examples of your work or happy customers.'
                    }
                    maxImages={5}
                    value={itemImages}
                    onChange={imgs => {
                      setItemImages(imgs);
                      const first = imgs.split(',')[0];
                      if (first) setItemImageUrl(first);
                    }}
                  />
                </div>

                <div className="vd-field">
                  <label className="vd-label" htmlFor="vd-item-desc">Description</label>
                  <textarea
                    id="vd-item-desc"
                    className="vd-input vd-textarea"
                    rows={4}
                    placeholder="Key features, condition, how long it takes, what is included, delivery…"
                    value={itemDescription}
                    onChange={e => setItemDescription(e.target.value)}
                  />
                </div>

                <div className="vd-form-foot">
                  <button type="button" className="vd-btn vd-btn-outline" onClick={() => goTab(itemKind === 'SERVICE' ? 'services' : itemKind === 'PROJECT' ? 'projects' : 'products')}>
                    Cancel
                  </button>
                  <button type="submit" className="vd-btn vd-btn-lime" disabled={isUploading}>
                    {isUploading ? 'Publishing…' : <>Publish {itemKind === 'PRODUCT' ? 'product' : itemKind === 'SERVICE' ? 'service' : 'past work'} <ArrowRight size={17} aria-hidden="true" /></>}
                  </button>
                </div>
              </form>

              <aside className="vd-card vd-hints">
                <h2><Lightbulb size={18} aria-hidden="true" /> What gets more customers</h2>
                <ul>
                  <li><Check size={15} aria-hidden="true" /> A clear name people would search for</li>
                  <li><Check size={15} aria-hidden="true" /> Real photos, the first one sharp and bright</li>
                  <li><Check size={15} aria-hidden="true" /> A price, or "price on request" if it varies</li>
                  <li><Check size={15} aria-hidden="true" /> Your area, so nearby customers find you</li>
                  <li><Check size={15} aria-hidden="true" /> A few honest lines in the description</li>
                </ul>
              </aside>
            </div>
          )
        )}

        {/* ======================================================== */}
        {/* CUSTOMER REQUESTS                                        */}
        {/* ======================================================== */}
        {activeTab === 'leads' && (
          <div className="vd-view">
            <div className="vd-toolbar">
              <div className="vd-seg" role="group" aria-label="Which requests">
                <button type="button" className={!onlyMatchingLeads ? 'is-on' : ''} aria-pressed={!onlyMatchingLeads} onClick={() => setOnlyMatchingLeads(false)}>
                  All <span>{leadPool.length}</span>
                </button>
                <button type="button" className={onlyMatchingLeads ? 'is-on' : ''} aria-pressed={onlyMatchingLeads} onClick={() => setOnlyMatchingLeads(true)}>
                  In my category <span>{matchingLeadCount}</span>
                </button>
              </div>
              <p className="vd-toolbar-note">Requests in your category come first. Send a quote to win the job.</p>
              <button type="button" className="vd-btn vd-btn-outline" onClick={onRefresh}>
                <RefreshCw size={16} aria-hidden="true" /> Refresh
              </button>
            </div>

            {openRequests.length > 0 ? (
              <ul className="vd-leads">
                {openRequests.map(lead => (
                  <li key={lead.id} className={`vd-lead${isMatchingLead(lead) ? ' is-match' : ''}`}>
                    <div className="vd-lead-top">
                      <span className="vd-tag is-open">{lead.custom_category || lead.category || lead.category_name || 'Request'}</span>
                      {isMatchingLead(lead) && <span className="vd-tag is-match"><Sparkles size={12} aria-hidden="true" /> Your category</span>}
                    </div>
                    <h3>{lead.title}</h3>
                    {lead.description && <p className="vd-lead-desc">{lead.description}</p>}
                    <p className="vd-lead-meta">
                      <span><MapPin size={14} aria-hidden="true" /> {lead.location_area || lead.location}</span>
                      <span><UserRound size={14} aria-hidden="true" /> {lead.customer_name || 'A customer'}</span>
                    </p>
                    <div className="vd-lead-foot">
                      <div>
                        <span className="vd-lead-label">Budget</span>
                        <strong>{lead.budget ? `₦${Number(lead.budget).toLocaleString('en-NG')}` : 'Open to offers'}</strong>
                      </div>
                      <button type="button" className="vd-btn vd-btn-lime" onClick={() => onRespondToRequest(lead)}>
                        Send a quote <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="vd-empty-card">
                <span className="vd-empty-icon" aria-hidden="true"><Megaphone size={30} /></span>
                <h2>{onlyMatchingLeads ? 'No requests in your category right now' : 'No open requests right now'}</h2>
                <p>New requests from students and residents will appear here. Check back soon.</p>
                {onlyMatchingLeads && (
                  <button type="button" className="vd-btn vd-btn-outline" onClick={() => setOnlyMatchingLeads(false)}>See all requests</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* REVIEWS AND RATINGS                                      */}
        {/* ======================================================== */}
        {activeTab === 'reviews' && (() => {
          const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: providerReviews.filter(r => r.rating === n).length }));
          const shownReviews = providerReviews.filter(r => reviewFilterRating === 'ALL' || r.rating === reviewFilterRating);
          return (
            <div className="vd-view">
              <section className="vd-card vd-rating">
                <div className="vd-rating-big">
                  <strong>{totalReviewsCount > 0 ? avgProviderRating : '–'}</strong>
                  <span className="vd-stars" aria-label={`${avgProviderRating} out of 5`}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={18} className={totalReviewsCount > 0 && i <= Math.round(Number(avgProviderRating)) ? 'is-on' : ''} aria-hidden="true" />
                    ))}
                  </span>
                  <span className="vd-rating-count">
                    {totalReviewsCount > 0 ? `${totalReviewsCount} review${totalReviewsCount === 1 ? '' : 's'}` : 'No reviews yet'}
                  </span>
                </div>
                <div className="vd-dist">
                  {dist.map(d => (
                    <div key={d.n} className="vd-dist-row">
                      <span>{d.n}<Star size={12} aria-hidden="true" /></span>
                      <span className="vd-dist-bar"><i style={{ width: `${totalReviewsCount ? (d.c / totalReviewsCount) * 100 : 0}%` }} /></span>
                      <span>{d.c}</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="vd-btn vd-btn-outline" onClick={loadProviderReviews} disabled={loadingReviews}>
                  <RefreshCw size={16} aria-hidden="true" /> {loadingReviews ? 'Refreshing…' : 'Refresh'}
                </button>
              </section>

              <div className="vd-seg vd-seg-wrap" role="group" aria-label="Filter by stars">
                {(['ALL', 5, 4, 3, 2, 1] as const).map(f => (
                  <button key={String(f)} type="button" className={reviewFilterRating === f ? 'is-on' : ''} aria-pressed={reviewFilterRating === f} onClick={() => setReviewFilterRating(f)}>
                    {f === 'ALL' ? 'All' : <>{f} <Star size={12} aria-hidden="true" /></>}
                    <span>{f === 'ALL' ? providerReviews.length : dist.find(d => d.n === f)?.c}</span>
                  </button>
                ))}
              </div>

              {shownReviews.length > 0 ? (
                <ul className="vd-reviews">
                  {shownReviews.map(rev => (
                    <li key={rev.id} className="vd-review">
                      <div className="vd-review-head">
                        <span className="vd-side-avatar" aria-hidden="true">{(rev.customer_name || 'C').charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{rev.customer_name || 'A customer'}</strong>
                          <span>{new Date(rev.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <span className="vd-stars" aria-label={`${rev.rating} out of 5`}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={16} className={i <= rev.rating ? 'is-on' : ''} aria-hidden="true" />
                          ))}
                        </span>
                      </div>
                      {rev.comment && <p>“{rev.comment}”</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="vd-empty-card">
                  <span className="vd-empty-icon" aria-hidden="true"><Star size={30} /></span>
                  <h2>{providerReviews.length === 0 ? 'No reviews yet' : 'No reviews with that rating'}</h2>
                  <p>
                    {providerReviews.length === 0
                      ? 'After you serve a customer, ask them to leave a review. It helps the next customer choose you.'
                      : 'Try another filter.'}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* PROFILE SETTINGS                                         */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="vd-form-wrap">
            <form className="vd-card vd-form" onSubmit={handleSaveProfile}>
              <h2 className="vd-form-section">About {isArtisan ? 'you' : 'your business'}</h2>
              <div className="vd-field">
                <label className="vd-label" htmlFor="vd-p-name">{isArtisan ? 'Name or trade name' : 'Business name'}</label>
                <input id="vd-p-name" className="vd-input" required value={profileName} onChange={e => setProfileName(e.target.value)} />
              </div>
              <CategorySelect
                categories={categories}
                listingType={primaryProvider?.type === 'PROFESSIONAL' ? 'ARTISAN' : 'BUSINESS'}
                value={profileCategoryId}
                customCategory={profileCustomCategory}
                onChange={id => setProfileCategoryId(id)}
                onCustomCategoryChange={setProfileCustomCategory}
                required={false}
                label="Main category"
                placeholder="Choose a category"
              />
              <div className="vd-field">
                <label className="vd-label" htmlFor="vd-p-desc">
                  Description <span className="vd-label-note">{profileDescription.trim().length >= 30 ? 'Good length' : `${30 - profileDescription.trim().length} more characters`}</span>
                </label>
                <textarea
                  id="vd-p-desc"
                  className="vd-input vd-textarea"
                  rows={4}
                  placeholder={isArtisan ? 'What you do, how long you have done it, where you work…' : 'What you sell, opening hours, delivery, what makes you different…'}
                  value={profileDescription}
                  onChange={e => setProfileDescription(e.target.value)}
                />
              </div>

              <h2 className="vd-form-section">How customers reach you</h2>
              <div className="vd-grid-2">
                <div className="vd-field">
                  <label className="vd-label" htmlFor="vd-p-phone">Phone number</label>
                  <div className="vd-input-icon">
                    <Phone size={17} aria-hidden="true" />
                    <input id="vd-p-phone" type="tel" inputMode="tel" required value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
                  </div>
                </div>
                <div className="vd-field">
                  <label className="vd-label" htmlFor="vd-p-wa">WhatsApp number</label>
                  <div className="vd-input-icon">
                    <MessageCircle size={17} aria-hidden="true" />
                    <input id="vd-p-wa" type="tel" inputMode="tel" placeholder="0803 111 2233" value={profileWhatsapp} onChange={e => setProfileWhatsapp(e.target.value)} />
                  </div>
                </div>
              </div>

              <h2 className="vd-form-section">Where you are</h2>
              <div className="vd-grid-2">
                <div className="form-group">
                  <label htmlFor="vd-p-area">Area</label>
                  <select id="vd-p-area" value={profileLocationId} onChange={e => setProfileLocationId(e.target.value)}>
                    <option value="">Choose your area</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.area}</option>
                    ))}
                  </select>
                </div>
                <div className="vd-field">
                  <label className="vd-label" htmlFor="vd-p-landmark">Nearby landmark</label>
                  <input id="vd-p-landmark" className="vd-input" placeholder="e.g. Opposite LAUTECH second gate" value={profileLandmark} onChange={e => setProfileLandmark(e.target.value)} />
                </div>
              </div>
              <div className="vd-field">
                <label className="vd-label" htmlFor="vd-p-loc">Address or directions</label>
                <input id="vd-p-loc" className="vd-input" value={profileLocation} onChange={e => setProfileLocation(e.target.value)} />
              </div>

              <h2 className="vd-form-section">{isArtisan ? 'Your photo' : 'Shop photo or logo'}</h2>
              <div className="vd-field">
                <ImageUpload
                  label={isArtisan ? 'A clear photo of you or your workshop' : 'Your shop front, sign or logo'}
                  value={profileImageUrl}
                  onChange={url => setProfileImageUrl(url)}
                />
                <p className="vd-hint">A real photo helps customers recognise and trust you.</p>
              </div>

              <div className="vd-form-foot">
                <button type="button" className="vd-btn vd-btn-outline" onClick={() => goTab('dashboard')}>Cancel</button>
                <button type="submit" className="vd-btn vd-btn-lime" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving…' : <>Save changes <ArrowRight size={17} aria-hidden="true" /></>}
                </button>
              </div>
            </form>

            <aside className="vd-card vd-preview">
              <p className="vd-preview-label">How customers see you</p>
              <div className="vd-preview-card">
                <span className="vd-preview-photo">
                  {profileImageUrl ? <img src={profileImageUrl} alt="" /> : <span>{(profileName || 'E').charAt(0).toUpperCase()}</span>}
                </span>
                <strong>{profileName || 'Your name'}</strong>
                <span className="vd-preview-meta">
                  {[categories.find(c => c.id === profileCategoryId)?.name || profileCustomCategory, locations.find(l => l.id === profileLocationId)?.area].filter(Boolean).join(' · ') || 'Category · Area'}
                </span>
                <p>{profileDescription.trim() || 'Your description shows here.'}</p>
                <span className="vd-preview-btns">
                  <span><Phone size={14} aria-hidden="true" /> Call</span>
                  <span className="is-wa"><MessageCircle size={14} aria-hidden="true" /> WhatsApp</span>
                </span>
              </div>
            </aside>
          </div>
        )}

        {/* Edit a listing */}
        {editingListing && (
          <div className="vd-modal-backdrop" onClick={() => setEditingListing(null)}>
            <div className="vd-modal" role="dialog" aria-modal="true" aria-labelledby="vd-edit-title" onClick={e => e.stopPropagation()}>
              <div className="vd-modal-head">
                <h2 id="vd-edit-title">Edit {editingListing.kind === 'PRODUCT' ? 'product' : editingListing.kind === 'SERVICE' ? 'service' : 'past work'}</h2>
                <button type="button" className="vd-icon-btn" onClick={() => setEditingListing(null)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <form className="vd-form" onSubmit={handleSaveEdit}>
                <div className="vd-field">
                  <span className="vd-label">Type</span>
                  <div className="vd-seg" role="radiogroup" aria-label="Type">
                    {(['PRODUCT', 'SERVICE', 'PROJECT'] as const).map(k => (
                      <button key={k} type="button" role="radio" aria-checked={editKind === k} className={editKind === k ? 'is-on' : ''} onClick={() => setEditKind(k)}>
                        {k === 'PRODUCT' ? 'Product' : k === 'SERVICE' ? 'Service' : 'Past work'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="vd-field">
                  <label className="vd-label" htmlFor="vd-e-name">Name</label>
                  <input id="vd-e-name" className="vd-input" required value={editName} onChange={e => setEditName(e.target.value)} />
                </div>

                <div className="vd-grid-2">
                  <CategorySelect
                    categories={categories}
                    listingType={editKind === 'PRODUCT' ? 'PRODUCT' : 'SERVICE'}
                    value={editCategoryId}
                    customCategory={editCustomCategory}
                    onChange={id => setEditCategoryId(id)}
                    onCustomCategoryChange={setEditCustomCategory}
                    required={false}
                    label="Category"
                    placeholder="Choose a category"
                  />
                  <div className="form-group">
                    <label htmlFor="vd-e-area">Area</label>
                    <select id="vd-e-area" value={editLocationId} onChange={e => setEditLocationId(e.target.value)}>
                      <option value="">Choose your area</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.area}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="vd-field">
                  <label className="vd-label" htmlFor="vd-e-price">Price</label>
                  <div className="vd-price">
                    <div className={`vd-input-icon${editPriceOnRequest ? ' is-off' : ''}`}>
                      <span aria-hidden="true">₦</span>
                      <input
                        id="vd-e-price"
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={editPriceOnRequest}
                        value={editPriceOnRequest ? '' : editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                      />
                    </div>
                    <label className="vd-switch">
                      <input type="checkbox" checked={editPriceOnRequest} onChange={e => setEditPriceOnRequest(e.target.checked)} />
                      <span className="vd-switch-track" aria-hidden="true" />
                      Price on request
                    </label>
                  </div>
                </div>

                <div className="vd-grid-2">
                  <div className="vd-field">
                    <span className="vd-label">Visible to customers?</span>
                    <div className="vd-seg" role="radiogroup" aria-label="Visibility">
                      <button type="button" role="radio" aria-checked={editStatus === 'ACTIVE'} className={editStatus === 'ACTIVE' ? 'is-on' : ''} onClick={() => setEditStatus('ACTIVE')}>
                        <Eye size={14} aria-hidden="true" /> Live
                      </button>
                      <button type="button" role="radio" aria-checked={editStatus === 'HIDDEN'} className={editStatus === 'HIDDEN' ? 'is-on' : ''} onClick={() => setEditStatus('HIDDEN')}>
                        <EyeOff size={14} aria-hidden="true" /> Hidden
                      </button>
                    </div>
                  </div>
                  <div className="vd-field">
                    <span className="vd-label">Availability</span>
                    <div className="vd-seg" role="radiogroup" aria-label="Availability">
                      {(['AVAILABLE', 'RESERVED', 'SOLD'] as AvailabilityStatus[]).map(a => (
                        <button key={a} type="button" role="radio" aria-checked={editAvailabilityStatus === a} className={editAvailabilityStatus === a ? 'is-on' : ''} onClick={() => setEditAvailabilityStatus(a)}>
                          {a === 'AVAILABLE' ? 'Available' : a === 'RESERVED' ? 'Reserved' : 'Sold'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="vd-field">
                  <MultiImageUpload
                    label="Photos (up to 5)"
                    maxImages={5}
                    value={editImages}
                    onChange={imgs => {
                      setEditImages(imgs);
                      const first = imgs.split(',')[0];
                      if (first) setEditImageUrl(first);
                    }}
                  />
                </div>

                <div className="vd-field">
                  <label className="vd-label" htmlFor="vd-e-desc">Description</label>
                  <textarea id="vd-e-desc" className="vd-input vd-textarea" rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                </div>

                <div className="vd-form-foot">
                  <button type="button" className="vd-btn vd-btn-outline" onClick={() => setEditingListing(null)}>Cancel</button>
                  <button type="submit" className="vd-btn vd-btn-lime" disabled={isUpdating}>
                    {isUpdating ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm delete */}
        {itemToDelete && (
          <div className="vd-modal-backdrop" onClick={() => !isDeleting && setItemToDelete(null)}>
            <div className="vd-modal vd-modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="vd-del-title" onClick={e => e.stopPropagation()}>
              <span className="vd-empty-icon is-danger" aria-hidden="true"><Trash2 size={26} /></span>
              <h2 id="vd-del-title">Delete “{itemToDelete.name}”?</h2>
              <p>It will be removed from your listings and customers will no longer see it. This can’t be undone.</p>
              <div className="vd-form-foot">
                <button type="button" className="vd-btn vd-btn-outline" onClick={() => setItemToDelete(null)} disabled={isDeleting}>Keep it</button>
                <button type="button" className="vd-btn vd-btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Phone tab bar */}
      <nav className="vd-tabbar" aria-label="Dashboard">
        <button type="button" className={activeTab === 'dashboard' ? 'is-on' : ''} onClick={() => goTab('dashboard')}>
          <LayoutDashboard size={21} /> Overview
        </button>
        <button
          type="button"
          className={['products', 'services', 'projects'].includes(activeTab) ? 'is-on' : ''}
          onClick={() => goTab(isArtisan ? 'services' : 'products')}
        >
          {isArtisan ? <Wrench size={21} /> : <Box size={21} />} {isArtisan ? 'Services' : 'Listings'}
        </button>
        <button type="button" className="vd-tab-plus" onClick={() => onAdd(isArtisan ? 'SERVICE' : 'PRODUCT')} aria-label={isArtisan ? 'Add a service' : 'Add a product'}>
          <span className="vd-plus"><Plus size={26} strokeWidth={2.6} /></span>
        </button>
        <button type="button" className={activeTab === 'leads' ? 'is-on' : ''} onClick={() => goTab('leads')}>
          <Megaphone size={21} /> Requests
        </button>
        <button type="button" className={activeTab === 'settings' ? 'is-on' : ''} onClick={() => goTab('settings')}>
          <UserRound size={21} /> Profile
        </button>
      </nav>
    </div>
  );
};
