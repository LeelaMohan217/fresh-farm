import { Sprout } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — FarmFresh",
  description: "How FarmFresh collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "April 15, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-medium text-green-600">FarmFresh</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mt-4 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-10">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-slate prose-sm max-w-none space-y-10">

        {/* Intro */}
        <section>
          <p className="text-slate-600 leading-relaxed">
            FarmFresh (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the FarmFresh website and mobile
            experience. This Privacy Policy explains what personal data we collect when you visit our
            platform, place orders, or inquire about our services, and how we use and protect that data.
            By using our platform you agree to this policy.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <SubSection title="Information you give us">
            <ul>
              <li><strong>Account data</strong> — name, email address, and hashed password when you register.</li>
              <li><strong>Delivery data</strong> — phone number and delivery address provided at checkout.</li>
              <li><strong>Order data</strong> — products purchased, quantities, order history, and payment status.</li>
              <li><strong>Bulk-order data</strong> — event type (wedding, corporate, etc.), preferred dates, and special requirements you submit through our bulk-order form.</li>
              <li><strong>Service-inquiry data</strong> — details you share when requesting a hydroponic or aeroponic installation consultation.</li>
            </ul>
          </SubSection>
          <SubSection title="Information collected automatically">
            <ul>
              <li><strong>Usage data</strong> — pages visited, time spent, referring URL, and browser/device type.</li>
              <li><strong>Authentication cookies</strong> — short-lived JWT tokens used only to keep you signed in. We do not use third-party advertising or tracking cookies.</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul>
            <li>Process and fulfil your retail and bulk orders.</li>
            <li>Send order confirmations, shipping updates, and delivery notifications.</li>
            <li>Schedule and follow up on service consultations (hydroponic/aeroponic setup).</li>
            <li>Respond to customer-support queries.</li>
            <li>Improve our website, product catalogue, and service offerings.</li>
            <li>Comply with legal and regulatory obligations under Indian law.</li>
          </ul>
          <p className="text-slate-600 mt-3">
            We will not use your data for unrelated marketing without your explicit consent.
          </p>
        </Section>

        <Section title="3. Data Sharing">
          <p className="text-slate-600">We share your data only when necessary:</p>
          <ul>
            <li><strong>Delivery partners</strong> — your name, phone, and address to fulfil shipments.</li>
            <li><strong>Payment processors</strong> — transaction details to complete payments. We do not store full card numbers on our servers.</li>
            <li><strong>Legal authorities</strong> — when required by law, court order, or government request.</li>
          </ul>
          <p className="text-slate-600 mt-3 font-medium">We never sell your personal data to third parties.</p>
        </Section>

        <Section title="4. Data Storage & Security">
          <ul>
            <li>Your data is stored on secured servers with access controls.</li>
            <li>Passwords are hashed using bcrypt and are never stored in plain text.</li>
            <li>Sessions are managed via signed JWT tokens with limited validity periods.</li>
            <li>We review our security practices regularly and update them as needed.</li>
          </ul>
          <p className="text-slate-600 mt-3">
            No method of transmission over the internet is 100% secure. While we take all reasonable
            measures, we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="5. Your Rights">
          <p className="text-slate-600">
            Under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> you have the right to:
          </p>
          <ul>
            <li><strong>Access</strong> — request a summary of the personal data we hold about you.</li>
            <li><strong>Correction</strong> — ask us to correct inaccurate or incomplete data.</li>
            <li><strong>Erasure</strong> — request deletion of your data, subject to legal retention requirements.</li>
            <li><strong>Withdraw consent</strong> — opt out of any processing based on your consent at any time.</li>
            <li><strong>Grievance redressal</strong> — raise a complaint with our Data Protection Officer (see Section 9).</li>
            <li><strong>Nomination</strong> — nominate another person to exercise your rights in the event of your death or incapacity, as provided under the DPDP Act.</li>
          </ul>
          <p className="text-slate-600 mt-3">
            To exercise any of these rights, email us at{" "}
            <a href="mailto:privacy@farmfresh.in" className="text-green-600 hover:underline">
              privacy@farmfresh.in
            </a>. We will respond within 30 days.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p className="text-slate-600">
            We use only essential cookies required to authenticate you and maintain your shopping cart.
            We do not use cookies for advertising or cross-site tracking. You can disable cookies in
            your browser settings, though this will prevent you from signing in.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p className="text-slate-600">
            Our platform is not directed at children under the age of 18. We do not knowingly collect
            personal data from minors. If you believe a child has provided us with personal data, please
            contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="8. Data Retention">
          <p className="text-slate-600">
            We retain your personal data for as long as your account is active or as needed to provide
            services. Order records are kept for a minimum of 7 years as required by Indian tax
            regulations. You may request deletion of your account data at any time; tax-required records
            will be retained separately.
          </p>
        </Section>

        <Section title="9. Contact & Grievances">
          <p className="text-slate-600">
            For any privacy-related questions, requests, or grievances, contact our Data Protection Officer:
          </p>
          <address className="not-italic mt-3 text-slate-600 leading-relaxed">
            <strong>FarmFresh — Data Protection Officer</strong><br />
            Farm Lane, Jubilee Hills<br />
            Hyderabad, Telangana 500033<br />
            Email:{" "}
            <a href="mailto:privacy@farmfresh.in" className="text-green-600 hover:underline">
              privacy@farmfresh.in
            </a><br />
            Phone: +91 98765 43210
          </address>
        </Section>

        <Section title="10. Changes to This Policy">
          <p className="text-slate-600">
            We may update this Privacy Policy from time to time. When we do, we will update the
            &quot;Last updated&quot; date at the top and, for material changes, notify you via email or a
            prominent banner on the site. Continued use of our platform after changes constitutes your
            acceptance of the revised policy.
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
        {title}
      </h2>
      <div className="text-slate-600 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3>
      {children}
    </div>
  );
}
