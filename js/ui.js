export const appContainer = document.getElementById('app');
export const imageBg = document.getElementById('image-bg');
export const canvas = document.getElementById('visualizerCanvas');
export const audioUpload = document.getElementById('audioUpload');
export const playlistContainer = document.getElementById('playlistContainer');
export const radioContainer = document.getElementById('radioContainer');
export const player = document.getElementById('player');
export const currentTrackArt = document.getElementById('currentTrackArt');
export const currentTrackTitle = document.getElementById('currentTrackTitle');
export const currentTrackArtist = document.getElementById('currentTrackArtist');
export const playPauseBtn = document.getElementById('playPauseBtn');
export const playIcon = document.getElementById('playIcon');
export const pauseIcon = document.getElementById('pauseIcon');
export const prevBtn = document.getElementById('prevBtn');
export const nextBtn = document.getElementById('nextBtn');
export const progressWrapper = document.getElementById('progressWrapper');
export const progressBar = document.getElementById('progressBar');
export const currentTime = document.getElementById('currentTime');
export const totalTime = document.getElementById('totalTime');
export const initialMessage = document.getElementById('initialMessage');
export const volumeSlider = document.getElementById('volumeSlider');
export const toggleEqBtn = document.getElementById('toggleEqBtn');
export const changeBgBtn = document.getElementById('changeBgBtn');
export const bgModal = document.getElementById('bgModal');
export const bgGrid = document.getElementById('bgGrid');
export const closeBgModal = document.getElementById('closeBgModal');
export const bgUpload = document.getElementById('bgUpload');
export const togglePlaylistBtn = document.getElementById('togglePlaylistBtn');
export const modePlaylistBtn = document.getElementById('modePlaylistBtn');
export const modeRadioBtn = document.getElementById('modeRadioBtn');

export function displayBackgrounds(backgrounds, onSelectImage, onSelectParticles) {
    bgGrid.innerHTML = '';

    const particlesBtnContainer = document.createElement('div');
    particlesBtnContainer.className = 'cursor-pointer aspect-square rounded-md overflow-hidden transition-transform hover:scale-105 bg-gray-800 flex flex-col items-center justify-center p-2 text-center';
    particlesBtnContainer.innerHTML = `
        <i class="fas fa-atom text-4xl mb-2"></i>
        <span class="text-xs font-semibold">Particles</span>
    `;
    particlesBtnContainer.onclick = onSelectParticles;
    bgGrid.appendChild(particlesBtnContainer);
    
    backgrounds.forEach(bgUrl => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'cursor-pointer aspect-square rounded-md overflow-hidden transition-transform hover:scale-105';
        imgContainer.innerHTML = `<img src="${bgUrl}" class="w-full h-full object-cover" loading="lazy">`;
        imgContainer.onclick = () => onSelectImage(bgUrl);
        bgGrid.appendChild(imgContainer);
    });
}

export function formatTime(seconds) {
    const secs = Math.floor(seconds || 0);
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

export function updateProgress(audioPlayer) {
    const { duration, currentTime: time } = audioPlayer;
    const progressPercent = (time / duration) * 100;
    progressBar.value = isNaN(progressPercent) ? 0 : progressPercent;
    currentTime.textContent = formatTime(time);
    totalTime.textContent = isNaN(duration) ? '0:00' : formatTime(duration);
}

export function applyMarqueeIfNeeded(textElement) {
    const wrapper = textElement.parentElement;
    if (!wrapper) return;
    const shouldScroll = textElement.scrollWidth > wrapper.clientWidth;
    wrapper.classList.toggle('is-scrolling', shouldScroll);
}

export function applyMarqueeToAll() {
    if (currentTrackTitle) applyMarqueeIfNeeded(currentTrackTitle);
    playlistContainer.querySelectorAll('.marquee-text').forEach(applyMarqueeIfNeeded);
}

export function displayPlaylist(playlist, onTrackClick, onTrackDelete) {
    playlistContainer.innerHTML = '';
    initialMessage.classList.toggle('hidden', playlist.length > 0);
    
    playlist.forEach((track, index) => {
        const trackElement = document.createElement('div');
        trackElement.className = 'track-item flex items-center justify-between p-3 rounded-xl bg-black/20 backdrop-blur-lg border border-white/5 hover:bg-black/40 cursor-pointer transition-colors duration-200';
        
        const trackInfoContainer = document.createElement('div');
        trackInfoContainer.className = 'flex items-center flex-grow overflow-hidden mr-2 w-0 min-w-0';
        trackInfoContainer.innerHTML = `
            <div class="w-12 h-12 rounded-md mr-4 bg-white/10 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-music text-gray-300 text-xl"></i>
            </div>
            <div class="flex-grow overflow-hidden w-0 min-w-0">
                <div class="marquee-wrapper">
                    <p class="marquee-text font-semibold">${track.fileName}</p>
                </div>
                <p class="text-sm text-gray-400 truncate">${track.artistName}</p>
            </div>`;
        trackInfoContainer.addEventListener('click', () => onTrackClick(index));
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors';
        deleteButton.innerHTML = `<i class="fas fa-trash-alt"></i>`;
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            onTrackDelete(index);
        });
        
        trackElement.appendChild(trackInfoContainer);
        trackElement.appendChild(deleteButton);
        playlistContainer.appendChild(trackElement);
        applyMarqueeIfNeeded(trackElement.querySelector('.marquee-text'));
    });
}

export function displayRadioStations(stations, onStationClick) {
    radioContainer.innerHTML = '';
    stations.forEach((station, index) => {
        const stationEl = document.createElement('div');
        stationEl.className = 'track-item flex items-center justify-between p-3 rounded-xl bg-black/20 backdrop-blur-lg border border-white/5 hover:bg-black/40 cursor-pointer transition-colors duration-200';
        stationEl.innerHTML = `
            <div class="flex items-center flex-grow overflow-hidden mr-2 w-0 min-w-0">
                <div class="w-12 h-12 rounded-md mr-4 bg-white/10 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-headphones text-gray-300 text-xl"></i>
                </div>
                <div class="flex-grow overflow-hidden w-0 min-w-0">
                    <p class="font-semibold truncate">${station.name}</p>
                    <p class="text-sm text-gray-400 truncate">${station.genre}</p>
                </div>
            </div>`;
        stationEl.addEventListener('click', () => onStationClick(index));
        radioContainer.appendChild(stationEl);
    });
}

export function updateActiveTrackUI(currentIndex, currentRadioIndex, isPlaying, currentMode) {
    document.querySelectorAll('.track-item').forEach(el => {
        el.classList.remove('accent-bg-lite', 'accent-bg-lite-paused');
    });

    if (currentMode === 'playlist' && currentIndex !== -1) {
        const el = playlistContainer.children[currentIndex + (playlistContainer.children[0] === initialMessage ? 1 : 0)];
        if (el) el.classList.add(isPlaying ? 'accent-bg-lite' : 'accent-bg-lite-paused');
    } else if (currentMode === 'radio' && currentRadioIndex !== -1) {
        const el = radioContainer.children[currentRadioIndex];
        if (el) el.classList.add(isPlaying ? 'accent-bg-lite' : 'accent-bg-lite-paused');
    }
}
