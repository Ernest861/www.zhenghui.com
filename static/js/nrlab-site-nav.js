/**
 * Inject unified NRLab top nav (+ optional Tools crumb) into any page.
 * Usage: <div id="nrlab-site-nav" data-active="tools" data-tools-crumb="life-tree"></div>
 *        <script src="/js/nrlab-site-nav.js" defer></script>
 *        <link rel="stylesheet" href="/css/nrlab-site-chrome.css"/>
 */
(function () {
  var mount = document.getElementById("nrlab-site-nav");
  if (!mount) return;

  var active = (mount.getAttribute("data-active") || "").toLowerCase();
  var crumb = mount.getAttribute("data-tools-crumb") || "";

  /* Keep in sync with config/_default/menus.yaml (Visitors omitted). */
  var links = [
    { id: "home", name: "Home", href: "/" },
    { id: "focus", name: "Focus", href: "/#nrlab-overview" },
    { id: "research", name: "Research", href: "/#research-directions" },
    { id: "team", name: "Team", href: "/#team-foundation" },
    { id: "publications", name: "Publications", href: "/#publications" },
    { id: "outreach", name: "Outreach", href: "/#outreach-matrix" },
    { id: "tools", name: "Tools", href: "/tools/" },
    { id: "join", name: "Join", href: "/#training-recruitment" },
    { id: "alumni", name: "Alumni", href: "/#ra-alumni" },
    { id: "contact", name: "Contact", href: "/#contact" },
    { id: "apply", name: "Apply", href: "https://hlab2023.wjx.cn/vm/rnTipUj.aspx", cta: true },
  ];

  function isActive(item) {
    if (active && item.id === active) return true;
    var path = (location.pathname || "").replace(/\/index\.html$/, "/");
    if (item.id === "tools" && path.indexOf("/tools") === 0) return true;
    if (item.id === "home" && (path === "/" || path === "")) return true;
    return false;
  }

  var nav = document.createElement("header");
  nav.className = "nrlab-site-nav";
  nav.setAttribute("role", "banner");

  var brand = '<a class="nrlab-site-brand" href="/"><span class="mark" aria-hidden="true"></span>NRLab</a>';
  var toggle = '<button type="button" class="nrlab-site-toggle" aria-expanded="false" aria-controls="nrlab-site-links">Menu</button>';
  var lis = links.map(function (item) {
    var cls = [];
    if (isActive(item)) cls.push("is-active");
    if (item.cta) cls.push("is-cta");
    var aria = isActive(item) ? ' aria-current="page"' : "";
    return '<a href="' + item.href + '" class="' + cls.join(" ") + '"' + aria + ">" + item.name + "</a>";
  }).join("");

  nav.innerHTML =
    '<div class="nrlab-site-nav-inner">' +
    brand +
    toggle +
    '<nav id="nrlab-site-links" class="nrlab-site-links" aria-label="Primary">' + lis + "</nav>" +
    "</div>";

  mount.replaceWith(nav);

  var btn = nav.querySelector(".nrlab-site-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  if (crumb !== "" || active === "tools") {
    var crumbs = [
      { id: "index", name: "Tools 首页", href: "/tools/" },
      { id: "life-tree", name: "生命树", href: "/tools/life-tree" },
      { id: "life-tree-viz", name: "3D 查看器", href: "/tools/life-tree-viz" },
      { id: "appusage", name: "AppUsage", href: "/tools/appusage-timeline.html" },
      { id: "questionnaire", name: "量表汇总", href: "/tools/questionnaire.html" },
    ];
    var bar = document.createElement("div");
    bar.className = "nrlab-tools-crumb";
    bar.innerHTML =
      '<div class="nrlab-tools-crumb-inner">' +
      crumbs.map(function (c, i) {
        var on = c.id === crumb ? " is-on" : "";
        var sep = i ? '<span class="sep" aria-hidden="true">/</span>' : "";
        return sep + '<a class="' + on.trim() + '" href="' + c.href + '">' + c.name + "</a>";
      }).join("") +
      "</div>";
    nav.insertAdjacentElement("afterend", bar);
  }
})();
