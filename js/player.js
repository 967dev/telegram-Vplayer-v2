import { canvas, player as playerElement } from './ui.js';

const audioPlayer = document.getElementById('audioPlayer');
let canvasCtx; 
let audioContext, analyser, sourceNode, dataArray, animationFrameId;
let equalizerEnabled = true;

function setupVisualizer() {
    if (audioContext) return;
    try {
        if (!canvasCtx) canvasCtx = canvas.getContext('2d');
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioContext.createMediaElementSource(audioPlayer);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        animateVisualizer();
    } catch (e) { console.error("Could not initialize Web Audio API.", e); }
}

function animateVisualizer() {
    animationFrameId = requestAnimationFrame(animateVisualizer);
    if (!equalizerEnabled || !analyser || !canvasCtx) {
        if (canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const isCollapsed = document.body.classList.contains('playlist-collapsed');
    const primaryRgb = getComputedStyle(document.documentElement).getPropertyValue('--primary-color-rgb');
    const waveCount = 3;
    const sliceWidth = canvas.width / dataArray.length;
    const baseline = isCollapsed ? canvas.height / 2 : canvas.height - (playerElement.offsetHeight / 2) - 10;
    const amplitude = isCollapsed ? 150 : 80;
    for (let j = 0; j < waveCount; j++) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, baseline);
        canvasCtx.strokeStyle = `rgba(${primaryRgb}, ${0.8 - j * 0.2})`;
        canvasCtx.lineWidth = 3 - j;
        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 255.0;
            const y = baseline - (v * amplitude * (1 - j * 0.2));
            const x = i * sliceWidth;
            canvasCtx.lineTo(x, y);
        }
        canvasCtx.lineTo(canvas.width, baseline);
        canvasCtx.stroke();
    }
}

function toggleEqualizer(toggleEqBtn) {
    equalizerEnabled = !equalizerEnabled;
    toggleEqBtn.classList.toggle('accent-bg');
    toggleEqBtn.classList.toggle('bg-gray-600', !equalizerEnabled);
    if (!equalizerEnabled && canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
}

function setVolume(volumeSlider) { audioPlayer.volume = volumeSlider.value / 100; }
function setProgressOnAudio(progressBar) { const duration = audioPlayer.duration; if (!isNaN(duration)) audioPlayer.currentTime = (progressBar.value * duration) / 100; }

function handleParallax(e, imageBg) {
    const { innerWidth: width, innerHeight: height } = window;
    let x, y, strength;
    if (e.gamma !== undefined && e.beta !== undefined) {
        strength = 30; x = (e.gamma + 90) * (width / 180); y = (e.beta + 90) * (height / 180);
    } else {
        strength = 15; x = e.clientX; y = e.clientY;
    }
    const xPercent = (x / width - 0.5) * 2, yPercent = (y / height - 0.5) * 2;
    const offsetX = -xPercent * strength, offsetY = -yPercent * strength;
    imageBg.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

export { audioPlayer, setupVisualizer, animateVisualizer, toggleEqualizer, setVolume, setProgressOnAudio, handleParallax };
