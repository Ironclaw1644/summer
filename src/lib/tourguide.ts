// GENERATED FILE — synced from walkperro/src/showroom/tourguide/tourguide.ts (v1.0.0)
// Do not edit here. Edit in walkperro and re-run: node scripts/sync-tourguide.mjs
// walkperro tourguide — v1.0.0
// ─────────────────────────────────────────────────────────────────────────────
// Shared demo-mode overlay. This file is COPIED into each demo repo by
// walkperro/scripts/sync-tourguide.mjs — edit it THERE (walkperro), never in a
// consumer repo. Zero dependencies, brand tokens inlined.
//
// Consumer contract (each demo repo):
//   import { mountTourguide } from "<repo>/lib/tourguide";
//   mountTourguide({ steps, siteSlug, inquireUrl })   // only when DEMO_MODE=1
//
// What it does:
//   • persistent top banner: "demo — resets nightly, go wild"
//   • spotlight step tooltips (2px cards, mono type, charcoal/bone)
//   • "check out the admin →" nudge after the last public step
//   • exit-intent panel → "want this? → walkperro.com/websites/<slug>"
// ─────────────────────────────────────────────────────────────────────────────

export type TourStep = {
  selector: string;        // element to spotlight (first match)
  title: string;           // mono, uppercase-styled by CSS
  body: string;            // 1–2 sentences, lowercase
  route?: string;          // optional path to navigate to before showing
};

export type TourguideConfig = {
  siteSlug: string;        // walkperro.com/websites/<siteSlug>
  steps: TourStep[];
  adminUrl?: string;       // where the "check out the admin" nudge points
  accent?: string;         // default signal yellow
};

const BONE = "#F5F1E8";
const CHARCOAL = "#0E0E0E";
const SIGNAL = "#EBFF00";
const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, monospace`;

const CSS = `
.wp-tg-banner{position:fixed;top:0;left:0;right:0;z-index:99990;background:${CHARCOAL};color:${BONE};font-family:${MONO};font-size:12px;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:16px;padding:8px 12px;border-bottom:1px solid ${SIGNAL}}
.wp-tg-banner a{color:${SIGNAL};text-decoration:none;border-bottom:1px solid ${SIGNAL}}
.wp-tg-banner button{all:unset;cursor:pointer;color:${BONE};border:1px solid ${BONE};padding:2px 8px;font-family:${MONO};font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.wp-tg-banner button:hover{background:${BONE};color:${CHARCOAL}}
.wp-tg-mask{position:fixed;inset:0;z-index:99991;pointer-events:none}
.wp-tg-hole{position:absolute;box-shadow:0 0 0 99999px rgba(14,14,14,.62);outline:2px solid ${SIGNAL};transition:all .25s cubic-bezier(.2,0,0,1)}
.wp-tg-card{position:fixed;z-index:99993;max-width:320px;background:${BONE};color:${CHARCOAL};border:2px solid ${CHARCOAL};padding:16px;font-family:${MONO}}
.wp-tg-card h4{margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:600}
.wp-tg-card p{margin:0 0 12px;font-size:13px;line-height:1.5}
.wp-tg-row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.wp-tg-count{font-size:11px;color:#6B6B6B;letter-spacing:.08em}
.wp-tg-btn{all:unset;cursor:pointer;background:${CHARCOAL};color:${BONE};padding:6px 12px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-family:${MONO}}
.wp-tg-btn:hover{background:${SIGNAL};color:${CHARCOAL}}
.wp-tg-skip{all:unset;cursor:pointer;font-size:11px;color:#6B6B6B;letter-spacing:.08em;text-transform:uppercase}
.wp-tg-exit{position:fixed;inset:0;z-index:99995;background:rgba(14,14,14,.72);display:flex;align-items:center;justify-content:center;padding:24px}
.wp-tg-exit-card{background:${BONE};border:2px solid ${CHARCOAL};max-width:420px;padding:28px;font-family:${MONO}}
.wp-tg-exit-card h3{margin:0 0 10px;font-size:20px;font-weight:600;letter-spacing:-.01em;text-transform:lowercase}
.wp-tg-exit-card p{margin:0 0 18px;font-size:13px;line-height:1.55}
body.wp-tg-active{padding-top:37px}
`;

const LS_DONE = "wp_tg_done";
const LS_EXIT = "wp_tg_exit_shown";

export function mountTourguide(cfg: TourguideConfig): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("wp-tg-style")) return; // once

  const style = document.createElement("style");
  style.id = "wp-tg-style";
  style.textContent = CSS;
  document.head.appendChild(style);

  const inquireUrl = `https://www.walkperro.com/websites/${cfg.siteSlug}`;

  // ── banner ────────────────────────────────────────────────────────────────
  const banner = document.createElement("div");
  banner.className = "wp-tg-banner";
  banner.innerHTML =
    `<span>// demo — resets nightly. go wild.</span>` +
    (cfg.adminUrl
      ? `<a href="${cfg.adminUrl}">open the admin →</a>`
      : "") +
    `<a href="${inquireUrl}">want this? →</a>` +
    `<button type="button" data-tg-restart>tour</button>`;
  document.body.appendChild(banner);
  document.body.classList.add("wp-tg-active");
  banner.querySelector("[data-tg-restart]")!.addEventListener("click", () => {
    localStorage.removeItem(LS_DONE);
    runTour();
  });

  // ── spotlight tour ────────────────────────────────────────────────────────
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
      `<h4>// ${step.title}</h4><p>${step.body}</p>` +
      `<div class="wp-tg-row"><span class="wp-tg-count">${String(i + 1).padStart(2, "0")} / ${String(cfg.steps.length).padStart(2, "0")}</span>` +
      `<span><button class="wp-tg-skip" data-tg-skip>skip</button> ` +
      `<button class="wp-tg-btn" data-tg-next>${
        isLast ? (cfg.adminUrl ? "open the admin →" : "done") : "next →"
      }</button></span></div>`;
    document.body.appendChild(card);

    // position card near the hole, clamped to viewport
    const cw = 320;
    const below = r.bottom + 12 + 160 < window.innerHeight;
    Object.assign(card.style, {
      top: below ? `${r.bottom + 12}px` : `${Math.max(48, r.top - 172)}px`,
      left: `${Math.min(Math.max(12, r.left), window.innerWidth - cw - 12)}px`,
    });

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

  // resume after a route: step, or first visit auto-start
  const resume = sessionStorage.getItem("wp_tg_resume");
  if (resume !== null) {
    sessionStorage.removeItem("wp_tg_resume");
    stepIdx = parseInt(resume, 10) || 0;
    setTimeout(runTour, 400);
  } else if (!localStorage.getItem(LS_DONE)) {
    setTimeout(runTour, 900);
  }

  // ── exit intent (desktop only, once) ─────────────────────────────────────
  document.addEventListener("mouseout", (e) => {
    if (e.relatedTarget || (e as MouseEvent).clientY > 8) return;
    if (localStorage.getItem(LS_EXIT)) return;
    localStorage.setItem(LS_EXIT, "1");
    const wrap = document.createElement("div");
    wrap.className = "wp-tg-exit";
    wrap.innerHTML =
      `<div class="wp-tg-exit-card"><h3>want one of these?</h3>` +
      `<p>everything you just clicked — the site, the admin, the whole machine — ships in about a week, branded to your business.</p>` +
      `<div class="wp-tg-row"><button class="wp-tg-skip" data-tg-close>keep looking</button>` +
      `<a class="wp-tg-btn" style="text-decoration:none" href="${inquireUrl}">get this built →</a></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (ev) => {
      if (ev.target === wrap || (ev.target as HTMLElement).dataset.tgClose !== undefined) {
        wrap.remove();
      }
    });
  });
}
