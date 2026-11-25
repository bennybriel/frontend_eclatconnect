import React from 'react';
import { EclatLogo } from '../../components/EclatLogo';

interface LegalPageProps {
  onNavigate: (page: string) => void;
}

export const PrivacyPolicyPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '36px 16px 80px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Header Breadcrumb & Branding */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EclatLogo size={38} onClick={() => onNavigate('Home')} />
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#4C016A' }}>
              Privacy Policy
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
            background: '#f3e9f7',
            borderRadius: 10,
            padding: '18px 22px',
            marginBottom: 32,
            borderLeft: '4px solid #4C016A',
          }}
        >
          <strong style={{ color: '#4C016A', fontSize: 15, display: 'block', marginBottom: 6 }}>
            Executive Privacy Summary
          </strong>
          <p style={{ margin: 0, fontSize: 14, color: '#242126' }}>
            ECLAT CONNECT is committed to protecting the privacy of students, local residents, artisans, and business owners in Ogbomoso and the LAUTECH community. We only collect the information necessary to facilitate direct connections and verify accounts. <strong>We do not sell, rent, or trade your personal information to third parties.</strong>
          </p>
        </div>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            1. Introduction & Scope
          </h2>
          <p>
            Welcome to <strong>ECLAT CONNECT</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), accessible via <code>https://eclatconnect.com</code>. We operate a mobile-first local discovery and direct-connection platform connecting customers with verified businesses, campus products, skilled professionals, and local services around LAUTECH and the broader Ogbomoso metropolis, Oyo State, Nigeria.
          </p>
          <p>
            This Privacy Policy governs the manner in which ECLAT CONNECT collects, uses, maintains, and discloses information collected from users of our website, web applications, customer service channels, and our official WhatsApp Business integration.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            2. Information We Collect
          </h2>
          <p>We collect information in the following categories to provide seamless local discovery:</p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>
              <strong>Account & Profile Information:</strong> When registering, we collect your full name, email address, cryptographic password hash, role classification (Customer, Vendor, Artisan), and verified Nigerian telephone/WhatsApp phone number.
            </li>
            <li>
              <strong>Vendor & Business Showcase Data:</strong> For registered providers, we collect business name, trade category, campus hub location (e.g. Under G, Adenike, Aroje, General, Takie), physical landmark, business description, service showcase images, and public phone/WhatsApp contact lines.
            </li>
            <li>
              <strong>Customer Requests & Marketplace Listings:</strong> Details submitted in &quot;Post What I Need&quot; or pre-owned item sales, including item title, category, description, budget, uploaded photos, and availability status.
            </li>
            <li>
              <strong>Direct Contact & Interaction Telemetry:</strong> When you click &quot;Chat on WhatsApp&quot; or &quot;Call Now&quot; to contact a provider, we log lead activity timestamps to help artisans and administrators monitor marketplace reach.
            </li>
            <li>
              <strong>WhatsApp Cloud API Communications:</strong> Inbound messages, command keywords (e.g. <code>MENU</code>, <code>SEARCH</code>, <code>REQUESTS</code>), and interaction records processed through our registered Meta WhatsApp Business Cloud API number (<code>+234 814 472 5537</code>).
            </li>
            <li>
              <strong>Technical Device Data:</strong> IP address, browser type, operating system, and access timestamps collected automatically for system security, fraud prevention, and performance telemetry.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            3. How We Use Collected Information
          </h2>
          <p>Your information is used strictly for legitimate operational purposes:</p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>To display verified public provider listings and products to potential buyers in the LAUTECH and Ogbomoso community.</li>
            <li>To facilitate direct phone and WhatsApp communication between buyers and providers without hidden intermediary cuts.</li>
            <li>To send essential transactional notifications, OTP login codes, vendor approval confirmations, and security alerts.</li>
            <li>To dispatch authorized administrative announcements and community broadcasts regarding platform updates and safety alerts.</li>
            <li>To investigate suspicious activity, detect spam or fraudulent listings, and maintain marketplace trust.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            4. WhatsApp Cloud API & Third-Party Service Providers
          </h2>
          <p>
            ECLAT CONNECT integrates with industry-standard, secure infrastructure partners:
          </p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>
              <strong>Meta WhatsApp Business Cloud API:</strong> We utilize Meta&apos;s enterprise WhatsApp Cloud API to deliver user-initiated inquiries, customer support interactions, and authorized administrative broadcasts. All messaging strictly complies with Meta’s WhatsApp Business Messaging Policy.
            </li>
            <li>
              <strong>SmartSMSSolutions:</strong> Used for secure delivery of transactional SMS notifications and OTP verification codes to Nigerian mobile networks.
            </li>
            <li>
              <strong>Zoho CPAAS:</strong> Used for transactional email delivery (such as account verification and administrative notifications).
            </li>
          </ul>
          <p>These partners are contractually bound to handle your data securely and are prohibited from using your personal information for independent advertising.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            5. Data Protection, Security & Storage
          </h2>
          <p>
            We deploy multiple layers of enterprise security to safeguard your personal data:
          </p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>All web communications are encrypted in transit using Transport Layer Security (TLS 1.3 / HTTPS).</li>
            <li>Passwords are hashed using one-way cryptographic algorithms with unique salts; plaintext passwords are never stored.</li>
            <li>Databases are hosted in isolated Docker container networks with strict role-based access control and prepared statement query parameterization to prevent SQL injection.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            6. Information Sharing & Disclosure
          </h2>
          <p>
            <strong>We do not sell, rent, or trade your personal information.</strong> We only share information in the following situations:
          </p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>
              <strong>Public Profile Display:</strong> Information you voluntarily publish in your vendor profile (business name, category, location, phone, and WhatsApp contact) is visible to the public so customers can find and contact you.
            </li>
            <li>
              <strong>Legal Compliance:</strong> We may disclose information if required to do so by applicable Nigerian law, law enforcement investigation, or valid court order to prevent fraud or protect user safety.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            7. Your Legal Rights (NDPA 2023)
          </h2>
          <p>Under the Nigeria Data Protection Act (NDPA) 2023, you have the right to:</p>
          <ul style={{ paddingLeft: 22, lineHeight: 1.8 }}>
            <li>Request a copy of the personal information we hold about you.</li>
            <li>Update or correct inaccurate profile details at any time through your User Account dashboard.</li>
            <li>Request the deletion or deactivation of your account and associated listings.</li>
            <li>Opt out of non-transactional WhatsApp or email announcements.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            8. Policy Modifications
          </h2>
          <p>
            We may revise this Privacy Policy periodically. Any updates will be posted immediately with a revised effective date at the top of this page. Continued use of ECLAT CONNECT after changes are posted constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, color: '#4C016A', marginTop: 0, marginBottom: 12, borderBottom: '1px solid #f0eaf4', paddingBottom: 6 }}>
            9. Contact Information
          </h2>
          <p>For questions or requests regarding your personal data and privacy, please contact the ECLAT CONNECT administration team:</p>
          <div style={{ background: '#F7F5F0', border: '1px solid #e6e0ea', borderRadius: 10, padding: '18px 22px', fontSize: 14 }}>
            <div style={{ marginBottom: 6 }}><strong>Entity:</strong> ECLAT CONNECT Administration</div>
            <div style={{ marginBottom: 6 }}><strong>Coverage:</strong> LAUTECH Campus & Ogbomoso Metropolis, Oyo State, Nigeria</div>
            <div style={{ marginBottom: 6 }}><strong>Official WhatsApp:</strong> +234 814 472 5537</div>
            <div style={{ marginBottom: 6 }}><strong>Email:</strong> support@eclatconnect.com</div>
            <div><strong>Website:</strong> <a href="https://eclatconnect.com" style={{ color: '#4C016A', fontWeight: 600 }}>https://eclatconnect.com</a></div>
          </div>
        </section>
      </div>
    </div>
  );
};
