"use client";

import { useEffect } from "react";

import { mountTourguide, type TourStep } from "@/lib/tourguide";

// Real, verified selectors from the live public site + admin shell:
//   #top         → Hero section            (src/components/summer/Hero.tsx)
//   #services    → "Ways to Work Together" (src/components/summer/Offers.tsx)
//   #contact     → inquiry / booking form  (src/components/summer/ContactCta.tsx)
//   #testimonials→ client words strip      (src/components/summer/TestimonialsStrip.tsx)
//   aside        → admin sidebar nav       (src/components/admin/AdminShell.tsx)
const STEPS: TourStep[] = [
  {
    selector: "#top",
    title: "the front door",
    route: "/",
    body: "this is the hero — the first thing a prospective client sees. every headline, image, and button is editable from the admin.",
  },
  {
    selector: "#services",
    title: "ways to work together",
    route: "/",
    body: "private training, online coaching, and brand bookings. add, reorder, or reprice these offer cards without touching code.",
  },
  {
    selector: "#contact",
    title: "the booking form",
    route: "/",
    body: "every inquiry here lands straight in the admin as a lead. try submitting one — it resets nightly.",
  },
  {
    selector: "#testimonials",
    title: "social proof",
    route: "/",
    body: "client words, pulled from the database. approve, hide, or feature them from the testimonials screen.",
  },
  {
    selector: "aside",
    title: "the admin",
    route: "/admin",
    body: "this is the whole back office — leads, clients, subscriptions, revenue, classes, and content. no login needed in this demo.",
  },
];

export function DemoTourguide() {
  useEffect(() => {
    mountTourguide({
      siteSlug: "personal-training",
      adminUrl: "/admin",
      steps: STEPS,
    });
  }, []);

  return null;
}
