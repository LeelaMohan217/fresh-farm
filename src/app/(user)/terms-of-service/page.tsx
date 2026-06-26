import { Sprout } from "lucide-react";

export const metadata = {
  title: "Terms of Service — FarmFresh",
  description: "Terms and conditions governing your use of the FarmFresh platform.",
};

const LAST_UPDATED = "April 15, 2026";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-medium text-green-600">FarmFresh</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mt-4 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-400 mb-10">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-10">

        <section>
          <p className="text-slate-600 leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) govern your use of the FarmFresh website, mobile
            experience, and services (collectively, the &quot;Platform&quot;) operated by FarmFresh
            (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), registered in Hyderabad, Telangana, India. By accessing or
            using the Platform you agree to be bound by these Terms. If you do not agree, please
            discontinue use immediately.
          </p>
        </section>

        <Section title="1. Eligibility">
          <p>
            You must be at least 18 years old and capable of entering into a legally binding contract
            under the Indian Contract Act, 1872 to use this Platform. By using our Platform you
            represent that you meet these requirements.
          </p>
        </Section>

        <Section title="2. Account Registration">
          <ul>
            <li>You must provide accurate, complete, and up-to-date information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</li>
            <li>Notify us immediately at <a href="mailto:hello@farmfresh.in" className="text-green-600 hover:underline">hello@farmfresh.in</a> if you suspect unauthorized access to your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms or are used fraudulently.</li>
          </ul>
        </Section>

        <Section title="3. Products & Pricing">
          <ul>
            <li>All products are subject to availability. We reserve the right to limit quantities.</li>
            <li>Prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</li>
            <li>We reserve the right to change prices at any time without prior notice. The price charged will be the one displayed at the time you place your order.</li>
            <li>Product images are for illustrative purposes. Actual produce may vary in appearance due to its organic and seasonal nature.</li>
          </ul>
        </Section>

        <Section title="4. Orders & Payment">
          <ul>
            <li>Placing an order constitutes an offer to purchase. We reserve the right to accept or decline any order.</li>
            <li>You will receive an order confirmation by email once the order is accepted.</li>
            <li>Payment must be made in full at the time of ordering through the payment methods available on the Platform.</li>
            <li>We use third-party payment processors and are not responsible for any payment failures or errors on their part.</li>
            <li>In the event of pricing errors, we will notify you and give you the option to proceed at the correct price or cancel the order.</li>
          </ul>
        </Section>

        <Section title="5. Bulk Orders">
          <ul>
            <li>Bulk orders (weddings, corporate events, festivals, etc.) are subject to a separate confirmation process and may require a deposit.</li>
            <li>Bulk order details — quantities, delivery dates, and event type — must be accurate. Changes after confirmation may not be possible.</li>
            <li>Cancellations or modifications to bulk orders must be requested at least 72 hours before the scheduled delivery date, subject to our Refund Policy.</li>
          </ul>
        </Section>

        <Section title="6. Delivery">
          <ul>
            <li>We currently deliver within Hyderabad and select surrounding areas. Delivery zones are subject to change.</li>
            <li>Estimated delivery times are provided in good faith but are not guaranteed. We are not liable for delays caused by circumstances beyond our control (weather, traffic, etc.).</li>
            <li>You are responsible for providing a correct and accessible delivery address. Failed deliveries due to incorrect addresses may result in re-delivery charges.</li>
            <li>Risk of loss and title for products passes to you upon delivery.</li>
          </ul>
        </Section>

        <Section title="7. Services (Hydroponic & Aeroponic Setup)">
          <ul>
            <li>Service inquiries submitted through the Platform initiate a consultation process — they do not constitute a confirmed booking.</li>
            <li>Service agreements, timelines, and pricing are finalized separately between you and our team during the consultation.</li>
            <li>We are not liable for any property damage arising from your failure to follow setup guidelines provided during the consultation.</li>
          </ul>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            All content on the Platform — including text, images, logos, and product descriptions — is
            owned by or licensed to FarmFresh and protected under Indian copyright and intellectual
            property laws. You may not reproduce, distribute, or create derivative works without our
            prior written consent.
          </p>
        </Section>

        <Section title="9. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Platform for any unlawful purpose or in violation of these Terms.</li>
            <li>Submit false, misleading, or fraudulent information.</li>
            <li>Attempt to gain unauthorized access to any part of the Platform or its infrastructure.</li>
            <li>Use automated tools (bots, scrapers) to access or collect data from the Platform without our consent.</li>
            <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
          </ul>
        </Section>

        <Section title="10. Disclaimers">
          <p>
            The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express
            or implied, including merchantability, fitness for a particular purpose, or
            non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or
            free of viruses or other harmful components.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the fullest extent permitted by applicable law, FarmFresh shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising out of or relating
            to your use of the Platform. Our total liability for any claim arising out of or relating to
            these Terms or your use of the Platform shall not exceed the amount paid by you for the
            specific order or service giving rise to the claim.
          </p>
        </Section>

        <Section title="12. Governing Law & Dispute Resolution">
          <p>
            These Terms are governed by the laws of India. Any dispute arising out of or in connection
            with these Terms shall first be attempted to be resolved through good-faith negotiation.
            If unresolved within 30 days, disputes shall be submitted to the exclusive jurisdiction of
            the courts in Hyderabad, Telangana.
          </p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p>
            We may revise these Terms at any time. The updated version will be posted on this page with
            a revised &quot;Last updated&quot; date. For material changes we will notify you by email or a
            prominent notice on the Platform. Continued use of the Platform after changes take effect
            constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="14. Contact Us">
          <p>For questions about these Terms, contact us at:</p>
          <address className="not-italic mt-3 text-slate-600 leading-relaxed">
            <strong>FarmFresh</strong><br />
            Farm Lane, Jubilee Hills<br />
            Hyderabad, Telangana 500033<br />
            Email:{" "}
            <a href="mailto:hello@farmfresh.in" className="text-green-600 hover:underline">
              hello@farmfresh.in
            </a><br />
            Phone: +91 98765 43210
          </address>
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
