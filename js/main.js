import * as db from './db.js';
import * as ui from './ui.js';
import * as player from './player.js';

let playlist = [];
let currentIndex = -1;
let currentRadioIndex = -1;
let isPlaying = false;
let currentMode = 'playlist';
let colorThief;
let favoriteStations = JSON.parse(localStorage.getItem('fav_stations') || '[]');
let showOnlyFavorites = false;

const builtInBacks = [
    'back/1.png',
    'back/11.jpg',
    'back/12.jpg',
    'back/13.jpg',
    'back/14.jpg',
    'back/36.jpg',
    'back/37.jpg',
    'back/9.jpg',
    'back/44.gif',
    'back/45.gif',
    'back/48.gif',
    'back/49.gif',
];

const builtInRadioStations = [
    { name: "Ambient Record", genre: "Ambient", streamUrl: "https://radiorecord.hostingradio.ru/ambient96.aacp" },
    { name: "Lofi Box", genre: "Chill / Lofi", streamUrl: "https://boxradio-edge-00.streamafrica.net/lofi" },
    { name: "Synthwave", genre: "Electronic", streamUrl: "https://synthwave.stream.laut.fm/synthwave" },
    { name: "Deep House", genre: "House", streamUrl: "https://radiorecord.hostingradio.ru/deep96.aacp" },
    { name: "Like POP", genre: "Pop Hits", streamUrl: "https://likeradiostream.com/likepop" },
    { name: "Rock Record", genre: "Rock", streamUrl: "https://radiorecord.hostingradio.ru/rock96.aacp" },
    { name: "Phonk Record", genre: "Phonk", streamUrl: "https://radiorecord.hostingradio.ru/phonk96.aacp" },
    { name: "Rap Hits", genre: "Rap / Hip-Hop", streamUrl: "https://radiorecord.hostingradio.ru/rap96.aacp" },
    { name: "Record Gold", genre: "Retro Hits", streamUrl: "https://radiorecord.hostingradio.ru/gold96.aacp" },
    { name: "DNB Record", genre: "DnB", streamUrl: "https://radiorecord.hostingradio.ru/drumhits96.aacp" },
    { name: "DNB Liquid", genre: "Liquid DnB", streamUrl: "https://radiorecord.hostingradio.ru/liquidfunk96.aacp" },
    { name: "Jazz Radio", genre: "Classic Jazz", streamUrl: "https://jazzradio.ice.infomaniak.ch/jazzradio-high.mp3" },
    { name: "Chillout", genre: "Chillout / Lounge", streamUrl: "https://radiorecord.hostingradio.ru/chil96.aacp" },
    { name: "Techno Record", genre: "Techno", streamUrl: "https://radiorecord.hostingradio.ru/techno96.aacp" },
    { name: "Future House", genre: "Future House", streamUrl: "https://radiorecord.hostingradio.ru/fut96.aacp" },
    { name: "Vaporwave", genre: "Electronic / Vapor", streamUrl: "https://vaporwave.stream.laut.fm/vaporwave" }
];

const particleThemes = [
    { name: 'Accent', type: 'dynamic' },
    { name: 'Ocean', particle_color: '#89D4CF', line_color: '#7A6CCF' },
    { name: 'Sunset', particle_color: '#FFB88C', line_color: '#DE6262' },
    { name: 'Forest', particle_color: '#56AB2F', line_color: '#A8E063' },
    { name: 'Synthwave', particle_color: '#F472B6', line_color: '#5EEAD4' },
    { name: 'Fire', particle_color: '#ff4800', line_color: '#ff8c00' },
    { name: 'White', particle_color: '#ffffff', line_color: '#ff0000' }
];

function setMode(view) {
    // view can be: 'playlist', 'main', 'radio'
    document.body.classList.remove('state-playlist', 'state-main', 'state-radio');
    document.body.classList.add(`state-${view}`);

    // Update button highlights
    ui.modePlaylistBtn.classList.toggle('accent-bg', view === 'playlist');
    ui.modePlaylistBtn.classList.toggle('bg-gray-700', view !== 'playlist');
    ui.modeRadioBtn.classList.toggle('accent-bg', view === 'radio');
    ui.modeRadioBtn.classList.toggle('bg-gray-700', view !== 'radio');

    localStorage.setItem('player_view', view);

    // For internal logic, currentMode tracks what kind of item is playing
    // but the view tracks what is visible.
    ui.updateActiveTrackUI(currentIndex, currentRadioIndex, isPlaying, currentMode);
}

function setPlayingState(playing) {
    isPlaying = playing;
    ui.playIcon.classList.toggle('hidden', isPlaying);
    ui.pauseIcon.classList.toggle('hidden', !isPlaying);
    ui.updateActiveTrackUI(currentIndex, currentRadioIndex, isPlaying, currentMode);
}

function playTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    player.setupVisualizer();
    currentMode = 'playlist'; // Set playback mode
    currentIndex = index;
    currentRadioIndex = -1;
    const trackInfo = playlist[currentIndex];

    db.getTrackFileFromDB(trackInfo.id, (file) => {
        const audioURL = URL.createObjectURL(file);
        if (player.audioPlayer.src.startsWith('blob:')) URL.revokeObjectURL(player.audioPlayer.src);

        player.audioPlayer.src = audioURL;
        ui.currentTrackTitle.textContent = trackInfo.fileName;
        ui.currentTrackArtist.textContent = "Local File";
        ui.currentTrackArt.src = "https://placehold.co/64x64/1f2937/4b5563?text=Music";
        ui.progressWrapper.classList.remove('hidden');

        setTimeout(() => ui.applyMarqueeIfNeeded(ui.currentTrackTitle), 100);

        player.audioPlayer.play().catch(e => console.error("Playback error:", e));
        ui.player.classList.remove('translate-y-full');

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: trackInfo.fileName,
                artist: trackInfo.artistName,
                album: 'Music Player',
                artwork: [
                    { src: 'https://placehold.co/96x96/1f2937/4b5563?text=Music', sizes: '96x96', type: 'image/png' },
                    { src: 'https://placehold.co/128x128/1f2937/4b5563?text=Music', sizes: '128x128', type: 'image/png' },
                ]
            });
            navigator.mediaSession.setActionHandler('play', () => player.audioPlayer.play());
            navigator.mediaSession.setActionHandler('pause', () => player.audioPlayer.pause());
            navigator.mediaSession.setActionHandler('previoustrack', playPrev);
            navigator.mediaSession.setActionHandler('nexttrack', playNext);
        }
    });
}

function playRadioStation(index, shouldSyncWheel = true) {
    if (index < 0 || index >= builtInRadioStations.length) return;
    currentMode = 'radio'; // Set playback mode
    player.setupVisualizer();
    currentRadioIndex = index;
    currentIndex = -1;
    const station = builtInRadioStations[index];

    player.audioPlayer.src = station.streamUrl;
    ui.currentTrackTitle.textContent = station.name;
    ui.currentTrackArtist.textContent = station.genre;
    ui.currentTrackArt.src = "https://placehold.co/64x64/1f2937/4b5563?text=Radio";
    ui.progressWrapper.classList.add('hidden');
    ui.player.classList.remove('translate-y-full');

    if (shouldSyncWheel) {
        if (showOnlyFavorites) {
            const stationsToShow = builtInRadioStations.filter(s => favoriteStations.includes(s.name));
            const viewIndex = stationsToShow.findIndex(s => s.name === station.name);
            if (viewIndex > -1) ui.syncRadioWheel(viewIndex);
        } else {
            ui.syncRadioWheel(index);
        }
    }

    player.audioPlayer.play().catch(e => {
        if (e.name !== 'AbortError') {
            ui.currentTrackArtist.textContent = "Station Unavailable";
            console.error("Radio playback error:", e);
        }
    });

    // Handle stream errors
    player.audioPlayer.onerror = () => {
        if (currentMode === 'radio') ui.currentTrackArtist.textContent = "Stream Error / Offline";
    };

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: station.name,
            artist: station.genre,
            album: 'Radio',
            artwork: [
                { src: 'https://placehold.co/96x96/1f2937/4b5563?text=Radio', sizes: '96x96', type: 'image/png' },
                { src: 'https://placehold.co/128x128/1f2937/4b5563?text=Radio', sizes: '128x128', type: 'image/png' },
            ]
        });
        navigator.mediaSession.setActionHandler('play', () => player.audioPlayer.play());
        navigator.mediaSession.setActionHandler('pause', () => player.audioPlayer.pause());
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime) player.audioPlayer.currentTime = details.seekTime;
        });
    }

    updateFavoriteUI();
}


function updateFavoriteUI() {
    if (currentMode === 'radio' && currentRadioIndex !== -1) {
        // Find current playing station in global list
        const station = builtInRadioStations[currentRadioIndex];
        if (station) {
            const isFav = favoriteStations.includes(station.name);
            ui.footerFavBtn.classList.toggle('text-red-500', isFav);
            ui.footerFavBtn.classList.toggle('text-white/50', !isFav);
        }
    }
}

function toggleFavorite() {
    if (currentMode !== 'radio' || currentRadioIndex === -1) return;

    // Use global index to get the real station
    const station = builtInRadioStations[currentRadioIndex];
    if (!station) return;

    const idx = favoriteStations.indexOf(station.name);
    let isFavNow;

    if (idx > -1) {
        // Remove from favorites
        favoriteStations.splice(idx, 1);
        isFavNow = false;
    } else {
        // Add to favorites
        favoriteStations.push(station.name);
        isFavNow = true;
    }

    localStorage.setItem('fav_stations', JSON.stringify(favoriteStations));

    // Visual Update Immediate
    ui.footerFavBtn.classList.toggle('text-red-500', isFavNow);
    ui.footerFavBtn.classList.toggle('text-white/50', !isFavNow);

    // Heartbeat animation
    ui.footerFavBtn.classList.remove('heart-pop');
    void ui.footerFavBtn.offsetWidth;
    ui.footerFavBtn.classList.add('heart-pop');
    setTimeout(() => ui.footerFavBtn.classList.remove('heart-pop'), 500);

    // If we are in "Favorites Only" mode and we just removed the currently playing station
    if (showOnlyFavorites && !isFavNow) {
        const remaining = builtInRadioStations.filter(s => favoriteStations.includes(s.name));
        if (remaining.length > 0) {
            // Switch to the first available favorite
            const nextGlobal = builtInRadioStations.findIndex(s => s.name === remaining[0].name);
            playRadioStation(nextGlobal);
        } else {
            // No favorites left? Just refresh UI to show empty state/all
            refreshRadioUI();
        }
        return;
    }

    updateFavoriteUI(); // Sync other UI elements

    // Instant sync for the wheel item (without re-rendering all)
    const radioItems = document.querySelectorAll('.radio-wheel-item');
    radioItems.forEach(item => {
        if (item.textContent.trim().startsWith(station.name)) {
            const existingHeart = item.querySelector('.fa-heart');
            if (isFavNow && !existingHeart) {
                item.insertAdjacentHTML('afterbegin', '<i class="fas fa-heart text-[8px] text-red-500 absolute top-2 right-3"></i>');
            } else if (!isFavNow && existingHeart) {
                existingHeart.remove();
            }
        }
    });

    if (showOnlyFavorites) refreshRadioUI();
}

function refreshRadioUI() {
    const stationsToShow = builtInRadioStations.map(s => ({
        ...s,
        isFavorite: favoriteStations.includes(s.name)
    })).filter(s => !showOnlyFavorites || s.isFavorite);

    ui.displayRadioStations(stationsToShow, (viewIndex) => {
        // Map view index to global index
        const clickedStation = stationsToShow[viewIndex];
        const globalIndex = builtInRadioStations.findIndex(s => s.name === clickedStation.name);
        playRadioStation(globalIndex);
    });

    // Always ensure the active station is centered correctly in the view
    if (currentMode === 'radio' && currentRadioIndex !== -1) {
        const currentStation = builtInRadioStations[currentRadioIndex];
        const viewIndex = stationsToShow.findIndex(s => s.name === currentStation.name);
        if (viewIndex > -1) {
            // Add a small delay to ensure DOM is ready if called rapidly
            setTimeout(() => ui.syncRadioWheel(viewIndex), 10);
        }
    }
}

function togglePlayPause() {
    if (currentMode === 'playlist') {
        if (currentIndex === -1 && playlist.length > 0) return playTrack(0);
        if (currentIndex === -1) return;
    } else {
        if (currentRadioIndex === -1 && builtInRadioStations.length > 0) return playRadioStation(0);
        if (currentRadioIndex === -1) return;
    }
    isPlaying ? player.audioPlayer.pause() : player.audioPlayer.play();
}

function playNext() {
    if (currentMode === 'playlist') {
        playTrack((currentIndex + 1) % playlist.length || 0);
    } else {
        let nextIndex;
        if (showOnlyFavorites) {
            // Logic for favorites navigation
            const stationsToShow = builtInRadioStations.filter(s => favoriteStations.includes(s.name));
            if (stationsToShow.length === 0) return;

            const currentStation = builtInRadioStations[currentRadioIndex];
            const currentFavIndex = stationsToShow.findIndex(s => s.name === currentStation.name);

            // If current station is not in favorites (conceptually impossible if filtered, but safe), start from 0
            // Otherwise next in favorites list
            const nextFavIndex = (currentFavIndex + 1) % stationsToShow.length;
            const nextStation = stationsToShow[nextFavIndex];

            nextIndex = builtInRadioStations.findIndex(s => s.name === nextStation.name);
        } else {
            // Logic for normal navigation
            nextIndex = (currentRadioIndex + 1) % builtInRadioStations.length || 0;
        }
        playRadioStation(nextIndex);
    }
}

function playPrev() {
    if (currentMode === 'playlist') {
        playTrack((currentIndex - 1 + playlist.length) % playlist.length || 0);
    } else {
        let prevIndex;
        if (showOnlyFavorites) {
            // Logic for favorites navigation
            const stationsToShow = builtInRadioStations.filter(s => favoriteStations.includes(s.name));
            if (stationsToShow.length === 0) return;

            const currentStation = builtInRadioStations[currentRadioIndex];
            const currentFavIndex = stationsToShow.findIndex(s => s.name === currentStation.name);

            // Previous in favorites list
            const prevFavIndex = (currentFavIndex - 1 + stationsToShow.length) % stationsToShow.length;
            const prevStation = stationsToShow[prevFavIndex];

            prevIndex = builtInRadioStations.findIndex(s => s.name === prevStation.name);
        } else {
            // Logic for normal navigation
            prevIndex = (currentRadioIndex - 1 + builtInRadioStations.length) % builtInRadioStations.length || 0;
        }
        playRadioStation(prevIndex);
    }
}

function deleteTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    const trackIdToDelete = playlist[index].id;

    db.deleteTrackFromDB(trackIdToDelete, () => {
        if (index === currentIndex) {
            player.audioPlayer.pause();
            player.audioPlayer.src = '';
            ui.player.classList.add('translate-y-full');
            currentIndex = -1;
            setPlayingState(false);
        } else if (index < currentIndex) {
            currentIndex--;
        }
        playlist.splice(index, 1);
        ui.displayPlaylist(playlist, playTrack, deleteTrack);
        ui.updateActiveTrackUI(currentIndex, -1, isPlaying, currentMode);
    });
}

function handleFiles(event) {
    Array.from(event.target.files).forEach(file => {
        db.saveTrackToDB(file, (newTrack) => {
            playlist.push(newTrack);
            ui.displayPlaylist(playlist, playTrack, deleteTrack);
        });
    });
    ui.audioUpload.value = null;
}

function rgbStringToHex(rgbString) {
    if (!rgbString) return '#ffffff';
    const rgb = rgbString.match(/\d+/g).map(Number);
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

function deactivateParticlesBackground() {
    const particlesContainer = document.getElementById('particles-js');
    if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
    }
    particlesContainer.style.display = 'none';
    particlesContainer.classList.remove('light-theme');
    ui.imageBg.style.display = 'block';
    ui.videoBg.style.display = 'none';
    ui.videoBg.pause();
    ui.videoBg.src = "";
}

function activateParticlesDark() {
    deactivateParticlesBackground();
    const particlesContainer = document.getElementById('particles-js');
    particlesContainer.style.display = 'block';
    ui.imageBg.style.display = 'none';

    const randomTheme = particleThemes[Math.floor(Math.random() * particleThemes.length)];
    let particleColor, lineColor;
    if (randomTheme.type === 'dynamic') {
        const primaryRgb = getComputedStyle(document.documentElement).getPropertyValue('--primary-color-rgb');
        particleColor = rgbStringToHex(primaryRgb);
        lineColor = particleColor;
    } else {
        particleColor = randomTheme.particle_color;
        lineColor = randomTheme.line_color;
    }

    particlesJS('particles-js', {
        particles: {
            number: { value: 120, density: { enable: true, value_area: 800 } },
            color: { value: particleColor },
            shape: { type: "circle" },
            opacity: { value: 0.9, random: false },
            size: { value: 4, random: true },
            line_linked: { enable: true, distance: 150, color: lineColor, opacity: 0.8, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: false, straight: false, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" } },
            modes: { grab: { distance: 140, line_opacity: 1 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });
    localStorage.setItem('background_image', 'particles_dark');
    document.body.classList.add('no-blur');
    ui.bgModal.classList.add('hidden');
}

function activateParticlesLight() {
    deactivateParticlesBackground();
    const particlesContainer = document.getElementById('particles-js');
    particlesContainer.classList.add('light-theme');
    particlesContainer.style.display = 'block';
    ui.imageBg.style.display = 'none';

    const particleColor = '#333333';
    const lineColor = '#666666';

    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: particleColor },
            shape: { type: "circle" },
            opacity: { value: 0.8, random: false },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: lineColor, opacity: 0.7, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: false, straight: false, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" } },
            modes: { grab: { distance: 140, line_opacity: 1 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });
    localStorage.setItem('background_image', 'particles_light');
    document.body.classList.add('no-blur');
    ui.bgModal.classList.add('hidden');
}

function openBgModalAndLoadImages() {
    ui.displayBackgrounds(builtInBacks, selectBackground, activateParticlesDark, activateParticlesLight);
    ui.bgModal.classList.remove('hidden');
}

function updateAccentColor(imageDataUrl) {
    const tempImg = new Image();
    tempImg.crossOrigin = "Anonymous";
    tempImg.src = imageDataUrl;
    tempImg.onload = () => {
        try {
            const palette = colorThief.getPalette(tempImg, 3);
            let bestColor = palette[0], maxVibrancy = 0;
            palette.forEach(color => {
                const [r, g, b] = color;
                const avg = (r + g + b) / 3;
                const saturation = Math.sqrt(Math.pow(r - avg, 2) + Math.pow(g - avg, 2) + Math.pow(b - avg, 2));
                const vibrancy = saturation + Math.max(r, g, b);
                if (vibrancy > maxVibrancy && saturation > 30) {
                    maxVibrancy = vibrancy;
                    bestColor = color;
                }
            });
            const primaryRgb = bestColor.join(', ');
            const secondaryRgb = (palette[1] || bestColor).join(', ');
            document.documentElement.style.setProperty('--primary-color-rgb', primaryRgb);
            document.documentElement.style.setProperty('--secondary-color-rgb', secondaryRgb);
        } catch (e) {
            console.error("ColorThief error:", e);
            document.documentElement.style.setProperty('--primary-color-rgb', '139, 92, 246');
            document.documentElement.style.setProperty('--secondary-color-rgb', '219, 39, 119');
        }
    };
    tempImg.onerror = () => {
        document.documentElement.style.setProperty('--primary-color-rgb', '139, 92, 246');
        document.documentElement.style.setProperty('--secondary-color-rgb', '219, 39, 119');
    }
}

function selectBackground(url, type = 'image', fileToSave = null) {
    deactivateParticlesBackground();

    if (fileToSave) {
        localStorage.setItem('background_image', 'custom_db');
        db.saveBackgroundToDB(fileToSave, type);
    } else if (url && !url.startsWith('blob:')) {
        // Only save to localStorage if it's a built-in path, not a blob URL from DB
        localStorage.setItem('background_image', url);
    }

    localStorage.setItem('background_type', type);
    document.body.classList.remove('no-blur');

    if (type === 'video') {
        ui.imageBg.style.display = 'none';
        ui.videoBg.style.display = 'block';
        if (ui.videoBg.src.startsWith('blob:')) URL.revokeObjectURL(ui.videoBg.src);
        ui.videoBg.src = url;
        ui.videoBg.play().catch(e => console.warn("Video play failed:", e));
    } else {
        ui.videoBg.style.display = 'none';
        ui.videoBg.pause();
        ui.imageBg.style.display = 'block';
        ui.imageBg.style.backgroundImage = `url('${url}')`;
        updateAccentColor(url);
    }
    ui.bgModal.classList.add('hidden');
}

function loadSavedBackground() {
    const savedBg = localStorage.getItem('background_image');
    const savedType = localStorage.getItem('background_type') || 'image';

    if (savedBg === 'particles_dark') {
        activateParticlesDark();
    } else if (savedBg === 'particles_light') {
        activateParticlesLight();
    } else if (savedBg === 'custom_db') {
        db.getBackgroundFromDB((res) => {
            if (res && res.file) {
                const url = URL.createObjectURL(res.file);
                selectBackground(url, res.type);
            } else {
                // Fallback if DB is empty
                const randomBg = builtInBacks[Math.floor(Math.random() * builtInBacks.length)];
                selectBackground(randomBg, 'image');
            }
        });
    } else if (savedBg) {
        selectBackground(savedBg, savedType);
    } else {
        const randomBg = builtInBacks[Math.floor(Math.random() * builtInBacks.length)];
        selectBackground(randomBg, 'image');
    }
}

function handleBgUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);
    selectBackground(url, isVideo ? 'video' : 'image', file);
}

window.addEventListener('DOMContentLoaded', () => {
    Telegram.WebApp.ready();
    colorThief = new ColorThief();

    // Register Service Worker for PWA Store support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('Service Worker Registration Failed', err));
    }

    db.initDB(() => {
        db.loadPlaylistFromDB((loadedPlaylist) => {
            playlist = loadedPlaylist;
            ui.displayPlaylist(playlist, playTrack, deleteTrack);
            ui.updateActiveTrackUI(currentIndex, -1, false, currentMode);
        });
        // Background must be loaded AFTER DB is ready
        loadSavedBackground();
    });

    ui.displayRadioStations(builtInRadioStations, playRadioStation);
    const savedView = localStorage.getItem('player_view') || 'main';
    setMode(savedView);

    // Make footer visible but collapsed on entry
    ui.player.classList.remove('translate-y-full');
    ui.player.classList.add('collapsed');

    refreshRadioUI();

    // Load saved volume or default to 50%
    const savedVol = localStorage.getItem('player_volume') || 50;
    ui.volumeSlider.value = savedVol;
    player.audioPlayer.volume = savedVol / 100;

    // Initialize Collapse UI
    ui.initCollapseUI();
    ui.playerCollapseBtn.addEventListener('click', () => {
        ui.player.classList.toggle('collapsed');
    });

    window.addEventListener('resize', () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = ui.appContainer.clientWidth;
        const height = ui.appContainer.clientHeight;

        ui.canvas.width = width * dpr;
        ui.canvas.height = height * dpr;
        ui.canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);

        ui.applyMarqueeToAll();
    });
    window.dispatchEvent(new Event('resize'));

    window.addEventListener('mousemove', (e) => {
        const type = localStorage.getItem('background_type') || 'image';
        if (type === 'image') player.handleParallax(e, ui.imageBg);
    });
    window.addEventListener('deviceorientation', (e) => {
        const type = localStorage.getItem('background_type') || 'image';
        if (type === 'image') player.handleParallax(e, ui.imageBg);
    });

    ui.audioUpload.addEventListener('change', handleFiles);
    ui.toggleEqBtn.addEventListener('click', () => player.toggleEqualizer(ui.toggleEqBtn));
    ui.togglePlaylistBtn.addEventListener('click', () => {
        const currentView = ['playlist', 'main', 'radio'].find(v => document.body.classList.contains(`state-${v}`));
        let nextMode = currentView === 'playlist' ? 'main' : 'playlist';
        setMode(nextMode);
    });

    ui.changeBgBtn.addEventListener('click', openBgModalAndLoadImages);
    ui.footerFavBtn.addEventListener('click', toggleFavorite);
    ui.toggleFavoritesBtn.addEventListener('click', () => {
        showOnlyFavorites = !showOnlyFavorites;
        ui.toggleFavoritesBtn.classList.toggle('text-red-500', showOnlyFavorites);
        refreshRadioUI();
    });


    ui.closeBgModal.addEventListener('click', () => ui.bgModal.classList.add('hidden'));
    ui.bgUpload.addEventListener('change', handleBgUpload);

    ui.modePlaylistBtn.addEventListener('click', () => {
        const isCurrent = document.body.classList.contains('state-playlist');
        setMode(isCurrent ? 'main' : 'playlist');
    });
    ui.modeRadioBtn.addEventListener('click', () => {
        const isCurrent = document.body.classList.contains('state-radio');
        setMode(isCurrent ? 'main' : 'radio');
    });
    ui.playPauseBtn.addEventListener('click', togglePlayPause);
    ui.nextBtn.addEventListener('click', playNext);
    ui.prevBtn.addEventListener('click', playPrev);

    // Swipe gestures for playlist (Touch & Mouse)
    let startX = null;
    let isDragging = false;
    const swipeThreshold = 50;

    // Touch events
    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('#player')) {
            startX = null;
            return;
        }
        startX = e.changedTouches[0].screenX;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (startX === null) return;
        const diff = e.changedTouches[0].screenX - startX;
        handleSwipe(diff);
        startX = null;
    }, { passive: true });

    // Mouse events (Drag-to-swipe)
    window.addEventListener('mousedown', (e) => {
        // Don't trigger on interactables or the FOOTER
        if (e.target.closest('button, input, a, label, .track-item, #player')) {
            isDragging = false;
            startX = null;
            return;
        }
        startX = e.screenX;
        isDragging = true;
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging || startX === null) return;
        const diff = e.screenX - startX;
        handleSwipe(diff);
        isDragging = false;
        startX = null;
    });

    function handleSwipe(diff) {
        const views = ['playlist', 'main', 'radio'];
        const currentViewIndex = views.findIndex(v => document.body.classList.contains(`state-${v}`));

        if (diff > swipeThreshold) {
            // Swipe Right -> Go Left (towards playlist)
            if (currentViewIndex > 0) setMode(views[currentViewIndex - 1]);
        }
        else if (diff < -swipeThreshold) {
            // Swipe Left -> Go Right (towards radio)
            if (currentViewIndex < views.length - 1) setMode(views[currentViewIndex + 1]);
        }
    }

    player.audioPlayer.addEventListener('timeupdate', () => ui.updateProgress(player.audioPlayer));
    player.audioPlayer.addEventListener('play', () => setPlayingState(true));
    player.audioPlayer.addEventListener('pause', () => setPlayingState(false));
    player.audioPlayer.addEventListener('ended', playNext);

    ui.progressBar.addEventListener('input', () => player.setProgressOnAudio(ui.progressBar));
    ui.volumeSlider.addEventListener('input', () => player.setVolume(ui.volumeSlider));
});
