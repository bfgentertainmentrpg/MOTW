// Monster of the Week Campaign Keeper — runs entirely in the browser.
// Data lives in localStorage; use Export/Import to back up or share.

const STORAGE_KEY = "motw-keeper-v1";
const $ = (sel, root = document) => root.querySelector(sel);
const main = () => $("#main");

// ---------- storage ----------

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function newCampaign(name) {
  return { id: uid(), name, created: Date.now(), entries: [] };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read saved data", e);
  }
  const c = newCampaign("My Campaign");
  return { campaigns: [c], currentId: c.id };
}

let db = loadDb();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    alert("Could not save — your browser storage may be full or blocked. Export a backup now.");
  }
}

const campaign = () => db.campaigns.find((c) => c.id === db.currentId) || db.campaigns[0];
const entries = () => campaign().entries;
const getEntry = (id) => entries().find((e) => e.id === id);
const byName = (name) => entries().find((e) => e.name.toLowerCase() === name.trim().toLowerCase());

// ---------- helpers ----------

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Escape, then turn [[Name]] into links, **bold** into <strong>, newlines into <br>.
function richText(s) {
  return esc(s)
    .replace(/\[\[([^\]]+)\]\]/g, (_, name) => {
      const target = byName(name.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
      return target
        ? `<a href="#/entry/${target.id}" class="wikilink">${name}</a>`
        : `<a href="#/new/${encodeURIComponent(name)}" class="wikilink missing" title="Create this entry">${name}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function blankValue(field) {
  switch (field.kind) {
    case "attacks":
    case "links":
      return [];
    case "track":
      return { max: 7, taken: 0 };
    case "countdown":
      return { steps: COUNTDOWN_STEPS.map(() => ""), reached: -1 };
    case "number":
      return 0;
    default:
      return "";
  }
}

function newEntry(type, name = "") {
  const t = TEMPLATES[type];
  const fields = {};
  t.fields.forEach((f) => (fields[f.key] = blankValue(f)));
  return { id: uid(), type, name: name || `New ${t.single}`, tags: [], notes: "", fields, created: Date.now(), updated: Date.now() };
}

function textOf(entry) {
  const parts = [entry.name, entry.notes, ...(entry.tags || [])];
  for (const v of Object.values(entry.fields || {})) {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach((a) => typeof a === "object" && parts.push(a.name, a.tags));
    else if (v && v.steps) parts.push(...v.steps);
  }
  return parts.join(" \n ");
}

function backlinks(entry) {
  const needle = `[[${entry.name.toLowerCase()}]]`;
  return entries().filter((e) => {
    if (e.id === entry.id) return false;
    const linked = Object.values(e.fields || {}).some((v) => Array.isArray(v) && v.includes(entry.id));
    return linked || textOf(e).toLowerCase().includes(needle);
  });
}

function entryChip(e) {
  if (!e) return "";
  const t = TEMPLATES[e.type];
  return `<a class="chip" href="#/entry/${e.id}">${t.icon} ${esc(e.name)}</a>`;
}

function download(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "campaign";

// ---------- sidebar ----------

function renderSidebar() {
  const counts = {};
  entries().forEach((e) => (counts[e.type] = (counts[e.type] || 0) + 1));
  $("#campaign-select").innerHTML =
    db.campaigns.map((c) => `<option value="${c.id}" ${c.id === campaign().id ? "selected" : ""}>${esc(c.name)}</option>`).join("") +
    `<option value="__new">+ New campaign…</option>`;
  $("#nav").innerHTML =
    `<a href="#/" data-route="">🏠 Dashboard</a>` +
    Object.entries(TEMPLATES)
      .map(([type, t]) => `<a href="#/list/${type}" data-route="list/${type}">${t.icon} ${t.label}<span class="count">${counts[type] || 0}</span></a>`)
      .join("");
  const route = location.hash.replace(/^#\/?/, "");
  document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === route));
}

// ---------- views ----------

function viewDashboard() {
  const c = campaign();
  const active = entries().filter((e) => e.type === "mystery" && e.fields.status === "Active");
  const recent = [...entries()].sort((a, b) => b.updated - a.updated).slice(0, 10);
  const sessions = entries()
    .filter((e) => e.type === "session")
    .sort((a, b) => (b.fields.date || "").localeCompare(a.fields.date || "") || b.created - a.created)
    .slice(0, 3);

  main().innerHTML = `
    <header class="page-head">
      <h1 contenteditable="true" id="campaign-name" spellcheck="false" title="Click to rename">${esc(c.name)}</h1>
      <div class="actions">
        <button class="danger" id="delete-campaign">Delete campaign</button>
      </div>
    </header>
    <section class="quick-add">
      ${Object.entries(TEMPLATES).map(([type, t]) => `<a class="btn" href="#/new-type/${type}">+ ${t.icon} ${t.single}</a>`).join("")}
    </section>
    <div class="grid2">
      <section class="card">
        <h2>Active Mysteries</h2>
        ${active.length ? active.map((m) => `<div class="row">${entryChip(m)} ${countdownMini(m.fields.countdown)}</div>`).join("") : `<p class="muted">No active mysteries. Set a mystery's status to <em>Active</em> to pin it here.</p>`}
      </section>
      <section class="card">
        <h2>Latest Sessions</h2>
        ${sessions.length ? sessions.map((s) => `<div class="row">${entryChip(s)} <span class="muted">${esc(s.fields.date || "")}</span></div>`).join("") : `<p class="muted">No sessions logged yet.</p>`}
      </section>
    </div>
    <section class="card">
      <h2>Recently Updated</h2>
      ${recent.length ? recent.map((e) => `<div class="row">${entryChip(e)} <span class="muted">${new Date(e.updated).toLocaleString()}</span></div>`).join("") : `<p class="muted">Nothing here yet — add your first entry above.</p>`}
    </section>`;

  const nameEl = $("#campaign-name");
  nameEl.addEventListener("keydown", (ev) => ev.key === "Enter" && (ev.preventDefault(), nameEl.blur()));
  nameEl.addEventListener("blur", () => {
    c.name = nameEl.textContent.trim() || "Untitled Campaign";
    save();
    renderSidebar();
  });
  $("#delete-campaign").addEventListener("click", () => {
    if (!confirm(`Delete "${c.name}" and all its entries? Export a backup first if unsure.`)) return;
    db.campaigns = db.campaigns.filter((x) => x.id !== c.id);
    if (!db.campaigns.length) db.campaigns.push(newCampaign("My Campaign"));
    db.currentId = db.campaigns[0].id;
    save();
    route();
  });
}

function countdownMini(cd) {
  if (!cd) return "";
  return `<span class="cd-mini">${COUNTDOWN_STEPS.map((s, i) => `<i class="${i <= cd.reached ? "on" : ""}" title="${s}"></i>`).join("")}</span>`;
}

function viewList(type, filter = "") {
  const t = TEMPLATES[type];
  let list = entries().filter((e) => e.type === type);
  if (filter) list = list.filter((e) => textOf(e).toLowerCase().includes(filter.toLowerCase()));
  list.sort((a, b) => a.name.localeCompare(b.name));

  main().innerHTML = `
    <header class="page-head">
      <h1>${t.icon} ${t.label}</h1>
      <div class="actions"><a class="btn primary" href="#/new-type/${type}">+ New ${t.single}</a></div>
    </header>
    <div class="cards">
      ${list.length ? list.map(cardHtml).join("") : `<p class="muted">No ${t.label.toLowerCase()} yet.</p>`}
    </div>`;
}

function cardHtml(e) {
  const t = TEMPLATES[e.type];
  const f = e.fields || {};
  const sub = [f.type, f.status, f.date].filter(Boolean).map(esc).join(" · ");
  const img = f.image ? `<img src="${esc(f.image)}" alt="" loading="lazy" onerror="this.remove()">` : `<div class="icon">${t.icon}</div>`;
  const blurb = f.motivation || f.concept || f.description || f.recap || e.notes || "";
  return `
    <a class="entry-card" href="#/entry/${e.id}">
      ${img}
      <div>
        <strong>${esc(e.name)}</strong>
        ${sub ? `<div class="muted small">${sub}</div>` : ""}
        ${blurb ? `<div class="small blurb">${esc(blurb.slice(0, 140))}</div>` : ""}
        ${(e.tags || []).length ? `<div class="tags">${e.tags.map((g) => `<span class="tag">#${esc(g)}</span>`).join("")}</div>` : ""}
      </div>
    </a>`;
}

function viewSearch(q) {
  const isTag = q.startsWith("#");
  const needle = (isTag ? q.slice(1) : q).toLowerCase();
  const results = entries().filter((e) =>
    isTag ? (e.tags || []).some((g) => g.toLowerCase() === needle) : textOf(e).toLowerCase().includes(needle)
  );
  main().innerHTML = `
    <header class="page-head"><h1>Search: ${esc(q)}</h1></header>
    <div class="cards">${results.length ? results.map(cardHtml).join("") : `<p class="muted">No matches.</p>`}</div>`;
}

// ----- entry view -----

function viewEntry(id) {
  const e = getEntry(id);
  if (!e) return (main().innerHTML = `<p>Entry not found. <a href="#/">Back to dashboard</a></p>`);
  const t = TEMPLATES[e.type];
  const back = backlinks(e);

  main().innerHTML = `
    <header class="page-head">
      <div>
        <div class="muted small"><a href="#/list/${e.type}">${t.icon} ${t.label}</a></div>
        <h1>${esc(e.name)}</h1>
        ${(e.tags || []).length ? `<div class="tags">${e.tags.map((g) => `<a class="tag" href="#/search/${encodeURIComponent("#" + g)}">#${esc(g)}</a>`).join("")}</div>` : ""}
      </div>
      <div class="actions">
        <a class="btn primary" href="#/edit/${e.id}">Edit</a>
        <button id="dup">Duplicate</button>
        <button class="danger" id="del">Delete</button>
      </div>
    </header>
    <div class="entry-body">
      ${t.fields.map((f) => viewField(e, f)).join("")}
      ${e.notes ? `<section class="field"><h3>Notes</h3><div class="text">${richText(e.notes)}</div></section>` : ""}
    </div>
    ${back.length ? `<section class="card"><h2>Referenced by</h2>${back.map(entryChip).join(" ")}</section>` : ""}
    <p class="muted small">Tip: click harm boxes or countdown steps to track them live during play.</p>`;

  $("#del").addEventListener("click", () => {
    if (!confirm(`Delete "${e.name}"?`)) return;
    campaign().entries = entries().filter((x) => x.id !== e.id);
    save();
    location.hash = `#/list/${e.type}`;
  });
  $("#dup").addEventListener("click", () => {
    const copy = JSON.parse(JSON.stringify(e));
    Object.assign(copy, { id: uid(), name: `${e.name} (copy)`, created: Date.now(), updated: Date.now() });
    entries().push(copy);
    save();
    location.hash = `#/edit/${copy.id}`;
  });

  // Live tracking: harm boxes and countdown steps.
  main().querySelectorAll("[data-harm]").forEach((box) =>
    box.addEventListener("click", () => {
      const tr = e.fields[box.dataset.harm];
      const n = Number(box.dataset.n);
      tr.taken = tr.taken === n + 1 ? n : n + 1;
      e.updated = Date.now();
      save();
      viewEntry(id);
    })
  );
  main().querySelectorAll("[data-cd]").forEach((step) =>
    step.addEventListener("click", () => {
      const cd = e.fields[step.dataset.cd];
      const n = Number(step.dataset.n);
      cd.reached = cd.reached === n ? n - 1 : n;
      e.updated = Date.now();
      save();
      viewEntry(id);
    })
  );
}

function viewField(e, f) {
  const v = e.fields[f.key];
  let body = "";
  switch (f.kind) {
    case "image":
      return v ? `<img class="portrait" src="${esc(v)}" alt="" onerror="this.remove()">` : "";
    case "text":
    case "type":
    case "date":
      if (!v) return "";
      body = `<div class="text">${esc(v)}</div>`;
      break;
    case "number":
      if (!v) return "";
      body = `<div class="text big">${esc(v)}</div>`;
      break;
    case "textarea":
      if (!v) return "";
      body = `<div class="text">${richText(v)}</div>`;
      break;
    case "links": {
      const linked = (v || []).map(getEntry).filter(Boolean);
      if (!linked.length) return "";
      body = linked.map(entryChip).join(" ");
      break;
    }
    case "attacks":
      if (!v || !v.length) return "";
      body = `<table class="attacks"><tr><th>Attack</th><th>Harm</th><th>Tags</th></tr>${v
        .map((a) => `<tr><td>${esc(a.name)}</td><td>${esc(a.harm)}</td><td>${esc(a.tags)}</td></tr>`)
        .join("")}</table>`;
      break;
    case "track": {
      if (!v || !v.max) return "";
      const boxes = Array.from({ length: v.max }, (_, i) => `<button class="box ${i < v.taken ? "on" : ""}" data-harm="${f.key}" data-n="${i}" title="Harm ${i + 1}"></button>`).join("");
      body = `<div class="track">${boxes}<span class="muted small">${v.taken}/${v.max}${v.taken >= v.max ? " — dead / defeated" : ""}</span></div>`;
      break;
    }
    case "countdown": {
      if (!v || !v.steps.some(Boolean)) return "";
      body = `<ol class="countdown">${COUNTDOWN_STEPS.map(
        (s, i) => `<li class="${i <= v.reached ? "reached" : ""}" data-cd="${f.key}" data-n="${i}"><strong>${s}</strong> ${richText(v.steps[i] || "")}</li>`
      ).join("")}</ol>`;
      break;
    }
  }
  return `<section class="field"><h3>${f.label}</h3>${body}</section>`;
}

// ----- entry edit -----

function viewEdit(id, isNew = false) {
  const original = getEntry(id);
  if (!original) return (main().innerHTML = `<p>Entry not found.</p>`);
  const draft = JSON.parse(JSON.stringify(original));
  const t = TEMPLATES[draft.type];
  // Make sure older entries pick up fields added to templates later.
  t.fields.forEach((f) => draft.fields[f.key] === undefined && (draft.fields[f.key] = blankValue(f)));

  main().innerHTML = `
    <form id="edit" autocomplete="off">
      <header class="page-head">
        <div>
          <div class="muted small">${t.icon} ${isNew ? "New" : "Editing"} ${t.single}</div>
          <input class="title-input" name="name" value="${esc(draft.name)}" required>
        </div>
        <div class="actions">
          <button type="submit" class="primary">Save</button>
          <button type="button" id="cancel">Cancel</button>
        </div>
      </header>
      <label class="field"><h3>Tags</h3><input name="tags" value="${esc((draft.tags || []).join(", "))}" placeholder="comma, separated, tags"></label>
      <div id="fields"></div>
      <label class="field"><h3>Notes</h3><textarea name="notes" rows="5" placeholder="Anything else. Use [[Entry Name]] to link.">${esc(draft.notes)}</textarea></label>
    </form>`;

  const fieldsEl = $("#fields");
  const renderFields = () => (fieldsEl.innerHTML = t.fields.map((f) => editField(draft, f)).join(""));
  renderFields();

  fieldsEl.addEventListener("input", (ev) => {
    const el = ev.target;
    const key = el.dataset.key;
    if (!key) return;
    const f = t.fields.find((x) => x.key === key);
    const v = draft.fields[key];
    if (f.kind === "attacks") v[Number(el.dataset.i)][el.dataset.prop] = el.value;
    else if (f.kind === "track") v[el.dataset.prop] = Math.max(0, Number(el.value) || 0);
    else if (f.kind === "countdown") v.steps[Number(el.dataset.i)] = el.value;
    else if (f.kind === "number") draft.fields[key] = Number(el.value) || 0;
    else draft.fields[key] = el.value;

    // Picking a standard type fills in its motivation (if empty or still a default).
    if (f.kind === "type" && f.motivations) {
      const defaults = Object.values(f.motivations);
      const mot = draft.fields.motivation;
      if (f.motivations[el.value] && (!mot || defaults.includes(mot))) {
        draft.fields.motivation = f.motivations[el.value];
        const motEl = fieldsEl.querySelector('[data-key="motivation"]');
        if (motEl) motEl.value = draft.fields.motivation;
      }
    }
  });

  fieldsEl.addEventListener("change", (ev) => {
    const el = ev.target;
    if (el.dataset.linkAdd) {
      if (el.value && !draft.fields[el.dataset.linkAdd].includes(el.value)) draft.fields[el.dataset.linkAdd].push(el.value);
      renderFields();
    }
  });

  fieldsEl.addEventListener("click", (ev) => {
    const el = ev.target.closest("button");
    if (!el) return;
    const key = el.dataset.for;
    if (el.dataset.act === "add-attack") draft.fields[key].push({ name: "", harm: "", tags: "" });
    else if (el.dataset.act === "del-attack") draft.fields[key].splice(Number(el.dataset.i), 1);
    else if (el.dataset.act === "del-link") draft.fields[key] = draft.fields[key].filter((x) => x !== el.dataset.id);
    else return;
    ev.preventDefault();
    renderFields();
  });

  $("#cancel").addEventListener("click", () => {
    if (isNew) campaign().entries = entries().filter((x) => x.id !== id);
    save();
    history.back();
  });

  $("#edit").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const form = ev.target;
    draft.name = form.elements["name"].value.trim() || "Untitled";
    draft.tags = form.elements["tags"].value.split(",").map((s) => s.trim().replace(/^#/, "")).filter(Boolean);
    draft.notes = form.elements["notes"].value;
    draft.updated = Date.now();
    Object.assign(original, draft);
    save();
    location.hash = `#/entry/${id}`;
  });
}

function editField(draft, f) {
  const v = draft.fields[f.key];
  const hint = f.hint ? `<div class="muted small">${esc(f.hint)}</div>` : "";
  let body = "";
  switch (f.kind) {
    case "text":
    case "image":
      body = `<input data-key="${f.key}" value="${esc(v)}" ${f.kind === "image" ? 'type="url" placeholder="https://…"' : ""}>`;
      break;
    case "date":
      body = `<input type="date" data-key="${f.key}" value="${esc(v)}">`;
      break;
    case "number":
      body = `<input type="number" min="0" data-key="${f.key}" value="${esc(v)}" class="short">`;
      break;
    case "textarea":
      body = `<textarea data-key="${f.key}" rows="4">${esc(v)}</textarea>`;
      break;
    case "type":
      body = `<input data-key="${f.key}" value="${esc(v)}" list="dl-${f.key}-${draft.type}" placeholder="Pick or type your own">
        <datalist id="dl-${f.key}-${draft.type}">${f.options.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>`;
      break;
    case "track":
      body = `<div class="inline">Max <input type="number" min="0" max="30" class="short" data-key="${f.key}" data-prop="max" value="${v.max}">
        Taken <input type="number" min="0" class="short" data-key="${f.key}" data-prop="taken" value="${v.taken}"></div>`;
      break;
    case "attacks":
      body = `<table class="attacks edit"><tr><th>Attack</th><th>Harm</th><th>Tags</th><th></th></tr>
        ${v.map((a, i) => `<tr>
          <td><input data-key="${f.key}" data-i="${i}" data-prop="name" value="${esc(a.name)}" placeholder="Claws"></td>
          <td><input data-key="${f.key}" data-i="${i}" data-prop="harm" value="${esc(a.harm)}" placeholder="3-harm" class="short"></td>
          <td><input data-key="${f.key}" data-i="${i}" data-prop="tags" value="${esc(a.tags)}" placeholder="hand, messy"></td>
          <td><button type="button" data-act="del-attack" data-for="${f.key}" data-i="${i}" title="Remove">✕</button></td></tr>`).join("")}
        </table><button type="button" data-act="add-attack" data-for="${f.key}">+ Add attack</button>`;
      break;
    case "countdown":
      body = `<div class="countdown-edit">${COUNTDOWN_STEPS.map(
        (s, i) => `<label><span>${s}</span><input data-key="${f.key}" data-i="${i}" value="${esc(v.steps[i])}"></label>`
      ).join("")}</div>`;
      break;
    case "links": {
      const options = entries()
        .filter((e) => f.types.includes(e.type) && e.id !== draft.id && !v.includes(e.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      body = `<div class="links">${v
        .map(getEntry)
        .filter(Boolean)
        .map((e) => `<span class="chip">${TEMPLATES[e.type].icon} ${esc(e.name)} <button type="button" data-act="del-link" data-for="${f.key}" data-id="${e.id}" title="Remove">✕</button></span>`)
        .join("")}</div>
        <select data-link-add="${f.key}"><option value="">+ Link ${f.types.map((x) => TEMPLATES[x].single.toLowerCase()).join(" / ")}…</option>
        ${options.map((e) => `<option value="${e.id}">${TEMPLATES[e.type].icon} ${esc(e.name)}</option>`).join("")}</select>`;
      break;
    }
  }
  return `<div class="field"><h3>${f.label}</h3>${hint}${body}</div>`;
}

// ---------- router ----------

function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  const [page, arg] = [parts[0], decodeURIComponent(parts.slice(1).join("/"))];
  renderSidebar();
  window.scrollTo(0, 0);

  if (page === "list" && TEMPLATES[arg]) return viewList(arg);
  if (page === "entry") return viewEntry(arg);
  if (page === "edit") return viewEdit(arg);
  if (page === "search") return viewSearch(arg);
  if (page === "new-type" && TEMPLATES[arg]) return createAndEdit(arg);
  if (page === "new") return pickTypeFor(arg);
  viewDashboard();
}

function createAndEdit(type, name) {
  const e = newEntry(type, name);
  entries().push(e);
  save();
  history.replaceState(null, "", `#/edit/${e.id}`);
  renderSidebar();
  viewEdit(e.id, true);
}

// Clicking a [[link]] to an entry that doesn't exist yet offers to create it.
function pickTypeFor(name) {
  main().innerHTML = `
    <header class="page-head"><h1>Create “${esc(name)}”</h1></header>
    <p>What kind of entry is it?</p>
    <section class="quick-add">${Object.entries(TEMPLATES)
      .map(([type, t]) => `<button data-type="${type}">${t.icon} ${t.single}</button>`)
      .join("")}</section>`;
  main().querySelectorAll("[data-type]").forEach((b) => b.addEventListener("click", () => createAndEdit(b.dataset.type, name)));
}

// ---------- global controls ----------

$("#campaign-select").addEventListener("change", (ev) => {
  if (ev.target.value === "__new") {
    const name = prompt("Name for the new campaign:");
    if (name) {
      const c = newCampaign(name.trim());
      db.campaigns.push(c);
      db.currentId = c.id;
    }
  } else {
    db.currentId = ev.target.value;
  }
  save();
  location.hash = "#/";
  route();
});

$("#search").addEventListener("keydown", (ev) => {
  if (ev.key === "Enter" && ev.target.value.trim()) location.hash = `#/search/${encodeURIComponent(ev.target.value.trim())}`;
});

$("#export").addEventListener("click", () => {
  const c = campaign();
  download(`motw-${slug(c.name)}-${new Date().toISOString().slice(0, 10)}.json`, { app: "motw-keeper", version: 1, campaign: c });
});

$("#import").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const c = data.campaign;
    if (!c || !Array.isArray(c.entries)) throw new Error("Not a campaign export");
    const existing = db.campaigns.find((x) => x.id === c.id);
    if (existing) {
      if (!confirm(`"${existing.name}" already exists here. Replace it with the imported copy?`)) return;
      db.campaigns = db.campaigns.map((x) => (x.id === c.id ? c : x));
    } else {
      db.campaigns.push(c);
    }
    db.currentId = c.id;
    save();
    location.hash = "#/";
    route();
  } catch (e) {
    alert("That file couldn't be imported: " + e.message);
  }
});

$("#menu-toggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
$("#nav").addEventListener("click", () => document.body.classList.remove("nav-open"));

window.addEventListener("hashchange", route);
route();
