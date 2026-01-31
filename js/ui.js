export const appContainer = document.getElementById("app");
export const imageBg = document.getElementById("image-bg");
export const videoBg = document.getElementById("video-bg");
export const canvas = document.getElementById("visualizerCanvas");
export const audioUpload = document.getElementById("audioUpload");
export const playlistContainer = document.getElementById("playlistContainer");
export const radioContainer = document.getElementById("radioContainer");
export const player = document.getElementById("player");
export const currentTrackArt = document.getElementById("currentTrackArt");
export const currentTrackTitle = document.getElementById("currentTrackTitle");
export const currentTrackArtist = document.getElementById("currentTrackArtist");
export const playPauseBtn = document.getElementById("playPauseBtn");
export const playIcon = document.getElementById("playIcon");
export const pauseIcon = document.getElementById("pauseIcon");
export const prevBtn = document.getElementById("prevBtn");
export const nextBtn = document.getElementById("nextBtn");
export const progressWrapper = document.getElementById("progressWrapper");
export const progressBar = document.getElementById("progressBar");
export const currentTime = document.getElementById("currentTime");
export const totalTime = document.getElementById("totalTime");
export const initialMessage = document.getElementById("initialMessage");
export const volumeSlider = document.getElementById("volumeSlider");
export const toggleEqBtn = document.getElementById("toggleEqBtn");
export const changeBgBtn = document.getElementById("changeBgBtn");
export const bgModal = document.getElementById("bgModal");
export const bgGrid = document.getElementById("bgGrid");
export const closeBgModal = document.getElementById("closeBgModal");
export const bgUpload = document.getElementById("bgUpload");
export const togglePlaylistBtn = document.getElementById("togglePlaylistBtn");
export const modePlaylistBtn = document.getElementById("modePlaylistBtn");
export const modeRadioBtn = document.getElementById("modeRadioBtn");
export const toggleFavoritesBtn = document.getElementById("toggleFavoritesBtn");
export const footerFavBtn = document.getElementById("footerFavBtn");
export const pulseToggle = document.getElementById("pulseToggle");

// Player Collapse Handle
export const playerCollapseBtn = document.createElement('button');

export function initCollapseUI() {
    playerCollapseBtn.id = 'playerCollapseBtn';
    playerCollapseBtn.className = 'absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-3xl border border-white/10 w-12 h-12 rounded-full flex items-center justify-center text-white/70 transition-all hover:text-white hover:bg-black z-40 shadow-2xl';
    playerCollapseBtn.innerHTML = '<i class="fas fa-chevron-down text-lg"></i>';
    player.appendChild(playerCollapseBtn);
}

export function displayBackgrounds(backs, onSelect, onParticlesDark, onParticlesLight) {
    bgGrid.innerHTML = "";

    // Particles Button
    const particlesBtn = document.createElement("div");
    particlesBtn.className = "cursor-pointer aspect-square rounded-md overflow-hidden transition-transform hover:scale-105 bg-gray-800 flex flex-col items-center justify-center p-2 text-center";
    particlesBtn.innerHTML = `
        <i class="fas fa-atom text-4xl mb-2"></i>
        <span class="text-xs font-semibold">Particles</span>
    `;
    particlesBtn.onclick = onParticlesDark; // Default to dark for simplicity
    bgGrid.appendChild(particlesBtn);

    backs.forEach(back => {
        const item = document.createElement("div");
        item.className = "cursor-pointer aspect-square rounded-md overflow-hidden transition-transform hover:scale-105";
        item.innerHTML = `<img src="${back}" class="w-full h-full object-cover" loading="lazy">`;
        item.onclick = () => onSelect(back);
        bgGrid.appendChild(item);
    });
}

export function formatTime(seconds) {
    const s = Math.floor(seconds || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? "0" : ""}${rem}`;
}

export function updateProgress(audio) {
    const { duration, currentTime: curr } = audio;
    const percent = (curr / duration) * 100;
    progressBar.value = isNaN(percent) ? 0 : percent;
    currentTime.textContent = formatTime(curr);
    totalTime.textContent = isNaN(duration) ? "0:00" : formatTime(duration);
}

export function applyMarqueeIfNeeded(element) {
    const wrapper = element.parentElement;
    if (!wrapper) return;
    wrapper.classList.toggle("is-scrolling", element.scrollWidth > wrapper.clientWidth);
}

export function applyMarqueeToAll() {
    if (currentTrackTitle) applyMarqueeIfNeeded(currentTrackTitle);
    playlistContainer.querySelectorAll(".marquee-text").forEach(applyMarqueeIfNeeded);
}

export function displayPlaylist(tracks, onPlay, onDelete) {
    playlistContainer.innerHTML = "";
    if (initialMessage) initialMessage.classList.toggle("hidden", tracks.length > 0);

    tracks.forEach((track, index) => {
        const item = document.createElement("div");
        item.className = "track-item flex items-center justify-between p-3 rounded-xl bg-black/20 backdrop-blur-lg border border-white/5 hover:bg-black/40 cursor-pointer transition-colors duration-200";

        const info = document.createElement("div");
        info.className = "flex items-center flex-grow overflow-hidden mr-2 w-0 min-w-0";
        info.innerHTML = `
            <div class="w-12 h-12 rounded-md mr-4 bg-white/10 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-music text-gray-300 text-xl"></i>
            </div>
            <div class="flex-grow overflow-hidden w-0 min-w-0">
                <div class="marquee-wrapper">
                    <p class="marquee-text font-semibold">${track.fileName}</p>
                </div>
                <p class="text-sm text-gray-400 truncate">${track.artistName}</p>
            </div>`;
        info.addEventListener("click", () => onPlay(index));

        const del = document.createElement("button");
        del.className = "delete-btn flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors";
        del.innerHTML = '<i class="fas fa-trash-alt"></i>';
        del.addEventListener("click", (e) => {
            e.stopPropagation();
            onDelete(index);
        });

        item.appendChild(info);
        item.appendChild(del);
        playlistContainer.appendChild(item);

        const marqueeText = item.querySelector(".marquee-text");
        if (marqueeText) applyMarqueeIfNeeded(marqueeText);
    });
}

let radioWheelUpdateFn = null;
let radioWheelItemHeight = 90;

export function syncRadioWheel(index, animate = true, enableSound = true) {
    if (radioWheelUpdateFn) radioWheelUpdateFn(index, animate, enableSound);
}

export function displayRadioStations(stations, playCallback) {
    radioContainer.innerHTML = '';

    const stack = document.createElement('div');
    stack.className = 'radio-stack';
    radioContainer.appendChild(stack);

    const itemsArray = []; // For perf optimization

    let offset = 0;
    let activeIndex = 0;
    const itemHeight = radioWheelItemHeight;
    const totalHeight = stations.length * itemHeight;

    stations.forEach((station, index) => {
        const item = document.createElement('div');
        item.className = 'radio-wheel-item';
        const favIcon = station.isFavorite ? '<i class="fas fa-heart text-[8px] text-red-500 absolute top-2 right-3"></i>' : '';
        item.style.outline = 'none';
        item.innerHTML = `
            ${favIcon}
            <p class="font-bold text-base w-full px-2">${station.name}</p>
            <p class="text-[10px] opacity-50 uppercase tracking-widest">${station.genre}</p>
        `;
        item.onclick = () => {
            offset = -index * itemHeight;
            updateStack();
            playCallback(index, false);
        };
        stack.appendChild(item);
        itemsArray.push(item);
    });

    radioWheelUpdateFn = (index, animate = true, enableSound = true) => {
        const oldIndex = activeIndex;
        activeIndex = index;
        offset = -index * itemHeight;
        if (!animate) stack.style.transition = 'none';
        updateStack(enableSound);
        // Force tick if index changed but updateStack logic didn't catch it due to direct assignment
        if (oldIndex !== index && enableSound) playTickEffect();
        if (!animate) setTimeout(() => stack.style.transition = '', 0);
    };

    function updateStack(enableSound = true) {
        const centerY = 360;
        const winH = window.innerHeight;

        // Optimization: Use cached array and for-loop for 60fps smoothness
        for (let i = 0; i < itemsArray.length; i++) {
            const item = itemsArray[i];
            let itemY = (i * itemHeight) + offset;

            // Circular wrapping
            itemY = ((itemY + totalHeight / 2) % totalHeight + totalHeight) % totalHeight - totalHeight / 2;

            const distFromCenter = Math.abs(itemY);
            const absY = centerY + itemY;

            const maxDist = 350;
            const normalizedDist = Math.min(distFromCenter / maxDist, 1);

            const scale = 1 - (normalizedDist * 0.35);
            let opacity = 1 - (normalizedDist * 0.85);

            // Aggressive fade near header
            if (absY < 180) {
                const fadeFactor = Math.max(0, (absY - 100) / 80);
                opacity *= fadeFactor;
            }

            const blur = distFromCenter > itemHeight * 1.5 ? Math.min((distFromCenter - itemHeight * 1.5) / 40, 3) : 0;

            item.style.transform = `translate(-50%, ${absY}px) scale(${scale})`;
            item.style.opacity = opacity > 0.05 ? opacity : 0;
            item.style.filter = blur > 0.5 ? `blur(${blur}px)` : 'none';

            // Disable pointer events if the item is in the header/footer overlap zone
            if (absY < 180 || absY > winH - 150) {
                item.style.pointerEvents = 'none';
            } else {
                item.style.pointerEvents = 'auto';
            }

            if (distFromCenter < itemHeight / 2) {
                if (activeIndex !== i && enableSound) playTickEffect();
                activeIndex = i;
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    }

    let isDragging = false;
    let startY = 0;
    let startOffset = 0;

    // Wheel support
    radioContainer.onwheel = (e) => {
        e.preventDefault();
        offset -= e.deltaY;
        // Auto-snap logic for wheel
        clearTimeout(radioContainer.wheelTimeout);
        radioContainer.wheelTimeout = setTimeout(() => {
            activeIndex = Math.round(-offset / itemHeight) % stations.length;
            if (activeIndex < 0) activeIndex += stations.length;
            offset = -activeIndex * itemHeight;
            stack.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
            updateStack();
            playCallback(activeIndex, true);
        }, 150);
        stack.style.transition = 'none';
        updateStack();
    };

    radioContainer.onmousedown = (e) => {
        e.preventDefault();
        isDragging = true;
        startY = e.pageY;
        startOffset = offset;
        stack.style.transition = 'none';
        radioContainer.style.cursor = 'grabbing';
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        const delta = e.pageY - startY;
        offset = startOffset + delta;
        updateStack();
    };

    window.onmouseup = () => {
        if (!isDragging) return;
        isDragging = false;
        radioContainer.style.cursor = 'grab';
        stack.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';

        activeIndex = Math.round(-offset / itemHeight) % stations.length;
        if (activeIndex < 0) activeIndex += stations.length;

        offset = -activeIndex * itemHeight;
        updateStack();
        playCallback(activeIndex, true);
    };

    // Mobile/Touch Support
    radioContainer.ontouchstart = (e) => {
        isDragging = true;
        startY = e.touches[0].pageY;
        startOffset = offset;
        stack.style.transition = 'none';
    };
    radioContainer.ontouchmove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const delta = e.touches[0].pageY - startY;
        offset = startOffset + delta;
        updateStack();
    };
    radioContainer.ontouchend = () => {
        if (!isDragging) return;
        isDragging = false;
        stack.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
        activeIndex = Math.round(-offset / itemHeight) % stations.length;
        if (activeIndex < 0) activeIndex += stations.length;
        offset = -activeIndex * itemHeight;
        updateStack();
        playCallback(activeIndex, true);
    };

    // Initial positioning
    setTimeout(updateStack, 0);
}

function playTickEffect() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
    } catch (e) { }
}

export function updateActiveTrackUI(currentIndex, currentRadioIndex, isPlaying, mode) {
    document.querySelectorAll(".track-item, .radio-wheel-item").forEach(item => {
        item.classList.remove("accent-bg-lite", "accent-bg-lite-paused");
        // For radio items, ensure we also clear any hardcoded 'active' class
        item.classList.remove("active");
    });

    if (mode === "playlist" && currentIndex !== -1) {
        const item = playlistContainer.children[currentIndex];
        if (item) item.classList.add(isPlaying ? "accent-bg-lite" : "accent-bg-lite-paused");
    } else if (mode === "radio" && currentRadioIndex !== -1) {
        const stack = radioContainer.querySelector('.radio-stack');
        if (stack) {
            const item = stack.children[currentRadioIndex];
            // For radio, we ONLY use the class to trigger the glow/border from CSS
            if (item) item.classList.add(isPlaying ? "accent-bg-lite" : "accent-bg-lite-paused");
        }
    }
}
