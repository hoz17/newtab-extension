# 🧭 New Tab Dashboard

A clean, fast, and fully offline **New Tab Dashboard** for Chromium-based browsers.  
Designed for productivity with grouped links, drag & drop, and custom thumbnails — no server required.

---

## 📸 Screenshot

![Dashboard Screenshot](res/screenshot.png)

---

## ✨ Features

- Quick access links displayed as visual cards
- Groups with custom ordering (move up / down)
- Drag & drop to reorder links
- Custom thumbnails (local images or favicon fallback)
- Custom background (image, GIF, or muted video) with adjustable dim & blur
- Uniform card size for a clean layout
- Instant search across name, URL, and group
- Persistent storage using localStorage
- Dark UI optimized for daily use
- No server, no build step – runs directly from files
- Works as a New Tab browser extension

---

## 🚀 Installation (Developer Mode)

1. Download or clone this repository  
   Place it anywhere on your machine.

2. Open your browser and go to:  
   Settings → Extensions → Manage Extensions

3. Enable **Developer mode** (top right).

4. Click **Load unpacked**.

5. Select the repository folder.

Done! Open a new tab to see the dashboard.

---

## 📤 Export / Import Data

You can backup or transfer your dashboard data easily.

### Export
- Click **Export**
- A JSON backup file will be downloaded
- Includes:
  - All links
  - Group names & order
  - Metadata

### Import
- Click **Import**
- Select a previously exported JSON file
- Existing data will be replaced

⚠️ Import will overwrite current data.

---

## 🖼 Custom Background

Set an image, GIF, or video as the dashboard background.

1. Put your file in the `Dashboard/background/` folder, e.g. `photo.jpg`, `anim.gif`, or `clip.mp4`.
2. Click **Nền** (Background) in the toolbar.
3. In **Đường dẫn trong thư mục nền** (path in background folder), enter a relative path such as:
   - `./background/photo.jpg`
   - `./background/anim.gif`
   - `./background/clip.mp4`
4. Adjust **Độ tối** (dim) and **Làm mờ** (blur) to taste, then **Áp dụng** (Apply).

Notes:
- Videos are detected by extension (`mp4`, `webm`, `ogv`, `ogg`, `mov`, `m4v`) and always play **autoplay, looped, and muted** (muting is required for browser autoplay).
- The path (plus dim/blur) is stored in `localStorage`; the files themselves live in `Dashboard/background/`, which is **gitignored** so personal media is never committed.

---

## 📁 Project Structure
```
newtab-dashboard/
├── index.html # Main New Tab page
├── styles.css # Global styles & layout
├── app.js # Application logic
├── manifest.json # Extension configuration
├── thumbs/ # Local thumbnail images
│ ├── gmail.png
│ ├── notion.png
│ └── ...
├── background/ # Local background media (gitignored)
│ ├── photo.jpg
│ └── clip.mp4
├── icons/ # Extension icons
│ ├── icon16.png
│ ├── icon32.png
│ ├── icon48.png
│ └── icon128.png
└── screenshots/
└── dashboard.png
```

---

## 🧠 How It Works

- All links and settings are stored in browser `localStorage`
- Group order is stored separately to preserve layout
- No backend, no database, no external services required
- Clicking a card replaces the current tab (no new tab spam)

---

## 🛣 Roadmap

Planned improvements:

- [ ] Drag & drop between groups
- [ ] Collapse / expand groups
- [x] Import / export configuration (JSON)
- [x] Custom background (image / GIF / muted video)
- [ ] Keyboard shortcuts
- [ ] Optional sync using browser storage
- [ ] Firefox support

---

## ❓ FAQ

**Q: Does this require a server or hosting?**  
A: No. Everything runs locally in the browser.

**Q: Where is my data stored?**  
A: In the browser’s `localStorage`.

**Q: Can I use local images as thumbnails?**  
A: Yes. You can reference files in the `thumbs/` folder or use image data URLs.

**Q: Can I use a video as the background?**  
A: Yes. Drop it in `Dashboard/background/` and reference it (e.g. `./background/clip.mp4`). Videos always play muted and looped.

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
