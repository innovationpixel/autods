---
version: alpha
name: "AutoDropshipPrime"
description: "A credible, product-led dropshipping automation brand built around real seller workflows and dashboard evidence."
colors:
  background: "#FFFFFF"
  background-soft: "#FAF9FF"
  surface: "#FFFFFF"
  text-primary: "#171230"
  text-secondary: "#67627A"
  border: "#E9E4F2"
  border-strong: "#DDD3EC"
  brand-dark: "#211062"
  brand-indigo: "#32158C"
  brand-purple: "#6D28D9"
  brand-violet: "#8B3DFF"
  brand-magenta: "#F22EB7"
  success: "#14866D"
  warning: "#BA6B13"
  danger: "#B63A5B"
typography:
  sans:
    fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
rounded:
  DEFAULT: "0.75rem"
  sm: "0.625rem"
  md: "0.875rem"
  lg: "1.125rem"
  xl: "1.5rem"
spacing:
  section-gap: "5.875rem"
  page-max: "75.625rem"
  mobile-gutter: "0.875rem"
components:
  button: {}
  hero: {}
  dashboard-frame: {}
  marketing-section: {}
  table: {}
---

# AutoDropshipPrime Design System

## Overview

### Creative North Star
A polished B2B commerce control room: restrained white/lavender surfaces, strong dark-violet typography, colorful operational status cues, and real dashboard evidence. The visual quality should feel closer to mature SaaS and eCommerce software than to an illustration-heavy startup template.

### Product context and register
- **Audience and primary job:** eBay/eCommerce sellers evaluating one connected system for research, listings, monitoring, orders, Sheets, wallet activity, and profit visibility.
- **Target market(s) and evidence:** broad English-language ecommerce sellers; the maintained `BRIEF.txt` does not define a narrower market.
- **Locale(s) and language policy:** English-first marketing UI.
- **Usage scene:** desktop-first product evaluation with strong tablet/mobile support; screenshots and feature explanations must remain readable at narrow widths.
- **Register:** hybrid brand/product. Marketing pages lead with product storytelling; dashboard previews behave like credible software evidence.
- **Memorable signature:** connected-workflow storytelling paired with realistic AutoDropshipPrime dashboard screenshots and the indigo → violet → magenta brand accent.
- **Restraint:** gradients are accents, not full-page decoration; no random blobs, glassmorphism, excessive shadows, or repeated identical card grids.
- **Anti-references:** generic AI SaaS templates, neon cyberpunk, oversized empty hero layouts, stock-person illustrations, and pages where every section is a 3-card grid.
- **Token ownership/runtime mapping:** this file mirrors the canonical values already implemented in `app/globals.css`; runtime CSS remains the source of truth and this document records intent.

## Colors
White and very-light lavender carry the page. `text-primary` and `text-secondary` create hierarchy. Brand purple/violet/magenta are reserved for emphasis, CTAs, selected states, and small visual anchors. Status colors keep operational meaning separate from brand decoration.

## Typography
Use one Inter-based sans-serif family across the entire marketing site and product-facing UI, including headings, body copy, controls, forms, Ant Design and Material UI surfaces. Do not introduce alternate display/serif families for page content. Display copy is bold but controlled and should stay compact enough to preserve balanced two-column hero layouts. Body copy stays readable at 14–17px with generous line height and constrained measure. Data and labels may be denser but remain sentence case except for concise eyebrows. Marketplace/logo marks may preserve their own recognizable brand lettering when used as marks rather than page typography.

## Layout
Use a 1210px max content width with responsive gutters. Prefer asymmetrical 12-column compositions, editorial text + product evidence, alternating media/text rows, and bento arrangements with deliberate span differences. Avoid trapped dead space and equal-emphasis layouts. Mobile stacks naturally without horizontal overflow.

## Elevation & Depth
The site is intentionally flat: hierarchy comes from borders, tonal surfaces, spacing, and crop. Static content does not use decorative shadows. Dashboard/media frames may use soft background contrast but no floating-card shadow treatment.

## Shapes
Use medium radii rather than pills by default. Pills are reserved for status, eyebrows, and compact metadata. Larger media frames may use 18–24px radii; controls remain tighter.

## Components

### Foundational visual states
Interactive elements require visible hover/focus states, stable dimensions, sufficient contrast, and reduced-motion support. Loading/layout changes must not shift surrounding content unexpectedly.

### Buttons and actions
Primary actions use the brand gradient with white text. Secondary actions use white surfaces and quiet borders. Keep action names concrete and consistent across pages.

### Navigation and data display
Marketing navigation stays quiet so product content leads. Tables and dashboard previews favor legible data density, clear status language, and responsive overflow rather than decorative complexity.

### Forms and overlays
Use app-owned Ant Design/MUI behavior where already present, themed to AutoDropshipPrime. Fields keep labels and focus states visible and avoid default library blue.

### Iconography
Lucide React is the default functional icon family. Colorful brand/platform marks may use inline brand treatments or approved supplied assets. Icons support text labels; they do not replace them where meaning could be ambiguous.

### Motion
Use short 150–350ms state transitions, one purposeful marquee or reveal when it helps hierarchy, and respect `prefers-reduced-motion`. Avoid ambient movement that competes with product content.

### Content and data visualization
Write in direct seller language: research, list, monitor, order, track, calculate, review. Never claim unsupported integrations or outcomes. Charts use purple as primary series with blue/green supporting series and restrained annotations.

## Do's and Don'ts
- **Do:** make real product screenshots and workflow context the strongest evidence on feature pages.
- **Do:** vary layout type by content—editorial rows, connected rails, tables, and bento—not one repeated card system.
- **Don't:** use giant rounded cards for every section or add decorative gradients without a product role.
- **Don't:** invent integrations, testimonials, savings claims, or operational capabilities not supported by the brief/product.
