import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions governing your use of the Pandotic AI website.",
};

export default function Terms() {
  return (
    <section className="py-20 md:py-32 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-10 text-gray-400 text-base leading-relaxed">
          <p>
            Welcome to{" "}
            <span className="text-white">pandotic.ai</span> (the
            &ldquo;Site&rdquo;), operated by Pandotic AI (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;). By accessing or using this Site, you agree to be bound by these
            Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do
            not use the Site.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Use of the Site</h2>
            <p>
              This Site is provided for informational purposes. It describes our services,
              showcases our work, and provides a way for you to contact us. You agree to use the
              Site only for lawful purposes and in a manner that does not infringe the rights of, or
              restrict or inhibit the use of this Site by, any third party.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Intellectual Property</h2>
            <p>
              All content on this Site — including text, graphics, logos, images, blog posts, and
              design elements — is the property of Pandotic AI or its content suppliers and is
              protected by applicable intellectual property laws. You may not reproduce, distribute,
              modify, or create derivative works from any content on this Site without our prior
              written consent.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Contact Form Submissions</h2>
            <p>
              When you submit information through our contact form, you are sending us a general
              inquiry. A form submission does not create a binding agreement, contract, or obligation
              on either party. We will make reasonable efforts to respond to your inquiry, but we do
              not guarantee specific response times or outcomes.
            </p>
            <p className="mt-3">
              By submitting the form, you represent that the information you provide is accurate and
              that you have the authority to share it with us.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Links</h2>
            <p>
              This Site may contain links to third-party websites, including team members&apos;
              LinkedIn profiles and external project references. These links are provided for your
              convenience only. We do not control, endorse, or assume responsibility for the
              content, privacy policies, or practices of any third-party sites. You access them at
              your own risk.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Disclaimer of Warranties</h2>
            <p>
              This Site and its content are provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis without warranties of any kind, either express or implied,
              including but not limited to warranties of merchantability, fitness for a particular
              purpose, or non-infringement. We do not warrant that the Site will be uninterrupted,
              error-free, or free of harmful components.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, Pandotic AI and its team members,
              partners, and affiliates shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising out of or related to your use of, or
              inability to use, this Site or its content — regardless of the theory of liability.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to These Terms</h2>
            <p>
              We reserve the right to update or modify these Terms at any time. When we do, we will
              revise the &ldquo;Last updated&rdquo; date at the top of this page. Your continued use
              of the Site after any changes constitutes your acceptance of the revised Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of Colorado, United States, without regard to its conflict of law provisions. Any
              disputes arising under these Terms shall be subject to the exclusive jurisdiction of
              the courts located in the State of Colorado.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
            <p>
              If you have questions about these Terms, please reach out at{" "}
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
