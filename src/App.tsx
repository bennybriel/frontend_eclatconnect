import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { request } from './api/client';
import { Category, Location, Provider, Listing, ServiceRequest, RequestResponse, NotificationItem, Favorite } from './types';

// Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Toast, ToastNotice } from './components/Toast';
import { SignInPromptModal } from './components/SignInPromptModal';

// Pages
import { HomePage } from './pages/HomePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { RequestsPage } from './pages/RequestsPage';
import { PostRequestPage, RETURN_TO_KEY } from './pages/PostRequestPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { FILTER_PAGES, NOT_FOUND, buildUrl, filtersFrom, pageFor, pathFor, sectionPageFor, titleFor } from './routing';
import { recordRecent } from './utils/recent';

// Modals
import { ListingDetailsModal } from './pages/ListingDetailsModal';
import { RespondModal } from './pages/RespondModal';
import { ReportModal } from './pages/ReportModal';
import { ReviewModal, ReviewTarget } from './pages/ReviewModal';

// Pages most visitors never open on their first visit load on demand, so the first page arrives sooner
const MyRequestsPage = lazy(() => import('./pages/MyRequestsPage').then(m => ({ default: m.MyRequestsPage })));
const ResponsesPage = lazy(() => import('./pages/ResponsesPage').then(m => ({ default: m.ResponsesPage })));
const MyReviewsPage = lazy(() => import('./pages/MyReviewsPage').then(m => ({ default: m.MyReviewsPage })));
const FavouritesPage = lazy(() => import('./pages/FavouritesPage').then(m => ({ default: m.FavouritesPage })));
const VendorWorkspacePage = lazy(() => import('./pages/VendorWorkspacePage').then(m => ({ default: m.VendorWorkspacePage })));
const ProviderApplicationPage = lazy(() => import('./pages/ProviderApplicationPage').then(m => ({ default: m.ProviderApplicationPage })));
const NewListingPage = lazy(() => import('./pages/NewListingPage').then(m => ({ default: m.NewListingPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));

export const App: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // The page comes from the address bar (see routing.ts), so links, refresh and Back all work
  const [page, setPage] = useState<string>(() => pageFor(window.location.pathname));

  // Global taxonomy & data
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);
  const [myProviders, setMyProviders] = useState<Provider[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [responses, setResponses] = useState<RequestResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Favourites state (persisted across sessions for logged-in users)
  const [favoritesList, setFavoritesList] = useState<Favorite[]>([]);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  // Admin Data
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [adminProviders, setAdminProviders] = useState<Provider[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [adminPermissions, setAdminPermissions] = useState<any[]>([]);
  const [adminActivityLogs, setAdminActivityLogs] = useState<any[]>([]);
  const [adminWhatsappLogs, setAdminWhatsappLogs] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);

  // Search and filter state
  // Search filters start from the address too, e.g. /artisans?q=tailor&area=...&category=...
  const initialFilters = filtersFrom(FILTER_PAGES.includes(pageFor(window.location.pathname)) ? window.location.search : '');
  const [q, setQ] = useState(initialFilters.q);
  const [locationFilter, setLocationFilter] = useState(initialFilters.area);
  const [categoryFilter, setCategoryFilter] = useState(initialFilters.category);

  // Modals state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [respondingTo, setRespondingTo] = useState<ServiceRequest | null>(null);
  const [reportingItem, setReportingItem] = useState<any | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  // Toast feedback
  const [notice, setNotice] = useState<ToastNotice | null>(null);

  const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setNotice({ text, type });
  };

  // Initial Taxonomy fetch
  useEffect(() => {
    request<Category[]>('/public/categories').then(setCategories).catch(() => {});
    request<Location[]>('/public/locations').then(setLocations).catch(() => {});
  }, []);

  // Sync notifications count & user-specific data
  const refreshUserData = async () => {
    if (!isAuthenticated) {
      setMyProviders([]);
      setMyListings([]);
      setMyRequests([]);
      setResponses([]);
      setNotifications([]);
      setUnreadCount(0);
      setFavoritesList([]);
      setFavoritesMap({});
      return;
    }

    try {
      const [provs, reqs, notes, resps, favs] = await Promise.all([
        request<Provider[]>('/me/providers').catch(() => []),
        request<ServiceRequest[]>('/me/requests').catch(() => []),
        request<NotificationItem[]>('/me/notifications').catch(() => []),
        request<RequestResponse[]>('/me/responses').catch(() => []),
        request<Favorite[]>('/me/favorites').catch(() => []),
      ]);

      setMyProviders(provs);
      setMyRequests(reqs);
      setNotifications(notes);
      setUnreadCount(notes.filter(n => !n.read_at).length);
      setResponses(resps);
      setFavoritesList(favs);
      const map: Record<string, boolean> = {};
      favs.forEach(f => {
        if (f.item_id) map[f.item_id] = true;
        if (f.listing_id) map[f.listing_id] = true;
      });
      setFavoritesMap(map);

      if (provs.length > 0) {
        request<Listing[]>('/me/listings').then(setMyListings).catch(() => []);
      }
    } catch {}
  };

  const handleToggleFavorite = async (item: any) => {
    if (!isAuthenticated) {
      setShowSignInPrompt(true);
      return;
    }

    const itemId = String(item.id || item.item_id);
    const currentlyFav = !!favoritesMap[itemId];

    // Optimistic UI update
    setFavoritesMap(prev => ({ ...prev, [itemId]: !currentlyFav }));

    try {
      const res = await request<{ is_favorite: boolean; message: string }>('/me/favorites/toggle', 'POST', {
        item_id: itemId,
        item_title: item.name || item.title,
        item_type: item.kind || item.type || 'PRODUCT',
        item_price: item.price || item.budget,
        item_location: item.location,
        item_image_url: item.image_url || (item.images ? item.images.split(',')[0] : undefined),
        provider_name: item.provider_name,
        phone: item.phone,
        whatsapp: item.whatsapp,
        description: item.description,
      });

      setFavoritesMap(prev => ({ ...prev, [itemId]: res.is_favorite }));
      showToast(res.message, res.is_favorite ? 'success' : 'info');

      // Refresh favourites list
      request<Favorite[]>('/me/favorites').then(favs => {
        setFavoritesList(favs);
        const map: Record<string, boolean> = {};
        favs.forEach(f => {
          if (f.item_id) map[f.item_id] = true;
          if (f.listing_id) map[f.listing_id] = true;
        });
        setFavoritesMap(map);
      }).catch(() => {});
    } catch (err: any) {
      setFavoritesMap(prev => ({ ...prev, [itemId]: currentlyFav }));
      showToast(err.message, 'error');
    }
  };

  const handleRemoveFavorite = async (itemId: string) => {
    setFavoritesMap(prev => ({ ...prev, [itemId]: false }));
    setFavoritesList(prev => prev.filter(f => f.item_id !== itemId));
    try {
      await request(`/me/favorites/${itemId}`, 'DELETE');
      showToast('Removed from favourites', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
      request<Favorite[]>('/me/favorites').then(setFavoritesList).catch(() => {});
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [isAuthenticated, user?.id]);

  // Load catalog items based on current page
  const loadCatalogData = async (override?: { q?: string; location_id?: string; category_id?: string }) => {
    // Personal pages need a signed-in user; they show their own sign-in prompt otherwise
    const personalPages = ['My Requests', 'Responses', 'Notifications', 'Vendor Workspace', 'Vendor Dashboard'];
    if (!isAuthenticated && personalPages.includes(page)) {
      return;
    }
    setLoadingCatalog(true);
    try {
      const activeQ = override?.q !== undefined ? override.q : q;
      const activeLoc = override?.location_id !== undefined ? override.location_id : locationFilter;
      const activeCat = override?.category_id !== undefined ? override.category_id : categoryFilter;

      const params = new URLSearchParams();
      if (activeQ) params.set('q', activeQ);
      if (activeLoc) params.set('location_id', activeLoc);
      if (activeCat) params.set('category_id', activeCat);

      const qs = params.toString() ? `?${params.toString()}` : '';

      if (page === 'Businesses') {
        const data = await request(`/public/providers${qs}`);
        setItems(data.filter((p: any) => p.type === 'BUSINESS'));
      } else if (page === 'Professionals' || page === 'Artisans') {
        const data = await request(`/public/providers${qs}`);
        setItems(data.filter((p: any) => p.type === 'PROFESSIONAL'));
      } else if (page === 'Products') {
        params.set('kind', 'PRODUCT');
        const data = await request(`/public/listings?${params.toString()}`);
        setItems(data);
      } else if (page === 'Pre-owned') {
        const [preownedReqs, usedListings] = await Promise.all([
          request<any[]>(`/public/requests?request_type=PREOWNED_SALE${qs ? `&${params.toString()}` : ''}`).catch(() => []),
          request<any[]>(`/public/listings?kind=PRODUCT&q=used${activeLoc ? `&location_id=${activeLoc}` : ''}${activeCat ? `&category_id=${activeCat}` : ''}`).catch(() => []),
        ]);
        setItems([...preownedReqs, ...usedListings]);
      } else if (page === 'Services') {
        params.set('kind', 'SERVICE');
        const data = await request(`/public/listings?${params.toString()}`);
        setItems(data);
      } else if (page === 'Requests') {
        const data = await request(`/public/requests${qs}`);
        setItems(data.filter((r: any) => r.request_type !== 'PREOWNED_SALE'));
      } else if (page === 'My Requests') {
        const data = await request('/me/requests');
        setMyRequests(data);
      } else if (page === 'Responses') {
        const data = await request('/me/responses');
        setResponses(data);
      } else if (page === 'Notifications') {
        const data = await request('/me/notifications');
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read_at).length);
      } else if (page === 'Vendor Workspace' || page === 'Vendor Dashboard') {
        const [provs, lists, openReqs] = await Promise.all([
          request<Provider[]>('/me/providers').catch(() => []),
          request<Listing[]>('/me/listings').catch(() => []),
          request<ServiceRequest[]>('/public/requests').catch(() => []),
        ]);
        setMyProviders(provs);
        setMyListings(lists);
        setItems(openReqs);
      } else if (page === 'Admin' && isAdmin) {
        const [overview, provs, us, rls, perms, acts, wa, reps] = await Promise.all([
          request('/admin/overview').catch(() => null),
          request('/admin/providers').catch(() => []),
          request('/admin/users').catch(() => []),
          request('/admin/roles').catch(() => []),
          request('/admin/permissions').catch(() => []),
          request('/admin/activity-logs').catch(() => []),
          request('/admin/whatsapp-logs').catch(() => []),
          request('/admin/reports').catch(() => []),
        ]);
        setAdminOverview(overview);
        setAdminProviders(provs);
        setAdminUsers(us);
        setAdminRoles(rls);
        setAdminPermissions(perms);
        setAdminActivityLogs(acts);
        setAdminWhatsappLogs(wa);
        setAdminReports(reps);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleResetFilters = () => {
    setQ('');
    setLocationFilter('');
    setCategoryFilter('');
    loadCatalogData({ q: '', location_id: '', category_id: '' });
  };

  useEffect(() => {
    loadCatalogData();
  }, [page, locationFilter, categoryFilter]);

  // Account activation links (?activate=TOKEN) open the sign-in page once the account is active
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const activateToken = params.get('activate');
    if (!activateToken) return;
    request<{ message: string }>('/auth/activate', 'POST', { token: activateToken })
      .then(res => {
        showToast(res.message || 'Vendor account activated successfully! You may now sign in.', 'success');
        handleNavigate('Auth', { replace: true });
      })
      .catch(err => {
        showToast(err.message, 'error');
        handleNavigate('Auth', { replace: true });
      });
    // Runs once, on the first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back and Forward: show the page, filters and open listing that the address describes
  useEffect(() => {
    const handlePopState = () => {
      const nextPage = pageFor(window.location.pathname);
      setPage(nextPage);
      if (FILTER_PAGES.includes(nextPage)) {
        const f = filtersFrom(window.location.search);
        setQ(f.q);
        setLocationFilter(f.area);
        setCategoryFilter(f.category);
      }
      const openId = new URLSearchParams(window.location.search).get('open');
      if (openId) pendingOpenId.current = openId;
      else setSelectedItem(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Older or alternative addresses (/privacy, /login, /professionals...) switch to the official one,
  // so every page has exactly one address
  useEffect(() => {
    if (page === NOT_FOUND) return;
    const official = pathFor(page);
    if (window.location.pathname !== official) {
      window.history.replaceState(window.history.state, '', official + window.location.search);
    }
    // Only for the address the visitor arrived on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The browser tab names the page, e.g. "Artisans · ECLAT CONNECT"
  useEffect(() => {
    document.title = titleFor(page);
  }, [page]);

  // Keep the address in step with the search filters, without adding history entries per keystroke
  useEffect(() => {
    if (!FILTER_PAGES.includes(page)) return;
    const open = new URLSearchParams(window.location.search).get('open') || undefined;
    const url = buildUrl(pathFor(page), { q: q.trim() || undefined, area: locationFilter, category: categoryFilter, open });
    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(window.history.state, '', url);
    }
  }, [page, q, locationFilter, categoryFilter]);

  // Listing links: /businesses?open=<id> opens that listing once the section has loaded
  const pendingOpenId = useRef<string | null>(new URLSearchParams(window.location.search).get('open'));
  useEffect(() => {
    const id = pendingOpenId.current;
    // Requests open in their own sheet on the Requests page (/requests?open=<id>)
    if (page === 'Requests') {
      pendingOpenId.current = null;
      return;
    }
    if (!id || loadingCatalog || items.length === 0) return;
    const found = items.find(it => String(it.id) === id);
    if (found) setSelectedItem(found);
    pendingOpenId.current = null;
  }, [items, loadingCatalog]);

  /** Opens a listing and gives it its own address, so it can be shared and Back closes it */
  const openItem = (item: any) => {
    setSelectedItem(item);
    recordRecent(item);
    if (!item?.id) return;
    const section = sectionPageFor(item);
    const keepFilters = pathFor(section) === pathFor(page);
    const url = buildUrl(pathFor(section), {
      q: keepFilters ? q.trim() || undefined : undefined,
      area: keepFilters ? locationFilter : undefined,
      category: keepFilters ? categoryFilter : undefined,
      open: String(item.id),
    });
    window.history.pushState({ eclatModal: true }, '', url);
  };

  /** Closes the listing: steps back if opening it added a history entry, otherwise tidies the address */
  const closeItem = () => {
    if (window.history.state?.eclatModal) {
      window.history.back();
      return;
    }
    setSelectedItem(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has('open')) {
      params.delete('open');
      const qs = params.toString();
      window.history.replaceState(window.history.state, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }
  };

  /** Shows a page and puts its address in the address bar (see routing.ts) */
  const handleNavigate = (targetPage: string, options: { replace?: boolean } = {}) => {
    setSelectedItem(null);
    setPage(targetPage);
    const url = pathFor(targetPage);
    if (url !== window.location.pathname + window.location.search) {
      if (options.replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Header search: search the section the visitor is browsing, otherwise Products.
  // Clears category and area filters so a new keyword search starts fresh.
  const handleHeaderSearch = (searchQ: string) => {
    const searchableSections = ['Businesses', 'Products', 'Professionals', 'Artisans', 'Services', 'Pre-owned', 'Requests'];
    const target = searchableSections.includes(page) ? page : 'Products';
    setQ(searchQ);
    setCategoryFilter('');
    setLocationFilter('');
    if (target === page) {
      // Same page: filters may not change, so load the results directly
      loadCatalogData({ q: searchQ, category_id: '', location_id: '' });
    } else {
      handleNavigate(target);
    }
  };

  return (
    <>
      <Header
        currentPage={page}
        onNavigate={handleNavigate}
        onSearch={handleHeaderSearch}
        unreadCount={unreadCount}
      />

      <main className="main-content">
        <Toast notice={notice} onClose={() => setNotice(null)} />

        <Suspense
          fallback={
            <div className="page-loading" role="status">
              <span className="page-loading-spinner" aria-hidden="true" />
              Loading…
            </div>
          }
        >

        {/* 1. Home Module */}
        {page === 'Home' && (
          <HomePage
            categories={categories}
            locations={locations}
            selectedCategory={categoryFilter}
            onSelectCategory={catId => setCategoryFilter(catId)}
            onNavigate={handleNavigate}
            onSearch={(searchQ, catId, locId) => {
              // A homepage search replaces any earlier filters, so old ones never linger
              setQ(searchQ || '');
              setCategoryFilter(catId || '');
              setLocationFilter(locId || '');
            }}
            onSelectItem={openItem}
            favorites={favoritesMap}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* 2. Directory Modules (Businesses, Products, Artisans, Services, Pre-owned) */}
        {['Businesses', 'Products', 'Professionals', 'Artisans', 'Services', 'Pre-owned'].includes(page) && (
          <DirectoryPage
            pageTitle={page === 'Professionals' || page === 'Artisans' ? 'Campus Artisans' : page === 'Pre-owned' ? 'Pre-owned Items' : page}
            items={items}
            categories={categories}
            locations={locations}
            q={q}
            locationFilter={locationFilter}
            categoryFilter={categoryFilter}
            onSearchChange={setQ}
            onLocationChange={setLocationFilter}
            onCategoryChange={setCategoryFilter}
            onFilterSubmit={loadCatalogData}
            onResetFilters={handleResetFilters}
            onSelectItem={openItem}
            onNavigate={handleNavigate}
            favorites={favoritesMap}
            onToggleFavorite={handleToggleFavorite}
            loading={loadingCatalog}
          />
        )}

        {/* 3. Public Service Requests Feed */}
        {page === 'Requests' && (
          <RequestsPage
            requests={items}
            categories={categories}
            locations={locations}
            q={q}
            locationFilter={locationFilter}
            categoryFilter={categoryFilter}
            onSearchChange={setQ}
            onLocationChange={setLocationFilter}
            onCategoryChange={setCategoryFilter}
            onFilterSubmit={loadCatalogData}
            onResetFilters={handleResetFilters}
            onNavigate={handleNavigate}
            onRespondToRequest={setRespondingTo}
            loading={loadingCatalog}
          />
        )}

        {/* 4. Post What I Need (Request Wizard & Pre-owned Sales/Requests) */}
        {(page === 'Post What I Need' || page === 'Post Pre-owned Request' || page === 'Post Product Request' || page === 'Post Service Request' || page === 'Sell Pre-owned Item') && (
          <PostRequestPage
            categories={categories}
            locations={locations}
            currentPage={page}
            defaultMode={
              page === 'Sell Pre-owned Item'
                ? 'PREOWNED_SALE'
                : page === 'Post Pre-owned Request'
                ? 'PREOWNED_REQUEST'
                : page === 'Post Product Request'
                ? 'PRODUCT'
                : 'SERVICE'
            }
            initialLookingForPreowned={page === 'Post Pre-owned Request'}
            onSuccess={() => {
              refreshUserData();
              handleNavigate('My Requests');
            }}
            onToast={showToast}
            onNavigate={handleNavigate}
          />
        )}

        {/* 5. My Requests Activity */}
        {page === 'My Requests' && (
          <MyRequestsPage
            requests={myRequests}
            onRefresh={() => {
              request<ServiceRequest[]>('/me/requests').then(setMyRequests);
            }}
            onNavigate={handleNavigate}
            onToast={showToast}
          />
        )}

        {/* 6. Quotes / Responses Received */}
        {page === 'Responses' && (
          <ResponsesPage
            responses={responses}
            onNavigate={handleNavigate}
            onReviewProvider={setReviewTarget}
          />
        )}

        {/* 6b. My Customer Reviews */}
        {page === 'My Reviews' && (
          <MyReviewsPage
            onNavigate={handleNavigate}
            onToast={showToast}
          />
        )}

        {/* 6c. My Saved Favourites */}
        {page === 'Favourites' && (
          <FavouritesPage
            favorites={favoritesList}
            onRemoveFavorite={handleRemoveFavorite}
            onSelectItem={openItem}
            onNavigate={handleNavigate}
            onToast={showToast}
          />
        )}

        {/* 7. Vendor Workspace & Dashboard Portal */}
        {(page === 'Vendor Workspace' || page === 'Vendor Dashboard') && (
          <VendorWorkspacePage
            myProviders={myProviders}
            myListings={myListings}
            openRequests={items}
            categories={categories}
            locations={locations}
            unreadCount={unreadCount}
            onRefresh={() => {
              refreshUserData();
              loadCatalogData();
            }}
            onNavigate={handleNavigate}
            onRespondToRequest={setRespondingTo}
            onToast={showToast}
          />
        )}

        {/* 8. Provider Application (Register / Edit Profile) */}
        {page === 'Provider Application' && (
          <ProviderApplicationPage
            categories={categories}
            locations={locations}
            existingProvider={myProviders[0] || null}
            onSuccess={() => {
              refreshUserData();
              handleNavigate('Vendor Workspace');
            }}
            onToast={showToast}
            onNavigate={handleNavigate}
          />
        )}

        {/* 9. Publish New Listing */}
        {page === 'New Listing' && (
          <NewListingPage
            categories={categories}
            locations={locations}
            myProviders={myProviders}
            onSuccess={() => {
              refreshUserData();
              handleNavigate('Vendor Workspace');
            }}
            onToast={showToast}
            onNavigate={handleNavigate}
          />
        )}

        {/* 10. Notifications Center */}
        {page === 'Notifications' && (
          <NotificationsPage
            notifications={notifications}
            onRefresh={refreshUserData}
            onNavigate={handleNavigate}
            onToast={showToast}
          />
        )}

        {/* 11. User Account & Dashboard */}
        {page === 'Account' && (
          <AccountPage
            myProviders={myProviders}
            myRequestsCount={myRequests.length}
            unreadCount={unreadCount}
            favoritesCount={favoritesList.length}
            onNavigate={handleNavigate}
            onToast={showToast}
          />
        )}

        {/* 12. Authentication & Onboarding */}
        {page === 'Auth' && (
          <AuthPage
            onSuccess={signedInUser => {
              refreshUserData();
              // Return visitors to what they were doing before signing in
              let target = 'Home';
              try {
                const returnTo = sessionStorage.getItem(RETURN_TO_KEY);
                if (returnTo) {
                  target = returnTo;
                  sessionStorage.removeItem(RETURN_TO_KEY);
                }
              } catch {}
              // Vendors and artisans go to their workspace, which guides them through setup
              if (target === 'Home' && signedInUser && ['VENDOR', 'ARTISAN'].includes(signedInUser.role)) {
                target = 'Vendor Workspace';
              }
              handleNavigate(target);
            }}
            onToast={showToast}
          />
        )}

        {/* 13. Administrator Console */}
        {page === 'Admin' && isAdmin && (
          <AdminDashboardPage
            overviewData={adminOverview}
            providers={adminProviders}
            users={adminUsers}
            roles={adminRoles}
            permissions={adminPermissions}
            activityLogs={adminActivityLogs}
            whatsappLogs={adminWhatsappLogs}
            reports={adminReports}
            categories={categories}
            locations={locations}
            onRefresh={loadCatalogData}
            onNavigate={handleNavigate}
            onToast={showToast}
          />
        )}

        {/* 14. Legal Documents: Privacy Policy & Terms of Service */}
        {page === 'Privacy Policy' && (
          <PrivacyPolicyPage onNavigate={handleNavigate} />
        )}
        {page === 'Terms of Service' && (
          <TermsOfServicePage onNavigate={handleNavigate} />
        )}
        {page === NOT_FOUND && <NotFoundPage onNavigate={handleNavigate} />}
        </Suspense>
      </main>

      {/* Reusable Modals */}
      {selectedItem && (
        <ListingDetailsModal
          item={selectedItem}
          isFavorite={selectedItem ? Boolean(favoritesMap[selectedItem.id] || favoritesMap[selectedItem.item_id]) : false}
          onToggleFavorite={handleToggleFavorite}
          related={items.filter(it => sectionPageFor(it) === sectionPageFor(selectedItem))}
          onSelectRelated={openItem}
          onClose={closeItem}
          onReport={item => {
            closeItem();
            setReportingItem(item);
          }}
          onToast={showToast}
        />
      )}

      {/* Visitor Sign-In Prompt for Favourites */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        onSignIn={() => {
          setShowSignInPrompt(false);
          handleNavigate('Auth');
        }}
        onRegister={() => {
          setShowSignInPrompt(false);
          handleNavigate('Auth');
        }}
      />

      {respondingTo && (
        <RespondModal
          serviceRequest={respondingTo}
          myProviders={myProviders}
          onClose={() => setRespondingTo(null)}
          onSuccess={() => {
            setRespondingTo(null);
            refreshUserData();
          }}
          onToast={showToast}
        />
      )}

      {reportingItem && (
        <ReportModal
          item={reportingItem}
          onClose={() => setReportingItem(null)}
          onSignIn={() => {
            setReportingItem(null);
            handleNavigate('Auth');
          }}
          onToast={showToast}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          target={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            setReviewTarget(null);
            refreshUserData();
          }}
          onToast={showToast}
        />
      )}

      {/* Public Footer (hidden when inside full Portal layout) */}
      {!['Vendor Workspace', 'Vendor Dashboard'].includes(page) && (
        <Footer onNavigate={handleNavigate} />
      )}

      {/* Docked Mobile Bottom Navigation Bar (Visible on mobile viewports) */}
      <MobileBottomNav currentPage={page} onNavigate={handleNavigate} />
    </>
  );
};
