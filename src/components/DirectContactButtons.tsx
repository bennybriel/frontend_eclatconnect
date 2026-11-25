import React from 'react';
import { cleanPhone, request } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface DirectContactButtonsProps {
  phone?: string;
  whatsapp?: string;
  listingTitle?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const DirectContactButtons: React.FC<DirectContactButtonsProps> = ({
  phone,
  whatsapp,
  listingTitle,
  size = 'sm',
  fullWidth = false,
}) => {
  const { user } = useAuth();
  const contactPhone = phone || whatsapp;
  const contactWa = whatsapp || phone;

  if (!contactPhone && !contactWa) return null;

  const waNumber = cleanPhone(contactWa);
  const waMessage = encodeURIComponent(
    'Hello, I found your business on ECLAT CONNECT. I would like to make an enquiry.'
  );

  const handleTrackClick = (action: 'CALL' | 'CHAT_WHATSAPP') => {
    try {
      request('/whatsapp/track-click', 'POST', {
        phone: contactPhone || contactWa,
        listing_title: listingTitle || 'Campus Listing',
        action: action,
        customer_name: user?.name || 'Web Visitor',
        customer_phone: user?.phone || '',
      }).catch(() => {});
    } catch {}
  };

  return (
    <div
      className="direct-contact-group"
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 10,
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {contactPhone && (
        <a
          href={`tel:${contactPhone}`}
          className={`btn-call ${size === 'sm' ? 'btn-sm' : ''}`}
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            flex: fullWidth ? 1 : undefined,
            fontWeight: 600,
          }}
          title={`Call ${contactPhone}`}
          onClick={e => {
            e.stopPropagation();
            handleTrackClick('CALL');
          }}
        >
          <span>📞</span> Call Now
        </a>
      )}
      {contactWa && (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          className={`btn-whatsapp ${size === 'sm' ? 'btn-sm' : ''}`}
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            flex: fullWidth ? 1 : undefined,
            fontWeight: 600,
          }}
          title="Chat on WhatsApp"
          onClick={e => {
            e.stopPropagation();
            handleTrackClick('CHAT_WHATSAPP');
          }}
        >
          <span>💬</span> Chat on WhatsApp
        </a>
      )}
    </div>
  );
};
