import React from 'react';
import { EclatLogo } from '../../components/EclatLogo';

interface LegalPageProps {
  onNavigate: (page: string) => void;
}

export const TermsOfServicePage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '36px 16px 80px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Header Breadcrumb & Branding */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EclatLogo size={38} onClick={() => onNavigate('Home')} />
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#4C016A' }}>
              Terms of Service
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#5e5963' }}>
              ECLAT CONNECT · Official Production Document · Effective November 24, 2026
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('Home')}
          style={{ background: '#FFFFFF', border: '1.5px solid #e6e0ea', color: '#242126', padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          ← Back to Homepage
        </button>
      </div>

      {/* Main Content Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '36px 32px',
          lineHeight: 1.75,
          fontSize: 15,
          color: '#242126',
          boxShadow: '0 4px 18px rgba(36, 33, 38, 0.06)',
          border: '1px solid #e6e0ea',
        }}
      >
        {/* Executive Summary */}
        <div
          style={{
            background: '#E8F5E9',
            borderRadius: 10,
            padding: '18px 22px',
            marginBottom: 32,
            borderLeft: '4px solid #075E54',
          }}
        >
          <strong style={{ color: '#075E54', fontSize: 15, display: 'block', marginBottom: 6 }}>
            Terms & Agreement Summary
          </strong>
          <p style={{ margin: 0, fontSize: 14, color: '#242126' }}>
            By using ECLAT CONNECT, you agree to these Terms of Service. ECLAT CONNECT acts solely as an introductory discovery venue connecting independent artisans, business owners, students, and buyers. Transactions, payments, and product inspections occur directly between the buyer and the vendor without middleman cuts.
          </p>
        </div>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            1. Platform Nature & Overview
          </h2>
          <p>
            <strong>ECLAT CONNECT</strong> is a local discovery and direct-connection directory serving the Ladoke Akintola University of Technology (LAUTECH) campus and the wider Ogbomoso community in Oyo State, Nigeria.
          </p>
          <p>
            <strong>ECLAT CONNECT is solely an intermediary introductory platform.</strong> We do not manufacture, sell, store, deliver, or inspect physical items, pre-owned products, or artisan services. Any agreement, transaction, pricing negotiation, and exchange of funds occurs strictly between the user and the vendor.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            2. User Eligibility & Account Responsibilities
          </h2>
          <p>By creating an account on ECLAT CONNECT, you represent and agree that:</p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>You will provide accurate, truthful, and complete information during registration.</li>
            <li>You are responsible for safeguarding your password and account credentials.</li>
            <li>You are responsible for all activities conducted under your registered account.</li>
            <li>You will promptly report any unauthorized use or security vulnerability to our administration team.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            3. Vendor & Artisan Listing Standards
          </h2>
          <p>All registered businesses, artisans, and sellers must maintain high standards of commercial honesty:</p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>
              <strong>Truthful Representation:</strong> All listings must accurately depict the item or service, authentic pricing, and specific location hub (Under G, Bovas, Aroje, General, Takie, etc.). Bait-and-switch pricing or stolen photos are strictly prohibited.
            </li>
            <li>
              <strong>Administrative Approval:</strong> Provider profiles are subject to review and verification by the ECLAT CONNECT administration team prior to public directory indexing. We reserve the right to suspend or reject any listing that fails our quality and safety criteria.
            </li>
            <li>
              <strong>Availability Management:</strong> Vendors and sellers must promptly update pre-owned items and products to <code>AVAILABLE</code>, <code>RESERVED</code>, or <code>SOLD</code> to maintain platform accuracy.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            4. Safety Precautions & In-Person Meeting Rules
          </h2>
          <p>
            Because ECLAT CONNECT facilitates direct local connections, users must exercise reasonable caution:
          </p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>
              <strong>Meet in Public Locations:</strong> When buying, selling, or hiring services, always arrange meetings in well-lit, populated public hubs around campus or town (such as Under G Gate, Bovas Axis, Aroje, General Hospital Roundabout, or Takie Square).
            </li>
            <li>
              <strong>Inspect Items Prior to Payment:</strong> Thoroughly inspect all physical goods (e.g. mobile phones, laptops, electronics, furniture, books) and confirm working condition before completing cash payments or bank transfers.
            </li>
            <li>
              <strong>Never Pay Upfront Advance Deposits:</strong> Do not transfer advance commitment fees or delivery deposits to unverified individuals before inspecting the item or meeting in person.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            5. Prohibited Items & Conduct
          </h2>
          <p>The following listings, requests, and behaviors are strictly forbidden on ECLAT CONNECT:</p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>Stolen property, counterfeit items, or pirated media.</li>
            <li>Weapons, firearms, fireworks, or dangerous chemicals.</li>
            <li>Illegal narcotics, controlled substances, or unauthorized pharmaceuticals.</li>
            <li>Academic dishonesty services (impersonation, forged credentials, or exam malpractice assistance).</li>
            <li>Pornography, adult services, or sexually explicit content.</li>
            <li>Fraudulent investment schemes, pyramid schemes, or unsolicited commercial spamming.</li>
          </ul>
          <p>Violating accounts will be permanently terminated and reported to Nigerian law enforcement authorities.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            6. Direct WhatsApp & Telephone Communication Etiquette
          </h2>
          <p>
            The direct &quot;Chat on WhatsApp&quot; and &quot;Call Now&quot; buttons are provided to facilitate genuine inquiries. Users agree to:
          </p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>Communicate respectfully and courteously with providers and customers.</li>
            <li>Use the default enquiry template or clearly specify the product or service needed.</li>
            <li>Refrain from abusive language, harassment, price manipulation threats, or unsolicited commercial broadcasts.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            7. Reviews, Ratings & Content Moderation
          </h2>
          <p>
            Customers who have engaged with a provider may leave authentic reviews and star ratings. Reviews must reflect genuine personal experiences. ECLAT CONNECT reserves the right to moderate, hide, or remove reviews that contain profanity, hate speech, defamatory claims, or fabricated statements.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            8. Limitation of Liability & Disclaimers
          </h2>
          <p>
            ECLAT CONNECT is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. While our team actively verifies business registrations:
          </p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>We do not warrant the quality, fitness, safety, or legality of any item or service advertised by third-party providers.</li>
            <li>We are not a party to disputes, financial transactions, or agreements between buyers and sellers.</li>
            <li>To the maximum extent permitted by Nigerian law, ECLAT CONNECT disclaims all liability for direct, indirect, or consequential damages resulting from transactions conducted between users.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            9. Governing Law
          </h2>
          <p>
            These Terms of Service are governed by and construed in accordance with the laws of Oyo State and the Federal Republic of Nigeria.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            10. Contact Us
          </h2>
          <p>If you have any questions or require assistance regarding these Terms, please contact our team:</p>
          <div style={{ background: '#F7F5F0', border: '1px solid #e6e0ea', borderRadius: 10, padding: '18px 22px', fontSize: 14 }}>
            <div style={{ marginBottom: 6 }}><strong>Entity:</strong> ECLAT CONNECT Administration</div>
            <div style={{ marginBottom: 6 }}><strong>Coverage:</strong> LAUTECH & Ogbomoso Metropolis, Oyo State, Nigeria</div>
            <div style={{ marginBottom: 6 }}><strong>Email:</strong> support@eclatconnect.com</div>
            <div style={{ marginBottom: 6 }}><strong>Official WhatsApp:</strong> +234 814 472 5537</div>
            <div><strong>Website:</strong> <a href="https://eclatconnect.com" style={{ color: '#4C016A', fontWeight: 600 }}>https://eclatconnect.com</a></div>
          </div>
        </section>
      </div>
    </div>
  );
};
