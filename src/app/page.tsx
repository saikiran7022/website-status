import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, Bell, Globe, LineChart, ShieldCheck, Webhook } from "lucide-react";
import { PLANS } from "@/lib/plans";

const features = [
  { icon: Activity, title: "Uptime monitoring", description: "HTTP/HTTPS checks with keyword and status-code matching, custom headers and intervals." },
  { icon: LineChart, title: "Dashboards & history", description: "90-day uptime timelines, response-time trends, and per-monitor stats." },
  { icon: Bell, title: "Instant alerts", description: "Get notified by email and webhooks the moment something goes down — and when it recovers." },
  { icon: Globe, title: "Public status pages", description: "Share a branded status page with your customers on your own slug." },
  { icon: ShieldCheck, title: "Incident management", description: "Automatic and manual incidents with a full timeline of updates." },
  { icon: Webhook, title: "REST API", description: "Manage monitors and read uptime programmatically with API keys." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">WebsiteStatus</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link href="/signup"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Know the instant your site goes down</h1>
        <p className="text-lg text-muted-foreground mt-4">
          WebsiteStatus monitors your endpoints around the clock, alerts your team, and keeps your
          customers informed with a beautiful public status page.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/signup"><Button size="lg">Start monitoring free</Button></Link>
          <Link href="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>
        <p className="text-xs text-muted-foreground mt-3">No credit card required · {PLANS.free.maxMonitors} monitors free</p>
      </section>

      <section className="container mx-auto px-4 pb-20 max-w-5xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="border rounded-xl p-6">
              <f.icon className="w-6 h-6 text-blue-500 mb-3" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24 max-w-5xl">
        <h2 className="text-2xl font-bold text-center mb-8">Simple, transparent pricing</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {Object.values(PLANS).map((plan) => (
            <div key={plan.id} className="border rounded-xl p-6 flex flex-col">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground flex-1">
                {plan.features.map((feat) => <li key={feat}>• {feat}</li>)}
              </ul>
              <Link href="/signup" className="mt-6"><Button className="w-full" variant={plan.id === "pro" ? "default" : "outline"}>Get started</Button></Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground max-w-6xl">
          © {new Date().getFullYear()} WebsiteStatus · Built with Next.js
        </div>
      </footer>
    </div>
  );
}
