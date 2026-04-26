import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  Globe,
  Heart,
  Shield,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">WebsiteStatus</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-foreground text-muted-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Star className="w-3 h-3 mr-1" /> Trusted by 10,000+ teams
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Monitor your websites,{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              catch downtime fast
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Enterprise-grade uptime monitoring with instant alerts, beautiful status pages, and powerful APIs. Know the moment something goes wrong.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Monitoring Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/status/demo">
              <Button size="lg" variant="outline">
                View Demo Status Page
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> 10 monitors free</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> 5 min intervals</span>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="container pb-20">
        <div className="max-w-5xl mx-auto rounded-xl border shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-8">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Monitors", value: "24", icon: Activity, color: "text-blue-500" },
                { label: "Up", value: "22", icon: CheckCircle, color: "text-emerald-500" },
                { label: "Down", value: "1", icon: Heart, color: "text-red-500" },
                { label: "Avg Response", value: "142ms", icon: Clock, color: "text-amber-500" },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Response Time (30 days)</h3>
                <Badge variant="success">99.98% uptime</Badge>
              </div>
              <div className="flex items-end gap-[2px] h-20">
                {Array.from({ length: 60 }).map((_, i) => {
                  const h = 20 + Math.random() * 80;
                  const color = h > 80 ? "bg-red-400" : h > 60 ? "bg-amber-400" : "bg-emerald-400";
                  return <div key={i} className={`flex-1 rounded-sm ${color}`} style={{ height: `${h}%` }} />;
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30">
        <div className="container py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to stay online</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From simple HTTP checks to complex multi-step workflows, we&apos;ve got you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Activity, title: "Uptime Monitoring", desc: "Check HTTP, HTTPS, TCP, Ping, and DNS endpoints from multiple locations worldwide." },
              { icon: Bell, title: "Instant Alerts", desc: "Get notified via email, webhook, Slack, or Discord the moment something goes wrong." },
              { icon: Globe, title: "Status Pages", desc: "Beautiful, customizable status pages with custom branding and subdomain support." },
              { icon: Shield, title: "SSL Monitoring", desc: "Track SSL certificate expiration and get alerts before they expire." },
              { icon: TrendingUp, title: "Performance Metrics", desc: "Response time tracking, p50/p95/p99 percentiles, and historical trends." },
              { icon: Zap, title: "Powerful API", desc: "REST API with API key authentication for programmatic access and automation." },
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              period: "forever",
              description: "Perfect for personal projects and small websites.",
              features: ["10 monitors", "5-minute intervals", "Email alerts", "Basic status page", "7-day data retention"],
              cta: "Get Started",
              popular: false,
            },
            {
              name: "Pro",
              price: "$29",
              period: "/month",
              description: "For growing teams that need more power and flexibility.",
              features: ["50 monitors", "1-minute intervals", "All alert channels", "Custom status pages", "90-day data retention", "API access", "Team collaboration"],
              cta: "Start Free Trial",
              popular: true,
            },
            {
              name: "Enterprise",
              price: "$99",
              period: "/month",
              description: "For large organizations with advanced requirements.",
              features: ["Unlimited monitors", "30-second intervals", "Priority support", "White-label status pages", "Unlimited retention", "SSO / SAML", "SLA guarantee", "Dedicated account manager"],
              cta: "Contact Sales",
              popular: false,
            },
          ].map((plan, i) => (
            <Card key={i} className={`relative ${plan.popular ? "border-primary shadow-lg scale-[1.02]" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.popular ? "" : "variant-outline"}`} variant={plan.popular ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">WebsiteStatus</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} WebsiteStatus. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
