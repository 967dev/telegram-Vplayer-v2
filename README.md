# 🎵 Sonic Glow

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-purple.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)
![Telegram](https://img.shields.io/badge/Telegram-WebApp-blue.svg)

**Sonic Glow** is a premium, high-performance web-based music player and radio station hub. Designed with a stunning glassmorphism aesthetic, it features state-of-the-art "Neon Silk" visualizers, seamless cross-platform support, and advanced local storage capabilities.

---

## ✨ Key Features

- **🌈 Neon Silk Visualizers**: Three distinct, high-fidelity visualization modes (Wave, Circular, Bars) optimized for High DPI (Retina) displays.
- **📻 Global Radio Hub**: Pre-configured with premium electronic, lo-fi, and rap stations, featuring real-time error handling.
- **📂 Local Library Support**: Drag-and-drop your own music tracks. Metadata and files are stored locally using encrypted IndexedDB.
- **🖼️ Cinematic Backgrounds**: Support for high-quality video and image backgrounds with a "Universal Storage" system to bypass browser quota limits.
- **📱 Mobile First & Telegram Ready**: Fully optimized for mobile browsers and perfectly integrated as a Telegram WebApp.
- **🔋 Performance Optimized**: Caching systems for smooth 60 FPS UI transitions and low battery consumption.
- **🌙 Glassmorphism UI**: A modern, vibrant interface with dynamic accent colors that adapt to your music.

---

## 🛠 Tech Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+)
- **Styling**: CSS3 (Glassmorphism), TailwindCSS (Utility-first)
- **Audio Engine**: Web Audio API (AnalyserNode, MediaElementSource)
- **Database**: IndexedDB (for large asset storage and playlist persistence)
- **Design**: ColorThief (Dynamic extraction), FontAwesome (Iconography)

---

## 🚀 Quick Start & Deployment

### Local Development
To run the project locally, use any static file server:
```bash
npx serve .
```

### GitHub Pages Deployment
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Select the `main` branch as the source.
4. Your player will be live at `https://<your-username>.github.io/player_repo/`.

### 💻 Desktop App (Windows .EXE)
To build a standalone Windows executable:
1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Open terminal in the project folder and run:
   ```bash
   npm install
   ```
3. To test the app:
   ```bash
   npm start
   ```
4. To build the `.exe` file:
   ```bash
   npm run package-win
   ```
   The executable will be generated in the `/dist` folder.

### Telegram WebApp Integration
1. Open **@BotFather** on Telegram.
2. Create a new bot or select an existing one.
3. Go to **Bot Settings > Menu Button > Configure WebApp**.
4. Set the URL to your GitHub Pages link.

---

## 📖 Browser Support

| Browser | Support |
| :--- | :--- |
| **Chrome / Edge** | Full (Web Audio + IndexedDB) |
| **Safari / iOS** | Full (Optimized for MediaSession) |
| **Firefox** | Support (Standard Audio Context) |
| **Telegram In-App** | Optimized (Full Screen Experience) |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Created with ❤️ for music lovers.
