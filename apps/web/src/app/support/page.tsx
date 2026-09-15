'use client';

import React from 'react';
import { 
  HelpCircle, MessageCircle, Phone, Mail, 
  ExternalLink, ShieldCheck, FileText, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function SupportPage() {
  const faqs = [
    {
      q: 'How do I block a court for monsoon rain or lighting repairs?',
      a: 'Navigate to the Dashboard or Calendar, click "Block Slot", pick the turf and timeslot, select the reason (e.g. Weather/Maintenance), and confirm.'
    },
    {
      q: 'How does the check-in QR code work at the venue reception?',
      a: 'When a player arrives, click on their match in the Today schedule or Bookings list to open the Booking Detail Drawer and verify their QR code.'
    },
    {
      q: 'Can I set different pricing for prime evening floodlight hours?',
      a: 'Yes! Open Dynamic Pricing from the sidebar, where you can configure weekday and weekend tiers (e.g. ₹600 off-peak vs ₹1,000 peak evening).'
    },
    {
      q: 'How can players find my turf to book online?',
      a: 'Each turf has its own public marketplace page (e.g. /public/turf/t1). Click "View Public Page" on any turf card to preview or share the booking link.'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          TurfHub Help & Owner Support
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Operational guides, FAQs, and 24/7 priority support for turf partners.
        </p>
      </div>

      {/* Support Contact Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="https://wa.me/919443182940"
          target="_blank"
          rel="noreferrer"
          className="p-5 rounded-3xl bg-card border border-border hover:border-emerald-500/50 transition-colors flex items-center gap-3.5 group shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">WhatsApp Hotline</h3>
            <p className="text-xs text-muted-foreground mt-0.5">+91 94431 82940</p>
          </div>
        </a>

        <a
          href="tel:+919443182940"
          className="p-5 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors flex items-center gap-3.5 group shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Phone Support</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Mon–Sun 6 AM – 11 PM</p>
          </div>
        </a>

        <a
          href="mailto:support@turfhub.in"
          className="p-5 rounded-3xl bg-card border border-border hover:border-blue-500/50 transition-colors flex items-center gap-3.5 group shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Email Desk</h3>
            <p className="text-xs text-muted-foreground mt-0.5">support@turfhub.in</p>
          </div>
        </a>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
          <p className="text-xs text-muted-foreground">Quick answers to common operational questions</p>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {faqs.map((faq, i) => (
            <div key={i} className="py-4 first:pt-0 last:pb-0 space-y-1">
              <h4 className="font-bold text-sm text-foreground">{faq.q}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
