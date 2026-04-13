import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Pandotic AI collects, uses, and protects your information when you visit our website.",
};

export default function Privacy() {
  return (
    <section className="py-20 md:py-32 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-10 text-gray-400 text-base leading-relaxed">
          <p>
            Pandotic AI (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your
            privacy. This Privacy Policy explains how we collect, use, and protect information when
            you visit{" "}
            <span className="text-white">pandotic.ai</span> (the
            &ldquo;Site&rdquo;).
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>
            <p className="mb-3">
              We collect personal information only when you voluntarily submit it through our contact
              form. The information we collect includes:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Your name</li>
              <li>Your email address</li>
              <li>A description of your project or inquiry</li>
            </ul>
            <p className="mt-3">
              We do not collect information automatically. We do not use cookies, analytics tools,
              tracking pixels, or any other automated data-collection technologies on this Site.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Information</h2>
            <p>We use the information you submit through our contact form to:</p>
            <ul className="list-disc list-inside space-y-1 ml-1 mt-3">
              <li>Respond to your inquiry</li>
              <li>Discuss potential projects or services</li>
              <li>Improve our services and communications</li>
            </ul>
            <p className="mt-3">
              We will not sell, rent, or share your personal information with third parties for
              marketing purposes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
            <p>
              Our contact form is processed by{" "}
              <span className="text-white">Netlify Forms</span>, a service
              provided by Netlify, Inc. When you submit the form, your information is transmitted to
              and stored by Netlify on our behalf. Netlify&apos;s handling of your data is governed
              by their own privacy policy. We encourage you to review it for details on how they
              process and protect data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Cookies and Tracking</h2>
            <p>
              This Site does not use cookies, local storage, session storage, or any tracking or
              analytics technologies. We do not collect behavioral data, IP addresses, or device
              information through automated means.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Links</h2>
            <p>
              Our Site contains links to external websites, including team members&apos; LinkedIn
              profiles and other third-party resources. We are not responsible for the privacy
              practices or content of those external sites. We encourage you to review their privacy
              policies before providing any personal information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Data Retention and Deletion</h2>
            <p>
              We retain your contact form submissions only as long as necessary to respond to your
              inquiry and for our legitimate business purposes. If you would like us to delete your
              information, please email us at{" "}
              <a
                href="mailto:hello@pandotic.ai"
                className="text-[var(--color-accent)] hover:underline"
              >
                hello@pandotic.ai
              </a>{" "}
              and we will process your request promptly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Security</h2>
            <p>
              We take reasonable measures to protect the information you provide, including serving
              this Site over HTTPS and implementing security headers to guard against common web
              vulnerabilities. However, no method of electronic transmission or storage is completely
              secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Children&apos;s Privacy</h2>
            <p>
              This Site is not directed at children under the age of 13. We do not knowingly collect
              personal information from children. If you believe a child has submitted information to
              us, please contact us and we will delete it promptly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the
              &ldquo;Last updated&rdquo; date at the top of this page. We encourage you to review
              this page periodically to stay informed about how we handle your information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your data, you can
              reach us at{" "}
              <a
                href="mailto:hello@pandotic.ai"
                className="text-[var(--color-accent)] hover:underline"
              >
                hello@pandotic.ai
              </a>{" "}
              or through our{" "}
              <Link href="/contact" className="text-[var(--color-accent)] hover:underline">
                contact page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
