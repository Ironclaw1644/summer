// GENERATED FILE — synced from walkperro/src/showroom/tourguide/tourguide.ts (v2.4.1)
// Do not edit here. Edit in walkperro and re-run: node scripts/sync-tourguide.mjs
// walkperro tourguide — v2.4.1
// ─────────────────────────────────────────────────────────────────────────────
// Shared demo-mode overlay. COPIED into each demo repo by
// walkperro/scripts/sync-tourguide.mjs — edit it THERE (walkperro), never in a
// consumer repo. Zero dependencies.
//
// v2: HOST-ADAPTIVE styling. Instead of hardcoding walkperro's brand, the guide
// reads the host site's own accent color + font at mount time (from CSS custom
// properties, then a prominent button, then a neutral fallback) so the popups
// look like they belong to whatever site they're running on. Pass
// `theme: { accent, font }` to override the auto-detection.
//
// Consumer contract (each demo repo, only when DEMO_MODE=1):
//   import { mountTourguide } from "<repo>/lib/tourguide";
//   mountTourguide({ steps, siteSlug, adminUrl })
// ─────────────────────────────────────────────────────────────────────────────

export type TourStep = {
  selector: string;        // element to spotlight (first match)
  title: string;
  body: string;            // 1–2 sentences
  route?: string;          // optional path to navigate to before showing
};

export type TourguideTheme = {
  accent?: string;         // brand accent; auto-detected from the host if omitted
  font?: string;           // body font; inherits the host's if omitted
};

// Bottom-of-page studio line: one quiet "Want a site like this? → luziq.ai"
// link that slides up near the page bottom. No prices, no timers — Luziq quotes
// websites per project. Set `ctaBar: false` to turn it off for a demo.
export type TourguideConfig = {
  siteSlug: string;        // tags the lead: luziq.ai/websites/ (Luziq)
  steps: TourStep[];
  adminUrl?: string;       // where the "check out the admin" nudge points
  inquireUrl?: string;     // override for the "get this built" CTA target
  ctaBar?: boolean;        // bottom-of-page studio line (default on)
  accent?: string;         // shorthand for theme.accent
  theme?: TourguideTheme;
};

const LS_DONE = "wp_tg_done";
const LS_EXIT = "wp_tg_exit_shown";

// ── theme resolution ─────────────────────────────────────────────────────────

const ACCENT_VARS = [
  "--site-accent", "--site-cta", "--accent", "--accent-cta", "--color-accent",
  "--brand", "--brand-color", "--primary", "--color-primary", "--flame", "--gold",
];

function readCssVar(names: string[]): string | null {
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  for (const n of names) {
    const raw = (root.getPropertyValue(n) || body.getPropertyValue(n)).trim();
    const c = usableColor(raw);
    if (c) return c;
  }
  return null;
}

// Sample the page's most prominent CTA color as an accent guess. Scans real
// buttons + button-styled links (not just ones with btn/cta in the class),
// skips greys/whites/near-blacks, and keeps the most *saturated* hue — that's
// almost always the brand color (e.g. a restaurant's gold "Reserve" button).
function sampleButtonAccent(): string | null {
  const cands = document.querySelectorAll<HTMLElement>(
    "button,a[class*='btn'],a[class*='cta'],a[class*='button'],a[role='button'],[class*='Button']"
  );
  let best: string | null = null;
  let bestSat = 0.12; // require a minimum saturation to count as a brand hue
  for (const el of Array.from(cands).slice(0, 40)) {
    const rgb = parseRgb(getComputedStyle(el).backgroundColor);
    if (!rgb || rgb.a < 0.6 || isNearGrey(rgb) || isNearWhite(rgb)) continue;
    const mx = Math.max(rgb.r, rgb.g, rgb.b), mn = Math.min(rgb.r, rgb.g, rgb.b);
    if (mx < 28) continue; // near-black: keep looking for an actual color
    const sat = (mx - mn) / mx;
    if (sat > bestSat) { bestSat = sat; best = `rgb(${rgb.r},${rgb.g},${rgb.b})`; }
  }
  return best;
}

function parseRgb(s: string): { r: number; g: number; b: number; a: number } | null {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map((x) => parseFloat(x));
  return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
}
function isNearGrey(c: { r: number; g: number; b: number }): boolean {
  const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
  return mx - mn < 16;
}
function isNearWhite(c: { r: number; g: number; b: number }): boolean {
  return c.r > 235 && c.g > 235 && c.b > 235;
}
function luminance(hexOrRgb: string): number {
  let r = 0, g = 0, b = 0;
  const rgb = parseRgb(hexOrRgb);
  if (rgb) { r = rgb.r; g = rgb.g; b = rgb.b; }
  else {
    const h = hexOrRgb.replace("#", "");
    const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    r = parseInt(s.slice(0, 2), 16); g = parseInt(s.slice(2, 4), 16); b = parseInt(s.slice(4, 6), 16);
  }
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function contrastText(accent: string): string {
  return luminance(accent) > 0.6 ? "#141414" : "#ffffff";
}

// Resolve any CSS color (named/hex/rgb/hsl) to rgb channels via the DOM, so we
// can reason about greys/darkness regardless of the source format.
function toRgb(color: string): { r: number; g: number; b: number; a: number } | null {
  if (typeof document === "undefined") return parseRgb(color);
  const el = document.createElement("span");
  el.style.cssText = "display:none;color:" + color;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  el.remove();
  return parseRgb(computed);
}

// Accept a CSS-var value only if it's a real, non-neutral color. Wraps bare
// Tailwind/shadcn channel tokens ("240 6% 10%") and rejects greys/whites — an
// unusable token must not blank out the accent (transparent CTA, no strikethrough).
function usableColor(raw: string): string | null {
  if (!raw) return null;
  const ok = (c: string) =>
    typeof CSS !== "undefined" && !!CSS.supports && CSS.supports("color", c);
  let color: string | null = null;
  if (ok(raw)) color = raw;
  else if (ok(`hsl(${raw})`)) color = `hsl(${raw})`;
  else if (ok(`rgb(${raw})`)) color = `rgb(${raw})`;
  if (!color) return null;
  const rgb = toRgb(color);
  if (!rgb || rgb.a < 0.5 || isNearGrey(rgb) || isNearWhite(rgb)) return null;
  return color;
}

// Lift a too-dark accent so it stays legible on the dark reveal bar (keeps hue;
// desaturated near-blacks become a light neutral rather than an invisible smudge).
function ensureBright(color: string): string {
  const rgb = toRgb(color);
  if (!rgb) return color;
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  if (lum >= 0.26) return color;
  const mx = Math.max(rgb.r, rgb.g, rgb.b), mn = Math.min(rgb.r, rgb.g, rgb.b);
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  if (sat < 0.18) return "#ededed";
  const f = Math.min(3.2, 0.52 / Math.max(lum, 0.05));
  const c = (n: number) => Math.min(255, Math.round(n * f));
  return `rgb(${c(rgb.r)},${c(rgb.g)},${c(rgb.b)})`;
}

function resolveTheme(cfg: TourguideConfig): { accent: string; onAccent: string; font: string } {
  const accent =
    cfg.theme?.accent || cfg.accent ||
    readCssVar(ACCENT_VARS) || sampleButtonAccent() || "#141414";
  const font =
    cfg.theme?.font ||
    getComputedStyle(document.body).fontFamily ||
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  return { accent, onAccent: contrastText(accent), font };
}

function buildCSS(t: { accent: string; onAccent: string; font: string }): string {
  // The reveal bar is dark, so its accent must stay bright regardless of how
  // dark the host brand color is (the tour cards are white and use t.accent).
  const rev = ensureBright(t.accent);
  return `
.wp-tg-banner{position:fixed;top:0;left:0;right:0;z-index:99990;background:#141414f2;color:#fff;font-family:${t.font};font-size:13px;letter-spacing:.01em;display:flex;align-items:center;justify-content:center;gap:18px;padding:9px 14px;border-bottom:2px solid ${t.accent};backdrop-filter:saturate(1.2) blur(2px)}
.wp-tg-banner a.wp-tg-credit{white-space:nowrap;color:#fff;border-bottom-color:#ffffff66}@media (max-width:600px){.wp-tg-banner .wp-tg-nightly{display:none}}
.wp-tg-banner .wp-tg-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:${t.accent};margin-right:7px;vertical-align:middle}
.wp-tg-banner a{color:${t.accent};text-decoration:none;font-weight:600;border-bottom:1.5px solid ${t.accent}}
.wp-tg-banner button{all:unset;cursor:pointer;color:#fff;border:1px solid #ffffff88;border-radius:999px;padding:3px 12px;font-family:${t.font};font-size:12px}
.wp-tg-banner button:hover{background:${t.accent};border-color:${t.accent};color:${t.onAccent}}
.wp-tg-mask{position:fixed;inset:0;z-index:99991;pointer-events:none}
.wp-tg-hole{position:absolute;border-radius:8px;box-shadow:0 0 0 99999px rgba(15,17,21,.66);outline:3px solid ${t.accent};outline-offset:2px;transition:all .28s cubic-bezier(.2,0,0,1)}
.wp-tg-card{position:fixed;z-index:99993;width:330px;max-width:calc(100vw - 24px);box-sizing:border-box;background:#fff;color:#1a1a1a;border-radius:14px;box-shadow:0 18px 50px -12px rgba(0,0,0,.4),0 0 0 1px rgba(0,0,0,.05);padding:18px 18px 16px;font-family:${t.font}}
.wp-tg-card h4{margin:0 0 7px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:${t.accent}}
.wp-tg-card p{margin:0 0 14px;font-size:14px;line-height:1.55;color:#333}
.wp-tg-row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.wp-tg-count{font-size:12px;color:#9a9a9a;font-variant-numeric:tabular-nums}
.wp-tg-btn{all:unset;cursor:pointer;background:${t.accent};color:${t.onAccent};padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;font-family:${t.font}}
.wp-tg-btn:hover{filter:brightness(.92)}
.wp-tg-skip{all:unset;cursor:pointer;font-size:13px;color:#9a9a9a}
.wp-tg-skip:hover{color:#555}
.wp-tg-exit{position:fixed;inset:0;z-index:99995;background:rgba(15,17,21,.74);display:flex;align-items:center;justify-content:center;padding:24px}
.wp-tg-exit-card{background:#fff;border-radius:18px;box-shadow:0 30px 70px -20px rgba(0,0,0,.5);max-width:430px;padding:32px;font-family:${t.font}}
.wp-tg-exit-card h3{margin:0 0 12px;font-size:23px;font-weight:700;letter-spacing:-.01em;color:#1a1a1a}
.wp-tg-exit-card p{margin:0 0 20px;font-size:14px;line-height:1.6;color:#444}
body.wp-tg-active{padding-top:40px}
body.wp-tg-price-open{padding-bottom:48px}
.wp-tg-price{position:fixed;left:0;right:0;bottom:0;z-index:99992;transform:translateY(115%);transition:transform .55s cubic-bezier(.2,0,0,1);background:rgba(18,18,18,.94);backdrop-filter:saturate(1.2) blur(4px);border-top:1px solid ${rev};color:#fff;font-family:${t.font}}
.wp-tg-price.show{transform:translateY(0)}
.wp-tg-price-in{max-width:1120px;margin:0 auto;display:flex;align-items:center;gap:10px;justify-content:center;padding:10px 14px}
.wp-tg-price a.wp-tg-cta{color:#ffffffd9;text-decoration:none;font-size:13px;letter-spacing:.01em}
.wp-tg-price a.wp-tg-cta b{color:${rev};font-weight:600}
.wp-tg-price a.wp-tg-cta:hover{color:#fff}
.wp-tg-price-x{all:unset;cursor:pointer;color:#ffffff70;font-size:17px;line-height:1;padding:2px 8px;border-radius:8px}
.wp-tg-price-x:hover{color:#fff;background:#ffffff1a}
`;
}

export function mountTourguide(cfg: TourguideConfig): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("wp-tg-style")) return; // once

  const theme = resolveTheme(cfg);
  const style = document.createElement("style");
  style.id = "wp-tg-style";
  style.textContent = buildCSS(theme);
  document.head.appendChild(style);

  // "get this built" points at the studio that hosts the demo catalog
  // (Luziq, luziq.ai), NOT walkperro — and tags which demo drove the lead so the
  // contact form can prefill + Walk knows the source.
  const inquireUrl =
    cfg.inquireUrl ||
    `https://luziq.ai/websites/`;

  // ── banner ────────────────────────────────────────────────────────────────
  const banner = document.createElement("div");
  banner.className = "wp-tg-banner";
  banner.innerHTML =
    `<span><span class="wp-tg-dot"></span><a class="wp-tg-credit" href="https://luziq.ai/websites/" target="_blank" rel="nofollow noopener">Demo by <b style="letter-spacing:.12em">LUZIQ</b></a><span class="wp-tg-nightly"> · resets nightly</span></span>` +
    (cfg.adminUrl ? `<a href="${cfg.adminUrl}">open the admin →</a>` : "") +
    `<a href="${inquireUrl}" target="_blank" rel="nofollow noopener">want one like this? →</a>` +
    `<button type="button" data-tg-restart>tour</button>`;
  document.body.appendChild(banner);
  document.body.classList.add("wp-tg-active");
  banner.querySelector("[data-tg-restart]")!.addEventListener("click", () => {
    localStorage.removeItem(LS_DONE);
    stepIdx = 0;
    runTour();
  });

  // ── spotlight tour ──────────────────────────────────────────────────────────
  let stepIdx = 0;
  let mask: HTMLElement | null = null;
  let card: HTMLElement | null = null;

  function cleanupStep() {
    mask?.remove();
    card?.remove();
    mask = card = null;
  }

  function endTour(markDone = true) {
    cleanupStep();
    if (markDone) localStorage.setItem(LS_DONE, "1");
  }

  function showStep(i: number) {
    cleanupStep();
    const step = cfg.steps[i];
    if (!step) return endTour();
    if (step.route && window.location.pathname !== step.route) {
      sessionStorage.setItem("wp_tg_resume", String(i));
      window.location.href = step.route;
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) return showStep(i + 1); // selector missing → skip gracefully
    el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });

    const r = el.getBoundingClientRect();
    mask = document.createElement("div");
    mask.className = "wp-tg-mask";
    const hole = document.createElement("div");
    hole.className = "wp-tg-hole";
    Object.assign(hole.style, {
      top: `${r.top - 6}px`,
      left: `${r.left - 6}px`,
      width: `${r.width + 12}px`,
      height: `${r.height + 12}px`,
    });
    mask.appendChild(hole);
    document.body.appendChild(mask);

    card = document.createElement("div");
    card.className = "wp-tg-card";
    const isLast = i === cfg.steps.length - 1;
    card.innerHTML =
      `<h4>${step.title}</h4><p>${step.body}</p>` +
      `<div class="wp-tg-row"><span class="wp-tg-count">${i + 1} / ${cfg.steps.length}</span>` +
      `<span style="display:flex;gap:14px;align-items:center"><button class="wp-tg-skip" data-tg-skip>skip</button> ` +
      `<button class="wp-tg-btn" data-tg-next>${
        isLast ? (cfg.adminUrl ? "open the admin →" : "done") : "next →"
      }</button></span></div>`;
    document.body.appendChild(card);

    // Position after append so we can measure the real card size and clamp it
    // inside the viewport on both axes (prevents off-screen clipping on phones).
    const M = 12;
    const cr = card.getBoundingClientRect();
    const cardW = cr.width, cardH = cr.height;
    let left = Math.min(r.left, window.innerWidth - cardW - M);
    left = Math.max(M, left);
    const below = r.bottom + M + cardH < window.innerHeight;
    let top = below ? r.bottom + 14 : r.top - cardH - 14;
    top = Math.max(52, Math.min(top, window.innerHeight - cardH - M));
    Object.assign(card.style, { top: `${top}px`, left: `${left}px` });

    card.querySelector("[data-tg-skip]")!.addEventListener("click", () => endTour());
    card.querySelector("[data-tg-next]")!.addEventListener("click", () => {
      if (isLast) {
        endTour();
        if (cfg.adminUrl) window.location.href = cfg.adminUrl;
      } else {
        showStep(i + 1);
      }
    });
    stepIdx = i;
  }

  function runTour() {
    showStep(stepIdx);
  }

  // Don't auto-launch the tour when someone deep-links straight into the admin
  // (e.g. the "Admin" badge on the catalog) — step 1 lives on the storefront, so
  // auto-running would yank them off /admin. The banner's "tour" button still works.
  const onAdmin = /(^|\/)admin(\/|$)/.test(window.location.pathname);
  const resume = sessionStorage.getItem("wp_tg_resume");
  if (resume !== null) {
    sessionStorage.removeItem("wp_tg_resume");
    stepIdx = parseInt(resume, 10) || 0;
    setTimeout(runTour, 450);
  } else if (!localStorage.getItem(LS_DONE) && !onAdmin) {
    setTimeout(runTour, 950);
  }

  // ── exit intent (desktop only, once) ─────────────────────────────────────
  document.addEventListener("mouseout", (e) => {
    if (e.relatedTarget || (e as MouseEvent).clientY > 8) return;
    if (localStorage.getItem(LS_EXIT)) return;
    localStorage.setItem(LS_EXIT, "1");
    const wrap = document.createElement("div");
    wrap.className = "wp-tg-exit";
    wrap.innerHTML =
      `<div class="wp-tg-exit-card"><h3>Want a site like this?</h3>` +
      `<p>Everything you just clicked — the site, the admin, the whole thing — can be built and branded for your business.</p>` +
      `<div class="wp-tg-row"><button class="wp-tg-skip" data-tg-close>keep looking</button>` +
      `<a class="wp-tg-btn" style="text-decoration:none" href="${inquireUrl}" target="_blank" rel="nofollow noopener">Get this built →</a></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (ev) => {
      if (ev.target === wrap || (ev.target as HTMLElement).dataset.tgClose !== undefined) {
        wrap.remove();
      }
    });
  });

  // ── bottom-of-page studio line (no prices, no countdown) ──────────────────
  // Clear state left behind by the old priced bar so returning visitors see the
  // new line even if they dismissed the old one.
  localStorage.removeItem("wp_tg_deadline");
  localStorage.removeItem("wp_tg_price_dismissed");
  if (cfg.ctaBar !== false && !localStorage.getItem("wp_tg_cta_dismissed")) {
    const bar = document.createElement("div");
    bar.className = "wp-tg-price";
    bar.innerHTML =
      `<div class="wp-tg-price-in">` +
      `<a class="wp-tg-cta" href="https://luziq.ai/websites/" target="_blank" rel="nofollow noopener">Want a site like this? → <b>luziq.ai</b></a>` +
      `<button class="wp-tg-price-x" data-tg-price-x aria-label="dismiss">×</button>` +
      `</div>`;
    document.body.appendChild(bar);

    bar.querySelector("[data-tg-price-x]")!.addEventListener("click", () => {
      localStorage.setItem("wp_tg_cta_dismissed", "1");
      bar.classList.remove("show");
      document.body.classList.remove("wp-tg-price-open");
      setTimeout(() => bar.remove(), 550);
    });

    let shown = false;
    const reveal = () => {
      if (shown) return;
      shown = true;
      bar.classList.add("show");
      document.body.classList.add("wp-tg-price-open");
    };

    // Reveal when the visitor nears the bottom of the page.
    const sentinel = document.createElement("div");
    sentinel.style.cssText =
      "position:absolute;bottom:0;left:0;width:1px;height:1px;pointer-events:none";
    document.body.appendChild(sentinel);
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            reveal();
            io.disconnect();
          }
        },
        { rootMargin: "0px 0px 45% 0px" }
      );
      io.observe(sentinel);
    } else {
      const onScroll = () => {
        if ((window.scrollY + window.innerHeight) / document.body.scrollHeight > 0.66) {
          reveal();
          window.removeEventListener("scroll", onScroll);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }
}
