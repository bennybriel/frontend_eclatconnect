import React, { useState } from 'react';
import { request } from '../api/client';

export interface MultiImageUploadProps {
  label: string;
  hint?: string;
  images?: string[];
  value?: string;
  onChange?: (urls: any) => void;
  maxImages?: number;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  label,
  hint,
  images,
  value,
  onChange,
  maxImages = 5,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute active list from either array prop or comma-separated string prop
  const currentImages: string[] = React.useMemo(() => {
    if (Array.isArray(images)) return images;
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [images, value]);

  const notifyChange = (nextList: string[]) => {
    if (!onChange) return;
    if (typeof value === 'string' || (!Array.isArray(images) && value !== undefined)) {
      onChange(nextList.join(','));
    } else {
      onChange(nextList);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      setError(`You can upload a maximum of ${maxImages} images`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" exceeds the 5MB size limit.`);
          continue;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError(`"${file.name}" has an unsupported format. Use JPG, PNG or WebP.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await request<{ url: string }>('/media/upload', 'POST', formData, true);
        if (res && res.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0) {
        notifyChange([...currentImages, ...uploadedUrls]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload one or more images');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const next = [...currentImages];
    next.splice(index, 1);
    notifyChange(next);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const next = [...currentImages];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    notifyChange(next);
  };

  return (
    <div className="form-group" style={{ marginBottom: 20 }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {currentImages.length}/{maxImages} photos
        </span>
      </label>

      {hint && (
        <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontSize: 12.5 }}>
          {hint}
        </small>
      )}

      {/* Grid of Uploaded Image Previews */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        {currentImages.map((url, idx) => (
          <div
            key={url + idx}
            style={{
              position: 'relative',
              width: 90,
              height: 90,
              borderRadius: 8,
              overflow: 'hidden',
              border: idx === 0 ? '2px solid var(--purple, #581c87)' : '1px solid var(--border, #e2e8f0)',
              background: '#f9fafb',
            }}
          >
            <img
              src={url}
              alt={`Photo ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Badge for Primary / Cover Photo */}
            {idx === 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  background: 'var(--purple, #581c87)',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                }}
              >
                Cover
              </span>
            )}

            {/* Set as Primary button if not already cover */}
            {idx > 0 && (
              <button
                type="button"
                onClick={() => handleSetPrimary(idx)}
                title="Make this the cover photo"
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 4,
                  background: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 10,
                  padding: '2px 5px',
                  cursor: 'pointer',
                }}
              >
                ⭐ Cover
              </button>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              title="Remove image"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: 'rgba(239, 68, 68, 0.85)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Upload Button Tile */}
        {currentImages.length < maxImages && (
          <label
            style={{
              width: 90,
              height: 90,
              borderRadius: 8,
              border: '2px dashed #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: '#f8fafc',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: 24, lineHeight: 1 }}>{uploading ? '⏳' : '+'}</span>
            <span style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
              {uploading ? 'Uploading...' : 'Add Photos'}
            </span>
          </label>
        )}
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
