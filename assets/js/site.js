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
      const res = await fetch(`data/${name}.json`);
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
    }
  };

  window.KB = KB;
})();
