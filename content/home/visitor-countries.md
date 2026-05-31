---
widget: blank
active: true
headless: true
weight: 999
title: Visitor Countries
subtitle:

design:
  columns: "1"
---

<div class="nrlab-section-intro">
  <p class="nrlab-eyebrow">Visitor Map</p>
  <h2>Country-level visitor sources for this website.</h2>
  <p>The map stores and displays country-level aggregates only. Individual IP addresses are not saved or shown.</p>
</div>

<div class="nrlab-visitor-map" data-visitor-countries data-endpoint="/api/visitor-countries" data-geojson="/uploads/nrlab/world-countries-110m.geojson">
  <div class="nrlab-visitor-map-frame" data-visitor-map aria-live="polite"></div>
  <div class="nrlab-visitor-panel">
    <div class="nrlab-visitor-stats">
      <span><strong data-visitor-total>0</strong>Total visits</span>
      <span><strong data-visitor-country-count>0</strong>Countries</span>
    </div>
    <p class="nrlab-visitor-updated">Last updated: <span data-visitor-updated>Waiting for first visit</span></p>
    <ol class="nrlab-visitor-list" data-visitor-list>
      <li>Loading country-level visits...</li>
    </ol>
    <p class="nrlab-visitor-status" data-visitor-status>Loading visitor countries...</p>
  </div>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script defer src="/js/visitor-countries.js"></script>
