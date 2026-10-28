(function () {
  const state = { catalog: null, view: "models", filter: "", selected: null };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function load() {
    const res = await fetch("data/catalog.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Could not load catalog.json (" + res.status + ")");
    state.catalog = await res.json();
    $("#updated").textContent = state.catalog.updated || "";
    render();
  }

  function setView(view) {
    state.view = view;
    state.selected = null;
    $$("nav.tabs button").forEach((b) => {
      b.setAttribute("aria-selected", b.dataset.view === view ? "true" : "false");
    });
    render();
  }

  function projectTitle(id) {
    const p = state.catalog.projects.find((x) => x.id === id);
    return p ? p.title : id;
  }

  function modelTitle(id) {
    const m = state.catalog.models.find((x) => x.id === id);
    return m ? m.brand + " " + m.model : id;
  }

  function matches(text, q) {
    if (!q) return true;
    return text.toLowerCase().includes(q.toLowerCase());
  }

  function renderModels() {
    const q = state.filter.trim();
    const list = state.catalog.models.filter((m) => {
      const hay = [m.brand, m.model, ...(m.aka || []), m.panel_interface, m.cpu, ...(m.resolutions || [])].join(" ");
      return matches(hay, q);
    });
    const root = $("#panel-models");
    if (!list.length) {
      root.innerHTML = '<p class="empty">No models match that search.</p>';
      return;
    }
    root.innerHTML =
      '<input class="search" type="search" placeholder="Search models (e.g. D830, LVDS, 15.6)…" value="' +
      esc(state.filter) +
      '" id="model-search" aria-label="Search models" />' +
      '<div class="grid cards" id="model-grid"></div>';
    const grid = $("#model-grid");
    list.forEach((m) => {
      const el = document.createElement("article");
      el.className = "card";
      el.innerHTML =
        "<h2>" +
        esc(m.brand + " " + m.model) +
        "</h2>" +
        '<p class="meta">' +
        esc((m.aka || []).join(" · ")) +
        (m.year ? " · " + esc(m.year) : "") +
        "</p>" +
        "<dl>" +
        "<dt>Screen</dt><dd>" +
        esc(m.screen_size_in + '" · ' + (m.resolutions || []).join(" / ")) +
        "</dd>" +
        "<dt>Panel</dt><dd>" +
        esc(m.panel_interface) +
        "</dd>" +
        "<dt>CPU</dt><dd>" +
        esc(m.cpu) +
        "</dd>" +
        "<dt>Power</dt><dd>" +
        esc(m.power_adapter) +
        "</dd>" +
        "</dl>" +
        '<div class="chips">' +
        (m.fits_projects || [])
          .map((id) => '<a class="chip fit" href="#project-' + esc(id) + '">' + esc(projectTitle(id)) + "</a>")
          .join("") +
        ((m.unknowns || []).length
          ? '<span class="chip warn">' + esc(m.unknowns.length + " unknown(s)") + "</span>"
          : "") +
        "</div>" +
        '<div class="detail-actions"><button type="button" data-model="' +
        esc(m.id) +
        '">Full specs &amp; sources</button></div>';
      grid.appendChild(el);
    });
    $("#model-search").addEventListener("input", (e) => {
      state.filter = e.target.value;
      renderModels();
      $("#model-search").focus();
      const v = $("#model-search");
      const len = v.value.length;
      v.setSelectionRange(len, len);
    });
    grid.querySelectorAll("button[data-model]").forEach((btn) => {
      btn.addEventListener("click", () => showModel(btn.dataset.model));
    });
    grid.querySelectorAll("a.chip.fit").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const id = a.getAttribute("href").replace("#project-", "");
        setView("projects");
        setTimeout(() => {
          const t = document.getElementById("project-" + id);
          if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      });
    });
  }

  function showModel(id) {
    const m = state.catalog.models.find((x) => x.id === id);
    if (!m) return;
    state.selected = id;
    const root = $("#panel-models");
    root.innerHTML =
      '<p><button type="button" id="back-models">← All models</button></p>' +
      '<article class="card">' +
      "<h2>" +
      esc(m.brand + " " + m.model) +
      "</h2>" +
      '<p class="meta">' +
      esc((m.aka || []).join(" · ")) +
      (m.year ? " · " + esc(m.year) : "") +
      "</p>" +
      "<dl>" +
      "<dt>Screen</dt><dd>" +
      esc(m.screen_size_in + '"') +
      "</dd>" +
      "<dt>Resolutions</dt><dd>" +
      esc((m.resolutions || []).join("; ")) +
      "</dd>" +
      "<dt>Panel I/F</dt><dd>" +
      esc(m.panel_interface) +
      "</dd>" +
      "<dt>Connector</dt><dd>" +
      esc(m.panel_connector_notes) +
      "</dd>" +
      "<dt>CPU</dt><dd>" +
      esc(m.cpu) +
      "</dd>" +
      "<dt>Memory</dt><dd>" +
      esc(m.memory) +
      "</dd>" +
      "<dt>Power</dt><dd>" +
      esc(m.power_adapter) +
      "</dd>" +
      "<dt>Battery</dt><dd>" +
      esc(m.battery) +
      "</dd>" +
      "<dt>Ports</dt><dd>" +
      esc(m.ports_notes) +
      "</dd>" +
      "<dt>Gutting</dt><dd>" +
      esc(m.gutting_notes) +
      "</dd>" +
      "</dl>" +
      ((m.unknowns || []).length
        ? '<div class="callout"><strong>Marked unknown / verify on your unit:</strong><ul class="parts">' +
          m.unknowns.map((u) => "<li>" + esc(u) + "</li>").join("") +
          "</ul></div>"
        : "") +
      "<h3>Fits projects</h3>" +
      '<div class="chips">' +
      (m.fits_projects || [])
        .map((pid) => '<span class="chip fit">' + esc(projectTitle(pid)) + "</span>")
        .join("") +
      "</div>" +
      "<h3>Sources</h3>" +
      '<ol class="sources">' +
      (m.sources || [])
        .map((s) => '<li><a href="' + esc(s.url) + '" rel="noopener noreferrer" target="_blank">' + esc(s.title) + "</a></li>")
        .join("") +
      "</ol>" +
      "</article>";
    $("#back-models").addEventListener("click", () => {
      state.selected = null;
      renderModels();
    });
  }

  function renderProjects() {
    const q = state.filter.trim();
    const list = state.catalog.projects.filter((p) => {
      const hay = [p.title, p.summary, p.difficulty, ...(p.parts || [])].join(" ");
      return matches(hay, q);
    });
    const root = $("#panel-projects");
    root.innerHTML =
      '<input class="search" type="search" placeholder="Search projects…" value="' +
      esc(state.filter) +
      '" id="project-search" aria-label="Search projects" />' +
      '<div class="grid" id="project-grid"></div>';
    const grid = $("#project-grid");
    if (!list.length) {
      grid.innerHTML = '<p class="empty">No projects match.</p>';
      return;
    }
    list.forEach((p) => {
      const el = document.createElement("article");
      el.className = "card";
      el.id = "project-" + p.id;
      el.innerHTML =
        "<h2>" +
        esc(p.title) +
        "</h2>" +
        '<p class="meta">Difficulty: ' +
        esc(p.difficulty) +
        "</p>" +
        "<p>" +
        esc(p.summary) +
        "</p>" +
        "<h3>Fits models</h3>" +
        '<div class="chips">' +
        (p.fits_model_ids || [])
          .map((id) => '<span class="chip">' + esc(modelTitle(id)) + "</span>")
          .join("") +
        "</div>" +
        "<h3>Parts</h3>" +
        '<ul class="parts">' +
        (p.parts || []).map((x) => "<li>" + esc(x) + "</li>").join("") +
        "</ul>" +
        "<h3>Steps</h3>" +
        '<ol class="steps">' +
        (p.steps || []).map((x) => "<li>" + esc(x) + "</li>").join("") +
        "</ol>" +
        '<div class="safety"><strong>Safety</strong><ul>' +
        (p.safety || []).map((x) => "<li>" + esc(x) + "</li>").join("") +
        "</ul></div>";
      grid.appendChild(el);
    });
    $("#project-search").addEventListener("input", (e) => {
      state.filter = e.target.value;
      renderProjects();
      const v = $("#project-search");
      v.focus();
      const len = v.value.length;
      v.setSelectionRange(len, len);
    });
  }

  function renderLinks() {
    const root = $("#panel-links");
    const links = state.catalog.links || [];
    root.innerHTML =
      '<div class="callout">External designs and build logs. We cite them so you can learn from the originals — check each license before you remix or sell.</div>' +
      '<ul class="links">' +
      links
        .map(
          (l) =>
            "<li><h3><a href=\"" +
            esc(l.url) +
            '" rel="noopener noreferrer" target="_blank">' +
            esc(l.title) +
            "</a></h3>" +
            '<div class="chips">' +
            (l.tags || []).map((t) => '<span class="chip">' + esc(t) + "</span>").join("") +
            "</div>" +
            (l.notes ? "<p>" + esc(l.notes) + "</p>" : "") +
            "</li>"
        )
        .join("") +
      "</ul>";
  }

  function renderAbout() {
    $("#panel-about").innerHTML =
      '<article class="card">' +
      "<h2>About Recase</h2>" +
      "<p>Recase is a starter catalog for turning e-waste laptops into useful things — bartop arcades, photo stands, headrest monitors, and kiosks — organized by <strong>model</strong> so you know the screen size, panel connector, and power quirks before you cut wood or order a controller board.</p>" +
      '<p>Specs are only included when we can cite a source. Gaps are listed as <span class="chip warn">unknown</span> so you verify on your own unit (service tag, panel sticker, Dell Support).</p>' +
      '<p class="callout">Contribute: edit <code>data/catalog.json</code> and open a pull request. See <a href="https://github.com/fordcrews/recase/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a>.</p>' +
      "<p>Maintained by <a href=\"https://github.com/fordcrews\">fordcrews</a>. MIT licensed.</p>" +
      "</article>";
  }

  function render() {
    if (!state.catalog) return;
    $$(".panel").forEach((p) => {
      p.hidden = p.id !== "panel-" + state.view;
    });
    if (state.view === "models") {
      if (state.selected) showModel(state.selected);
      else renderModels();
    } else if (state.view === "projects") renderProjects();
    else if (state.view === "links") renderLinks();
    else if (state.view === "about") renderAbout();
  }

  document.addEventListener("DOMContentLoaded", () => {
    $$("nav.tabs button").forEach((b) => {
      b.addEventListener("click", () => {
        state.filter = "";
        setView(b.dataset.view);
      });
    });
    load().catch((err) => {
      $("#panel-models").hidden = false;
      $("#panel-models").innerHTML =
        '<p class="empty">Failed to load catalog: ' + esc(err.message) + "</p>";
    });
  });
})();
