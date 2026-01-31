import { canvas, player as playerElement } from './ui.js';

const audioPlayer = document.getElementById('audioPlayer');
let canvasCtx;
let audioContext, analyser, gainNode, sourceNode, dataArray, animationFrameId;
let equalizerEnabled = true;
let visualizerMode = 'wave'; // 'wave', 'circular', 'bars'
let cachedPrimaryRGB = '139, 92, 246';
let lastColorUpdate = 0;
let pulseEnabled = false;
let pulseIntensity = 0;

function setupVisualizer() {
    if (audioContext) {
        if (audioContext.state === 'suspended') audioContext.resume();
        return;
    }
    try {
        if (!canvasCtx) canvasCtx = canvas.getContext('2d');
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioContext.createMediaElementSource(audioPlayer);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;

        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.95; // Provide 5% headroom to prevent clipping

        sourceNode.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        animateVisualizer();
    } catch (e) {
        console.error("Could not initialize Web Audio API.", e);
    }
}

function animateVisualizer() {
    animationFrameId = requestAnimationFrame(animateVisualizer);
    if (!equalizerEnabled || !analyser || !canvasCtx) {
        if (canvasCtx) {
            canvasCtx.save();
            canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.restore();
        }
        return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2.0 for performance on high-end mobile screens
    const logicalW = canvas.width / dpr;
    const logicalH = canvas.height / dpr;

    analyser.getByteFrequencyData(dataArray);

    // Clear whole physical area
    canvasCtx.save();
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.restore();

    canvasCtx.shadowBlur = 0;
    canvasCtx.shadowColor = 'transparent';

    const now = Date.now();
    if (now - lastColorUpdate > 500) {
        cachedPrimaryRGB = getComputedStyle(document.documentElement).getPropertyValue('--primary-color-rgb') || '139, 92, 246';
        lastColorUpdate = now;
    }

    const primaryRgb = cachedPrimaryRGB;
    const isCollapsed = document.getElementById('player').classList.contains('collapsed');

    // Use logical height for visible center calculation
    const headerH = 140;
    const footerH = isCollapsed ? 70 : 160;
    const visibleCenterY = headerH + (logicalH - headerH - footerH) / 2;

    if (visualizerMode === 'circular') {
        drawCircularVisualizer(primaryRgb, visibleCenterY, logicalW, logicalH);
    } else if (visualizerMode === 'wave') {
        drawWaveVisualizer(primaryRgb, visibleCenterY, logicalW, logicalH);
    } else {
        drawBarVisualizer(primaryRgb, visibleCenterY, logicalW, logicalH);
    }

    if (pulseEnabled && dataArray) {
        // Calculate bass intensity (average of first 8 frequency bins for a bit more range)
        let bassSum = 0;
        const bassCount = 8;
        for (let i = 0; i < bassCount; i++) bassSum += dataArray[i];
        const bassLevel = bassSum / bassCount / 255; // 0 to 1

        // Smoothly approach target intensity but with a faster "attack" for punchiness
        const targetIntensity = bassLevel;
        if (targetIntensity > pulseIntensity) {
            pulseIntensity = pulseIntensity * 0.5 + targetIntensity * 0.5; // Fast attack
        } else {
            pulseIntensity = pulseIntensity * 0.9 + targetIntensity * 0.1; // Slower decay
        }

        const scale = 1 + (pulseIntensity * 0.08); // Max 8% scale (was 5%)
        const brightness = 1 + (pulseIntensity * 0.3); // Max 30% brightness boost (was 20%)
        const saturate = 100 + (pulseIntensity * 50); // Up to 150% saturation
        const transform = `translate(var(--tw-translate-x), var(--tw-translate-y)) scale(${scale})`;
        const filter = `brightness(${brightness}) saturate(${saturate}%)`;

        const imgBg = document.getElementById('image-bg');
        const vidBg = document.getElementById('video-bg');

        if (imgBg) {
            imgBg.style.setProperty('transform', transform, 'important');
            imgBg.style.setProperty('filter', filter, 'important');
        }
        if (vidBg) {
            vidBg.style.setProperty('transform', transform, 'important');
            vidBg.style.setProperty('filter', filter, 'important');
        }
    } else {
        // Reset if disabled
        const imgBg = document.getElementById('image-bg');
        const vidBg = document.getElementById('video-bg');
        if (imgBg) {
            imgBg.style.filter = '';
            // Don't reset transform here because parallax uses it, 
            // but we can remove the extra scale if needed. 
            // For now, simplicity:
        }
    }

    canvasCtx.shadowBlur = 0;
}

function drawCircularVisualizer(primaryRgb, centerY, logicalW, logicalH) {
    const centerX = logicalW / 2;
    const radius = Math.min(logicalW, logicalH) * 0.22;

    const barCount = 120;
    const halfCount = barCount / 2;

    for (let i = 0; i < halfCount; i++) {
        const dataIndex = Math.floor((i / halfCount) * dataArray.length * 0.8);
        const value = dataArray[dataIndex] / 255.0;
        const barHeight = 15 + value * 110;

        const angleRight = Math.PI / 2 + (i / halfCount) * Math.PI;
        const angleLeft = Math.PI / 2 - (i / halfCount) * Math.PI;

        const drawBar = (angle) => {
            const xStart = centerX + Math.cos(angle) * (radius + 5);
            const yStart = centerY + Math.sin(angle) * (radius + 5);
            const xEnd = centerX + Math.cos(angle) * (radius + 5 + barHeight);
            const yEnd = centerY + Math.sin(angle) * (radius + 5 + barHeight);

            canvasCtx.beginPath();
            canvasCtx.moveTo(xStart, yStart);
            canvasCtx.lineTo(xEnd, yEnd);
            canvasCtx.strokeStyle = `rgba(${primaryRgb}, ${0.4 + value * 0.6})`;
            canvasCtx.lineWidth = 3;
            canvasCtx.lineCap = 'round';
            canvasCtx.stroke();
        };

        drawBar(angleRight);
        drawBar(angleLeft);
    }

    const avg = Array.from(dataArray.slice(0, 10)).reduce((a, b) => a + b, 0) / 10 / 255;
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, radius * (0.9 + avg * 0.2), 0, 2 * Math.PI);
    canvasCtx.fillStyle = `rgba(${primaryRgb}, 0.05)`;
    canvasCtx.fill();
}

function drawWaveVisualizer(primaryRgb, baseline, logicalW, logicalH) {
    // Optimization: reduce segments on mobile
    const isMobile = 'ontouchstart' in window;
    const dataLen = isMobile ? 48 : 64;
    const sliceWidth = logicalW / (dataLen - 1);

    const layers = isMobile ? [
        { scale: 1.0, opacity: 0.8, width: 3, blur: 0 },
        { scale: 1.3, opacity: 0.3, width: 1, blur: 0 }
    ] : [
        { scale: 1.0, opacity: 0.8, width: 3, blur: 15 },
        { scale: 0.7, opacity: 0.4, width: 2, blur: 5 },
        { scale: 1.3, opacity: 0.2, width: 1, blur: 2 }
    ];

    layers.forEach(layer => {
        canvasCtx.beginPath();
        canvasCtx.strokeStyle = `rgba(${primaryRgb}, ${layer.opacity})`;
        canvasCtx.lineWidth = layer.width;

        if (layer.blur > 0) {
            canvasCtx.shadowBlur = layer.blur;
            canvasCtx.shadowColor = `rgba(${primaryRgb}, ${layer.opacity})`;
        }

        canvasCtx.lineCap = 'round';
        canvasCtx.lineJoin = 'round';

        let x = 0;
        let p1 = { x: 0, y: baseline };

        for (let i = 0; i < dataLen; i++) {
            const v = dataArray[i] / 255.0;
            const y = baseline - (v * 160 * layer.scale);

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                const xc = (x + (x - sliceWidth)) / 2;
                canvasCtx.quadraticCurveTo(x - sliceWidth, p1.y, xc, (p1.y + y) / 2);
            }
            p1 = { x, y };
            x += sliceWidth;
        }
        canvasCtx.stroke();
    });

    canvasCtx.shadowBlur = 0;
}

function drawBarVisualizer(primaryRgb, baseline, logicalW, logicalH) {
    const barCount = 64;
    const gutter = 3;
    const barWidth = (logicalW - (barCount * gutter)) / barCount;
    const halfCount = barCount / 2;

    for (let i = 0; i < halfCount; i++) {
        const dataIndex = Math.floor(i * (dataArray.length / halfCount) * 0.7);
        const v = dataArray[dataIndex] / 255;
        const barHeight = v * 160;

        canvasCtx.fillStyle = `rgba(${primaryRgb}, ${0.3 + v * 0.7})`;

        const xRight = (logicalW / 2) + i * (barWidth + gutter);
        canvasCtx.fillRect(xRight, baseline - barHeight / 2, barWidth, barHeight);

        const xLeft = (logicalW / 2) - (i + 1) * (barWidth + gutter);
        canvasCtx.fillRect(xLeft, baseline - barHeight / 2, barWidth, barHeight);
    }
}

function toggleEqualizer(toggleEqBtn) {
    const modes = ['wave', 'circular', 'bars', 'off'];
    let currentIndex = modes.indexOf(visualizerMode);
    if (!equalizerEnabled) currentIndex = 3;

    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    if (nextMode === 'off') {
        equalizerEnabled = false;
        visualizerMode = 'wave';
        toggleEqBtn.classList.remove('accent-bg');
        toggleEqBtn.classList.add('bg-gray-600');
        if (canvasCtx) {
            canvasCtx.save();
            canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.restore();
        }
    } else {
        equalizerEnabled = true;
        visualizerMode = nextMode;
        toggleEqBtn.classList.add('accent-bg');
        toggleEqBtn.classList.remove('bg-gray-600');
    }
}

function setVolume(volumeSlider) {
    const vol = volumeSlider.value / 100;
    audioPlayer.volume = vol;
    localStorage.setItem('player_volume', volumeSlider.value);
}

function setProgressOnAudio(progressBar) {
    const duration = audioPlayer.duration;
    if (!isNaN(duration)) audioPlayer.currentTime = (progressBar.value * duration) / 100;
}

function handleParallax(e, imageBg, videoBg) {
    const { innerWidth: width, innerHeight: height } = window;
    let x, y, strength;
    if (e.gamma !== undefined && e.beta !== undefined) {
        strength = 30;
        x = (e.gamma + 90) * (width / 180);
        y = (e.beta + 90) * (height / 180);
    } else {
        strength = 15;
        x = e.clientX;
        y = e.clientY;
    }
    const xPercent = (x / width - 0.5) * 2;
    const yPercent = (y / height - 0.5) * 2;
    const offsetX = -xPercent * strength;
    const offsetY = -yPercent * strength;
    const transform = `translate(${offsetX}px, ${offsetY}px)`;
    if (imageBg) imageBg.style.transform = transform;
    if (videoBg) videoBg.style.transform = transform;
}

function setVisualizerMode(mode) {
    visualizerMode = mode;
}

function setPulseEnabled(enabled) {
    pulseEnabled = enabled;
}

export {
    audioPlayer,
    setupVisualizer,
    animateVisualizer,
    toggleEqualizer,
    setVolume,
    setProgressOnAudio,
    handleParallax,
    visualizerMode,
    setVisualizerMode,
    setPulseEnabled
};
