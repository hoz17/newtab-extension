const STORAGE_KEY = "newtab_dashboard_links_v1";
const GROUP_ORDER_KEY = "dashboard_group_order_v1";
const NAME_KEY = "dashboard_user_name_v1";
const COLLAPSED_KEY = "dashboard_collapsed_groups_v1";
const THEME_KEY = "dashboard_theme_v1";
const NOTES_KEY = "dashboard_notes_v1";
const SORT_KEY = "dashboard_sort_mode_v1";

const DEFAULT_GROUP = "Mặc định";

const DEFAULT_LINKS = [
  { id: crypto.randomUUID(), name: "Facebook", url: "https://facebook.com/", thumb: "./thumbs/facebook.png", group: "", opens: 0 },
  { id: crypto.randomUUID(), name: "Youtube", url: "https://youtube.com/", thumb: "./thumbs/youtube.png", group: "", opens: 0 },
];

const $ = (sel) => document.querySelector(sel);

const grid = $("#grid");
const search = $("#search");
const btnAdd = $("#btnAdd");
const btnReset = $("#btnReset");
const sortMode = $("#sortMode");

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
const greetingEl = $("#greeting");

let dragId = null;

/* -------------------- helpers -------------------- */

function groupOf(x) {
  const g = (x.group || "").trim();
  return g ? g : DEFAULT_GROUP;
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
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

/* -------------------- toast + hoàn tác -------------------- */

const toastHost = $("#toastHost");

function showToast(msg, actionLabel, onAction, duration = 6000) {
  if (!toastHost) return;

  const toast = document.createElement("div");
  toast.className = "toast";

  const text = document.createElement("span");
  text.textContent = msg;
  toast.appendChild(text);

  let timer = null;
  const dismiss = () => {
    if (timer) clearTimeout(timer);
    toast.remove();
  };

  if (actionLabel && typeof onAction === "function") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => {
      dismiss();
      onAction();
    });
    toast.appendChild(btn);
  }

  toastHost.appendChild(toast);
  timer = setTimeout(dismiss, duration);
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

/* -------------------- greeting theo giờ -------------------- */

function greetingText() {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function updateGreeting() {
  if (!greetingEl) return;
  greetingEl.textContent = greetingText();
}

/* -------------------- storage: links -------------------- */

function loadLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : structuredClone(DEFAULT_LINKS);
    if (!Array.isArray(arr)) return structuredClone(DEFAULT_LINKS);
    return arr.map(x => ({ ...x, group: groupOf(x), opens: Number(x.opens) || 0 }));
  } catch {
    return structuredClone(DEFAULT_LINKS).map(x => ({ ...x, group: groupOf(x), opens: 0 }));
  }
}

function saveLinks(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function persistAndRender() {
  saveLinks(links);
  syncGroupOrder(links);
  renderChips(links);
  renderGrouped(links);
}

/* -------------------- storage: user name -------------------- */

function loadUserName() {
  try {
    return (localStorage.getItem(NAME_KEY) || "").trim();
  } catch {
    return "";
  }
}

function saveUserName(name) {
  localStorage.setItem(NAME_KEY, (name || "").trim());
}

/* -------------------- UI: user name (top-left) -------------------- */

const nameArea = $("#nameArea");

function renderName() {
  const name = loadUserName();
  if (name) renderNameDisplay(name);
  else renderNameEditor("", false); // chưa có tên → hiện phần đặt tên
}

function renderNameDisplay(name) {
  if (!nameArea) return;
  nameArea.innerHTML = "";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "name-display";
  btn.textContent = name;
  btn.title = "Đổi tên";
  btn.addEventListener("click", () => renderNameEditor(name, true));

  nameArea.appendChild(btn);
}

function renderNameEditor(current, autofocus) {
  if (!nameArea) return;
  nameArea.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "name-input";
  input.placeholder = "Nhập tên của bạn…";
  input.value = current || "";
  input.maxLength = 40;

  const commit = () => {
    const val = input.value.trim();
    if (val) saveUserName(val);
    renderName();
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "Escape") { e.preventDefault(); renderName(); }
  });
  input.addEventListener("blur", commit);

  nameArea.appendChild(input);

  if (autofocus) {
    input.focus();
    input.select();
  }
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

/* -------------------- storage: collapse group -------------------- */

function loadCollapsedSet() {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveCollapsed(set) {
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...set]));
}

let collapsedGroups = loadCollapsedSet();

function toggleCollapse(groupName) {
  if (collapsedGroups.has(groupName)) collapsedGroups.delete(groupName);
  else collapsedGroups.add(groupName);
  saveCollapsed(collapsedGroups);
  renderGrouped(links);
}

/* -------------------- storage: sort mode -------------------- */

function loadSortMode() {
  try {
    const v = localStorage.getItem(SORT_KEY);
    return v === "opens" ? "opens" : "manual";
  } catch {
    return "manual";
  }
}

function saveSortMode(mode) {
  localStorage.setItem(SORT_KEY, mode);
}

let sortModeValue = loadSortMode();

/* -------------------- đếm số lần mở link -------------------- */

function bumpOpen(id) {
  const item = links.find(x => x.id === id);
  if (!item) return;
  item.opens = (Number(item.opens) || 0) + 1;
  saveLinks(links);
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

/* -------------------- drag & drop: reorder + đổi group -------------------- */

// thả lên một tile khác: chèn trước tile đó, nhận group của tile đích
function handleDropOnItem(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;

  const fromIndex = links.findIndex(x => x.id === fromId);
  const toIndex = links.findIndex(x => x.id === toId);
  if (fromIndex < 0 || toIndex < 0) return;

  const targetGroup = groupOf(links[toIndex]);
  const [moved] = links.splice(fromIndex, 1);
  moved.group = targetGroup;

  // tính lại vị trí đích sau khi splice
  const newToIndex = links.findIndex(x => x.id === toId);
  links.splice(newToIndex, 0, moved);

  persistAndRender();
}

// thả vào vùng trống của group (không trúng tile nào): chuyển sang group đó, đặt cuối
function handleDropOnGroup(fromId, groupName) {
  if (!fromId) return;
  const fromIndex = links.findIndex(x => x.id === fromId);
  if (fromIndex < 0) return;

  const [moved] = links.splice(fromIndex, 1);
  moved.group = groupName;
  links.push(moved);

  persistAndRender();
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

  // chỉ cho kéo-thả khi không tìm kiếm và đang ở chế độ thủ công
  const canDrag = !q && sortModeValue === "manual";

  // group -> items
  const grouped = new Map();
  for (const item of view) {
    const g = groupOf(item);
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g).push(item);
  }

  grid.innerHTML = "";

  for (const groupName of groupOrder) {
    let items = grouped.get(groupName) || [];
    if (q && items.length === 0) continue; // khi search, ẩn group rỗng

    // sắp xếp "hay dùng"
    if (sortModeValue === "opens") {
      items = [...items].sort((a, b) => (Number(b.opens) || 0) - (Number(a.opens) || 0));
    }

    // khi tìm kiếm luôn mở rộng để thấy kết quả
    const isCollapsed = !q && collapsedGroups.has(groupName);

    const section = document.createElement("section");
    section.className = "group-section" + (isCollapsed ? " collapsed" : "");
    section.id = `group-${slugify(groupName)}`;

    // cho phép thả link vào group (kể cả group rỗng)
    if (canDrag) {
      section.addEventListener("dragover", (e) => {
        if (!dragId) return;
        e.preventDefault();
        section.classList.add("drop-target");
      });
      section.addEventListener("dragleave", (e) => {
        if (e.target === section) section.classList.remove("drop-target");
      });
      section.addEventListener("drop", (e) => {
        e.preventDefault();
        section.classList.remove("drop-target");
        const fromId = dragId || e.dataTransfer.getData("text/plain");
        handleDropOnGroup(fromId, groupName);
      });
    }

    // header
    const header = document.createElement("div");
    header.className = "group-header";

    const left = document.createElement("div");
    left.className = "group-left";

    const toggle = document.createElement("button");
    toggle.className = "group-toggle";
    toggle.type = "button";
    toggle.textContent = "▾";
    toggle.title = isCollapsed ? "Mở rộng nhóm" : "Thu gọn nhóm";
    toggle.setAttribute("aria-expanded", String(!isCollapsed));
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCollapse(groupName);
    });
    left.appendChild(toggle);

    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = groupName;
    title.title = "Nhấn để thu gọn / mở rộng";
    title.addEventListener("click", () => toggleCollapse(groupName));
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

      // drag chỉ khi cho phép (không search, chế độ thủ công)
      tile.draggable = canDrag;

      tile.addEventListener("dragstart", (e) => {
        if (!canDrag) return;
        dragId = item.id;
        tile.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
      });

      tile.addEventListener("dragend", () => {
        tile.classList.remove("dragging");
        dragId = null;
        document.querySelectorAll(".tile.drag-over").forEach(el => el.classList.remove("drag-over"));
        document.querySelectorAll(".group-section.drop-target").forEach(el => el.classList.remove("drop-target"));
      });

      tile.addEventListener("dragover", (e) => {
        if (!canDrag) return;
        e.preventDefault();
        if (tile.dataset.id === dragId) return;
        tile.classList.add("drag-over");
      });

      tile.addEventListener("dragleave", () => tile.classList.remove("drag-over"));

      tile.addEventListener("drop", (e) => {
        if (!canDrag) return;
        e.preventDefault();
        e.stopPropagation(); // tránh section drop bắt lại
        tile.classList.remove("drag-over");

        const fromId = dragId || e.dataTransfer.getData("text/plain");
        const toId = tile.dataset.id;
        handleDropOnItem(fromId, toId);
      });

      const a = document.createElement("a");
      a.href = item.url;

      // đếm số lần mở
      const onOpen = () => bumpOpen(item.id);
      a.addEventListener("click", onOpen);
      a.addEventListener("auxclick", (e) => { if (e.button === 1) onOpen(); });

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
      const host = hostnameOf(item.url) || item.url || "";
      const opens = Number(item.opens) || 0;
      small.textContent = opens > 0 ? `${host} · ${opens} lượt` : host;

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
if (sortMode) sortMode.value = sortModeValue;
renderChips(links);
renderGrouped(links);
renderName();
startClock();
updateGreeting();
setInterval(updateGreeting, 60000);

search.addEventListener("input", () => renderGrouped(links));

if (sortMode) {
  sortMode.addEventListener("change", () => {
    sortModeValue = sortMode.value === "opens" ? "opens" : "manual";
    saveSortMode(sortModeValue);
    renderGrouped(links);
  });
}

btnReset.addEventListener("click", () => {
  const prev = structuredClone(links);
  links = structuredClone(DEFAULT_LINKS).map(x => ({ ...x, group: groupOf(x), opens: 0 }));
  persistAndRender();
  showToast("Đã khôi phục danh sách mặc định.", "Hoàn tác", () => {
    links = prev;
    persistAndRender();
  });
});

btnAdd.addEventListener("click", () => openAdd());

btnCancel.addEventListener("click", () => modal.close("cancel"));
$("#btnClose").addEventListener("click", () => modal.close("cancel"));

btnDelete.addEventListener("click", () => {
  const id = fId.value;
  if (!id) return;

  const idx = links.findIndex(x => x.id === id);
  if (idx < 0) { modal.close("cancel"); return; }

  const removed = links[idx];
  links.splice(idx, 1);
  persistAndRender();
  modal.close("deleted");

  showToast(`Đã xoá “${removed.name || "liên kết"}”.`, "Hoàn tác", () => {
    const at = Math.min(idx, links.length);
    links.splice(at, 0, removed);
    persistAndRender();
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = fId.value || crypto.randomUUID();
  const name = (fName.value || "").trim();
  const url = normalizeUrl(fUrl.value);
  const thumb = (fThumb.value || "").trim();
  const group = (fGroup.value || "").trim() || DEFAULT_GROUP;

  const idx = links.findIndex(x => x.id === id);
  const prevOpens = idx >= 0 ? (Number(links[idx].opens) || 0) : 0;
  const updated = { id, name, url, thumb, group, opens: prevOpens };

  if (idx >= 0) links[idx] = updated;
  else links.unshift(updated);

  persistAndRender();
  modal.close("saved");
});

const btnExport = document.querySelector("#btnExport");
const btnImport = document.querySelector("#btnImport");
const importFile = document.querySelector("#importFile");

btnExport.addEventListener("click", () => {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    name: loadUserName(),
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
      alert("File sao lưu không hợp lệ.");
      return;
    }

    // chống mất dữ liệu: xác nhận trước khi ghi đè
    const hasData = links.length > 0;
    if (hasData) {
      const ok = confirm(
        `Nhập sẽ THAY THẾ ${links.length} liên kết hiện có bằng ${data.links.length} liên kết trong file.\n` +
        `Bạn có thể Hoàn tác ngay sau đó. Tiếp tục?`
      );
      if (!ok) return;
    }

    // snapshot để hoàn tác
    const prevLinks = structuredClone(links);
    const prevOrder = structuredClone(groupOrder);
    const prevName = loadUserName();

    links = data.links.map(x => ({
      ...x,
      id: x.id || crypto.randomUUID(),
      group: (x.group || DEFAULT_GROUP).trim(),
      opens: Number(x.opens) || 0
    }));

    groupOrder = Array.isArray(data.groupOrder) ? data.groupOrder : [];

    saveGroupOrder(groupOrder);

    if (typeof data.name === "string") {
      saveUserName(data.name);
      renderName();
    }

    persistAndRender();

    showToast("Đã nhập dữ liệu.", "Hoàn tác", () => {
      links = prevLinks;
      groupOrder = prevOrder;
      saveGroupOrder(groupOrder);
      saveUserName(prevName);
      renderName();
      persistAndRender();
    });
  } catch (err) {
    console.error(err);
    alert("Không thể nhập file.");
  }
});

/* -------------------- theme sáng / tối -------------------- */

const btnTheme = $("#btnTheme");

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(t) {
  if (t === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  if (btnTheme) {
    btnTheme.textContent = t === "light" ? "☀️" : "🌙";
    btnTheme.title = t === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng";
  }
}

let themeValue = loadTheme();
applyTheme(themeValue);

if (btnTheme) {
  btnTheme.addEventListener("click", () => {
    themeValue = themeValue === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, themeValue);
    applyTheme(themeValue);
  });
}

/* -------------------- ghi chú / việc cần làm -------------------- */

const notesPanel = $("#notesPanel");
const notesForm = $("#notesForm");
const notesInput = $("#notesInput");
const notesList = $("#notesList");
const btnNotes = $("#btnNotes");
const btnNotesClose = $("#btnNotesClose");

function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveNotes(arr) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(arr));
}

let notes = loadNotes();

function renderNotes() {
  if (!notesList) return;
  notesList.innerHTML = "";

  if (notes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "notes-empty";
    empty.textContent = "Chưa có việc nào. Thêm việc đầu tiên nhé!";
    notesList.appendChild(empty);
    return;
  }

  for (const note of notes) {
    const li = document.createElement("li");
    li.className = "note-item" + (note.done ? " done" : "");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!note.done;
    cb.addEventListener("change", () => {
      note.done = cb.checked;
      saveNotes(notes);
      renderNotes();
    });

    const text = document.createElement("div");
    text.className = "note-text";
    text.textContent = note.text;

    const del = document.createElement("button");
    del.className = "note-del";
    del.type = "button";
    del.textContent = "✕";
    del.title = "Xoá việc";
    del.addEventListener("click", () => {
      notes = notes.filter(n => n.id !== note.id);
      saveNotes(notes);
      renderNotes();
    });

    li.appendChild(cb);
    li.appendChild(text);
    li.appendChild(del);
    notesList.appendChild(li);
  }
}

function openNotes() {
  if (!notesPanel) return;
  notesPanel.classList.add("open");
  document.body.classList.add("notes-open");
  if (notesInput) notesInput.focus();
}

function closeNotes() {
  if (notesPanel) notesPanel.classList.remove("open");
  document.body.classList.remove("notes-open");
}

if (btnNotes) btnNotes.addEventListener("click", () => {
  if (notesPanel && notesPanel.classList.contains("open")) closeNotes();
  else openNotes();
});
if (btnNotesClose) btnNotesClose.addEventListener("click", closeNotes);

/* -------------------- panel cài đặt -------------------- */

const settingsPanel = $("#settingsPanel");
const btnSettings = $("#btnSettings");
const btnSettingsClose = $("#btnSettingsClose");

function openSettings() {
  if (!settingsPanel) return;
  settingsPanel.classList.add("open");
  document.body.classList.add("settings-open");
}

function closeSettings() {
  if (settingsPanel) settingsPanel.classList.remove("open");
  document.body.classList.remove("settings-open");
}

if (btnSettings) btnSettings.addEventListener("click", () => {
  if (settingsPanel && settingsPanel.classList.contains("open")) closeSettings();
  else openSettings();
});
if (btnSettingsClose) btnSettingsClose.addEventListener("click", closeSettings);

if (notesForm) {
  notesForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (notesInput.value || "").trim();
    if (!text) return;
    notes.unshift({ id: crypto.randomUUID(), text, done: false });
    saveNotes(notes);
    notesInput.value = "";
    renderNotes();
  });
}

renderNotes();

/* -------------------- background (nhiều ảnh: tĩnh / ngẫu nhiên / xoay vòng) -------------------- */

const BG_KEY = "dashboard_background_v1";
const VIDEO_RE = /\.(mp4|webm|ogv|ogg|mov|m4v)$/i;

let bgRotateTimer = null;
let bgRotateIndex = 0;

function isVideoPath(p) {
  return VIDEO_RE.test((p || "").trim());
}

function parsePaths(text) {
  return (text || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

function loadBgSettings() {
  try {
    const raw = localStorage.getItem(BG_KEY);
    const s = raw ? JSON.parse(raw) : null;

    // giá trị mặc định
    const out = { paths: [], mode: "static", intervalMin: 10, dim: 35, blur: 0 };
    if (s && typeof s === "object") {
      // di trú từ dạng cũ { path, dim, blur }
      if (Array.isArray(s.paths)) out.paths = s.paths.filter(Boolean);
      else if (typeof s.path === "string" && s.path.trim()) out.paths = [s.path.trim()];

      if (s.mode === "random" || s.mode === "rotate" || s.mode === "static") out.mode = s.mode;
      if (Number.isFinite(s.intervalMin)) out.intervalMin = Math.min(240, Math.max(1, s.intervalMin));
      if (Number.isFinite(s.dim)) out.dim = s.dim;
      if (Number.isFinite(s.blur)) out.blur = s.blur;
    }
    return out;
  } catch {
    return { paths: [], mode: "static", intervalMin: 10, dim: 35, blur: 0 };
  }
}

function saveBgSettings(s) {
  localStorage.setItem(BG_KEY, JSON.stringify(s));
}

function renderBgPath(path) {
  const bgLayer = $("#bgLayer");
  const bgVideo = $("#bgVideo");
  if (!bgLayer || !bgVideo) return;

  const p = (path || "").trim();

  if (!p) {
    document.body.classList.remove("has-custom-bg", "bg-is-video");
    bgLayer.style.backgroundImage = "";
    bgVideo.removeAttribute("src");
    bgVideo.load();
    return;
  }

  document.body.classList.add("has-custom-bg");

  if (isVideoPath(p)) {
    document.body.classList.add("bg-is-video");
    bgLayer.style.backgroundImage = "";
    if (bgVideo.getAttribute("src") !== p) bgVideo.src = p;
    bgVideo.muted = true; // luôn tắt tiếng
    bgVideo.play().catch(() => {});
  } else {
    document.body.classList.remove("bg-is-video");
    bgVideo.removeAttribute("src");
    bgVideo.load();
    bgLayer.style.backgroundImage = `url("${p}")`;
  }
}

function pickBgPath(s) {
  const paths = s.paths || [];
  if (paths.length === 0) return "";
  if (paths.length === 1) return paths[0];

  if (s.mode === "random") {
    return paths[Math.floor(Math.random() * paths.length)];
  }
  if (s.mode === "rotate") {
    return paths[bgRotateIndex % paths.length];
  }
  return paths[0]; // static → dòng đầu
}

function applyBackground() {
  const s = loadBgSettings();

  document.documentElement.style.setProperty("--bg-dim", (s.dim / 100).toString());
  document.documentElement.style.setProperty("--bg-blur", `${s.blur}px`);

  // luôn dọn timer cũ
  if (bgRotateTimer) { clearInterval(bgRotateTimer); bgRotateTimer = null; }

  const paths = s.paths || [];

  if (paths.length === 0) {
    renderBgPath("");
    return;
  }

  if (s.mode === "rotate" && paths.length > 1) {
    bgRotateIndex = 0;
    renderBgPath(paths[bgRotateIndex]);
    const ms = Math.max(1, s.intervalMin) * 60000;
    bgRotateTimer = setInterval(() => {
      bgRotateIndex = (bgRotateIndex + 1) % paths.length;
      renderBgPath(paths[bgRotateIndex]);
    }, ms);
  } else {
    renderBgPath(pickBgPath(s));
  }
}

/* -------------------- UI: background modal -------------------- */

const bgModal = $("#bgModal");
const bgForm = $("#bgForm");
const bgPaths = $("#bgPaths");
const bgModeSel = $("#bgMode");
const bgInterval = $("#bgInterval");
const bgIntervalField = $("#bgIntervalField");
const bgDim = $("#bgDim");
const bgBlur = $("#bgBlur");
const bgDimVal = $("#bgDimVal");
const bgBlurVal = $("#bgBlurVal");
const bgPreview = $("#bgPreview");
const btnBg = $("#btnBg");

function setBgPreview(path) {
  bgPreview.innerHTML = "";
  bgPreview.style.backgroundImage = "";
  const p = (path || "").trim();

  if (!p) {
    bgPreview.textContent = "Chưa có ảnh nền";
    return;
  }

  if (isVideoPath(p)) {
    const v = document.createElement("video");
    v.src = p;
    v.muted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    v.play().catch(() => {});
    bgPreview.appendChild(v);
  } else {
    bgPreview.style.backgroundImage = `url("${p}")`;
  }
}

function previewFirstPath() {
  const first = parsePaths(bgPaths.value)[0] || "";
  setBgPreview(first);
}

function updateIntervalVisibility() {
  if (!bgIntervalField) return;
  bgIntervalField.style.display = (bgModeSel && bgModeSel.value === "rotate") ? "" : "none";
}

function openBgModal() {
  const s = loadBgSettings();
  bgDim.value = s.dim;
  bgBlur.value = s.blur;
  bgDimVal.textContent = `${s.dim}%`;
  bgBlurVal.textContent = `${s.blur}px`;
  bgPaths.value = (s.paths || []).join("\n");
  if (bgModeSel) bgModeSel.value = s.mode;
  if (bgInterval) bgInterval.value = s.intervalMin;
  updateIntervalVisibility();
  previewFirstPath();
  bgModal.showModal();
}

btnBg.addEventListener("click", openBgModal);
$("#btnBgClose").addEventListener("click", () => bgModal.close("cancel"));
$("#btnBgCancel").addEventListener("click", () => bgModal.close("cancel"));

/* xem trước độ tối / độ mờ theo thời gian thực */
bgDim.addEventListener("input", () => {
  bgDimVal.textContent = `${bgDim.value}%`;
  document.documentElement.style.setProperty("--bg-dim", (bgDim.value / 100).toString());
});
bgBlur.addEventListener("input", () => {
  bgBlurVal.textContent = `${bgBlur.value}px`;
  document.documentElement.style.setProperty("--bg-blur", `${bgBlur.value}px`);
});

bgPaths.addEventListener("input", previewFirstPath);
if (bgModeSel) bgModeSel.addEventListener("change", updateIntervalVisibility);

bgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  saveBgSettings({
    paths: parsePaths(bgPaths.value),
    mode: bgModeSel ? bgModeSel.value : "static",
    intervalMin: bgInterval ? (parseInt(bgInterval.value, 10) || 10) : 10,
    dim: parseInt(bgDim.value, 10) || 0,
    blur: parseInt(bgBlur.value, 10) || 0,
  });
  applyBackground();
  bgModal.close("saved");
});

$("#btnBgRemove").addEventListener("click", () => {
  saveBgSettings({
    paths: [],
    mode: bgModeSel ? bgModeSel.value : "static",
    intervalMin: bgInterval ? (parseInt(bgInterval.value, 10) || 10) : 10,
    dim: parseInt(bgDim.value, 10) || 35,
    blur: parseInt(bgBlur.value, 10) || 0,
  });
  bgPaths.value = "";
  setBgPreview("");
  applyBackground();
  bgModal.close("removed");
});

/* khi huỷ (Esc / Huỷ / ✕): khôi phục dim/blur đã lưu */
bgModal.addEventListener("close", () => {
  if (bgModal.returnValue === "saved" || bgModal.returnValue === "removed") return;
  applyBackground();
});

applyBackground();

/* -------------------- phím tắt -------------------- */

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

document.addEventListener("keydown", (e) => {
  const anyModalOpen = (modal && modal.open) || (bgModal && bgModal.open);

  // Esc: đóng panel cài đặt / ghi chú / xoá nội dung tìm kiếm
  if (e.key === "Escape") {
    if (settingsPanel && settingsPanel.classList.contains("open")) {
      closeSettings();
      return;
    }
    if (notesPanel && notesPanel.classList.contains("open")) {
      closeNotes();
      return;
    }
    if (document.activeElement === search && search.value) {
      search.value = "";
      renderGrouped(links);
      return;
    }
    return;
  }

  // các phím còn lại: bỏ qua khi đang gõ hoặc có modal mở
  if (anyModalOpen) return;

  // Enter trong ô tìm kiếm: mở kết quả đầu tiên
  if (e.key === "Enter" && document.activeElement === search) {
    const first = grid.querySelector(".tile a[href]");
    if (first) {
      bumpOpen(first.closest(".tile").dataset.id);
      window.location.href = first.href;
    }
    return;
  }

  if (isTypingTarget(document.activeElement)) return;

  // "/" hoặc Ctrl/Cmd+K: focus ô tìm kiếm
  if (e.key === "/" || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
    e.preventDefault();
    search.focus();
    search.select();
    return;
  }

  // "n": thêm website
  if (e.key === "n" || e.key === "N") {
    e.preventDefault();
    openAdd();
    return;
  }
});
