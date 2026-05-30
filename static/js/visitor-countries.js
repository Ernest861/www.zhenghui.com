(function () {
  const root = document.querySelector("[data-visitor-countries]");

  if (!root) {
    return;
  }

  const endpoint = root.dataset.endpoint || "/api/visitor-countries";
  const geoUrl = root.dataset.geojson || "/uploads/nrlab/world-countries-110m.geojson";
  const sessionKey = "nrlab-country-visit-recorded";
  const mapEl = root.querySelector("[data-visitor-map]");
  const listEl = root.querySelector("[data-visitor-list]");
  const statusEl = root.querySelector("[data-visitor-status]");
  const totalEl = root.querySelector("[data-visitor-total]");
  const countriesEl = root.querySelector("[data-visitor-country-count]");
  const updatedEl = root.querySelector("[data-visitor-updated]");

  function emptyStats() {
    return {
      total: 0,
      countryCount: 0,
      updatedAt: null,
      countries: [],
    };
  }

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function hasRecordedThisSession() {
    try {
      return window.sessionStorage.getItem(sessionKey) === "1";
    } catch (error) {
      return false;
    }
  }

  function markRecordedThisSession() {
    try {
      window.sessionStorage.setItem(sessionKey, "1");
    } catch (error) {
      // Some privacy modes block sessionStorage; the server still stores country aggregates only.
    }
  }

  async function requestStats(method) {
    const response = await fetch(endpoint, {
      method,
      cache: "no-store",
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error(`Visitor countries request failed: ${response.status}`);
    }

    return response.json();
  }

  async function loadStats() {
    try {
      if (!hasRecordedThisSession()) {
        const stats = await requestStats("POST");
        markRecordedThisSession();
        return stats;
      }

      return requestStats("GET");
    } catch (error) {
      setStatus("Country tracking activates after the Netlify deploy finishes.");
      return emptyStats();
    }
  }

  async function loadCountries() {
    const response = await fetch(geoUrl, { cache: "force-cache" });

    if (!response.ok) {
      throw new Error(`Country map failed to load: ${response.status}`);
    }

    return response.json();
  }

  function updateNumbers(stats) {
    if (totalEl) {
      totalEl.textContent = String(stats.total || 0);
    }

    if (countriesEl) {
      countriesEl.textContent = String(stats.countryCount || stats.countries?.length || 0);
    }

    if (updatedEl) {
      updatedEl.textContent = stats.updatedAt
        ? new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(stats.updatedAt))
        : "Waiting for first visit";
    }
  }

  function renderList(stats) {
    if (!listEl) {
      return;
    }

    const countries = (stats.countries || []).slice(0, 8);

    if (!countries.length) {
      listEl.replaceChildren(document.createElement("li"));
      listEl.firstElementChild.textContent = "No country-level visits recorded yet.";
      return;
    }

    const items = countries.map((country) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const count = document.createElement("strong");

      label.textContent = country.name;
      count.textContent = String(country.count);
      item.append(label, count);

      return item;
    });

    listEl.replaceChildren(...items);
  }

  function drawMap(geojson, stats) {
    if (!mapEl || !window.d3) {
      return;
    }

    const width = Math.max(mapEl.clientWidth, 320);
    const height = Math.max(Math.round(width * 0.5), 260);
    const countries = new Map((stats.countries || []).map((country) => [country.code, country]));
    const maxCount = Math.max(1, ...Array.from(countries.values()).map((country) => country.count));
    const color = window.d3.scaleSequential([1, maxCount], window.d3.interpolateRgb("#bdeee4", "#6b4eff"));
    const projection = window.d3.geoNaturalEarth1().fitSize([width, height], geojson);
    const path = window.d3.geoPath(projection);

    mapEl.innerHTML = "";

    const svg = window.d3
      .select(mapEl)
      .append("svg")
      .attr("role", "img")
      .attr("aria-label", "Country-level visitor source map")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height);

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 8)
      .attr("fill", "#f6faf8");

    svg
      .append("g")
      .selectAll("path")
      .data(geojson.features)
      .join("path")
      .attr("d", path)
      .attr("fill", (feature) => {
        const country = countries.get(feature.properties.code);
        return country ? color(country.count) : "#dfe9e5";
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.6)
      .append("title")
      .text((feature) => {
        const country = countries.get(feature.properties.code);
        return country
          ? `${country.name}: ${country.count} visit${country.count === 1 ? "" : "s"}`
          : feature.properties.name;
      });
  }

  function debounce(callback) {
    let timer;

    return function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(callback, 150);
    };
  }

  Promise.all([loadStats(), loadCountries()])
    .then(([stats, geojson]) => {
      updateNumbers(stats);
      renderList(stats);
      drawMap(geojson, stats);
      setStatus("Country-level aggregate only. IP addresses are not stored or displayed.");
      window.addEventListener("resize", debounce(() => drawMap(geojson, stats)));
    })
    .catch(() => {
      updateNumbers(emptyStats());
      renderList(emptyStats());
      setStatus("Visitor map is temporarily unavailable.");
    });
})();
