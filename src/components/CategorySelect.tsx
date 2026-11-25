import React from 'react';
import { Category } from '../types';

export type ListingCategoryType = 'BUSINESS' | 'ARTISAN' | 'SERVICE' | 'PRODUCT' | 'ALL';

interface CategorySelectProps {
  categories: Category[];
  listingType: ListingCategoryType;
  value: string;
  customCategory?: string;
  onChange: (categoryId: string, categoryName: string) => void;
  onCustomCategoryChange?: (val: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const getCategoriesForType = (categories: Category[], listingType: ListingCategoryType): Category[] => {
  if (!categories || categories.length === 0) return [];

  const filtered = categories.filter(c => {
    if (listingType === 'ALL') return true;
    const catType = (c.target_type || 'ALL').toUpperCase();
    if (catType === 'ALL') return true;
    if (listingType === 'SERVICE') {
      return catType === 'SERVICE' || catType === 'ARTISAN';
    }
    return catType === listingType.toUpperCase();
  });

  // Sort: standard alphabetically, with "Others" guaranteed at the very end
  return filtered.sort((a, b) => {
    const isAOthers = a.name.trim().toLowerCase() === 'others';
    const isBOthers = b.name.trim().toLowerCase() === 'others';
    if (isAOthers) return 1;
    if (isBOthers) return -1;
    return a.name.localeCompare(b.name);
  });
};

export const CategorySelect: React.FC<CategorySelectProps> = ({
  categories,
  listingType,
  value,
  customCategory = '',
  onChange,
  onCustomCategoryChange,
  required = true,
  label = 'Category *',
  placeholder = 'Select appropriate category',
  disabled = false,
}) => {
  const relevantCategories = getCategoriesForType(categories, listingType);
  const selectedCat = relevantCategories.find(c => c.id === value);
  const isOthersSelected = selectedCat?.name.trim().toLowerCase() === 'others';

  return (
    <div>
      <div className="form-group">
        {label && <label>{label}</label>}
        <select
          required={required}
          value={value}
          disabled={disabled}
          onChange={e => {
            const catId = e.target.value;
            const chosen = relevantCategories.find(c => c.id === catId);
            onChange(catId, chosen ? chosen.name : '');
          }}
        >
          <option value="">{placeholder}</option>
          {relevantCategories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isOthersSelected && (
        <div className="form-group" style={{ marginTop: 10, animation: 'fadeIn 0.2s ease-in' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-dark, #1a1a1a)' }}>
            Please specify your category {required && '*'}
          </label>
          <input
            type="text"
            required={required}
            maxLength={120}
            placeholder={
              listingType === 'ARTISAN'
                ? 'e.g. Tailoring, Shoe Making, Welding, Generator Repair...'
                : listingType === 'BUSINESS'
                ? 'e.g. Printing Press, Event Decor, Pharmacy, Photography...'
                : listingType === 'SERVICE'
                ? 'e.g. Laundry, House Cleaning, Graphic Design, Catering...'
                : 'e.g. Musical Instruments, Solar Panels, Footwear, Books...'
            }
            value={customCategory}
            onChange={e => onCustomCategoryChange?.(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1.5px solid var(--primary-accent, #6366f1)',
              borderRadius: 8,
              fontSize: 14,
              background: '#fff',
            }}
          />
          <small style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, display: 'block' }}>
            💡 Your specified category will be saved, immediately searchable, and reviewed for inclusion by administrators.
          </small>
        </div>
      )}
    </div>
  );
};
