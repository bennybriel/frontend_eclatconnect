import React from 'react';
import { cleanPhone, request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Phone } from 'lucide-react';

interface DirectContactButtonsProps {
  phone?: string;
  whatsapp?: string;
  listingTitle?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** "compact": a WhatsApp button plus an icon-only call button, for listing cards */
  variant?: 'default' | 'compact';
}

export const DirectContactButtons: React.FC<DirectContactButtonsProps> = ({
  phone,
  whatsapp,
  listingTitle,
  size = 'sm',
  fullWidth = false,
  variant = 'default',
}) => {
  const { user } = useAuth();
  const contactPhone = phone || whatsapp;
  const contactWa = whatsapp || phone;

  if (!contactPhone && !contactWa) return null;

  const waNumber = cleanPhone(contactWa);
  const waMessage = encodeURIComponent(
    listingTitle
      ? `Hello, I saw "${listingTitle}" on ECLAT CONNECT and I would like to make an enquiry.`
      : 'Hello, I found you on ECLAT CONNECT and I would like to make an enquiry.'
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

  if (variant === 'compact') {
    return (
      <div className="contact-compact" onClick={e => e.stopPropagation()}>
        {contactWa && (
          <a
            className="contact-compact-wa"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://wa.me/${waNumber}?text=${waMessage}`}
            onClick={() => handleTrackClick('CHAT_WHATSAPP')}
          >
            <MessageCircle size={16} strokeWidth={2.2} aria-hidden="true" />
            WhatsApp
          </a>
        )}
        {contactPhone && (
          <a
            className="contact-compact-call"
            href={`tel:${contactPhone}`}
            aria-label={listingTitle ? `Call about ${listingTitle}` : 'Call'}
            title="Call"
            onClick={() => handleTrackClick('CALL')}
          >
            <Phone size={16} strokeWidth={2.2} aria-hidden="true" />
          </a>
        )}
      </div>
    );
  }

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
