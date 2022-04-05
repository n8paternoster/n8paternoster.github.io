// use JS naming convensions. No_under_scores
// Caps are for Constructors
function clientToDeviceRect(cssRect) {
    const dpr = window.devicePixelRatio;

    const deviceRect = {};
    for (const k in cssRect) {
        if (k == 'toJSON') continue;
        deviceRect[k] = Math.round(cssRect[k] * dpr);
    }
    return deviceRect;
}
function snapToDeviceRect(e, deviceRect) {
    const dpr = window.devicePixelRatio;
    e.style.position = 'absolute';
    e.style.top = deviceRect.top % 1 / dpr + 'px';
    e.style.left = deviceRect.left % 1 / dpr + 'px';
    e.style.width = deviceRect.width / dpr + 'px';
    e.style.height = deviceRect.height / dpr + 'px';
}
function snapToParentPixels(e) {
    const clientRect = e.parentNode.getBoundingClientRect();
    const deviceRect = clientToDeviceRect(clientRect);

    // Chrome doesn't snap non-DPR-multiple canvases properly, snapping only to evens.
    const evenOnly = false;
    if (evenOnly) {
        const dpr = window.devicePixelRatio;
        for (const k of ['width', 'height']) {
            let cur = deviceRect[k];
            if (cur >= dpr) {
                cur -= cur % dpr;
            }
            deviceRect[k] = cur;
        }
    }

    snapToDeviceRect(e, deviceRect);

    return deviceRect;
}

const canvases = document.querySelectorAll('canvas');
let supportsDevicePixelContextBox = true;
const resizeObserver = new ResizeObserver(onResize);
for (const canvas of canvases) {
    canvas.parentNode.canvas = canvas;
    if (supportsDevicePixelContextBox) {
        try {
            resizeObserver.observe(canvas.parentNode, { box: 'device-pixel-content-box' });
        } catch (e) {
            supportsDevicePixelContextBox = false;
        }
    }
    if (!supportsDevicePixelContextBox) {
        resizeObserver.observe(canvas.parentNode, { box: 'border-box' });
    }
}
// the problem here is if we don't support `device-pixel-content-box`
// then zooming the page will not notify us of canvases who's CSS size
// has not changed even though the number of native pixels they cover has.
if (!supportsDevicePixelContextBox) {
    window.addEventListener('resize', () => {
        for (const canvas of canvases) {
            resizeCanvasToParentPixels(canvas);
            draw(canvas);
        }
    });
}

function onResize(entries) {
    for (const entry of entries) {
        const canvas = entry.canvas;
        resizeCanvasToDevicePixels(entry);
        draw(entry.target.canvas);
    }
}
function resizeCanvasToDevicePixels(entry) {
    const canvas = entry.target.canvas;
    if (entry.devicePixelContentBoxSize) {
        canvas.width = entry.devicePixelContentBoxSize[0].inlineSize;
        canvas.height = entry.devicePixelContentBoxSize[0].blockSize;
    } else {
        resizeCanvasToParentPixels(canvas);
    }
}
function resizeCanvasToParentPixels(canvas) {
    const rect = snapToParentPixels(canvas);
    canvas.width = rect.width;
    canvas.height = rect.height;
}
function draw(canvas) {
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // set the background
    ctx.fillStyle = "rgb(230, 230, 230)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var audioEle = document.getElementById('audio-source');
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyzer = new AnalyserNode(audioCtx);
const bufferSize = 512; // lower = faster fps, smoother waveform scrolling
var visibleFrames = 1;
analyzer.fftSize = bufferSize;
var buffer = new Float32Array(bufferSize);

// connect audio element
var source = audioCtx.createMediaElementSource(audioEle);
source.connect(analyzer);
analyzer.connect(audioCtx.destination);

var fpsInterval, now, then, elapsed;
var waveformCanvas = document.getElementById('waveform-layer');
var waveformCtx = waveformCanvas.getContext('2d');
function drawWaveform() {
    // prevent browser anti-aliasing which will distort the copied data
    waveformCtx.mozImageSmoothingEnabled = false;
    waveformCtx.webkitImageSmoothingEnabled = false;
    waveformCtx.msImageSmoothingEnabled = false;
    waveformCtx.imageSmoothingEnabled = false;

    // TODO - change this?
    analyzer.smoothingTimeConstant = 0;

    waveformCtx.lineWidth = 2;
    waveformCtx.strokeStyle = "blue";
    fpsInterval = 1000 / (44100 / bufferSize);  // fps = sampleRate/bufferSize
    console.log(fpsInterval);
    then = window.performance.now();
    drawHandle = drawFrame();
}
var drawHandle;
var prevSample = 0;
function drawFrame(timestamp) {
    drawHandle = requestAnimationFrame(drawFrame);
    now = timestamp;
    elapsed = now - then;
    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);

        var width = waveformCanvas.width;
        var height = waveformCanvas.height;
        var frameWidth = width / visibleFrames;
        var deltaX = frameWidth / bufferSize;

        // move the previous waveform over
        waveformCtx.globalCompositeOperation = 'copy';
        waveformCtx.drawImage(waveformCanvas, -frameWidth, 0, width, height);
        waveformCtx.globalCompositeOperation = 'source-over';

        analyzer.getFloatTimeDomainData(buffer);
        // move to the previous sample
        waveformCtx.beginPath();
        var x = width - frameWidth - deltaX;
        var y = (height / 2) * (1 - prevSample);
        prevSample = buffer[bufferSize - 1];
        waveformCtx.moveTo(x, y);

        // line to each subsequent sample
        for (let i = 0; i < bufferSize; i++) {
            x += deltaX;
            y = (height / 2) * (1 - buffer[i]);
            waveformCtx.lineTo(x, y);
            //if (buffer[i] >= 1 || buffer[i] <= -1) console.log(buffer[i]);
        }
        waveformCtx.stroke();
    }
}

audioEle.addEventListener('play', function () {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    drawWaveform();
});
audioEle.addEventListener('pause', function () {
    cancelAnimationFrame(drawHandle);
});