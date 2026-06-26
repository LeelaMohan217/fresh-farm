import { Sprout } from "lucide-react";

export const metadata = {
  title: "Refund Policy — FarmFresh",
  description: "FarmFresh refund, return, and cancellation policy for orders and services.",
};

const LAST_UPDATED = "April 15, 2026";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-medium text-green-600">FarmFresh</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mt-4 mb-2">Refund Policy</h1>
      <p className="text-sm text-slate-400 mb-10">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-10">

        <section>
          <p className="text-slate-600 leading-relaxed">
            At FarmFresh we take pride in delivering fresh, organic produce and quality service. Because
            we deal in perishable goods, our refund and return policy is designed to be fair while
            accounting for the nature of fresh food. Please read this policy carefully before placing
            an order.
          </p>
        </section>

        <Section title="1. Damaged or Incorrect Items">
          <p>
            If you receive an item that is damaged, spoiled, or different from what you ordered, you are
            eligible for a full refund or replacement at no extra charge.
          </p>
          <ul>
            <li>Report the issue within <strong>24 hours</strong> of delivery.</li>
            <li>
              Email{" "}
              <a href="mailto:hello@farmfresh.in" className="text-green-600 hover:underline">
                hello@farmfresh.in
              </a>{" "}
              with your order number and at least one clear photo of the item.
            </li>
            <li>We will review your report and respond within 1 business day.</li>
            <li>Approved refunds are processed to your original payment method within <strong>5–7 business days</strong>.</li>
          </ul>
        </Section>

        <Section title="2. Missing Items">
          <p>
            If an item is missing from your order, contact us within <strong>24 hours</strong> of delivery
            with your order number. We will dispatch the missing item in the next available delivery slot
            or issue a refund for that item.
          </p>
        </Section>

        <Section title="3. Order Cancellations — Regular Orders">
          <ul>
            <li>
              Cancellations requested <strong>before the order is dispatched</strong> are eligible for a
              full refund.
            </li>
            <li>
              Once an order has been dispatched, cancellations are not accepted as the produce has
              already been harvested and packed for you.
            </li>
            <li>
              To cancel, email{" "}
              <a href="mailto:hello@farmfresh.in" className="text-green-600 hover:underline">
                hello@farmfresh.in
              </a>{" "}
              or call <strong>+91 98765 43210</strong> as soon as possible after placing the order.
            </li>
          </ul>
        </Section>

        <Section title="4. Bulk Order Cancellations">
          <ul>
            <li>
              Cancellations made <strong>72 hours or more</strong> before the scheduled delivery date:
              full refund of any deposit paid.
            </li>
            <li>
              Cancellations made <strong>24–72 hours</strong> before delivery: 50% of the deposit is
              refunded; the remainder covers preparation costs.
            </li>
            <li>
              Cancellations made <strong>less than 24 hours</strong> before delivery: no refund, as
              produce will have been harvested and packed.
            </li>
            <li>
              To cancel a bulk order, email{" "}
              <a href="mailto:hello@farmfresh.in" className="text-green-600 hover:underline">
                hello@farmfresh.in
              </a>{" "}
              with your order reference number.
            </li>
          </ul>
        </Section>

        <Section title="5. Non-Refundable Items">
          <p>The following are not eligible for a refund:</p>
          <ul>
            <li>Perishable items that have been delivered in satisfactory condition and not reported within 24 hours.</li>
            <li>Items damaged after delivery due to improper storage on your end.</li>
            <li>Orders where the issue is reported beyond the 24-hour window without a valid reason for the delay.</li>
          </ul>
        </Section>

        <Section title="6. Services (Hydroponic & Aeroponic Setup)">
          <ul>
            <li>
              Consultation bookings cancelled <strong>48 hours or more</strong> in advance: full refund
              of any booking fee.
            </li>
            <li>
              Cancellations within <strong>48 hours</strong> of the scheduled consultation: no refund of
              the booking fee.
            </li>
            <li>
              If a service visit has commenced (materials delivered or installation begun), refunds will
              be calculated based on the value of work not yet performed.
            </li>
            <li>
              Service disputes must be raised within <strong>7 days</strong> of the service date by
              emailing{" "}
              <a href="mailto:hello@farmfresh.in" className="text-green-600 hover:underline">
                hello@farmfresh.in
              </a>.
            </li>
          </ul>
        </Section>

        <Section title="7. Refund Processing">
          <ul>
            <li>Approved refunds are returned to your original payment method.</li>
            <li>Processing time: <strong>5–7 business days</strong> after approval (bank timelines may vary).</li>
            <li>You will receive a confirmation email once the refund has been initiated.</li>
            <li>We do not charge any processing fee for refunds.</li>
          </ul>
        </Section>

        <Section title="8. How to Raise a Refund Request">
          <p>Contact us through any of the following:</p>
          <address className="not-italic mt-3 text-slate-600 leading-relaxed">
            <strong>Email:</strong>{" "}
            <a href="mailto:hello@farmfresh.in" className="text-green-600 hover:underline">
              hello@farmfresh.in
            </a><br />
            <strong>Phone:</strong> +91 98765 43210<br />
            <strong>Address:</strong> Farm Lane, Jubilee Hills, Hyderabad, Telangana 500033
          </address>
          <p className="mt-3">
            Please include your <strong>order number</strong>, a description of the issue, and any
            supporting photos. We aim to resolve all refund requests within <strong>2 business days</strong>.
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
