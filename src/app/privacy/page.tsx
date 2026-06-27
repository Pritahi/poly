import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Poly",
  description: "Poly privacy policy — we don't see your data.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: June 2026</p>

        <Section title="Our Privacy Promise">
          <p>Poly was designed with privacy as a first principle. <strong>Your API response data never leaves your machine.</strong> We never see your payloads, user data, PII, business logic, auth tokens, or API keys.</p>
        </Section>

        <Section title="What We Collect">
          <p>The Poly SDK sends <strong>only schema metadata</strong> to Poly Cloud for drift analysis:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Field names and data types (e.g., &quot;name&quot;: &quot;string&quot;)</li>
            <li>Schema structure (nesting, arrays)</li>
            <li>Drift type classification (rename, remove, type_change, etc.)</li>
          </ul>
          <p className="mt-2"><strong>We never collect:</strong> actual field values, response payloads, user data, authentication credentials, or any PII.</p>
        </Section>

        <Section title="How We Use Data">
          <p>Schema metadata is used exclusively for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Detecting API schema drift</li>
            <li>Generating field mappings via AI</li>
            <li>Improving detection accuracy</li>
          </ul>
        </Section>

        <Section title="Data Storage">
          <p>Schema metadata is stored in Supabase (PostgreSQL). We retain incident history for dashboard analytics. No response payloads or user data are ever stored.</p>
        </Section>

        <Section title="Third-Party Services">
          <p>We use Mistral AI for generating field mappings. Only field names and types are sent to Mistral — never values. We use Supabase for database storage.</p>
        </Section>

        <Section title="Contact">
          <p>Questions? <a href="mailto:hello@poly.dev" className="text-primary hover:underline">hello@poly.dev</a></p>
        </Section>
      </main>
    </div>
  );
}
