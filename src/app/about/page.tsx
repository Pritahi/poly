import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Poly",
  description: "Poly — Survive third-party API changes without proxying your traffic.",
};

export default function AboutPage() {
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
        <h1 className="text-4xl font-bold mb-6">About Poly</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Poly is an integration reliability platform that protects your application from 
            third-party API breaking changes — without ever proxying your traffic.
          </p>
          <p>
            When external APIs change their response schemas (renamed fields, removed fields, 
            type changes), your code breaks. Poly detects these changes in real-time, generates 
            safe AI-powered mappings, and patches responses locally before your code sees them.
          </p>
          <p>
            Unlike API gateways or proxies, Poly never sees your data. Only schema metadata 
            (field names and types) is sent to the cloud for analysis. Your payloads, user data, 
            and business logic stay on your machine.
          </p>
          <h2 className="text-xl font-bold text-gray-900 mt-8">How It Works</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Install the Poly SDK and wrap your HTTP client (Axios or Fetch)</li>
            <li>Poly learns your API schemas by observing responses</li>
            <li>When drift is detected, schema metadata is sent to Poly Cloud</li>
            <li>AI analyzes the change and generates safe field mappings</li>
            <li>Patches are applied in-memory — your code never notices the change</li>
          </ol>
          <h2 className="text-xl font-bold text-gray-900 mt-8">Built With</h2>
          <p>
            Next.js · TypeScript · Supabase · Mistral AI · Tailwind CSS · Prisma
          </p>
        </div>
      </main>
    </div>
  );
}
