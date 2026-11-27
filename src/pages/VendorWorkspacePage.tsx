import React, { useState, useEffect } from 'react';
import { Provider, Listing, ServiceRequest, Category, Location, ListingKind, Review, AvailabilityStatus } from '../types';
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

  return (
    <div className="portal-layout">
      {/* ======================================================== */}
      {/* 1. PORTAL SIDEBAR NAVIGATION                             */}
      {/* ======================================================== */}
      <aside className="portal-sidebar">
        <div>
          {/* Sidebar Header */}
          <div className="portal-sidebar-header">
            <div className="portal-brand" onClick={() => onNavigate('Home')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <EclatLogo light={true} size={30} />
              <span className="portal-role-badge">
                {isArtisan ? 'Artisan Portal' : 'Vendor Portal'}
              </span>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isApproved ? '#22c55e' : '#f59e0b' }} />
              <span style={{ fontWeight: 600 }}>
                {isApproved
                  ? (primaryProvider?.verified ? 'Verified & Live' : 'Approved & Live')
                  : statusNotice.title}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="portal-nav">
            <div className="portal-nav-section-title">Core Management</div>

            <button
              className={`portal-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span style={{ fontSize: 17 }}>📊</span>
              <span>Dashboard Overview</span>
            </button>

            <button
              className={`portal-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span style={{ fontSize: 17 }}>🛍️</span>
              <span>Products & Items ({productCount})</span>
            </button>

            <button
              className={`portal-nav-item ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <span style={{ fontSize: 17 }}>🔧</span>
              <span>Skilled Services ({serviceCount})</span>
            </button>

            <button
              className={`portal-nav-item ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <span style={{ fontSize: 17 }}>📁</span>
              <span>Project Showcase ({projectCount})</span>
            </button>

            <button
              className={`portal-nav-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => {
                setItemKind(isArtisan ? 'SERVICE' : 'PRODUCT');
                setActiveTab('upload');
              }}
            >
              <span style={{ fontSize: 17 }}>⚡</span>
              <span>{isApproved ? '+ Upload / Add Item' : '🔒 + Upload / Add Item'}</span>
            </button>

            <div className="portal-nav-section-title" style={{ marginTop: 10 }}>Marketplace & Leads</div>

            <button
              className={`portal-nav-item ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              <span style={{ fontSize: 17 }}>💬</span>
              <span>Customer Leads ({openRequests.length})</span>
            </button>

            <button
              className={`portal-nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <span style={{ fontSize: 17 }}>⭐</span>
              <span>Customer Reviews ({totalReviewsCount})</span>
            </button>

            <button
              className={`portal-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span style={{ fontSize: 17 }}>⚙️</span>
              <span>Store Profile</span>
            </button>

            <button
              className="portal-nav-item"
              onClick={() => onNavigate('Notifications')}
            >
              <span style={{ fontSize: 17 }}>🔔</span>
              <span>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="portal-sidebar-footer">
          <button
            className="btn-outline btn-sm"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', width: '100%', justifyContent: 'center' }}
            onClick={() => onNavigate('Home')}
          >
            🌐 Back to Marketplace
          </button>

          <button
            className="btn-danger btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              logout();
              onToast('Signed out of vendor portal', 'info');
              onNavigate('Home');
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. PORTAL MAIN CONTENT PANEL                             */}
      {/* ======================================================== */}
      <main className="portal-main-panel">
        {/* Topbar inside Portal */}
        <div className="portal-topbar">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
              {isArtisan ? 'ARTISAN PORTAL' : 'VENDOR PORTAL'} / {activeTab.toUpperCase()}
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800 }}>
              {activeTab === 'dashboard' && (isArtisan ? 'Artisan Dashboard Overview' : 'Vendor Dashboard Overview')}
              {activeTab === 'products' && 'Products & Items Catalog'}
              {activeTab === 'services' && 'Skilled Trade Services'}
              {activeTab === 'projects' && 'Completed Projects & Portfolio Showcase'}
              {activeTab === 'upload' && (itemKind === 'PRODUCT' ? 'Upload New Product / Item' : itemKind === 'SERVICE' ? 'Add New Skilled Service' : 'Add Project Portfolio Showcase')}
              {activeTab === 'leads' && 'Campus Customer Leads in Ogbomoso'}
              {activeTab === 'reviews' && 'Customer Reviews & Reputation'}
              {activeTab === 'settings' && (isArtisan ? 'Artisan Profile & Trade Settings' : 'Store Profile & Business Settings')}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-lime btn-sm"
              style={{ fontWeight: 700, opacity: isApproved ? 1 : 0.6, cursor: isApproved ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                if (!isApproved) {
                  onToast('Your profile needs to be approved before uploading products.', 'error');
                  return;
                }
                setItemKind('PRODUCT');
                setActiveTab('upload');
              }}
            >
              {isApproved ? '+ Upload Product' : '🔒 + Upload Product'}
            </button>

            <button
              className="btn-outline btn-sm"
              style={{ opacity: isApproved ? 1 : 0.6, cursor: isApproved ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                if (!isApproved) {
                  onToast('Your profile needs to be approved before adding services.', 'error');
                  return;
                }
                setItemKind('SERVICE');
                setActiveTab('upload');
              }}
            >
              {isApproved ? '+ Add Service' : '🔒 + Add Service'}
            </button>

            <button
              className="btn-outline btn-sm"
              style={{ opacity: isApproved ? 1 : 0.6, cursor: isApproved ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                if (!isApproved) {
                  onToast('Your profile needs to be approved before adding projects.', 'error');
                  return;
                }
                setItemKind('PROJECT');
                setActiveTab('upload');
              }}
            >
              {isApproved ? '+ Add Project' : '🔒 + Add Project'}
            </button>

            <button className="btn-outline btn-sm" onClick={() => onNavigate('Home')}>
              Marketplace ↗
            </button>
          </div>
        </div>

        {/* Pending Final Administrator Approval Notification */}
        {!isApproved ? (
          <div
            style={{
              background: '#fffbeb',
              border: '2px solid #f59e0b',
              borderRadius: 12,
              padding: '18px 22px',
              marginBottom: 24,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.10)',
            }}
          >
            <div style={{ fontSize: 34, flexShrink: 0 }}>⏳</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h3 style={{ margin: 0, color: '#92400e', fontSize: 17, fontWeight: 800 }}>
                  {statusNotice.title}
                </h3>
                <span className="card-badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, border: '1px solid #fde68a' }}>
                  {statusNotice.badge}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#78350f', lineHeight: 1.55 }}>
                {statusNotice.text}
                {(providerStatus === 'MORE_INFO' || providerStatus === 'REJECTED') && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('Provider Application')}
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-purple)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 14 }}
                    >
                      Update my profile
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: 12,
              padding: '12px 18px',
              marginBottom: 22,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 22 }}>✓</div>
            <div style={{ fontSize: 13.5, color: '#166534' }}>
              <strong>Approved & Live:</strong> Your {isArtisan ? 'campus artisan' : 'approved provider'} profile is approved and active on campus. You have full access to add, update, and manage your products, services, and project showcase!
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: DASHBOARD (THE MAIN PORTAL HOME)                */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Welcome Banner */}
            <div className="portal-welcome-banner">
              <div>
                <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent-lime)', fontWeight: 700 }}>
                  Live Store Overview
                </span>
                <h2 style={{ margin: '6px 0 8px', fontSize: 24, color: '#fff' }}>
                  Welcome back, {primaryProvider?.name || user?.name}! 👋
                </h2>
                <div style={{ fontSize: 14, color: '#f3e8ff', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  <span>📍 {primaryProvider?.location_area || primaryProvider?.location || 'Ogbomoso'}</span>
                  <span>📞 {primaryProvider?.phone || user?.phone}</span>
                  {primaryProvider?.whatsapp && <span>💬 WhatsApp: {primaryProvider.whatsapp}</span>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  className="card-badge"
                  style={{
                    background: isApproved ? '#dcfce7' : '#fef3c7',
                    color: isApproved ? '#166534' : '#92400e',
                    fontSize: 13,
                    padding: '6px 14px',
                    fontWeight: 700,
                  }}
                >
                  {isApproved
                    ? (primaryProvider?.verified ? '✓ Verified Artisan & Live' : '✓ Approved Provider & Live')
                    : `⏳ ${statusNotice.title}`}
                </span>
              </div>
            </div>

            {/* KPI Metric Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              <div
                onClick={() => { setActiveTab('products'); setFilterStatus('ALL'); }}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  🛍️ Total Products
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  {productCount}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Physical items & goods</div>
              </div>

              <div
                onClick={() => { setActiveTab('services'); setFilterStatus('ALL'); }}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  🔧 Total Services
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  {serviceCount}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Artisan & trade skills</div>
              </div>

              <div
                onClick={() => { setActiveTab('projects'); setFilterStatus('ALL'); }}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  📁 Projects Portfolio
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  {projectCount}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Completed jobs & showcase</div>
              </div>

              <div
                onClick={() => { setActiveTab('products'); setFilterStatus('ACTIVE'); }}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  🟢 Live in Catalog
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#166534', marginTop: 4 }}>
                  {activeCount}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Active & discoverable</div>
              </div>

              <div
                onClick={() => { setActiveTab('products'); setFilterStatus('HIDDEN'); }}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  ⚪ Hidden / Drafts
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#6b7280', marginTop: 4 }}>
                  {hiddenCount}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Temporarily offline</div>
              </div>

              <div
                onClick={() => setActiveTab('leads')}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  💬 Customer Leads
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                  {openRequests.length}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Open community requests</div>
              </div>

              <div
                onClick={() => setActiveTab('reviews')}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  ⭐ Rating & Reviews
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                  {totalReviewsCount > 0 ? `${avgProviderRating} ★` : 'No reviews'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {totalReviewsCount} review{totalReviewsCount === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            {/* Quick Action Cards Strip */}
            <div className="portal-quick-actions">
              <div
                className="portal-quick-btn"
                onClick={() => {
                  if (!isApproved) {
                    onToast('Your profile needs to be approved before uploading products.', 'error');
                    return;
                  }
                  setItemKind('PRODUCT');
                  setActiveTab('upload');
                }}
              >
                <span style={{ fontSize: 26 }}>🛍️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Upload Product</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>List gadgets, books, fashion, groceries</div>
                </div>
              </div>

              <div
                className="portal-quick-btn"
                onClick={() => {
                  if (!isApproved) {
                    onToast('Your profile needs to be approved before adding services.', 'error');
                    return;
                  }
                  setItemKind('SERVICE');
                  setActiveTab('upload');
                }}
              >
                <span style={{ fontSize: 26 }}>🔧</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Add Skilled Service</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Offer repairs, tailoring, laundry, tutorials</div>
                </div>
              </div>

              <div
                className="portal-quick-btn"
                onClick={() => {
                  if (!isApproved) {
                    onToast('Your profile needs to be approved before adding projects.', 'error');
                    return;
                  }
                  setItemKind('PROJECT');
                  setActiveTab('upload');
                }}
              >
                <span style={{ fontSize: 26 }}>📁</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Add Project Showcase</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Showcase completed jobs & client work</div>
                </div>
              </div>

              <div className="portal-quick-btn" onClick={() => setActiveTab('leads')}>
                <span style={{ fontSize: 26 }}>💬</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>View Campus Leads</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Answer requests from students in town</div>
                </div>
              </div>

              <div className="portal-quick-btn" onClick={() => setActiveTab('reviews')}>
                <span style={{ fontSize: 26 }}>⭐</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Customer Reviews</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Inspect feedback & ratings ({totalReviewsCount})</div>
                </div>
              </div>

              <div className="portal-quick-btn" onClick={() => setActiveTab('settings')}>
                <span style={{ fontSize: 26 }}>⚙️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Store Settings</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update store name, contact & location</div>
                </div>
              </div>
            </div>

            {/* Recent Catalog Preview */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 22px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 17 }}>Recent Store Items</h3>
                <button className="btn-outline btn-sm" onClick={() => setActiveTab('products')}>
                  View All Items ({myListings.length}) →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myListings.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'var(--ivory)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{item.kind === 'PRODUCT' ? '🛍️' : '🔧'}</span>
                      <div>
                        <strong>{item.name}</strong>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {item.kind} · {item.price ? `₦${Number(item.price).toLocaleString()}` : 'Price on request'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        className="card-badge"
                        style={{
                          background: item.status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6',
                          color: item.status === 'ACTIVE' ? '#166534' : '#6b7280',
                          fontSize: 11.5,
                        }}
                      >
                        {item.status}
                      </span>
                      <button
                        className="btn-outline btn-sm"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        onClick={() => handleToggleStatus(item)}
                      >
                        {item.status === 'ACTIVE' ? 'Hide' : 'Make Active'}
                      </button>
                    </div>
                  </div>
                ))}

                {myListings.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '8px 0' }}>
                    No items in your catalog yet. Use the upload button above to add your first product or trade service.
                  </p>
                )}
              </div>
            </div>

            {/* Recent Leads Preview */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 17 }}>Latest Community Service Requests</h3>
                <button className="btn-outline btn-sm" onClick={() => setActiveTab('leads')}>
                  View All Leads ({openRequests.length}) →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {openRequests.slice(0, 3).map(lead => (
                  <div
                    key={lead.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'var(--ivory)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <span className="card-badge" style={{ fontSize: 11 }}>{lead.category || 'Request'}</span>
                      <h4 style={{ margin: '4px 0 2px', fontSize: 14.5 }}>{lead.title}</h4>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 General Area: {lead.location_area || lead.location}</div>
                    </div>
                    <button className="btn-lime btn-sm" onClick={() => onRespondToRequest(lead)}>
                      💰 Submit Quote
                    </button>
                  </div>
                ))}

                {openRequests.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '8px 0' }}>
                    No open service requests right now. Check back soon!
                  </p>
                )}
              </div>
            </div>

            {/* Recent Reviews Preview */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 22px', marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 17 }}>⭐ Recent Customer Reviews</h3>
                  {totalReviewsCount > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>
                      ★ {avgProviderRating} / 5.0
                    </span>
                  )}
                </div>
                <button className="btn-outline btn-sm" onClick={() => setActiveTab('reviews')}>
                  View All Reviews ({totalReviewsCount}) →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {providerReviews.slice(0, 3).map(rev => (
                  <div
                    key={rev.id}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--ivory)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong>{rev.customer_name || 'Community member'}</strong>
                      </div>
                      <span style={{ color: '#eab308', fontSize: 14 }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </span>
                    </div>
                    {rev.comment && <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>"{rev.comment}"</div>}
                  </div>
                ))}

                {providerReviews.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '8px 0' }}>
                    No customer reviews yet. Once clients engage with your store or services, their reviews will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2, 3 & 4: PRODUCTS, SERVICES & PROJECTS CATALOGS   */}
        {/* ======================================================== */}
        {['products', 'services', 'projects'].includes(activeTab) && (
          <div>
            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'products' ? 'products & items' : activeTab === 'services' ? 'services' : 'projects'} by name, category, description...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}
                />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">🟢 Active Only</option>
                  <option value="HIDDEN">⚪ Hidden Only</option>
                </select>
              </div>

              <button
                className="btn-lime btn-sm"
                style={{ opacity: isApproved ? 1 : 0.6, cursor: isApproved ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (!isApproved) {
                    onToast('Your profile needs to be approved before adding items, services, or projects.', 'error');
                    return;
                  }
                  setItemKind(activeTab === 'services' ? 'SERVICE' : activeTab === 'projects' ? 'PROJECT' : 'PRODUCT');
                  setActiveTab('upload');
                }}
              >
                {isApproved
                  ? `+ Add ${activeTab === 'services' ? 'Service' : activeTab === 'projects' ? 'Project' : 'Product'}`
                  : `🔒 Add ${activeTab === 'services' ? 'Service' : activeTab === 'projects' ? 'Project' : 'Product'}`}
              </button>
            </div>

            {/* Listings Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredListings.map(item => (
                <div
                  key={item.id}
                  className="item-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 280 }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          background: item.kind === 'PRODUCT' ? '#fdf2f8' : item.kind === 'SERVICE' ? '#eff6ff' : '#f0fdf4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 28,
                          flexShrink: 0,
                        }}
                      >
                        {item.kind === 'PRODUCT' ? '🛍️' : item.kind === 'SERVICE' ? '🔧' : '📁'}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        <span className="card-badge" style={{
                          background: item.kind === 'PRODUCT' ? '#fdf2f8' : item.kind === 'SERVICE' ? '#eff6ff' : '#f0fdf4',
                          color: item.kind === 'PRODUCT' ? '#9d174d' : item.kind === 'SERVICE' ? '#1e40af' : '#166534',
                        }}>
                          {item.kind === 'PRODUCT' ? '🛍️ Item / Product' : item.kind === 'SERVICE' ? '🔧 Service' : '📁 Project Showcase'}
                        </span>
                        <span
                          className="card-badge"
                          style={{
                            background: item.status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6',
                            color: item.status === 'ACTIVE' ? '#166534' : '#6b7280',
                            fontWeight: 600,
                          }}
                        >
                          {item.status === 'ACTIVE' ? '🟢 Active (Live)' : '⚪ Hidden'}
                        </span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Availability:</span>
                          <AvailabilityBadge
                            status={item.availability_status || 'AVAILABLE'}
                            size="sm"
                            interactive
                            onStatusChange={(newStatus) => handleUpdateItemAvailability(item.id, newStatus)}
                          />
                        </div>
                        {item.category_name && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            🏷️ {item.category_name}
                          </span>
                        )}
                        {item.location_area && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            📍 {item.location_area}
                          </span>
                        )}
                      </div>

                      <h3 style={{ margin: '2px 0 4px', fontSize: 16, fontWeight: 700 }}>{item.name}</h3>
                      {item.description && (
                        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#4b5563', maxHeight: 38, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.description}
                        </p>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
                        {item.price ? `₦${Number(item.price).toLocaleString()}` : 'Price on request / Negotiable'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-outline btn-sm"
                      style={{ opacity: isApproved ? 1 : 0.6, cursor: isApproved ? 'pointer' : 'not-allowed' }}
                      onClick={() => handleToggleStatus(item)}
                      title={isApproved ? "Toggle public visibility" : "Status updating locked: waiting for administrator approval"}
                    >
                      {isApproved ? (item.status === 'ACTIVE' ? '🙈 Hide' : '👁️ Make Active') : '🔒 Hide/Show'}
                    </button>

                    <button
                      className="btn-outline btn-sm"
                      style={{ opacity: isApproved ? 1 : 0.6, cursor: isApproved ? 'pointer' : 'not-allowed' }}
                      onClick={() => handleOpenEdit(item)}
                      title={isApproved ? "Edit item details" : "Editing locked: waiting for administrator approval"}
                    >
                      {isApproved ? '✏️ Edit' : '🔒 Edit'}
                    </button>

                    <button
                      className="btn-outline btn-sm"
                      style={{ color: '#dc2626', borderColor: '#fca5a5', opacity: isApproved ? 1 : 0.6, cursor: isApproved ? 'pointer' : 'not-allowed' }}
                      onClick={() => {
                        if (!isApproved) {
                          onToast('Your profile needs to be approved before you can delete items.', 'error');
                          return;
                        }
                        setItemToDelete(item);
                      }}
                      title={isApproved ? "Delete item" : "Deletion locked: waiting for administrator approval"}
                    >
                      {isApproved ? '🗑️ Delete' : '🔒 Delete'}
                    </button>
                  </div>
                </div>
              ))}

              {filteredListings.length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>
                    {activeTab === 'services' ? '🔧' : '🛍️'}
                  </div>
                  <h3 style={{ margin: '0 0 6px 0' }}>
                    No {activeTab === 'services' ? 'services' : activeTab === 'products' ? 'products' : 'items'} found
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '0 0 16px 0' }}>
                    {searchQuery || filterStatus !== 'ALL'
                      ? 'Try adjusting your search query or filters.'
                      : 'Start building your campus store catalog by uploading your first product or trade service.'}
                  </p>
                  <button
                    className="btn-lime"
                    style={{ opacity: isApproved ? 1 : 0.6, cursor: isApproved ? 'pointer' : 'not-allowed' }}
                    onClick={() => {
                      if (!isApproved) {
                        onToast('Your profile needs to be approved before you can upload or add items.', 'error');
                        return;
                      }
                      setItemKind(activeTab === 'services' ? 'SERVICE' : 'PRODUCT');
                      setActiveTab('upload');
                    }}
                  >
                    + Add Your First {activeTab === 'services' ? 'Service' : 'Product'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 5: UPLOAD / ADD ITEM WIZARD                        */}
        {/* ======================================================== */}
        {activeTab === 'upload' && (
          !isApproved ? (
            <section className="form-panel" style={{ background: '#fff', maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: '48px 24px', border: '2px solid #fde68a', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>⏳</div>
              <h2 style={{ color: '#92400e', margin: '0 0 10px 0', fontSize: 22, fontWeight: 800 }}>
                {statusNotice.title}
              </h2>
              <p style={{ maxWidth: 540, margin: '0 auto 20px', fontSize: 14.5, color: '#78350f', lineHeight: 1.6 }}>
                {statusNotice.text}
              </p>
              <button className="btn-outline btn-sm" onClick={() => setActiveTab('dashboard')}>
                ← Back to Dashboard Overview
              </button>
            </section>
          ) : (
            <section className="form-panel" style={{ background: '#fff', maxWidth: 760, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: 20 }}>
                    {itemKind === 'PRODUCT' ? '🛍️ Upload New Product / Item' : itemKind === 'SERVICE' ? '🔧 Add New Skilled Service' : '📁 Add Project Showcase'}
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    Fill out the details below to publish live to the campus catalog.
                  </p>
                </div>
                <button className="btn-outline btn-sm" onClick={() => setActiveTab('dashboard')}>
                  Cancel
                </button>
              </div>

              <form onSubmit={handleUploadSubmit}>
                {/* Kind Selector */}
                <div className="form-group">
                  <label>What are you listing? *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 6 }}>
                    <div
                      onClick={() => setItemKind('PRODUCT')}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: itemKind === 'PRODUCT' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: itemKind === 'PRODUCT' ? '#fdf4ff' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14 }}>🛍️ Item / Product</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Groceries, electronics, books, phones, clothes, gadgets
                      </div>
                    </div>

                    <div
                      onClick={() => setItemKind('SERVICE')}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: itemKind === 'SERVICE' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: itemKind === 'SERVICE' ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14 }}>🔧 Skilled Service / Trade</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Wiring, plumbing, laundry, tailoring, tutorials, design
                      </div>
                    </div>

                    <div
                      onClick={() => setItemKind('PROJECT')}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: itemKind === 'PROJECT' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: itemKind === 'PROJECT' ? '#f0fdf4' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14 }}>📁 Project Portfolio</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Completed client jobs, sample installations, case studies
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title / Name */}
                <div className="form-group">
                  <label>
                    {itemKind === 'PRODUCT'
                      ? 'Product / Item Name *'
                      : itemKind === 'SERVICE'
                      ? 'Service Title *'
                      : 'Project / Portfolio Title *'}
                  </label>
                  <input
                    required
                    placeholder={
                      itemKind === 'PRODUCT'
                        ? 'e.g. Casio fx-991EX Scientific Calculator'
                        : itemKind === 'SERVICE'
                        ? 'e.g. Hostel Wiring & Fan Installation'
                        : 'e.g. Solar Inverter System Setup at Adenike Hostel'
                    }
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                  />
                </div>

                {/* Category & Campus Area */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <CategorySelect
                    categories={categories}
                    listingType={itemKind === 'PRODUCT' ? 'PRODUCT' : 'SERVICE'}
                    value={itemCategoryId}
                    customCategory={itemCustomCategory}
                    onChange={(id) => setItemCategoryId(id)}
                    onCustomCategoryChange={setItemCustomCategory}
                    required={false}
                    label="Category"
                    placeholder="Select category"
                  />

                  <div className="form-group">
                    <label>Campus Area / Location</label>
                    <select value={itemLocationId} onChange={e => setItemLocationId(e.target.value)}>
                      <option value="">Select area</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.area} ({loc.landmark || 'Ogbomoso'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price & Price on Request */}
                <div className="form-group">
                  <label>Price (₦)</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 15000"
                      disabled={priceOnRequest}
                      value={priceOnRequest ? '' : itemPrice}
                      onChange={e => setItemPrice(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={priceOnRequest}
                        onChange={e => setPriceOnRequest(e.target.checked)}
                      />
                      Price on request / Negotiable
                    </label>
                  </div>
                </div>

                {/* Multi-Image Upload (Storefront / Products / Artisan Skill Showcase) */}
                <MultiImageUpload
                  label={
                    itemKind === 'PRODUCT'
                      ? 'Product Photos (Cover photo + Gallery pictures) 📷'
                      : itemKind === 'PROJECT'
                      ? 'Artisan Past Works Showcase (Portfolio Photos) 🛠️'
                      : 'Service Photos & Samples (Up to 5 pictures) 💼'
                  }
                  hint={
                    itemKind === 'PRODUCT'
                      ? 'Upload up to 5 photos showing your product from different angles, tags, and in use.'
                      : itemKind === 'PROJECT'
                      ? 'Upload up to 5 pictures of your previous work, finished craft, repair, haircut, or tailoring to showcase your skill to clients.'
                      : 'Upload pictures demonstrating your service or previous happy clients.'
                  }
                  maxImages={5}
                  value={itemImages}
                  onChange={imgs => {
                    setItemImages(imgs);
                    const first = imgs.split(',')[0];
                    if (first) setItemImageUrl(first);
                  }}
                />

                {/* Description */}
                <div className="form-group">
                  <label>Description & Details</label>
                  <textarea
                    rows={4}
                    placeholder="Describe key features, condition, warranty, turnaround time, or special instructions..."
                    value={itemDescription}
                    onChange={e => setItemDescription(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-lime"
                  style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
                  disabled={isUploading}
                >
                  {isUploading ? 'Publishing Item...' : `✓ Publish ${itemKind === 'PRODUCT' ? 'Product' : itemKind === 'SERVICE' ? 'Service' : 'Project'} Now →`}
                </button>
              </form>
            </section>
          )
        )}

        {/* ======================================================== */}
        {/* VIEW 5: STUDENT SERVICE LEADS IN OGBOMOSO                */}
        {/* ======================================================== */}
        {activeTab === 'leads' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Customer requests</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  Open requests from students and residents. Requests in your category are listed first.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={onlyMatchingLeads}
                    onChange={e => setOnlyMatchingLeads(e.target.checked)}
                  />
                  Only my category ({matchingLeadCount})
                </label>
                <button className="btn-outline btn-sm" onClick={onRefresh}>
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {openRequests.map(lead => (
                <div key={lead.id} className="item-card" style={{ background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span className="card-badge">{lead.category || lead.category_name || 'Request'}</span>
                        {isMatchingLead(lead) && (
                          <span className="card-badge" style={{ background: '#ecfccb', color: '#3f6212' }}>Matches your category</span>
                        )}
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 General Area: {lead.location_area || lead.location}</span>
                      </div>
                      <h4 style={{ margin: '4px 0', fontSize: 16 }}>{lead.title}</h4>
                      <p style={{ margin: '4px 0 10px', fontSize: 13.5, color: '#4b5563' }}>{lead.description}</p>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Requested by: <strong>{lead.customer_name || 'Community Member'}</strong>
                      </div>
                    </div>

                    {lead.budget && (
                      <div style={{ textAlign: 'right' }}>
                        <small style={{ color: 'var(--text-muted)' }}>Customer Budget:</small>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                          ₦{Number(lead.budget).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 14, borderTop: '1px solid #f0f0f0', paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-lime btn-sm" onClick={() => onRespondToRequest(lead)}>
                      💰 Submit Quote / Offer →
                    </button>
                  </div>
                </div>
              ))}

              {openRequests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>{onlyMatchingLeads ? 'No open requests in your category right now.' : 'No open customer requests right now.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 6: CUSTOMER REVIEWS & REPUTATION                    */}
        {/* ======================================================== */}
        {activeTab === 'reviews' && (
          <div>
            {/* Reputation Overview Banner */}
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '24px 28px',
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #fcd34d',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 900, color: '#78350f', lineHeight: 1 }}>
                    {totalReviewsCount > 0 ? avgProviderRating : '-'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', marginTop: 2 }}>
                    ★ ★ ★ ★ ★
                  </span>
                </div>

                <div>
                  <h2 style={{ margin: 0, fontSize: 20, color: 'var(--primary)' }}>
                    Customer Reviews & Store Reputation
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
                    {totalReviewsCount > 0
                      ? `Based on ${totalReviewsCount} customer review${totalReviewsCount === 1 ? '' : 's'}`
                      : 'Build your campus reputation by providing great products and reliable services.'}
                  </p>
                </div>
              </div>

              <button className="btn-outline btn-sm" onClick={loadProviderReviews} disabled={loadingReviews}>
                {loadingReviews ? 'Refreshing...' : '🔄 Refresh Reviews'}
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 18, paddingBottom: 4 }}>
              {(['ALL', 5, 4, 3, 2, 1] as const).map(f => {
                const count = f === 'ALL'
                  ? providerReviews.length
                  : providerReviews.filter(r => r.rating === f).length;
                return (
                  <button
                    key={String(f)}
                    onClick={() => setReviewFilterRating(f)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: reviewFilterRating === f ? 'var(--primary)' : 'var(--border)',
                      background: reviewFilterRating === f ? 'var(--primary)' : '#fff',
                      color: reviewFilterRating === f ? 'var(--accent-lime)' : 'var(--charcoal)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f === 'ALL' ? `All Reviews (${count})` : `${f} Stars (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Reviews Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {providerReviews
                .filter(r => reviewFilterRating === 'ALL' || r.rating === reviewFilterRating)
                .map(rev => (
                  <div
                    key={rev.id}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '16px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {(rev.customer_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>{rev.customer_name || 'Community Customer'}</strong>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#eab308', fontSize: 16 }}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#854d0e' }}>
                          {rev.rating}.0 / 5.0
                        </div>
                      </div>
                    </div>

                    {rev.comment && (
                      <p style={{ margin: '8px 0 0', fontSize: 14, color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '10px 14px', borderRadius: 6 }}>
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))}

              {providerReviews.filter(r => reviewFilterRating === 'ALL' || r.rating === reviewFilterRating).length === 0 && (
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
                  <h3 style={{ margin: '0 0 6px 0' }}>No Reviews in this Category</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>
                    {providerReviews.length === 0
                      ? 'You have not received any customer reviews yet. Reviews from buyers and clients will appear here.'
                      : 'No reviews found with the selected star filter.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 7: STORE PROFILE SETTINGS                           */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <section className="form-panel" style={{ background: '#fff', maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: 20 }}>Store Profile Settings</h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  Update your business identity, contact channels, and campus location.
                </p>
              </div>
              <button className="btn-outline btn-sm" onClick={() => setActiveTab('dashboard')}>
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Business / Trade Name *</label>
                <input
                  required
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div className="form-group">
                  <label>Primary Phone Number *</label>
                  <input
                    required
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    placeholder="e.g. 08031112233"
                    value={profileWhatsapp}
                    onChange={e => setProfileWhatsapp(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <CategorySelect
                  categories={categories}
                  listingType={primaryProvider?.type === 'PROFESSIONAL' ? 'ARTISAN' : 'BUSINESS'}
                  value={profileCategoryId}
                  customCategory={profileCustomCategory}
                  onChange={(id) => setProfileCategoryId(id)}
                  onCustomCategoryChange={setProfileCustomCategory}
                  required={false}
                  label="Primary Category"
                  placeholder="Select category"
                />

                <div className="form-group">
                  <label>Campus Area</label>
                  <select value={profileLocationId} onChange={e => setProfileLocationId(e.target.value)}>
                    <option value="">Select area</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.area}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address / Location Details</label>
                <input
                  value={profileLocation}
                  onChange={e => setProfileLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Nearby Landmark</label>
                <input
                  placeholder="e.g. Opposite LAUTECH Second Gate, Behind Bovas"
                  value={profileLandmark}
                  onChange={e => setProfileLandmark(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Business Bio / Description</label>
                <textarea
                  rows={3}
                  value={profileDescription}
                  onChange={e => setProfileDescription(e.target.value)}
                />
              </div>

              {/* Shop / Storefront Photo */}
              <div style={{ marginBottom: 20 }}>
                <ImageUpload
                  label="Shop Front / Workshop Photo (Storefront Picture) 🏪"
                  value={profileImageUrl}
                  onChange={url => setProfileImageUrl(url)}
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Upload a photo of your shop storefront, workshop, signpost, or studio so customers can easily locate and trust your business around LAUTECH.
                </small>
              </div>

              <button
                type="submit"
                className="btn-lime"
                style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes →'}
              </button>
            </form>
          </section>
        )}

        {/* Edit Item Modal */}
        {editingListing && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: 18 }}>
                  ✏️ Edit {editingListing.kind === 'PRODUCT' ? 'Product' : editingListing.kind === 'SERVICE' ? 'Service' : 'Project'}
                </h2>
                <button className="btn-outline btn-sm" onClick={() => setEditingListing(null)}>✕</button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label>Item Type</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="editKind"
                        checked={editKind === 'PRODUCT'}
                        onChange={() => setEditKind('PRODUCT')}
                      />
                      🛍️ Product
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="editKind"
                        checked={editKind === 'SERVICE'}
                        onChange={() => setEditKind('SERVICE')}
                      />
                      🔧 Service
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="editKind"
                        checked={editKind === 'PROJECT'}
                        onChange={() => setEditKind('PROJECT')}
                      />
                      📁 Project Showcase
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Item Title *</label>
                  <input
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <CategorySelect
                    categories={categories}
                    listingType={editKind === 'PRODUCT' ? 'PRODUCT' : 'SERVICE'}
                    value={editCategoryId}
                    customCategory={editCustomCategory}
                    onChange={(id) => setEditCategoryId(id)}
                    onCustomCategoryChange={setEditCustomCategory}
                    required={false}
                    label="Category"
                    placeholder="Select category"
                  />

                  <div className="form-group">
                    <label>Campus Area</label>
                    <select value={editLocationId} onChange={e => setEditLocationId(e.target.value)}>
                      <option value="">Select area</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.area}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Price (₦)</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={editPriceOnRequest}
                      value={editPriceOnRequest ? '' : editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={editPriceOnRequest}
                        onChange={e => setEditPriceOnRequest(e.target.checked)}
                      />
                      Negotiable / Quote
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Visibility Status</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)}>
                      <option value="ACTIVE">🟢 Active (Visible in Catalog)</option>
                      <option value="HIDDEN">⚪ Hidden (Draft / Private)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Item Availability</label>
                    <select value={editAvailabilityStatus} onChange={e => setEditAvailabilityStatus(e.target.value as AvailabilityStatus)}>
                      <option value="AVAILABLE">🟢 Available</option>
                      <option value="RESERVED">🟡 Reserved</option>
                      <option value="SOLD">⚪ Sold</option>
                    </select>
                  </div>
                </div>

                <MultiImageUpload
                  label={
                    editKind === 'PRODUCT'
                      ? 'Product Photos (Cover photo + Gallery pictures) 📷'
                      : editKind === 'PROJECT'
                      ? 'Artisan Past Works Showcase (Portfolio Photos) 🛠️'
                      : 'Service Photos & Samples (Up to 5 pictures) 💼'
                  }
                  maxImages={5}
                  value={editImages}
                  onChange={imgs => {
                    setEditImages(imgs);
                    const first = imgs.split(',')[0];
                    if (first) setEditImageUrl(first);
                  }}
                />

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setEditingListing(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-lime btn-sm" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: 460 }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>🗑️ Delete Item</h3>
              <p style={{ fontSize: 14, color: '#374151', margin: '0 0 16px 0' }}>
                Are you sure you want to permanently remove <strong>"{itemToDelete.name}"</strong> from your catalog? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => setItemToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
