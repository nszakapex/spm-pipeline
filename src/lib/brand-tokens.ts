/**
 * SPM Pipeline brand tokens.
 *
 * Confirmed values are taken from the live public site https://superpowermentors.com
 * (CSS/JS bundles and public assets, audited 2026-08-20).
 * Approximations are labeled in docs/brand-audit.md.
 */

export const brandTokens = {
  name: {
    product: "SPM Pipeline",
    full: "Superpower Mentors — Pipeline Control",
    org: "Superpower Mentors",
    legal: "Superpower Consulting, Inc.",
  },
  tagline: "Because being understood changes everything.",
  colors: {
    /** Confirmed: --spm-blue-primary */
    bluePrimary: "#1c48e6",
    /** Confirmed: --spm-blue-secondary */
    blueSecondary: "#2f6fc4",
    /** Confirmed: dominant navy text */
    navy: "#07164A",
    /** Confirmed: --spm-text-muted (light theme) */
    textMuted: "#4b5875",
    /** Confirmed: warm cream surface accent */
    cream: "#faf6ee",
    /** Confirmed: gold accent */
    gold: "#e8bd36",
    /** Confirmed: CTA gradient start */
    sky: "#4f9dff",
    /** Confirmed: logo mark fill (favicon / banner mark) */
    markBlue: "#2563eb",
    /** Confirmed: deep blue panel end */
    deepBlue: "#163a8a",
    /** Confirmed: soft photo frame */
    sand: "#e8e1d7",
    white: "#ffffff",
    /** Confirmed cream — used as the ops canvas */
    appBackground: "#f4f7fc",
    surface: "#ffffff",
    border: "rgba(7, 22, 74, 0.12)",
    borderStrong: "rgba(7, 22, 74, 0.16)",
    flag: "#e8bd36",
    ok: "#1c48e6",
  },
  typography: {
    fontFamily:
      '"Lucida Grande", "Helvetica Neue", Inter, "Avenir Next", ui-sans-serif, system-ui, sans-serif',
    trackingTight: "-0.03em",
    trackingDisplay: "-0.045em",
  },
  radius: {
    base: "1.25rem",
    pill: "9999px",
    card: "8px",
    panel: "8px",
  },
  shadow: {
    soft: "0 18px 50px -46px rgba(7, 22, 74, 0.28)",
    panel: "0 28px 80px -48px rgba(7, 22, 74, 0.45)",
    cta: "0 10px 22px rgba(28, 72, 230, 0.18)",
  },
  assets: {
    logoBanner: "/brand/logo-banner.svg",
    logoMark: "/brand/logo-mark.svg",
    /** Public source URLs used for the prototype assets */
    publicLogoBannerUrl:
      "https://superpowermentors.com/assets/logo_banner_blue-2ntnM3I7.svg",
    publicFaviconUrl: "https://superpowermentors.com/favicon.svg",
  },
  tone: [
    "human",
    "optimistic",
    "polished",
    "warm",
    "modern",
    "high-trust",
    "operationally serious",
  ] as const,
} as const;

export type BrandTokens = typeof brandTokens;
