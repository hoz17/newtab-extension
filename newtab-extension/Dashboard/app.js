const STORAGE_KEY = "newtab_dashboard_links_v1";
const GROUP_ORDER_KEY = "dashboard_group_order_v1";

const DEFAULT_GROUP = "Mặc định";

const DEFAULT_LINKS = [
  { id: crypto.randomUUID(), name: "Facebook", url: "https://facebook.com/", thumb: "./thumbs/facebook.png", group: "" },
  { id: crypto.randomUUID(), name: "Youtube", url: "https://youtube.com/", thumb: "./thumbs/youtube.png", group: "" },
];

const $ = (sel) => document.querySelector(sel);

const grid = $("#grid");
const search = $("#search");
const btnAdd = $("#btnAdd");
const btnReset = $("#btnReset");

const modal = $("#modal");
const form = $("#form");
const modalTitle = $("#modalTitle");
const btnDelete = $("#btnDelete");
const btnCancel = $("#btnCancel");

const fId = $("#fId");
const fName = $("#fName");
const fUrl = $("#fUrl");
const fThumb = $("#fThumb");
const fGroup = $("#fGroup");

const chips = $("#chips");
const clockTime = $("#clockTime");
const clockDate = $("#clockDate");

let dragId = null;

/* -------------------- helpers -------------------- */

function groupOf(x) {
  const g = (x.group || "").trim();
  return g ? g : DEFAULT_GROUP;
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

function faviconUrl(url) {
  const host = hostnameOf(url);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

function normalizeUrl(u) {
  const t = (u || "").trim();
  if (!t) return "";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(t)) return t;
  if (/^[\w.-]+\.[a-zA-Z]{2,}/.test(t)) return `https://${t}`;
  return t;
}

/* -------------------- clock -------------------- */

function startClock() {
  if (!clockTime && !clockDate) return;

  const timeFormat = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateFormat = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const update = () => {
    const now = new Date();
    if (clockTime) clockTime.textContent = timeFormat.format(now);
    if (clockDate) clockDate.textContent = dateFormat.format(now);
  };

  update();
  setInterval(update, 1000);
}

/* -------------------- storage: links -------------------- */

function loadLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : structuredClone(DEFAULT_LINKS);
    if (!Array.isArray(arr)) return structuredClone(DEFAULT_LINKS);
    return arr.map(x => ({ ...x, group: groupOf(x) }));
  } catch {
    return structuredClone(DEFAULT_LINKS).map(x => ({ ...x, group: groupOf(x) }));
  }
}

function saveLinks(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

/* -------------------- storage: group order -------------------- */

function loadGroupOrder() {
  try {
    const raw = localStorage.getItem(GROUP_ORDER_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveGroupOrder(order) {
  localStorage.setItem(GROUP_ORDER_KEY, JSON.stringify(order));
}

let groupOrder = loadGroupOrder();

function syncGroupOrder(links) {
  const existing = new Set(links.map(x => groupOf(x)));
  if (!existing.has(DEFAULT_GROUP)) existing.add(DEFAULT_GROUP);

  // giữ lại group còn tồn tại
  groupOrder = groupOrder.filter(g => existing.has(g));

  // thêm group mới vào cuối theo thứ tự xuất hiện
  for (const x of links) {
    const g = groupOf(x);
    if (!groupOrder.includes(g)) groupOrder.push(g);
  }

  // đảm bảo DEFAULT_GROUP luôn có mặt
  if (!groupOrder.includes(DEFAULT_GROUP)) groupOrder.push(DEFAULT_GROUP);

  saveGroupOrder(groupOrder);
}

/* -------------------- UI: chips (scroll to group) -------------------- */

function renderChips(links) {
  if (!chips) return;

  // dùng groupOrder để chips đúng thứ tự
  chips.innerHTML = "";

  const topBtn = document.createElement("button");
  topBtn.className = "chip";
  topBtn.type = "button";
  topBtn.textContent = "Tất cả";
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  chips.appendChild(topBtn);

  for (const g of groupOrder) {
    const id = `group-${slugify(g)}`;

    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = g;

    b.addEventListener("click", () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    chips.appendChild(b);
  }
}

/* -------------------- group move up/down -------------------- */

function moveGroup(name, dir) {
  const i = groupOrder.indexOf(name);
  if (i < 0) return;

  const j = i + dir;
  if (j < 0 || j >= groupOrder.length) return;

  [groupOrder[i], groupOrder[j]] = [groupOrder[j], groupOrder[i]];
  saveGroupOrder(groupOrder);

  renderChips(links);
  renderGrouped(links);
}

/* -------------------- render grouped -------------------- */

function renderGrouped(links) {
  const q = (search.value || "").trim().toLowerCase();

  const view = !q
    ? links
    : links.filter(x =>
      (x.name || "").toLowerCase().includes(q) ||
      (x.url || "").toLowerCase().includes(q) ||
      groupOf(x).toLowerCase().includes(q)
    );

  // group -> items
  const grouped = new Map();
  for (const item of view) {
    const g = groupOf(item);
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g).push(item);
  }

  grid.innerHTML = "";

  for (const groupName of groupOrder) {
    const items = grouped.get(groupName) || [];
    if (q && items.length === 0) continue; // khi search, ẩn group rỗng

    const section = document.createElement("section");
    section.className = "group-section";
    section.id = `group-${slugify(groupName)}`;

    // header
    const header = document.createElement("div");
    header.className = "group-header";

    const left = document.createElement("div");
    left.className = "group-left";

    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = groupName;
    left.appendChild(title);

    const right = document.createElement("div");
    right.className = "group-actions";

    const upBtn = document.createElement("button");
    upBtn.className = "group-move";
    upBtn.type = "button";
    upBtn.textContent = "↑";
    upBtn.title = "Move group up";
    upBtn.disabled = (groupOrder.indexOf(groupName) === 0);
    upBtn.addEventListener("click", (e) => {
      e.preventDefault();
      moveGroup(groupName, -1);
    });

    const downBtn = document.createElement("button");
    downBtn.className = "group-move";
    downBtn.type = "button";
    downBtn.textContent = "↓";
    downBtn.title = "Move group down";
    downBtn.disabled = (groupOrder.indexOf(groupName) === groupOrder.length - 1);
    downBtn.addEventListener("click", (e) => {
      e.preventDefault();
      moveGroup(groupName, +1);
    });

    const count = document.createElement("div");
    count.className = "group-count";
    count.textContent = `${items.length}`;

    right.appendChild(upBtn);
    right.appendChild(downBtn);
    right.appendChild(count);

    header.appendChild(left);
    header.appendChild(right);

    // subgrid
    const subgrid = document.createElement("div");
    subgrid.className = "grid";

    for (const item of items) {
      const tile = document.createElement("article");
      tile.className = "tile";
      tile.dataset.id = item.id;

      // drag only when not searching (tránh reorder theo view lọc)
      tile.draggable = !q;

      tile.addEventListener("dragstart", (e) => {
        if (q) return;
        dragId = item.id;
        tile.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
      });

      tile.addEventListener("dragend", () => {
        tile.classList.remove("dragging");
        dragId = null;
        document.querySelectorAll(".tile.drag-over").forEach(el => el.classList.remove("drag-over"));
      });

      tile.addEventListener("dragover", (e) => {
        if (q) return;
        e.preventDefault();
        if (tile.dataset.id === dragId) return;
        tile.classList.add("drag-over");
      });

      tile.addEventListener("dragleave", () => tile.classList.remove("drag-over"));

      tile.addEventListener("drop", (e) => {
        if (q) return;
        e.preventDefault();
        tile.classList.remove("drag-over");

        const fromId = dragId || e.dataTransfer.getData("text/plain");
        const toId = tile.dataset.id;
        if (!fromId || !toId || fromId === toId) return;

        const fromIndex = links.findIndex(x => x.id === fromId);
        const toIndex = links.findIndex(x => x.id === toId);
        if (fromIndex < 0 || toIndex < 0) return;

        const [moved] = links.splice(fromIndex, 1);
        links.splice(toIndex, 0, moved);

        saveLinks(links);
        syncGroupOrder(links);
        renderChips(links);
        renderGrouped(links);
      });

      const a = document.createElement("a");
      a.href = item.url;

      const thumbWrap = document.createElement("div");
      thumbWrap.className = "thumb";

      const img = document.createElement("img");
      img.alt = item.name || "Website";
      img.loading = "lazy";

      const src = (item.thumb || "").trim() || faviconUrl(item.url);
      img.src = src || "";

      img.onerror = () => {
        const fallback = faviconUrl(item.url);
        if (img.src !== fallback && fallback) img.src = fallback;
        else img.remove();
      };

      thumbWrap.appendChild(img);

      const meta = document.createElement("div");
      meta.className = "meta";

      const leftMeta = document.createElement("div");
      leftMeta.style.minWidth = "0";

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = item.name || "Untitled";

      const small = document.createElement("div");
      small.className = "small";
      small.textContent = hostnameOf(item.url) || item.url || "";

      leftMeta.appendChild(name);
      leftMeta.appendChild(small);

      const kebab = document.createElement("button");
      kebab.className = "kebab";
      kebab.type = "button";
      kebab.textContent = "⋯";
      kebab.title = "Sửa";
      kebab.addEventListener("click", (e) => {
        e.preventDefault();
        openEdit(item);
      });
      kebab.addEventListener("dragstart", (e) => e.preventDefault());

      meta.appendChild(leftMeta);
      meta.appendChild(kebab);

      a.appendChild(thumbWrap);
      a.appendChild(meta);
      tile.appendChild(a);

      subgrid.appendChild(tile);
    }

    section.appendChild(header);
    section.appendChild(subgrid);
    grid.appendChild(section);
  }
}

/* -------------------- modal add/edit -------------------- */

function openAdd() {
  modalTitle.textContent = "Thêm website";
  fId.value = "";
  fName.value = "";
  fUrl.value = "";
  fThumb.value = "";
  fGroup.value = "";
  btnDelete.style.display = "none";
  modal.showModal();
  fName.focus();
}

function openEdit(item) {
  modalTitle.textContent = "Sửa website";
  fId.value = item.id;
  fName.value = item.name || "";
  fUrl.value = item.url || "";
  fThumb.value = item.thumb || "";
  fGroup.value = item.group || "";
  btnDelete.style.display = "";
  modal.showModal();
  fName.focus();
}

/* -------------------- init + events -------------------- */

let links = loadLinks();
syncGroupOrder(links);
renderChips(links);
renderGrouped(links);
startClock();

search.addEventListener("input", () => renderGrouped(links));

btnReset.addEventListener("click", () => {
  links = structuredClone(DEFAULT_LINKS).map(x => ({ ...x, group: groupOf(x) }));
  saveLinks(links);
  syncGroupOrder(links);
  renderChips(links);
  renderGrouped(links);
});

btnAdd.addEventListener("click", () => openAdd());

btnCancel.addEventListener("click", () => modal.close("cancel"));
$("#btnClose").addEventListener("click", () => modal.close("cancel"));

btnDelete.addEventListener("click", () => {
  const id = fId.value;
  if (!id) return;

  links = links.filter(x => x.id !== id);
  saveLinks(links);

  modal.close("deleted");
  syncGroupOrder(links);
  renderChips(links);
  renderGrouped(links);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = fId.value || crypto.randomUUID();
  const name = (fName.value || "").trim();
  const url = normalizeUrl(fUrl.value);
  const thumb = (fThumb.value || "").trim();
  const group = (fGroup.value || "").trim() || DEFAULT_GROUP;

  const updated = { id, name, url, thumb, group };

  const idx = links.findIndex(x => x.id === id);
  if (idx >= 0) links[idx] = updated;
  else links.unshift(updated);

  saveLinks(links);

  modal.close("saved");
  syncGroupOrder(links);
  renderChips(links);
  renderGrouped(links);
});
const btnExport = document.querySelector("#btnExport");
const btnImport = document.querySelector("#btnImport");
const importFile = document.querySelector("#importFile");

btnExport.addEventListener("click", () => {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    links,
    groupOrder
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "newtab-dashboard-backup.json";
  a.click();
  URL.revokeObjectURL(url);
});
btnImport.addEventListener("click", () => {
  importFile.value = "";
  importFile.click();
});

importFile.addEventListener("change", async () => {
  const file = importFile.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data.links)) {
      alert("Invalid backup file");
      return;
    }

    links = data.links.map(x => ({
      ...x,
      id: x.id || crypto.randomUUID(),
      group: (x.group || DEFAULT_GROUP).trim()
    }));

    groupOrder = Array.isArray(data.groupOrder)
      ? data.groupOrder
      : [];

    saveLinks(links);
    saveGroupOrder(groupOrder);
    syncGroupOrder(links);

    renderChips(links);
    renderGrouped(links);

    alert("Import successful");
  } catch (err) {
    console.error(err);
    alert("Failed to import file");
  }
});
