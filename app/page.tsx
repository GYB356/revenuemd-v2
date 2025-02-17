'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const features = [
  {
    title: 'Smart Billing',
    description: 'Automated billing system with real-time insurance verification and claim tracking.',
    icon: Icons.billing,
  },
  {
    title: 'Patient Management',
    description: 'Comprehensive patient records with secure data management and easy access.',
    icon: Icons.patients,
  },
  {
    title: 'Analytics',
    description: 'AI-powered insights to optimize revenue and improve practice efficiency.',
    icon: Icons.analytics,
  },
  {
    title: 'Telemedicine',
    description: 'Virtual consultations with integrated video calls and secure messaging.',
    icon: Icons.video,
  },
  {
    title: 'IoT Integration',
    description: 'Connect with smart medical devices for real-time patient monitoring.',
    icon: Icons.device,
  },
  {
    title: 'Security',
    description: 'Enterprise-grade security with HIPAA compliance and data encryption.',
    icon: Icons.shield,
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$99',
    description: 'Perfect for small practices',
    features: [
      'Up to 500 patients',
      'Basic analytics',
      'Email support',
      'Standard security',
    ],
  },
  {
    name: 'Professional',
    price: '$199',
    description: 'For growing medical practices',
    features: [
      'Unlimited patients',
      'Advanced analytics',
      'Priority support',
      'Enhanced security',
      'Telemedicine features',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large healthcare organizations',
    features: [
      'Custom patient limit',
      'AI-powered insights',
      '24/7 dedicated support',
      'Custom integrations',
      'Advanced IoT support',
    ],
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Icons.logo className="h-6 w-6 text-primary" />
              <span className="font-heading text-xl font-bold">RevenueMD</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary">
              Contact
            </Link>
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
          <Button variant="ghost" className="md:hidden">
            <Icons.menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-24 space-y-8 md:space-y-16">
          <motion.div 
            className="mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-600">
              Streamline Your Healthcare Revenue Management
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Powerful analytics, seamless billing, and intelligent insights to optimize your healthcare practice.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24 space-y-8">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
              Features
            </h2>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Everything you need to manage your healthcare practice efficiently
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="relative overflow-hidden rounded-lg border bg-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-xl font-bold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container py-24 space-y-8">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Choose the plan that best fits your practice
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={cn(
                  "relative overflow-hidden rounded-lg border bg-background p-8",
                  plan.popular && "border-primary shadow-lg"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 transform">
                    <div className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                      Popular
                    </div>
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  <h3 className="font-heading text-2xl font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Icons.check className="mr-2 h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-8 w-full">
                    Get Started
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="container py-24 space-y-8">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
              Get in Touch
            </h2>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Have questions? We're here to help
            </p>
          </div>
          <div className="mx-auto max-w-2xl">
            <form className="grid gap-6">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button type="submit">Send Message</Button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Icons.logo className="h-6 w-6 text-primary" />
              <span className="font-heading text-xl font-bold">RevenueMD</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Modern healthcare revenue management platform.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-bold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary">About</Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary">Careers</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-bold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-primary">Security</Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-bold">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="https://twitter.com" className="hover:text-primary">Twitter</Link>
              </li>
              <li>
                <Link href="https://linkedin.com" className="hover:text-primary">LinkedIn</Link>
              </li>
              <li>
                <Link href="https://github.com" className="hover:text-primary">GitHub</Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

