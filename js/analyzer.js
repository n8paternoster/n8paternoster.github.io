// Functions to achieve "pixel-perfect" canvas rendering; this is necessary since animating the waveform involves many consecutive redraws of the waveform canvas and even a tiny fraction mismatch between the css pixel size and the device's physical pixel size will be amplified and result in various aliasing problems
function clientToDeviceRect(cssRect) {
    const dpr = window.devicePixelRatio;
    const deviceRect = {};
    for (const k in cssRect) {
        if (k == 'toJSON') continue;
        deviceRect[k] = Math.round(cssRect[k] * dpr);
    }
    return deviceRect;
}
function snapToDeviceRect(ele, deviceRect) {
    const dpr = window.devicePixelRatio;
    ele.style.position = 'absolute';
    elee.style.top = deviceRect.top % 1 / dpr + 'px';
    ele.style.left = deviceRect.left % 1 / dpr + 'px';
    ele.style.width = deviceRect.width / dpr + 'px';
    ele.style.height = deviceRect.height / dpr + 'px';
}
function snapToParentPixels(ele) {
    // fallback for devices that don't support 'device-pixel-content-box' (accessing an element's size in device pixels directly)
    const clientRect = ele.parentNode.getBoundingClientRect();
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
    snapToDeviceRect(ele, deviceRect);
    return deviceRect;
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
function redrawCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (canvas.id === "waveform-layer") {
        // prevent browser anti-aliasing which will distort the copied data
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "blue";
    } else if (canvas.id === "grid-layer") {
        drawGrid();
    }
}
function onResize(entries) {
    for (const entry of entries) {
        resizeCanvasToDevicePixels(entry);
        redrawCanvas(entry.target.canvas);
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyzer = new AnalyserNode(audioCtx);
const bufferSize = 512; // lower = faster fps, smoother waveform scrolling
var buffer = new Float32Array(bufferSize);
var visibleFrames = 1;
var fpsInterval, now, then, elapsed;
var waveformCanvas = document.getElementById('waveform-layer');
var waveformCtx = waveformCanvas.getContext('2d');
var drawHandle;
var prevSample = 0;

function drawGrid(sampleRate = 44100) {
    var gridCanvas = document.getElementById('grid-layer');
    var ctx = gridCanvas.getContext('2d');
    var width = gridCanvas.width;
    var height = gridCanvas.height;
    width = waveformCanvas.width;
    height = waveformCanvas.height;

    // set the background
    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    ctx.fillStyle = "rgb(230, 230, 230)";
    ctx.fillRect(0, 0, width, height);

    // draw the border
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // draw the x-axis
    var windowLength = (bufferSize * visibleFrames) / sampleRate * 1000;    // in msecs
    var tDelta = 1000; // in msecs
    if (windowLength <= 20) tDelta = 1;
    else if (windowLength <= 50) tDelta = 2.5;
    else if (windowLength <= 100) tDelta = 5;
    else if (windowLength <= 200) tDelta = 10;
    else if (windowLength <= 500) tDelta = 25;
    else if (windowLength <= 1000) tDelta = 50;
    else if (windowLength <= 2000) tDelta = 100;
    else if (windowLength <= 5000) tDelta = 250;
    else if (windowLength <= 10000) tDelta = 500;
    else tDelta = 1000;
    var numNotches = Math.floor(windowLength / tDelta);
    const notchHeight = Math.floor((gridCanvas.height - waveformCanvas.height) / 2);

    ctx.fillStyle = 'black';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.beginPath();
    for (let i = 1; i < numNotches; i++) {  // notches
        ctx.moveTo(Math.floor(i * (width / numNotches)), height - (notchHeight/2));
        ctx.lineTo(Math.floor(i * (width / numNotches)), height + (notchHeight/2));
        ctx.fillText((tDelta * (i - numNotches)).toFixed(2), i * (width / numNotches), height + 20);
    }
    ctx.stroke();


    // draw the y-axis
    ctx.beginPath();
    for (let i = 1; i < 10; i++) {
        if (i === 5) continue;
        ctx.moveTo(width - 7, i * (height / 10));
        ctx.lineTo(width + 7, i * (height / 10));
    }
    ctx.stroke();
}
function drawWaveform(sampleRate = 44100) {
    // prevent browser anti-aliasing which will distort the copied data
    waveformCtx.mozImageSmoothingEnabled = false;
    waveformCtx.webkitImageSmoothingEnabled = false;
    waveformCtx.msImageSmoothingEnabled = false;
    waveformCtx.imageSmoothingEnabled = false;
    waveformCtx.lineWidth = 2;
    waveformCtx.strokeStyle = "blue";

    // throttle RAF to capture the as many audio samples as possible
    fpsInterval = 1000 / (sampleRate / bufferSize);  // fps = sampleRate/bufferSize
    then = window.performance.now();
    drawHandle = drawFrame();
}
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

var audioEle = document.getElementById('audio-source');
audioEle.addEventListener('play', function () {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    drawWaveform();
});
audioEle.addEventListener('pause', function () {
    cancelAnimationFrame(drawHandle);
});
document.getElementById('x-scale').addEventListener('input', function (e) {
    //// exponential scaling
    //const a = e.target.max;
    //const b = Math.pow(a, 1 / a);
    //visibleFrames = Math.floor(e.target.min * Math.pow(b, e.target.value));
    visibleFrames = e.target.value;
    drawGrid();
});
document.addEventListener('DOMContentLoaded', e => {

    // Observe the canvases on the page and adjust size for 'pixel-perfect' device rendering
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
        } else {
            resizeObserver.observe(canvas.parentNode, { box: 'border-box' });
        }
    }
    if (!supportsDevicePixelContextBox) {
        // if device-pixel-content-box is not supported, then zooming the page will not notify us of canvases whose CSS size has not changed even though the number of native pixels they cover has
        window.addEventListener('resize', () => {
            for (const canvas of canvases) {
                resizeCanvasToParentPixels(canvas);
                redrawCanvas(canvas);
            }
        });
    }

    // setup audio graph
    var source = audioCtx.createMediaElementSource(audioEle);
    source.connect(analyzer);
    analyzer.connect(audioCtx.destination);
    analyzer.fftSize = bufferSize;
    analyzer.smoothingTimeConstant = 0; // TODO - change this?
});