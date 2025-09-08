import * as db from './db.js';
import * as ui from './ui.js';
import * as player from './player.js';

let playlist = [];
let currentIndex = -1;
let currentRadioIndex = -1;
let isPlaying = false;
let currentMode = 'playlist';
let colorThief;

const builtInBacks = ['back/1.png', 'back/11.jpg', 'back/12.jpg', 'back/13.jpg', 'back/14.jpg', 'back/36.jpg', 'back/37.jpg', 'back/9.jpg'];

const builtInRadioStations = [
    { name: "NRJ DnB", genre: "Drum & Bass", streamUrl: "https://edge04.cdn.bitflip.ee:8888/NRJdnb" },
    { name: "Lofi Radio", genre: "Chill / Lofi Hip-Hop", streamUrl: "https://boxradio-edge-00.streamafrica.net/lofi" },
    { name: "EDM Radio", genre: "Electronic Dance Music", streamUrl: "https://edmradio.stream.laut.fm/edmradio" },
    { name: "Fuko", genre: "Hip-Hop / Rap", streamUrl: "https://radiorecord.hostingradio.ru/mf96.aacp" },
    { name: "Like POP", genre: "Pop Hits", streamUrl: "https://likeradiostream.com/likepop" },
    { name: "Record Rock", genre: "Rock Anthems", streamUrl: "https://radiorecord.hostingradio.ru/rock96.aacp" },
    { name: "Pirate Station", genre: "EDM", streamUrl: "https://radiorecord.hostingradio.ru/ps96.aacp" },
    { name: "Phonk", genre: "Phonk", streamUrl: "https://radiorecord.hostingradio.ru/phonk96.aacp" },
    { name: "RapHits", genre: "Rap / Hip-Hop", streamUrl: "https://radiorecord.hostingradio.ru/rap96.aacp" },
    { name: "DNB Record", genre: "DnB", streamUrl: "https://radiorecord.hostingradio.ru/drumhits96.aacp" },
    { name: "DNB Liquid", genre: "DnB", streamUrl: "https://radiorecord.hostingradio.ru/liquidfunk96.aacp" },
    { name: "Record LoFi", genre: "LoFi", streamUrl: "https://radiorecord.hostingradio.ru/lofi96.aacp" },
    { name: "Record Hardstyle", genre: "Hardstyle", streamUrl: "https://radiorecord.hostingradio.ru/teo96.aacp" }
];

const particleThemes = [
    { name: 'Accent', type: 'dynamic' },
    { name: 'Ocean', particle_color: '#89D4CF', line_color: '#7A6CCF' },
    { name: 'Sunset', particle_color: '#FFB88C', line_color: '#DE6262' },
    { name: 'Forest', particle_color: '#56AB2F', line_color: '#A8E063' },
    { name: 'Synthwave', particle_color: '#F472B6', line_color: '#5EEAD4' },
    { name: 'Fire', particle_color: '#ff4800', line_color: '#ff8c00' }
];

function setMode(mode) {
    currentMode = mode;
    localStorage.setItem('player_mode', mode);
    if (mode === 'playlist') {
        ui.playlistContainer.classList.remove('hidden');
        ui.radioContainer.classList.add('hidden');
        ui.modePlaylistBtn.classList.add('accent-bg');
        ui.modePlaylistBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
        ui.modeRadioBtn.classList.remove('accent-bg');
        ui.modeRadioBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
    } else {
        ui.playlistContainer.classList.add('hidden');
        ui.radioContainer.classList.remove('hidden');
        ui.modeRadioBtn.classList.add('accent-bg');
        ui.modeRadioBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
        ui.modePlaylistBtn.classList.remove('accent-bg');
        ui.modePlaylistBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
    }
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
    });
}

function playRadioStation(index) {
    if (index < 0 || index >= builtInRadioStations.length) return;
    player.setupVisualizer();
    currentRadioIndex = index;
    currentIndex = -1;
    const station = builtInRadioStations[index];

    player.audioPlayer.src = station.streamUrl;
    ui.currentTrackTitle.textContent = station.name;
    ui.currentTrackArtist.textContent = station.genre;
    ui.currentTrackArt.src = "https://placehold.co/64x64/1f2937/4b5563?text=Radio";
    ui.progressWrapper.classList.add('hidden');

    player.audioPlayer.play().catch(e => console.error("Radio playback error:", e));
    ui.player.classList.remove('translate-y-full');
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
        playRadioStation((currentRadioIndex + 1) % builtInRadioStations.length || 0);
    }
}

function playPrev() {
    if (currentMode === 'playlist') {
        playTrack((currentIndex - 1 + playlist.length) % playlist.length || 0);
    } else {
        playRadioStation((currentRadioIndex - 1 + builtInRadioStations.length) % builtInRadioStations.length || 0);
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
    ui.imageBg.style.display = 'block';
}

function activateParticlesBackground() {
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
    localStorage.setItem('background_image', 'particles');
    ui.bgModal.classList.add('hidden');
}

function openBgModalAndLoadImages() {
    ui.displayBackgrounds(builtInBacks, selectBackground, activateParticlesBackground);
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

function selectBackground(imageUrl) {
    deactivateParticlesBackground();
    localStorage.setItem('background_image', imageUrl);
    ui.imageBg.style.backgroundImage = `url('${imageUrl}')`;
    updateAccentColor(imageUrl);
    ui.bgModal.classList.add('hidden');
}

function loadSavedBackground() {
    const savedBg = localStorage.getItem('background_image');
    if (savedBg === 'particles') {
        activateParticlesBackground();
    } else if (savedBg) {
        deactivateParticlesBackground();
        ui.imageBg.style.backgroundImage = `url('${savedBg}')`;
        updateAccentColor(savedBg);
    } else {
        const randomBg = builtInBacks[Math.floor(Math.random() * builtInBacks.length)];
        selectBackground(randomBg);
    }
}

function handleBgUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => selectBackground(e.target.result);
    reader.readAsDataURL(file);
}

window.addEventListener('DOMContentLoaded', () => {
    Telegram.WebApp.ready();
    colorThief = new ColorThief();

    db.initDB(() => {
        db.loadPlaylistFromDB((loadedPlaylist) => {
            playlist = loadedPlaylist;
            ui.displayPlaylist(playlist, playTrack, deleteTrack);
            ui.updateActiveTrackUI(currentIndex, -1, false, currentMode);
        });
    });
    
    ui.displayRadioStations(builtInRadioStations, playRadioStation);
    loadSavedBackground();
    const savedMode = localStorage.getItem('player_mode') || 'playlist';
    setMode(savedMode);
    player.audioPlayer.volume = ui.volumeSlider.value / 100;

    window.addEventListener('resize', () => {
        ui.canvas.width = ui.appContainer.clientWidth;
        ui.canvas.height = ui.appContainer.clientHeight;
        ui.applyMarqueeToAll();
    });
    window.dispatchEvent(new Event('resize'));

    window.addEventListener('mousemove', (e) => player.handleParallax(e, ui.imageBg));
    window.addEventListener('deviceorientation', (e) => player.handleParallax(e, ui.imageBg));
    
    ui.audioUpload.addEventListener('change', handleFiles);
    ui.toggleEqBtn.addEventListener('click', () => player.toggleEqualizer(ui.toggleEqBtn));
    ui.togglePlaylistBtn.addEventListener('click', () => document.body.classList.toggle('playlist-collapsed'));
    
    ui.changeBgBtn.addEventListener('click', openBgModalAndLoadImages);
    
    ui.closeBgModal.addEventListener('click', () => ui.bgModal.classList.add('hidden'));
    ui.bgUpload.addEventListener('change', handleBgUpload);
    
    ui.modePlaylistBtn.addEventListener('click', () => setMode('playlist'));
    ui.modeRadioBtn.addEventListener('click', () => setMode('radio'));
    
    ui.playPauseBtn.addEventListener('click', togglePlayPause);
    ui.nextBtn.addEventListener('click', playNext);
    ui.prevBtn.addEventListener('click', playPrev);
    
    player.audioPlayer.addEventListener('timeupdate', () => ui.updateProgress(player.audioPlayer));
    player.audioPlayer.addEventListener('play', () => setPlayingState(true));
    player.audioPlayer.addEventListener('pause', () => setPlayingState(false));
    player.audioPlayer.addEventListener('ended', playNext);
    
    ui.progressBar.addEventListener('input', () => player.setProgressOnAudio(ui.progressBar));
    ui.volumeSlider.addEventListener('input', () => player.setVolume(ui.volumeSlider));
});
