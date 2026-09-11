# 🧭 New Tab Dashboard

A clean, fast, and fully offline **New Tab Dashboard** for Chromium-based browsers.  
Grouped links, drag & drop, custom backgrounds, a light/dark theme, and a built-in to‑do list — no server, no build step, no tracking.

---

## 📸 Screenshot

![Dashboard Screenshot](res/screenshot.png)

---

## ✨ Features

- **Quick-access links** shown as uniform visual cards
- **Groups** with custom ordering (move up / down) and **collapse / expand**
- **Drag & drop** to reorder links within a group (manual sort mode)
- **Sort modes** — *Thủ công* (manual) or *Hay dùng* (most used, by open count)
- **Custom thumbnails** (local images or automatic favicon fallback)
- **Light & dark themes** with a one-click toggle (remembered between sessions)
- **Custom background** — image, GIF, or muted video — with adjustable **dim** and **blur**
- **To‑do list** (*Việc cần làm*) — auto-opens on a new tab when you still have unfinished tasks
- **Editable user name** + a time-of-day greeting (morning / noon / afternoon / evening)
- **Instant search** across name, URL, and group
- **Keyboard shortcuts** for search, add, and closing panels
- **Export / Import** your whole setup as a JSON backup
- **Restore defaults** in one click
- **100% local** — everything is stored in `localStorage`, no server or database
- Works as a **New Tab** override extension

---

## 🚀 Installation (Developer Mode)

1. Download or clone this repository and place it anywhere on your machine.
2. Open your browser and go to **Settings → Extensions → Manage Extensions**.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the **repository root** (the folder containing `manifest.json`).

Done! Open a new tab to see the dashboard.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `/` or `Ctrl`/`Cmd` + `K` | Focus the search box |
| `N` | Add a new website |
| `Enter` (in search) | Open the first matching result |
| `Esc` | Close the open modal / side panel |

---

## ✅ To-Do List (Việc cần làm)

- Click **Ghi chú** in the toolbar to open the **Việc cần làm** panel.
- Type a task in **Thêm việc…** and press `Enter` to add it.
- Check a task to mark it done, or use the ✕ to remove it.
- **On every new tab**, if any task is still unfinished, the panel opens automatically (without stealing focus from the search box) so nothing slips through.
- Tasks are saved in `localStorage`.

---

## 🎨 Theme

- Toggle **light / dark** from **⚙️ Cài đặt → Giao diện**.
- Your choice is stored in `localStorage` and re-applied on every new tab.
- In light theme, backgrounds, overlays, tiles, and placeholders are all tuned for a genuinely bright look while keeping custom video/image backgrounds visible.

---

## 🖼 Custom Background

Set an image, GIF, or video as the dashboard background.

1. Put your file in the `Dashboard/background/` folder, e.g. `photo.jpg`, `anim.gif`, or `clip.mp4`.
2. Open **⚙️ Cài đặt → Hình nền**.
3. In **Đường dẫn** (path in background folder), enter a relative path such as:
   - `./background/photo.jpg`
   - `./background/anim.gif`
   - `./background/clip.mp4`
4. Adjust **Độ tối** (dim) and **Làm mờ** (blur) to taste, then **Áp dụng** (Apply).

Notes:
- Videos are detected by extension (`mp4`, `webm`, `ogv`, `ogg`, `mov`, `m4v`) and always play **autoplay, looped, and muted** (muting is required for browser autoplay).
- The path (plus dim/blur) is stored in `localStorage`; the files themselves live in `Dashboard/background/`, which is **gitignored** so personal media is never committed.

---

## 📤 Export / Import Data

Back up or transfer your dashboard easily from **⚙️ Cài đặt → Dữ liệu**.

### Export
- Click **Export dữ liệu**
- A JSON backup file is downloaded, including:
  - All links
  - Group names & order
  - User name and metadata

### Import
- Click **Import dữ liệu**
- Select a previously exported JSON file

⚠️ Import **overwrites** current data. Use **Khôi phục mặc định** to reset everything to the defaults.

---

## 📁 Project Structure
```
newtab-extension/
├── manifest.json        # Extension configuration (New Tab override)
├── README.md
├── LICENSE
├── res/
│   └── screenshot.png
└── Dashboard/
    ├── index.html       # New Tab page
    ├── styles.css        # Global styles & layout (light/dark themes)
    ├── app.js            # Application logic
    ├── favicon.png       # Extension icon
    ├── thumbs/           # Local thumbnail images
    │   ├── youtube.png
    │   ├── drive.png
    │   └── ...
    └── background/       # Local background media (gitignored)
        └── clip.mp4
```

---

## 🧠 How It Works

- Links, groups, theme, name, notes, background, and sort mode are all stored in the browser's `localStorage` (each under its own key).
- Group order and collapsed state are stored separately to preserve your layout.
- No backend, no database, no external services.
- Clicking a card replaces the current tab (no new-tab spam).

---

## 🛣 Roadmap

- [x] Import / export configuration (JSON)
- [x] Custom background (image / GIF / muted video)
- [x] Collapse / expand groups
- [x] Keyboard shortcuts
- [x] Light / dark theme
- [x] Built-in to-do list
- [ ] Drag & drop between groups
- [ ] Optional sync using browser storage
- [ ] Firefox support

---

## ❓ FAQ

**Q: Does this require a server or hosting?**  
A: No. Everything runs locally in the browser.

**Q: Where is my data stored?**  
A: In the browser's `localStorage`.

**Q: Can I use local images as thumbnails?**  
A: Yes. Reference files in `Dashboard/thumbs/`, or use image data URLs. Without a thumbnail, the site's favicon is used (needs internet).

**Q: Can I use a video as the background?**  
A: Yes. Drop it in `Dashboard/background/` and reference it (e.g. `./background/clip.mp4`). Videos always play muted and looped.

**Q: Why does the to-do panel open by itself?**  
A: By design — when you open a new tab and still have unfinished tasks, the panel opens automatically as a reminder. It won't focus the input, so your search stays usable. Finish (or clear) your tasks and it stays closed.

**Q: Can the New Tab page have a favicon?**  
A: No. Chrome does not support favicons for overridden New Tab pages.

**Q: Will this slow down my browser?**  
A: No. The dashboard is lightweight and only loads when opening a new tab.

---

## 🧩 Browser Compatibility

- Chrome
- Edge
- Brave
- Firefox (requires adjustments)

---

## 📜 License

MIT License — free to use, modify, and distribute.
