import React, { useState } from 'react';
import { request } from '../api/client';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG and WebP images are allowed');
      return;
    }

    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await request<{ url: string }>('/media/upload', 'POST', formData, true);
      onChange(res.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <small style={{ color: 'var(--brand-purple)', marginTop: 4 }}>Uploading image...</small>}
      {value && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={value}
            alt="Preview"
            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
          />
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => onChange('')}
          >
            Remove
          </button>
        </div>
      )}
      {error && <small style={{ color: '#dc2626', marginTop: 4 }}>{error}</small>}
    </div>
  );
};
