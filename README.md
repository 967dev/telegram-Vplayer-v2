Music Player - Telegram Web App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A client-side music player designed to run as a Telegram Web App. This application is built focusing on a highly customizable and visually appealing user experience. It's a static web app with no backend dependencies, perfect for hosting on services like GitHub Pages.

## ✨ Features

-   **Dual Playback Modes**:
    -   **My Music**: Upload and play your own local audio files.
    -   **Radio**: Stream from a curated list of live internet radio stations.
-   **Persistent Local Storage**: User-uploaded tracks are saved in the browser's **IndexedDB**, ensuring your playlist persists between sessions.
-   **Advanced Background Customization**:
    -   **Static Images**: Choose from a predefined list of background images.
    -   **Animated Particles**: A dynamic particle system powered by `particles.js`.
    -   **Dynamic Theming**: The UI's accent colors are automatically extracted from the current background image using **ColorThief.js**, creating a seamless and immersive look.
-   **Real-time Audio Visualizer**: A multi-layered wave animation that syncs with the music's frequencies, built with the **Web Audio API** and HTML5 Canvas.
-   **Native OS Integration**:
    -   The **Media Session API** integrates the player with the OS, providing media controls.
    -   Supports hardware media keys (play/pause, next/prev) on desktops.
-   **Polished UI/UX**:
    -   A subtle **parallax effect** on the background that responds to device motion or mouse movement.
    -   A scrolling **marquee effect** for long track titles.
    -   A collapsible playlist view for a distraction-free "Now Playing" mode.

## 🛠️ Tech Stack

-   **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
-   **Styling**: Tailwind CSS, Font Awesome
-   **Core Web APIs**:
    -   Web Audio API
    -   IndexedDB API
    -   Media Session API
-   **Libraries**:
    -   [Particles.js](https://github.com/VincentGarreau/particles.js/) - for the animated background.
    -   [ColorThief.js](https://github.com/lokesh/color-thief) - for dynamic theme generation.
-   **Platform**: Telegram Web App API

## 🚀 Getting Started

This is a static web application and does not require a build process or a backend server.

1.  **Clone the repository:**
   
2.  **Host the files:**
    Upload the contents of the repository (`player.html`, the `js/` folder, and the `back/` folder) to any static hosting service.

3.  **Telegram Bot Integration:**
    To use this as a Telegram Web App, you need a Telegram bot.
    -   Create a bot using [@BotFather](https://t.me/BotFather).
    -   Use a simple script (Python, Node.js, etc.) with your bot's token to send a message containing an `InlineKeyboardButton` with a `web_app` field pointing to your hosted URL.

Distributed under the MIT License. See `LICENSE` for more information
