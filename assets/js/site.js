/* KHELO BHARAT platform — shared runtime.
   Dependency-free. Loads canonical JSON from /data and renders shared chrome. */
(() => {
  "use strict";

  const NAV = [
    { href: "index.html", label: "Vision" },
    { href: "modules.html", label: "Modules" },
    { href: "systems.html", label: "Integration Hub" },
    { href: "stakeholders.html", label: "Stakeholders" },
    { href: "approvals.html", label: "Approvals" },
    { href: "datasets.html", label: "Data Catalogue" },
    { href: "questions.html", label: "Questions & Decisions" },
    { href: "roadmap.html", label: "Roadmap" },
    { href: "map.html", label: "Relationship Map" },
    { href: "governance.html", label: "Governance" }
  ];

  const EVIDENCE_LABELS = {
    "verified": "Verified",
    "partially-verified": "Partially verified",
    "proposed": "Proposed",
    "assumption": "Assumption",
    "requires-confirmation": "Requires govt confirmation",
    "unknown": "Unknown",
    "decision-required": "Decision required",
    "planned": "Planned"
  };

  const cache = {};

  const KB = {
    esc(s) {
      return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    },

    /* Some source strings carry intentional <b> emphasis; allow only that tag. */
    escKeepBold(s) {
      return KB.esc(s).replace(/&lt;(\/?b)&gt;/g, "<$1>");
    },

    param(name) {
      return new URLSearchParams(location.search).get(name);
    },

    async data(name) {
      if (cache[name]) return cache[name];
      const res = await fetch(`data/${name}.json`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load data/${name}.json (${res.status})`);
      cache[name] = await res.json();
      return cache[name];
    },

    chip(evidence, extraClass) {
      const label = EVIDENCE_LABELS[evidence] || evidence;
      return `<span class="chip chip--${KB.esc(evidence)}${extraClass ? " " + extraClass : ""}">${KB.esc(label)}</span>`;
    },

    modCode(id, color) {
      return `<span class="mod-code" style="background:${KB.esc(color)}">${KB.esc(id)}</span>`;
    },

    renderHeader(current) {
      const links = NAV.map(n =>
        `<a href="${n.href}"${n.href === current ? ' aria-current="page"' : ""}>${n.label}</a>`
      ).join("");
      return `
        <a class="skip-link" href="#main">Skip to main content</a>
        <div class="site-header">
          <div class="bar">
            <a class="brand" href="index.html" style="text-decoration:none">Khelo <em>Bharat</em></a>
            <nav class="site-nav" aria-label="Platform sections">${links}</nav>
          </div>
        </div>`;
    },

    renderFooter() {
      return `
        <footer class="site-footer">
          <div class="wrap">
            <div>Khelo Bharat — Platform Blueprint &amp; Decision Registers. Concept material: proposed designs are labeled and are not existing government systems.</div>
            <div><a href="index.html">Vision</a> · <a href="modules.html">20 Modules</a> · <a href="questions.html">Open questions</a></div>
          </div>
        </footer>`;
    },

    breadcrumbs(items) {
      const lis = items.map((it, i) =>
        i === items.length - 1
          ? `<li aria-current="page">${KB.esc(it.label)}</li>`
          : `<li><a href="${it.href}">${KB.esc(it.label)}</a></li>`
      ).join("");
      return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${lis}</ol></nav>`;
    },

    mountChrome(current) {
      const header = document.getElementById("site-header");
      const footer = document.getElementById("site-footer");
      if (header) header.innerHTML = KB.renderHeader(current);
      if (footer) footer.innerHTML = KB.renderFooter();
    },

    stateBlock(kind, title, detail) {
      return `<div class="state${kind === "error" ? " state--error" : ""}" role="${kind === "error" ? "alert" : "status"}"><b>${KB.esc(title)}</b>${KB.esc(detail || "")}</div>`;
    },

    /* ---------- Visual components (dependency-free) ---------- */

    reveal() {
      const els = document.querySelectorAll("[data-reveal]");
      if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      els.forEach((e, i) => {
        const d = e.dataset.delay ?? (e.parentElement && e.parentElement.children.length > 2 ? (i % 6) * 60 : 0);
        if (d) e.style.transitionDelay = `${d}ms`;
        io.observe(e);
      });
    },

    /* Sticky in-page section nav with scrollspy. sections: [{id,label}] */
    pageNav(sections) {
      const nav = `<nav class="page-nav" aria-label="Page sections"><ul>${
        sections.map(s => `<li><a href="#${s.id}">${KB.esc(s.label)}</a></li>`).join("")}</ul></nav>`;
      queueMicrotask(() => {
        const links = [...document.querySelectorAll(".page-nav a")];
        const map = new Map(sections.map(s => [s.id, links.find(a => a.getAttribute("href") === "#" + s.id)]));
        const io = new IntersectionObserver(entries => {
          entries.forEach(en => {
            if (en.isIntersecting) {
              links.forEach(a => a.classList.remove("active"));
              const a = map.get(en.target.id);
              if (a) a.classList.add("active");
            }
          });
        }, { rootMargin: "-20% 0px -70% 0px" });
        sections.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el); });
      });
      return nav;
    },

    /* Numbered tile flow from modules.json `flow` strings (with <b> labels). */
    flowTiles(steps) {
      return `<div class="flow-tiles">${
        steps.map(s => `<div class="flow-tile">${KB.escKeepBold(s)}</div>`).join("")}</div>`;
    },

    /* Horizontal bar chart. items: [{label, value, color}] */
    barChart(items, max) {
      const m = max || Math.max(...items.map(i => i.value), 1);
      return `<div class="bar-chart">${items.map(i => `
        <div class="bar-row">
          <span>${KB.esc(i.label)}</span>
          <span class="track"><span class="fill" style="width:${Math.round(100 * i.value / m)}%;${i.color ? `background:${KB.esc(i.color)}` : ""}"></span></span>
          <span class="val">${KB.esc(i.value)}</span>
        </div>`).join("")}</div>`;
    },

    /* Hub-and-spoke SVG: module/platform at centre, systems around.
       nodes: [{label, cls (integration class), verified (bool)}] */
    INT_COLORS: {
      "direct-integration": "#C05E12", "data-exchange": "#0B2E59", "federated-access": "#7A2E7E",
      "workflow-coordination": "#1E7A3C", "reporting-consolidation": "#14606B", "referral": "#B3541E",
      "future-integration": "#8a7a55", "manual-import": "#5B6675", "single-sign-on": "#334d6b", "none": "#9FB4CF"
    },

    hubSpoke(centerLabel, nodes, opts = {}) {
      const W = 760, H = Math.max(400, 130 + nodes.length * 34);
      const cx = W / 2, cy = H / 2;
      const rx = W / 2 - 130, ry = H / 2 - 46;
      const pts = nodes.map((n, i) => {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / nodes.length;
        return { ...n, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
      });
      const lines = pts.map((p, i) => {
        const c = KB.INT_COLORS[p.cls] || "#9FB4CF";
        const still = p.cls === "future-integration" || p.cls === "none";
        return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${c}" stroke-width="2.2" opacity=".85" stroke-dasharray="6 8"${still ? "" : ` style="animation:kbFlow ${1.2 + (i % 4) * .15}s linear infinite"`}/>`;
      }).join("");
      const nodeEls = pts.map(p => {
        const c = KB.INT_COLORS[p.cls] || "#9FB4CF";
        const anchor = p.x < cx - 8 ? "end" : p.x > cx + 8 ? "start" : "middle";
        const tx = p.x + (anchor === "end" ? -16 : anchor === "start" ? 16 : 0);
        const badge = p.verified ? `<circle cx="${p.x + 9}" cy="${p.y - 9}" r="5" fill="#1E7A3C"/>` : "";
        return `<g><circle cx="${p.x}" cy="${p.y}" r="11" fill="${c}"/>${badge}
          <text x="${tx}" y="${p.y + 4}" text-anchor="${anchor}" font-size="13" font-weight="700" fill="#152233">${KB.esc(p.label)}</text></g>`;
      }).join("");
      const usedClasses = [...new Set(nodes.map(n => n.cls))];
      const legend = `<div class="viz-legend" style="border-top:1px solid var(--paper-2);padding-top:12px">${usedClasses.map(c =>
        `<span><i style="background:${KB.INT_COLORS[c] || "#9FB4CF"}"></i>${KB.esc(c)}</span>`).join("")}
        <span><i style="background:#1E7A3C;border-radius:50%"></i>source-verified system</span></div>`;
      const small = String(centerLabel).length <= 4;
      const centerText = small
        ? `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="20" font-weight="800" fill="#fff" font-family="Fraunces,serif">${KB.esc(centerLabel)}</text>`
        : `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#F5A54A" letter-spacing="1" font-family="Inter,sans-serif">VERIFIED</text>
           <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" font-family="Fraunces,serif">${KB.esc(centerLabel)}</text>`;
      return `<div class="hub-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${KB.esc(opts.aria || `Integration map for ${centerLabel}`)}">
        ${lines}
        <circle class="pulse" cx="${cx}" cy="${cy}" r="60" fill="none" stroke="#F5A54A" stroke-width="2" style="transform-box:fill-box;transform-origin:center;animation:kbPulse 2.8s ease-out infinite"/>
        <circle cx="${cx}" cy="${cy}" r="54" fill="#0B2E59"/>
        <circle cx="${cx}" cy="${cy}" r="54" fill="none" stroke="#F5A54A" stroke-width="2" opacity=".55"/>
        ${centerText}
        ${nodeEls}
      </svg>${legend}</div>`;
    },

    /* Stylised screen wireframe per module pattern. */
    wireframe(pattern, title) {
      const bars = h => h.map(([v, cls]) => `<i class="${cls || ""}" style="height:${v}%"></i>`).join("");
      const rows = n => Array.from({ length: n }, (_, i) =>
        `<div class="wf-row"><i></i><span><u></u><u></u></span><s class="${i % 3 === 1 ? "g" : ""}">${i % 3 === 1 ? "OK" : "VIEW"}</s></div>`).join("");
      const BODIES = {
        dashboard: `<div class="wf-kpis"><div class="wf-kpi"><b>2.1L</b><span>records</span></div><div class="wf-kpi"><b>86%</b><span>on time</span></div><div class="wf-kpi"><b>14</b><span>flagged</span></div><div class="wf-kpi"><b>#3</b><span>rank</span></div></div>
          <div class="wf-bars">${bars([[62], [88, "hi"], [47], [71], [58], [93, "ok"], [66], [79]])}</div>${rows(2)}`,
        registry: `<div class="wf-field"><u style="width:55%"></u></div>${rows(4)}`,
        profile: `<div class="wf-profile"><div class="wf-avatar">A</div><div class="wf-rows">${rows(3)}</div></div>
          <div class="wf-steps"><b>✓</b><i></i><b>✓</b><i></i><b class="cur">3</b><i></i><b class="pend">4</b></div>`,
        workflow: `<div class="wf-steps"><b>✓</b><i></i><b>✓</b><i></i><b class="cur">3</b><i></i><b class="pend">4</b><i></i><b class="pend">5</b></div>${rows(3)}`,
        capture: `<div class="wf-form"><div class="wf-field"><u></u></div><div class="wf-field"><u style="width:52%"></u></div><div class="wf-field"><u style="width:44%"></u></div><div class="wf-btn"></div></div>
          <div class="wf-kpis" style="grid-template-columns:repeat(2,1fr)"><div class="wf-kpi"><b>Offline</b><span>sync ready</span></div><div class="wf-kpi"><b>12</b><span>queued</span></div></div>`
      };
      return `<div class="wireframe"><div class="wf-window">
        <div class="wf-bar"><i></i><i></i><i></i><span>${KB.esc(title || pattern + " pattern")}</span></div>
        <div class="wf-body">${BODIES[pattern] || BODIES.registry}</div>
      </div><div class="wf-caption"><b>Screen concept</b> — illustrative wireframe of the module's primary ${KB.esc(pattern)} pattern; not a built product.</div></div>`;
    }
  };

  window.KB = KB;
})();
