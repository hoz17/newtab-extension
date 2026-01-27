const STORAGE_KEY = "newtab_dashboard_links_v1";

const DEFAULT_LINKS = [
  { id: crypto.randomUUID(), name: "Gmail", url: "https://mail.google.com/", thumb: "./thumbs/gmail.png", group: "Admin" },
  { id: crypto.randomUUID(), name: "Google Calendar", url: "https://calendar.google.com/", thumb: "./thumbs/calendar.png", group: "Admin" },
  { id: crypto.randomUUID(), name: "Notion", url: "https://www.notion.so/", thumb: "./thumbs/notion.png", group: "PM" },
  { id: crypto.randomUUID(), name: "Jira", url: "https://www.atlassian.com/software/jira", thumb: "./thumbs/jira.png", group: "PM" },
  { id: crypto.randomUUID(), name: "Slack", url: "https://app.slack.com/client", thumb: "./thumbs/slack.png", group: "Team" }
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

let dragId = null;

const chips = document.querySelector("#chips");
const fGroup = document.querySelector("#fGroup");

let activeGroup = "Tất cả";
const DEFAULT_GROUP = "Mặc định";


function loadLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : structuredClone(DEFAULT_LINKS);
    if (!Array.isArray(arr)) return structuredClone(DEFAULT_LINKS);
    return arr.map(x => ({
      ...x,
      group: (x.group && x.group.trim()) ? x.group.trim() : DEFAULT_GROUP
    }));
  } catch {
    return structuredClone(DEFAULT_LINKS).map(x => ({
      ...x,
      group: x.group || DEFAULT_GROUP
    }));
  }
}

function saveLinks(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

/**
 * Fallback favicon:
 * - Dùng dịch vụ favicon của Google (cần internet).
 * - Nếu bạn muốn offline hoàn toàn, hãy cung cấp thumb local.
 */
function faviconUrl(url) {
  const host = hostnameOf(url);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

function normalizeUrl(u) {
  const t = (u || "").trim();
  if (!t) return "";
  // Cho phép file://, http(s)://, chrome://, edge:// ... (nếu trình duyệt cho)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(t)) return t;
  // Nếu người dùng nhập "example.com" → thêm https://
  if (/^[\w.-]+\.[a-zA-Z]{2,}/.test(t)) return `https://${t}`;
  return t;
}

function renderGrouped(links) {
  const q = (search.value || "").trim().toLowerCase();

  // lọc theo search nhưng vẫn render theo group
  const view = !q
    ? links
    : links.filter(x =>
      (x.name || "").toLowerCase().includes(q) ||
      (x.url || "").toLowerCase().includes(q)
    );

  // gom theo group
  const groups = new Map();
  for (const item of view) {
    const g = groupOf(item);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(item);
  }

  // đảm bảo group mặc định hiện (khi không search)
  if (!q && !groups.has(DEFAULT_GROUP)) groups.set(DEFAULT_GROUP, []);

  grid.innerHTML = "";

  for (const [groupName, items] of groups.entries()) {
    // Section wrapper
    const section = document.createElement("section");
    section.className = "group-section";
    section.id = `group-${slugify(groupName)}`;

    // Header group
    const header = document.createElement("div");
    header.className = "group-header";

    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = groupName;

    const count = document.createElement("div");
    count.className = "group-count";
    count.textContent = `${items.length}`;

    header.appendChild(title);
    header.appendChild(count);

    // Grid con
    const subgrid = document.createElement("div");
    subgrid.className = "grid"; // reuse y hệt grid hiện có

    for (const item of items) {
      // dùng lại đúng tile render cũ, chỉ thay chỗ append vào subgrid
      const tile = document.createElement("article");
      tile.className = "tile";
      tile.dataset.id = item.id;

      // Drag&drop: để đơn giản, chỉ cho kéo khi KHÔNG search
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
        renderChips(links);
        renderGrouped(links);
      });

      const a = document.createElement("a");
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

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

      const left = document.createElement("div");
      left.style.minWidth = "0";

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = item.name || "Untitled";

      const small = document.createElement("div");
      small.className = "small";
      small.textContent = hostnameOf(item.url) || item.url || "";

      left.appendChild(name);
      left.appendChild(small);

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

      meta.appendChild(left);
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


let links = loadLinks();
renderChips(links);
renderGrouped(links);

search.addEventListener("input", () => {
  renderGrouped(links);
});

btnReset.addEventListener("click", () => {
  links = structuredClone(DEFAULT_LINKS);
  saveLinks(links);
  renderChips(links);
  renderGrouped(links);
});

btnAdd.addEventListener("click", () => openAdd());

btnCancel.addEventListener("click", () => modal.close("cancel"));
$("#btnClose").addEventListener("click", () => modal.close("cancel"));

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

btnDelete.addEventListener("click", () => {
  const id = fId.value;
  if (!id) return;
  links = links.filter(x => x.id !== id);
  saveLinks(links);
  modal.close("deleted");
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
  renderChips(links);
  renderGrouped(links);
});

function getGroups(links) {
  const set = new Set([DEFAULT_GROUP]);
  for (const x of links) {
    const g = (x.group || "").trim() || DEFAULT_GROUP;
    set.add(g);
  }

  return ["Tất cả", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}
function getGroupsInOrder(links) {
  const map = new Map(); // giữ thứ tự xuất hiện
  for (const x of links) map.set(groupOf(x), true);
  if (!map.has(DEFAULT_GROUP)) map.set(DEFAULT_GROUP, true);
  return Array.from(map.keys());
}
function renderChips(links) {
  if (!chips) return;

  const groups = getGroupsInOrder(links);
  chips.innerHTML = "";

  // nút "Lên đầu"
  const topBtn = document.createElement("button");
  topBtn.className = "chip";
  topBtn.type = "button";
  topBtn.textContent = "Tất cả";
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  chips.appendChild(topBtn);

  for (const g of groups) {
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

function groupOf(x) {
  const g = (x.group || "").trim();
  return g ? g : DEFAULT_GROUP;
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
