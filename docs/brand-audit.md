# Brand Audit — Superpower Mentors (current public site)

**Audited:** 2026-08-20  
**Source of truth:** https://superpowermentors.com (release meta `spm:release` / commit dated 2026-08-12)  
**Purpose:** Ground SPM Pipeline UI in the live public brand — not legacy SPM branding.

## Confirmed assets

| Asset | URL / path | Notes |
| --- | --- | --- |
| Logo banner (wordmark + mark) | https://superpowermentors.com/assets/logo_banner_blue-2ntnM3I7.svg | Copied to `public/brand/logo-banner.svg` |
| Logo mark / favicon | https://superpowermentors.com/favicon.svg | Copied to `public/brand/logo-mark.svg` |
| Social preview | https://superpowermentors.com/images/social-preview-v6.png | Reference only |

Logo fills in banner SVG: wordmark `#07164A`, mark `#2563eb`.  
Favicon mark fill: `#2563eb`.

**Authorization note:** Prototype uses publicly served SVG assets. Request an authorized internal-software logo package before production distribution.

## Confirmed colors

| Token | Hex | Source |
| --- | --- | --- |
| `--spm-blue-primary` | `#1c48e6` | Live CSS `:root` |
| `--spm-blue-secondary` | `#2f6fc4` | Live CSS `:root` |
| Navy text | `#07164A` | Dominant JS class usage |
| `--spm-text-muted` | `#4b5875` | Live CSS `:root` (light) |
| Cream | `#faf6ee` | JS/CSS |
| Gold | `#e8bd36` | JS/CSS |
| CTA sky | `#4f9dff` | Primary button gradient start |
| Deep panel blue | `#163a8a` | Gradient panels |
| Sand frame | `#e8e1d7` | Photo frames |

Dark-theme alternate SPM blues exist in CSS (`#4a6fa8` / `#5b7fad`) — not used for this ops app.

## Typography

**Confirmed stack:** `Inter, "Avenir Next", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Headlines: large semibold, tight tracking (`-0.03em` to `-0.04em`), occasional italic emphasis and secondary-blue spanned words.

## Radius / buttons / chrome

| Pattern | Confirmed value |
| --- | --- |
| Base `--radius` | `1.25rem` |
| Primary CTA | `rounded-full`, ~`h-14`, gradient `#4f9dff` → `#1c48e6` |
| Panels / cards | ~`1.75rem`–`2rem` soft radii |
| Nav | Pill “liquid glass” bar on marketing site |

## Visual tone

Human, optimistic, polished, warm, modern, high-trust. Real photography; not cartoon illustration. Marketing site uses light airy surfaces with blue/navy/gold.

## Approximations used in SPM Pipeline

| Token | Value | Why approximate |
| --- | --- | --- |
| App background | `#f4f7fc` | Soft blue-gray derived from marketing washes — not a named CSS var |
| Ops border | `rgba(7,22,74,0.10)` | Matches navy-tint borders used on site |
| Danger / success | `#c23b4a` / `#0C7F79` | `#0C7F79` appears once on site; danger chosen for ops urgency (labeled approximation) |

## Application guidance

- Feel like internal Superpower Mentors software — product name **SPM Pipeline**, subtitle Pipeline Control.
- Restrain glassmorphism vs marketing site.
- Avoid neon AI gradients, purple-black tropes, Salesforce clutter, clinical healthcare chrome.
- Prefer Inter to stay on-brand with the live public site.

## Code mapping

See `src/lib/brand-tokens.ts`.
