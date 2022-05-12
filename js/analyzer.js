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
function onResize(entries) {
    var running = visualizer.drawHandle !== 0;
    visualizer.stopAnimation();
    for (const entry of entries) {
        resizeCanvasToDevicePixels(entry);
        let canvas = entry.target.canvas;
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    visualizer.drawOverlay();
    if (running) visualizer.startAnimation();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Visualizer {
    static timeBufferSize = 2048;
    static freqBufferSize = 16384;  // linearly spaced frequency bins from 0Hz - 1/2 sample rate
    static minLength = 1 / 200;
    static maxLength = 5;

    analyzer;
    domain = 'time';
    windowLength = Visualizer.minLength;
    drawHandle = 0;
    gridCanvas = document.getElementById('grid-layer');
    waveformCanvas = document.getElementById('waveform-layer');

    constructor(node) {
        this.analyzer = node;
        this.analyzer.fftSize = Visualizer.timeBufferSize;
        this.analyzer.minDecibels = -100;
        this.analyzer.maxDecibels = 0;
        //this.analyzer.smoothingTimeConstant = 0; // TODO - change this?
    }

    startAnimation() {
        var ctx = this.waveformCanvas.getContext('2d');

        // prevent browser anti-aliasing which will distort the copied data
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;

        drawWaveformFrame = drawWaveformFrame.bind(this);
        drawFrequencyFrame = drawFrequencyFrame.bind(this);

        var buffer;
        var prevSample = 0;
        var then = 0;
        
        if (this.domain === 'time') {
            buffer = new Float32Array(Visualizer.timeBufferSize);
            this.analyzer.fftSize = Visualizer.timeBufferSize;
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 2;
            this.drawHandle = requestAnimationFrame(drawWaveformFrame);
        } else if (this.domain === 'frequency') {
            buffer = new Float32Array(Visualizer.freqBufferSize);
            this.analyzer.fftSize = Visualizer.freqBufferSize * 2;
            this.drawHandle = requestAnimationFrame(drawFrequencyFrame);
        }

        function drawWaveformFrame(now) {
            this.drawHandle = requestAnimationFrame(drawWaveformFrame);

            var elapsed = now - then;
            then = now;

            var width = this.waveformCanvas.width;
            var height = this.waveformCanvas.height;
            var numSamples = Math.floor(0.001 * elapsed * this.analyzer.context.sampleRate);
            if (numSamples <= 0 || numSamples > Visualizer.timeBufferSize) numSamples = Visualizer.timeBufferSize;
            var frameWidth = width * (numSamples / (this.windowLength * this.analyzer.context.sampleRate));
            if (frameWidth > width) frameWidth = width;
            var deltaX = frameWidth / numSamples;

            // move the previous waveform over
            ctx.globalCompositeOperation = 'copy';
            ctx.drawImage(this.waveformCanvas, -frameWidth, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';

            this.analyzer.getFloatTimeDomainData(buffer);

            // move to the previous sample
            ctx.beginPath();
            var x = width - frameWidth - deltaX;
            var y = (height / 2) * (1 - prevSample);
            prevSample = buffer[numSamples - 1];
            ctx.moveTo(x, y);

            // line to each subsequent sample
            for (let i = 0; i < numSamples; i++) {
                x += deltaX;
                y = (height / 2) * (1 - buffer[i]);
                ctx.lineTo(x, y);
                //if (buffer[i] >= 1 || buffer[i] <= -1) console.log(buffer[i]);
            }
            ctx.stroke();
        };
        function drawFrequencyFrame(now) {
            this.drawHandle = requestAnimationFrame(drawFrequencyFrame);

            var width = this.waveformCanvas.width;
            var height = this.waveformCanvas.height;
            ctx.clearRect(0, 0, width, height);

            var linearStep = (this.analyzer.context.sampleRate / 2) / Visualizer.freqBufferSize;
            var numLogBins = Math.round(Math.log10(20000) / (Math.log10(linearStep / 20 + 1)));
            var logStep = Math.log10(20000) / numLogBins;
            var startBin = Math.round(numLogBins * Math.log10(20) / Math.log10(20000));
            var numDisplayBins = numLogBins - startBin + 1;

            this.analyzer.getFloatFrequencyData(buffer);
            ctx.lineWidth = 2;

            var barWidth = width / numDisplayBins;
            let barHeight;
            var x = 0;
            let dynRange = this.analyzer.maxDecibels - this.analyzer.minDecibels;
            let hue = 300;
            let hueDelta = 300 / numDisplayBins;
            let prevI = Math.round(Math.pow(10, startBin * logStep) / linearStep) - 1;
            for (let b = startBin; b <= numLogBins; b++) {
                let f = Math.pow(10, b * logStep);
                let i = Math.round(f / linearStep);
                let val = Math.max(...buffer.slice(prevI + 1, i + 1));
                //console.log("bin ", b, ": ", f, "hz", ", index ", i, ": ", i * linearStep, "prevI: ", prevI, "max val: ", val);
                barHeight = ((val - this.analyzer.minDecibels) / dynRange) * height;
                ctx.fillStyle = 'hsla(' + hue + ', 100%, 45%, 0.85)';
                ctx.fillRect(x, height - barHeight, barWidth, height);
                hue -= hueDelta;
                x += barWidth;
                prevI = i;
            }
        };
    }
    stopAnimation() {
        cancelAnimationFrame(this.drawHandle);
        this.drawHandle = 0;
    }
    drawOverlay() {
        var ctx = this.gridCanvas.getContext('2d');
        var width = this.waveformCanvas.width;
        var height = this.waveformCanvas.height;

        // set the background
        ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
        ctx.fillStyle = "rgb(230, 230, 230)";
        ctx.fillRect(0, 0, width, height);

        // draw the border
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.strokeRect(1, 1, width - 2, height - 2);

        // draw the x-axis
        var xGap = Math.floor((this.gridCanvas.height - height) / 2);
        var notchLength = xGap;
        ctx.fillStyle = "black";
        ctx.font = "bold " + xGap + "px sans-serif";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        if (this.domain === 'time') {
            let magnitude = Math.pow(10, Math.ceil(Math.log10(this.windowLength)));
            let xDelta = this.windowLength / magnitude;   // in the range [0.1, 1]
            if (xDelta < 0.13) xDelta = 0.1;
            else if (xDelta < 0.25) xDelta = 0.25;
            else if (xDelta < 0.5) xDelta = 0.5;
            else xDelta = 1;
            xDelta = xDelta * magnitude / 10;
            let numXNotches = Math.floor(this.windowLength / xDelta);
            let unit = "s";
            if (xDelta < 0.1) {
                xDelta *= 1000;
                unit = "ms";
            }
            ctx.beginPath();
            for (let i = 1; i < numXNotches; i++) {  // notches
                let w = Math.floor(i * (width / numXNotches));
                ctx.moveTo(w, height - (notchLength / 2));
                ctx.lineTo(w, height + (notchLength / 2));
                let text = Number((xDelta * (i - numXNotches)).toFixed(2)) + unit;
                ctx.fillText(text, w, height + xGap);
            }
            ctx.stroke();
        } else if (this.domain === 'frequency') {
            for (let f = 30, m = 10; f < 20000; f += m) {
                m = Math.pow(10, Math.floor(Math.log10(f)));    // magnitude
                let d = Math.floor(f / m);  // first digit of f
                let x = Math.floor((Math.log10(f) - Math.log10(20)) / 3 * width);
                ctx.lineWidth = (d === 1) ? 2 : 0.5;
                ctx.beginPath();
                ctx.moveTo(x, height);
                ctx.lineTo(x, 0);
                ctx.stroke();
                if (d <= 3 || d === 5 || d === 7)
                    ctx.fillText(f, x, height + xGap / 2);
            }
        }

        // draw the y-axis
        ctx.textBaseline = "middle";
        ctx.textAlign = "start";
        var yGap = Math.floor((this.gridCanvas.width - width) / 2);
        if (this.domain === 'time') {
            let numYNotches = 4;            // must be even to include 0
            let yDelta = 2 / numYNotches;   // values in the range [-1, 1]
            ctx.beginPath();
            for (let i = 1; i < numYNotches; i++) {
                let h = Math.floor(i * (height / numYNotches));
                ctx.moveTo(width - (notchLength / 2), h);
                ctx.lineTo(width + (notchLength / 2), h);
                ctx.fillText(Math.round(10 * (1 - i * yDelta)) / 10, width + notchLength, h);
            }
            ctx.stroke();
        } else if (this.domain === 'frequency') {
            let dynRange = this.analyzer.minDecibels - this.analyzer.maxDecibels;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let db = 10 * Math.ceil(this.analyzer.maxDecibels / 10); db > this.analyzer.minDecibels; db -= 10) {
                if (db === this.analyzer.maxDecibels) continue;
                console.log(db);
                let y = Math.floor((db - this.analyzer.maxDecibels) / dynRange * height);
                console.log(db, dynRange, y);
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.fillText(db, width + yGap / 2, y);
            }
            ctx.stroke();
        }
    }
    setWindowLength(percent) {
        if (this.domain !== 'time') return;
        this.windowLength = Visualizer.minLength + percent * (Visualizer.maxLength - Visualizer.minLength);
        if (this.windowLength > Visualizer.maxLength) this.windowLength = Visualizer.maxLength;
        this.drawOverlay();
    }
    changeDomain(domain) {
        if (domain === 'time' && this.domain !== 'time' ||
            domain === 'frequency' && this.domain !== 'frequency') {
            var running = this.drawHandle !== 0;
            this.stopAnimation();
            this.clearCanvas();
            this.domain = domain;
            visualizer.drawOverlay();
            if (running) visualizer.startAnimation();
        }
    }
    clearCanvas() {
        this.gridCanvas.getContext('2d').clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
        this.waveformCanvas.getContext('2d').clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
    }
}

// [sourceNode or streamNode] -> [analyzerNode] -> [context destination]
var audioEle = document.getElementById('audio-source');
var audioCtx, analyzerNode, sourceNode, mediaStream, streamNode;
var visualizer;

function setupGraph() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = new MediaElementAudioSourceNode(audioCtx, { mediaElement: audioEle });
    analyzerNode = new AnalyserNode(audioCtx);
    sourceNode.connect(analyzerNode);
    analyzerNode.connect(audioCtx.destination);
    visualizer = new Visualizer(analyzerNode);
}
async function getMediaStream() {
    if (!window.navigator.mediaDevices) {
        throw new Error("This browser does not support web audio or has web audio disabled");
    }
    try {
        const constraints = { audio: true, video: false };
        const stream = await window.navigator.mediaDevices.getUserMedia(constraints);
        return stream;
    } catch (e) {
        switch (e.name) {
            case "NotAllowedError":
                throw new Error("Access to the microphone was denied. Enable permission in the browser settings.");
            case "NotFoundError":
                throw new Error("No microphone found.");
            default:
                throw e;
        }
    }
}

audioEle.addEventListener('play', function () {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    visualizer.startAnimation();
});
audioEle.addEventListener('pause', function () {
    visualizer.stopAnimation();
});
document.getElementById('x-scale').addEventListener('input', (e) =>
    visualizer.setWindowLength(e.target.value)
);
document.getElementById('audio-input').addEventListener('change', async function (e) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    switch (e.target.value) {
        case 'microphone':
            try {
                if (!mediaStream) mediaStream = await getMediaStream();
                if (!streamNode) streamNode = audioCtx.createMediaStreamSource(mediaStream);
                if (sourceNode) sourceNode.disconnect();
                audioEle.srcObject = mediaStream;
                streamNode.connect(analyzerNode);
            } catch (e) {
                console.log(e.message);
            }
            break;
        case 'africa':
            if (!sourceNode) sourceNode = audioCtx.createMediaElementSource(audioEle);
            if (streamNode) streamNode.disconnect();
            audioEle.src = "../project-assets/audio-analyzer/africa-toto.wav";
            //audioEle.load();
            sourceNode.connect(analyzerNode);
            break;
    }
});
document.getElementById('time-button').addEventListener('click', (e) => {
    visualizer.changeDomain('time');
    e.target.classList.add('active-domain');
    document.getElementById('frequency-button').classList.remove('active-domain');
});
document.getElementById('frequency-button').addEventListener('click', (e) => {
    visualizer.changeDomain('frequency');
    e.target.classList.add('active-domain');
    document.getElementById('time-button').classList.remove('active-domain');
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
            var running = visualizer.drawHandle !== 0;
            visualizer.stopAnimation();
            for (const canvas of canvases) {
                resizeCanvasToParentPixels(canvas);
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            }
            visualizer.drawOverlay();
            if (running) visualizer.startAnimation();
        });
    }

    setupGraph();
});
