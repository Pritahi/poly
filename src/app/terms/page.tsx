import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Poly",
  description: "Poly terms of service.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-transparent p-0 flex items-center justify-center text-primary font-bold text-sm">P</div>
            <span className="font-bold text-lg tracking-tight text-gray-900">Poly</span>
          </a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: June 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>By using Poly, you agree to these terms. If you don&apos;t agree, don&apos;t use the service.</p>
        </Section>

        <Section title="2. Service Description">
          <p>Poly provides API schema drift detection and response transformation services. The Poly SDK runs in your application and sends schema metadata to our cloud for analysis. Your API response data never leaves your machine.</p>
        </Section>

        <Section title="3. Beta Period">
          <p>Poly is currently in beta. The service is provided &quot;as is&quot; without warranties. Features, pricing, and availability may change. We&apos;ll notify users of significant changes.</p>
        </Section>

        <Section title="4. Fair Use">
          <p>During beta, Poly is free with unlimited usage. We reserve the right to implement rate limits if usage impacts service quality for other users. You may not use Poly for illegal purposes or to violate third-party API terms of service.</p>
        </Section>

        <Section title="5. Intellectual Property">
          <p>The Poly SDK is open source (MIT License). The Poly Cloud service, dashboard, and AI engine are proprietary. Generated field mappings belong to you.</p>
        </Section>

        <Section title="6. Limitation of Liability">
          <p>Poly is not liable for damages resulting from incorrect field mappings, service downtime, or API changes. Always test patches in a staging environment before production deployment.</p>
        </Section>

        <Section title="7. Contact">
          <p>Questions? <a href="mailto:hello@poly.dev" className="text-primary hover:underline">hello@poly.dev</a></p>
        </Section>
      </main>
    </div>
  );
}
