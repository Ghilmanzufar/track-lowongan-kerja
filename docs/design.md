---
version: "alpha"
name: "HealthTech Plataforma Clínica"
description: "Healthtech landing, medical icons, clinic portal, healthcare green, patient journey, appointments, doctors, trust, clean, accessible, digital health. Ideal for landing pages, modern websites. AI-ready template."
colors:
  primary: "#FFFFFF"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2.5rem
    fontWeight: 700
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
rounded:
  sm: 12px
  md: 24px
  lg: 36px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 12px
---

## Overview

Healthtech landing, medical icons, clinic portal, healthcare green, patient journey, appointments, doctors, trust, clean, accessible, digital health. Ideal for landing pages, modern websites. AI-ready template. Hospital software used to look like it was designed by someone who actively hated the people using it. Grey backgrounds, tiny serif fonts, interfaces that screamed 'you are in an institution.' For decades, clinical tools prioritized data density over human comprehension — and patients never even saw the screen. Everything lived behind a desk.

Then telemedicine happened. Suddenly patients needed to navigate these systems themselves. The pandemic didn't invent the problem, but it made ignoring it impossible. Clinics scrambled to build patient portals that didn't terrify people already anxious about their health. Trust became a design variable, not just a brand value.

What emerged was a specific visual language: generous whitespace, muted blues and greens, rounded corners softening clinical edges. HIPAA didn't just influence backend architecture — it shaped UI decisions too. You can't show a notification preview with PHI. You can't cache certain screens. Every tooltip, every modal, every error state carries compliance weight. The constraint bred clarity. Calm wasn't an aesthetic choice; it was the only responsible one.

- Density: 3/10 — Airy
- Variance: 3/10 — Restrained
- Motion: 4/10 — Subtle

- **Style:** Clean, Trustworthy, Accessible
- **Keywords:** healthtech landing, medical icons, clinic portal, healthcare green, patient journey, appointments, doctors, trust, clean, accessible, digital health
- **Era:** 2020s HealthTech
- **Light/Dark:** ✓ Full / ✗ No

## Colors

- **White** (#FFFFFF) — Secondary surface


## Typography

- **Display / Hero:** Como funciona — Weight 700, tight tracking, used for headline impact
- **Accent:** Inter — Used for decorative or emphasis text
- **Body:** Como funciona — Weight 400, 16px/1.6 line-height, max 72ch per line
- **UI Labels / Captions:** Como funciona — 0.875rem, weight 500, slight letter-spacing
- **Monospace:** JetBrains Mono — Used for code, metadata, and technical values

Scale:
- Hero: clamp(2.5rem, 5vw, 4rem)
- H1: 2.25rem
- H2: 1.5rem
- Body: 1rem / 1.6
- Small: 0.875rem


## Layout

- **Grid:** CSS Grid primary. Max-width containment: 1280px centered with 1.5rem side padding.
- **Spacing rhythm:** Balanced. Base unit: 0.5rem (8px).
- **Section vertical gaps:** clamp(4rem, 8vw, 8rem).
- **Hero layout:** Split-screen (text left, visual right).
- **Feature sections:** Zig-zag alternating text+image rows. No 3-equal-columns.
- **Mobile collapse:** All multi-column layouts collapse below 768px. No horizontal overflow.
- **z-index contract:** base (0) / sticky-nav (100) / overlay (200) / modal (300) / toast (500).


## Elevation & Depth

Formas orgânicas (curvas suaves) como separadores, animação de pulso cardíaco, campos de formulário com foco destacado (borda e sombra em verde), seção 'Como funciona' em passos.

- **Physics:** Ease-out curves, 200-300ms duration. Smooth and predictable.
- **Entry animations:** Fade + translate-Y (16px → 0) over 420ms ease-out. Staggered cascades for lists: 80ms between items.
- **Hover states:** Subtle color shift + shadow adjustment over 200ms.
- **Page transitions:** Fade only (200ms).
- **Performance:** Only transform and opacity animated. No layout-triggering properties.


## Shapes

Base corner radius: 12px. See rounded tokens in front matter for the full scale.


## Components

- **Primary Button:** Rounded (12px) shape. Accent color fill. Hover: 8% darken + subtle lift shadow. Active: -1px translate tactile press. Font weight 600. No outer glows.
- **Secondary / Ghost Button:** Outline variant. 1.5px border in muted color. Text in primary color. Hover: subtle background fill.
- **Cards:** Rounded (12px) corners. Surface background. Subtle shadow (0 2px 12px rgba(0,0,0,0.06)). 1px border stroke.
- **Inputs:** Label above input. 1px border stroke. Focus ring: 2px accent color offset 2px. Error text below in semantic red. No floating labels.
- **Navigation:** Primary surface background. Active item: accent color indicator. Font weight 500 when active.
- **Skeletons:** Shimmer animation matching component dimensions. No circular spinners.
- **Empty States:** Icon-based composition with descriptive text and action button.


## Do's and Don'ts

- No emojis in UI — use icon system only (Lucide, Heroicons)
- No pure black (#000000) — use off-black or charcoal variants
- No oversaturated accent colors (saturation cap: 80%)
- No 3-column equal-width feature layouts — use zig-zag or asymmetric grid
- No `h-screen` — use `min-h-[100dvh]`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links — use picsum.photos or inline SVG
- No generic lorem ipsum in demos

- Do Navbar + Hero
- Do Serviços/Funcionalidades
- Do Como Funciona (passos)
- Do Testimonials
- Do CTA 'Agendar consulta'
- Do Meta tags SEO
- Do Footer com LGPD
- Do Contraste alto
- Do Animações suaves
- Do Vocabulário médico acessível.


## Use Case

Landing pages, Modern websites

<!-- Source: https://designmd.app/library/healthtech-plataforma-clinica · designmd.app -->
