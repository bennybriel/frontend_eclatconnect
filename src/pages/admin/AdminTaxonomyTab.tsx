import React, { useState, useEffect } from 'react';
import { Category, Location, CategorySuggestion } from '../../types';
import { request } from '../../api/client';

interface AdminTaxonomyTabProps {
  categories: Category[];
  locations: Location[];
  onRefresh: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminTaxonomyTab: React.FC<AdminTaxonomyTabProps> = ({
  categories,
  locations,
  onRefresh,
  onToast,
}) => {
  const [catName, setCatName] = useState('');
  const [catTargetType, setCatTargetType] = useState<'ALL' | 'BUSINESS' | 'ARTISAN' | 'SERVICE' | 'PRODUCT'>('BUSINESS');
  const [activeTypeTab, setActiveTypeTab] = useState<'ALL' | 'BUSINESS' | 'ARTISAN' | 'SERVICE' | 'PRODUCT'>('ALL');
  const [areaName, setAreaName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [submittingCat, setSubmittingCat] = useState(false);
  const [submittingLoc, setSubmittingLoc] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedMergeTargets, setSelectedMergeTargets] = useState<{ [id: string]: string }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await request<CategorySuggestion[]>('/admin/category-suggestions');
      setSuggestions(data || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setSubmittingCat(true);
    try {
      await request('/admin/categories', 'POST', {
        name: catName.trim(),
        target_type: catTargetType,
      });
      onToast(`Category "${catName}" (${catTargetType}) added successfully`, 'success');
      setCatName('');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleApproveSuggestion = async (sugg: CategorySuggestion) => {
    setProcessingId(sugg.id);
    try {
      await request(`/admin/category-suggestions/${sugg.id}/approve`, 'POST', {
        name: sugg.name,
        target_type: sugg.target_type,
      });
      onToast(`✓ Approved "${sugg.name}" as an active ${sugg.target_type} category. Associated items updated!`, 'success');
      await loadSuggestions();
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMergeSuggestion = async (sugg: CategorySuggestion) => {
    const targetCatId = selectedMergeTargets[sugg.id];
    if (!targetCatId) {
      onToast('Please select a target category to merge into', 'error');
      return;
    }
    const targetCat = categories.find(c => c.id === targetCatId);
    setProcessingId(sugg.id);
    try {
      await request(`/admin/category-suggestions/${sugg.id}/merge`, 'POST', {
        target_category_id: targetCatId,
      });
      onToast(`✓ Grouped "${sugg.name}" under "${targetCat?.name || 'selected category'}". All matching items re-assigned!`, 'success');
      await loadSuggestions();
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSuggestion = async (sugg: CategorySuggestion) => {
    setProcessingId(sugg.id);
    try {
      await request(`/admin/category-suggestions/${sugg.id}/reject`, 'POST', {
        reason: 'Dismissed by administrator',
      });
      onToast(`Dismissed custom suggestion "${sugg.name}"`, 'info');
      await loadSuggestions();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    setSubmittingLoc(true);
    try {
      await request('/admin/locations', 'POST', {
        area: areaName.trim(),
        landmark: landmark.trim() || undefined,
      });
      onToast(`Campus area "${areaName}" added successfully`, 'success');
      setAreaName('');
      setLandmark('');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmittingLoc(false);
    }
  };

  const filteredCategories = categories.filter(c => {
    if (activeTypeTab === 'ALL') return true;
    const t = (c.target_type || 'ALL').toUpperCase();
    return t === activeTypeTab || t === 'ALL';
  });

  const pendingSuggestions = suggestions.filter(s => s.status === 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Pending Custom Category Submissions (Review & Grouping) */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📥 Custom Category Submissions</span>
              {pendingSuggestions.length > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                  {pendingSuggestions.length} Pending Review
                </span>
              )}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              When users select "Others" and specify a custom category, their submissions appear here. Approve them to make them official searchable categories, or group similar submissions under an existing category.
            </p>
          </div>
          <button className="btn-outline btn-sm" onClick={loadSuggestions} disabled={loadingSuggestions}>
            {loadingSuggestions ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {pendingSuggestions.length === 0 ? (
          <div style={{ padding: '20px', background: 'var(--warm-ivory)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
            ✓ All custom categories have been reviewed. No pending suggestions right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingSuggestions.map(sugg => (
              <div
                key={sugg.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 16,
                  background: '#fcfcfc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 15, color: 'var(--text-dark)' }}>🏷️ {sugg.name}</strong>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                      {sugg.target_type}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    Submitted by: <strong>{sugg.submitted_by_name || sugg.submitted_by_email || 'Community Member'}</strong>
                    {sugg.provider_name && <span> • Provider: <em>{sugg.provider_name}</em></span>}
                    {sugg.listing_name && <span> • Item: <em>{sugg.listing_name}</em></span>}
                    {sugg.request_title && <span> • Request: <em>{sugg.request_title}</em></span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Action 1: Approve as New Official Category */}
                  <button
                    className="btn-lime btn-sm"
                    disabled={processingId === sugg.id}
                    onClick={() => handleApproveSuggestion(sugg)}
                    title="Creates this category and updates all matching listings and requests"
                  >
                    ✓ Approve as Category
                  </button>

                  {/* Action 2: Group / Merge under Existing Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <select
                      style={{ padding: '6px 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid var(--border)' }}
                      value={selectedMergeTargets[sugg.id] || ''}
                      onChange={e => setSelectedMergeTargets(prev => ({ ...prev, [sugg.id]: e.target.value }))}
                    >
                      <option value="">Group under existing category...</option>
                      {categories.filter(c => c.name.toLowerCase() !== 'others').map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.target_type || 'ALL'})
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-outline btn-sm"
                      disabled={processingId === sugg.id || !selectedMergeTargets[sugg.id]}
                      onClick={() => handleMergeSuggestion(sugg)}
                      title="Reassigns all associated items to this chosen category"
                    >
                      Merge
                    </button>
                  </div>

                  {/* Action 3: Dismiss */}
                  <button
                    className="btn-outline btn-sm"
                    style={{ color: '#ef4444' }}
                    disabled={processingId === sugg.id}
                    onClick={() => handleRejectSuggestion(sugg)}
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories & Campus Locations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20 }}>
        {/* Categories Management by Listing Type */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Marketplace Categories ({categories.length})</h3>
          <p style={{ margin: '0 0 14px 0', color: 'var(--text-muted)', fontSize: 12.5 }}>
            Specific category taxonomies mapped to each listing type: Businesses, Artisans, Services, and Products.
          </p>

          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {(['ALL', 'BUSINESS', 'ARTISAN', 'SERVICE', 'PRODUCT'] as const).map(type => (
              <button
                key={type}
                onClick={() => setActiveTypeTab(type)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: activeTypeTab === type ? 700 : 500,
                  border: '1px solid var(--border)',
                  background: activeTypeTab === type ? 'var(--dark-moss, #2e4a3d)' : '#fff',
                  color: activeTypeTab === type ? '#fff' : 'var(--text-dark)',
                  cursor: 'pointer',
                }}
              >
                {type === 'ALL' ? 'All Types' : type === 'BUSINESS' ? 'Businesses' : type === 'ARTISAN' ? 'Artisans' : type === 'SERVICE' ? 'Services' : 'Products'}
              </button>
            ))}
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="New Category Name..."
                value={catName}
                onChange={e => setCatName(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
              />
              <select
                value={catTargetType}
                onChange={e => setCatTargetType(e.target.value as any)}
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12.5 }}
              >
                <option value="BUSINESS">Businesses</option>
                <option value="ARTISAN">Artisans</option>
                <option value="SERVICE">Services</option>
                <option value="PRODUCT">Products</option>
                <option value="ALL">All Types</option>
              </select>
            </div>
            <button type="submit" className="btn-lime btn-sm" disabled={submittingCat || !catName.trim()} style={{ alignSelf: 'flex-start' }}>
              + Add Category
            </button>
          </form>

          {/* Categorized List */}
          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {filteredCategories.map(c => {
              const isOthers = c.name.toLowerCase() === 'others';
              return (
                <span
                  key={c.id}
                  style={{
                    background: isOthers ? '#fef3c7' : 'var(--warm-ivory)',
                    border: isOthers ? '1px solid #f59e0b' : '1px solid var(--border)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <strong>{c.name}</strong>
                  <span style={{ fontSize: 10, color: '#666', background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>
                    {c.target_type || 'ALL'}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Campus Locations Management */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>LAUTECH & Ogbomoso Zones ({locations.length})</h3>
          <p style={{ margin: '0 0 14px 0', color: 'var(--text-muted)', fontSize: 12.5 }}>
            General campus and town areas used to protect private customer addresses while enabling zone-based search.
          </p>
          <form onSubmit={handleAddLocation} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <input
              placeholder="Campus Area (e.g. Stadium Road, Adenike, Under G)"
              value={areaName}
              onChange={e => setAreaName(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Landmark (e.g. Near Bovas, Main Gate)"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
              />
              <button type="submit" className="btn-lime btn-sm" disabled={submittingLoc || !areaName.trim()}>
                + Add Zone
              </button>
            </div>
          </form>

          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {locations.map(loc => (
              <div key={loc.id} style={{ padding: '6px 10px', background: 'var(--warm-ivory)', borderRadius: 6, fontSize: 12.5, border: '1px solid var(--border)' }}>
                <strong>📍 {loc.area}</strong> {loc.landmark && <span style={{ color: '#666' }}>({loc.landmark})</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
