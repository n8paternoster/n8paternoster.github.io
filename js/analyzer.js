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
        //visualizer.drawWaveformOverlay();
        visualizer.drawOverlay();
    }
}
function onResize(entries) {
    for (const entry of entries) {
        resizeCanvasToDevicePixels(entry);
        redrawCanvas(entry.target.canvas);
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Visualizer {
    static timeBufferSize = 2048;
    static freqBufferSize = 16384;  // linearly spaced frequency bins from 0Hz - 1/2 sample rate
    static numDisplayedBins = 256;
    static minLength = 1 / 200;
    static maxLength = 5;

    analyzer;
    domain = 'time';
    buffer = new Float32Array(Visualizer.timeBufferSize);
    freqBuffer = new Float32Array(Visualizer.freqBufferSize);
    windowLength = Visualizer.minLength;
    gridCanvas = document.getElementById('grid-layer');
    waveformCanvas = document.getElementById('waveform-layer');

    constructor(analyzerNode) {
        this.analyzer = analyzerNode;
        this.analyzer.fftSize = Visualizer.timeBufferSize;
        this.analyzer.minDecibels = -100;
        this.analyzer.maxDecibels = 0;
        //this.analyzer.smoothingTimeConstant = 0; // TODO - change this?

        this.drawWaveformFrame = this.drawWaveformFrame.bind(this);
        this.drawFrequencyFrame = this.drawFrequencyFrame.bind(this);
        this.drawLogFrequencyFrame = this.drawLogFrequencyFrame.bind(this);
    }

    drawHandle;
    prevSample = 0;
    then = 0;
    ctx = this.waveformCanvas.getContext('2d');

    startAnimation() {
        // prevent browser anti-aliasing which will distort the copied data
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "blue";

        if (this.domain === 'time') {
            this.analyzer.fftSize = Visualizer.timeBufferSize;
            this.drawHandle = requestAnimationFrame(this.drawWaveformFrame);
        } else if (this.domain === 'frequency') {
            this.analyzer.fftSize = Visualizer.freqBufferSize * 2;
            //this.drawHandle = requestAnimationFrame(this.drawFrequencyFrame);
            this.drawHandle = requestAnimationFrame(this.drawLogFrequencyFrame);
        }
    }
    stopAnimation() {
        cancelAnimationFrame(this.drawHandle);
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
        var gap = Math.floor((this.gridCanvas.height - height) / 2);
        ctx.fillStyle = "black";
        ctx.font = "bold " + gap + "px sans-serif";
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
                ctx.moveTo(w, height - (gap / 2));
                ctx.lineTo(w, height + (gap / 2));
                let text = Number((xDelta * (i - numXNotches)).toFixed(2)) + unit;
                ctx.fillText(text, w, height + gap);
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
                    ctx.fillText(f, x, height + gap / 2);
            }
        }

        // draw the y-axis
        ctx.textBaseline = "middle";
        ctx.textAlign = "start";
        if (this.domain === 'time') {
            let numYNotches = 4;            // must be even to include 0
            let yDelta = 2 / numYNotches;   // values in the range [-1, 1]
            let yGutter = Math.floor((this.gridCanvas.width - width) - gap / 2);  // drawable horizontal space
            ctx.beginPath();
            for (let i = 1; i < numYNotches; i++) {
                let h = Math.floor(i * (height / numYNotches));
                ctx.moveTo(width - (gap / 2), h);
                ctx.lineTo(width + (gap / 2), h);
                ctx.fillText(Math.round(10 * (1 - i * yDelta)) / 10, width + gap, h, yGutter);
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
                ctx.fillText(db, width + gap / 2, y);
            }
            ctx.stroke();
        }
    }

    setWindowLength(percent) {
        if (this.domain !== 'time') return;
        this.windowLength = Visualizer.minLength + percent * (Visualizer.maxLength - Visualizer.minLength);
        if (this.windowLength > Visualizer.maxLength) this.windowLength = Visualizer.maxLength;
        this.drawWaveformOverlay();
    }
    
    drawWaveformFrame(now) {
        this.drawHandle = requestAnimationFrame(this.drawWaveformFrame);

        var elapsed = now - this.then;
        this.then = now;

        var width = this.waveformCanvas.width;
        var height = this.waveformCanvas.height;
        var numSamples = Math.floor(0.001 * elapsed * this.analyzer.context.sampleRate);
        if (numSamples <= 0 || numSamples > Visualizer.timeBufferSize) numSamples = Visualizer.timeBufferSize;
        var frameWidth = width * (numSamples / (this.windowLength * this.analyzer.context.sampleRate));
        if (frameWidth > width) frameWidth = width;
        var deltaX = frameWidth / numSamples;

        // move the previous waveform over
        this.ctx.globalCompositeOperation = 'copy';
        this.ctx.drawImage(this.waveformCanvas, -frameWidth, 0, width, height);
        this.ctx.globalCompositeOperation = 'source-over';

        this.analyzer.getFloatTimeDomainData(this.buffer);

        // move to the previous sample
        this.ctx.beginPath();
        var x = width - frameWidth - deltaX;
        var y = (height / 2) * (1 - this.prevSample);
        this.prevSample = this.buffer[numSamples - 1];
        this.ctx.moveTo(x, y);

        // line to each subsequent sample
        for (let i = 0; i < numSamples; i++) {
            x += deltaX;
            y = (height / 2) * (1 - this.buffer[i]);
            this.ctx.lineTo(x, y);
            //if (buffer[i] >= 1 || buffer[i] <= -1) console.log(buffer[i]);
        }
        this.ctx.stroke();
    }
    drawFrequencyFrame(now) {
        this.drawHandle = requestAnimationFrame(this.drawFrequencyFrame);

        var elapsed = now - this.then;
        this.then = now;

        var width = this.waveformCanvas.width;
        var height = this.waveformCanvas.height;
        this.ctx.clearRect(0, 0, width, height);

        // Only display frequency values in the audible range
        var binDelta = this.analyzer.context.sampleRate / this.analyzer.fftSize;
        var startBin = Math.round(20 / binDelta);
        var endBin = Math.round(20000 / binDelta);
        var numAudibleBins = endBin - startBin + 1;

        this.analyzer.getFloatFrequencyData(this.buffer);

        this.ctx.fillStyle = 'red';
        this.ctx.lineWidth = 2;

        var barWidth = width / numAudibleBins;
        let barHeight;
        var x = 0;
        let dynRange = this.analyzer.maxDecibels - this.analyzer.minDecibels;
        let logRange = Math.log10(20000) - Math.log10(20);
        let blue = true;
        for (let i = startBin; i <= endBin; i++) {
            let f = i * binDelta;
            if (f > 5135 && f < 5200) this.ctx.fillStyle = 'yellow';
            else 
            this.ctx.fillStyle = 'rgb(' + Math.floor(f + 100) + ',50,50)';
            barWidth = (Math.log10((i + 1) * binDelta) - Math.log10(f)) / logRange * width;
            barHeight = ((this.buffer[Math.floor(i)] - this.analyzer.minDecibels) / dynRange) * height;
            blue = !blue;
            this.ctx.fillRect(x, height - barHeight, barWidth, height);
            x += barWidth;
        }
    }
    drawLogFrequencyFrame(now) {
        this.drawHandle = requestAnimationFrame(this.drawLogFrequencyFrame);

        var elapsed = now - this.then;
        this.then = now;

        var width = this.waveformCanvas.width;
        var height = this.waveformCanvas.height;
        this.ctx.clearRect(0, 0, width, height);

        var linearStep = (this.analyzer.context.sampleRate/2) / Visualizer.freqBufferSize;
        var numLogBins = Math.round(Math.log10(20000) / (Math.log10(linearStep / 20 + 1)));
        var logStep = Math.log10(20000) / numLogBins;
        var startBin = Math.round(numLogBins * Math.log10(20) / Math.log10(20000));
        var numDisplayBins = numLogBins - startBin + 1;
        //console.log("linear step: ", linearStep);
        //console.log("numLogBins: ", numLogBins);
        //console.log("log step: ", logStep);
        //console.log("start bin: ", startBin);
        //console.log("num display bins: ", numDisplayBins);

        this.analyzer.getFloatFrequencyData(this.freqBuffer);
        this.ctx.lineWidth = 2;

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
            let val = Math.max(...this.freqBuffer.slice(prevI + 1, i + 1));
            //console.log("bin ", b, ": ", f, "hz", ", index ", i, ": ", i * linearStep, "prevI: ", prevI, "max val: ", val);
            barHeight = ((val - this.analyzer.minDecibels) / dynRange) * height;
            this.ctx.fillStyle = 'hsla(' + hue + ', 100%, 45%, 0.85)';
            this.ctx.fillRect(x, height - barHeight, barWidth, height);
            hue -= hueDelta;
            x += barWidth;
            prevI = i;
        }
    }

    //drawWaveformOverlay() {
    //    var ctx = this.gridCanvas.getContext('2d');
    //    var width = this.waveformCanvas.width;
    //    var height = this.waveformCanvas.height;

    //    // set the background
    //    ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    //    ctx.fillStyle = "rgb(230, 230, 230)";
    //    ctx.fillRect(0, 0, width, height);

    //    // draw the border
    //    ctx.lineWidth = 2;
    //    ctx.strokeStyle = "black";
    //    ctx.strokeRect(1, 1, width - 2, height - 2);

    //    // draw the x-axis
    //    var magnitude = Math.pow(10, Math.ceil(Math.log10(this.windowLength)));
    //    var xDelta = this.windowLength / magnitude;   // value in the range [0.1, 1]
    //    if (xDelta < 0.13) xDelta = 0.1;
    //    else if (xDelta < 0.25) xDelta = 0.25;
    //    else if (xDelta < 0.5) xDelta = 0.5;
    //    else xDelta = 1;
    //    xDelta = xDelta * magnitude / 10;
    //    var numXNotches = Math.floor(this.windowLength / xDelta);
    //    var notchLength = Math.floor((this.gridCanvas.height - height) / 2);
    //    var unit = "s";
    //    if (xDelta < 0.1) {
    //        xDelta *= 1000;
    //        unit = "ms";
    //    }
    //    ctx.fillStyle = "black";
    //    ctx.font = "bold " + notchLength + "px sans-serif";
    //    ctx.textBaseline = "top";
    //    ctx.textAlign = "center";
    //    ctx.beginPath();
    //    for (let i = 1; i < numXNotches; i++) {  // notches
    //        let w = Math.floor(i * (width / numXNotches));
    //        ctx.moveTo(w, height - (notchLength / 2));
    //        ctx.lineTo(w, height + (notchLength / 2));
    //        let text = Number((xDelta * (i - numXNotches)).toFixed(2)) + unit;
    //        ctx.fillText(text, w, height + notchLength);
    //    }
    //    ctx.stroke();

    //    // draw the y-axis
    //    ctx.textBaseline = "middle";
    //    ctx.textAlign = "start";
    //    var numYNotches = 4;            // set to even to include 0
    //    var yDelta = 2 / numYNotches;   // values in the range [-1, 1]
    //    var yGutter = Math.floor((this.gridCanvas.width - width) - notchLength / 2);  // drawable horizontal space
    //    ctx.beginPath();
    //    for (let i = 1; i < numYNotches; i++) {
    //        let h = Math.floor(i * (height / numYNotches));
    //        ctx.moveTo(width - (notchLength / 2), h);
    //        ctx.lineTo(width + (notchLength / 2), h);
    //        ctx.fillText(Math.round(10 * (1 - i * yDelta)) / 10, width + notchLength, h, yGutter);
    //    }
    //    ctx.stroke();
    //}
    //drawFrequencyOverlay() {
    //    var ctx = this.gridCanvas.getContext('2d');
    //    var width = this.waveformCanvas.width;
    //    var height = this.waveformCanvas.height;

    //    // set the background
    //    ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    //    ctx.fillStyle = "rgb(230, 230, 230)";
    //    ctx.fillRect(0, 0, width, height);

    //    // draw the border
    //    ctx.lineWidth = 2;
    //    ctx.strokeStyle = "black";
    //    ctx.strokeRect(1, 1, width - 2, height - 2);

    //    // draw the x-axis
    //    const numXNotches = 10;
    //    var minFreq = 20;
    //    var maxFreq = Math.min(20000, Math.floor(this.analyzer.context.sampleRate / 2));
    //    var xDelta = Math.floor((maxFreq - minFreq) / numXNotches);
    //    var notchLength = Math.floor((this.gridCanvas.height - height) / 2);
    //    var unit = "Hz";
    //    ctx.fillStyle = "black";
    //    ctx.font = "bold " + notchLength + "px sans-serif";
    //    ctx.textBaseline = "top";
    //    ctx.textAlign = "center";
    //    ctx.beginPath();
    //    for (let i = 1; i < numXNotches; i++) {
    //        // linear
    //        let w = Math.floor(i * (width / numXNotches));
    //        ctx.moveTo(w, height - (notchLength / 2));
    //        ctx.lineTo(w, height + (notchLength / 2));
    //        let text = Number(xDelta * i) + unit;
    //        ctx.fillText(text, w, height + notchLength);
    //    }
    //    ctx.stroke();
    //}
    //drawLogFrequencyOverlay() {
    //    var ctx = this.gridCanvas.getContext('2d');
    //    var width = this.waveformCanvas.width;
    //    var height = this.waveformCanvas.height;

    //    // set the background
    //    ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    //    ctx.fillStyle = "rgb(230, 230, 230)";
    //    ctx.fillRect(0, 0, width, height);

    //    // draw the border
    //    ctx.lineWidth = 2;
    //    ctx.strokeStyle = "black";
    //    ctx.strokeRect(1, 1, width - 2, height - 2);

    //    // draw the x-axis
    //    var gap = Math.floor((this.gridCanvas.height - height) / 2);
    //    ctx.fillStyle = "black";
    //    ctx.font = "bold " + gap + "px sans-serif";
    //    ctx.textBaseline = "top";
    //    ctx.textAlign = "center";

    //    for (let f = 30, m = 10; f < 20000; f += m) {

    //        m = Math.pow(10, Math.floor(Math.log10(f)));    // magnitude
    //        let d = Math.floor(f / m);  // first digit of f
    //        let x = Math.floor((Math.log10(f) - Math.log10(20)) / 3 * width);

    //        ctx.lineWidth = (d === 1) ? 2 : 0.5;
    //        ctx.beginPath();
    //        ctx.moveTo(x, height);
    //        ctx.lineTo(x, 0);
    //        ctx.stroke();
    //        if (d <= 3 || d === 5 || d === 7)
    //            ctx.fillText(f, x, height + gap / 2);
    //    }

    //    // draw the y-axis
    //    var dynRange = this.analyzer.minDecibels - this.analyzer.maxDecibels;
    //    ctx.lineWidth = 1;
    //    ctx.textBaseline = "middle";
    //    ctx.textAlign = "start";
    //    ctx.beginPath();
    //    for (let db = 10 * Math.ceil(this.analyzer.maxDecibels / 10); db > this.analyzer.minDecibels; db -= 10) {
    //        if (db === this.analyzer.maxDecibels) continue;
    //        console.log(db);
    //        let y = Math.floor((db - this.analyzer.maxDecibels) / dynRange * height);
    //        console.log(db, dynRange, y);
    //        ctx.moveTo(0, y);
    //        ctx.lineTo(width, y);
    //        ctx.fillText(db, width + gap / 2, y);
    //    }
    //    ctx.stroke();

    //}
}

var audioSrc;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyzer = new AnalyserNode(audioCtx);
var visualizer = new Visualizer(analyzer);

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
document.getElementById('microphone').addEventListener('click', async function () {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    try {
        const stream = await getMediaStream();
        if (audioSrc) audioSrc.disconnect();
        audioSrc = audioCtx.createMediaStreamSource(stream);
        audioSrc.connect(analyzer);
    } catch (e) {
        console.log(e.message);
    }
});

var audioEle = document.getElementById('audio-source');
audioEle.addEventListener('play', function () {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    visualizer.startAnimation();
});
audioEle.addEventListener('pause', function () {
    visualizer.stopAnimation();
});
document.getElementById('x-scale').addEventListener('input', function (e) {
    visualizer.setWindowLength(e.target.value);
});
document.getElementById('time-button').addEventListener('click', function () {
    visualizer.domain = 'time';
    //visualizer.drawWaveformOverlay();
    visualizer.drawOverlay();
});
document.getElementById('frequency-button').addEventListener('click', function () {
    visualizer.domain = 'frequency';
    //visualizer.drawFrequencyOverlay();
    //visualizer.drawLogFrequencyOverlay();
    visualizer.drawOverlay();
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
    audioSrc = audioCtx.createMediaElementSource(audioEle);
    audioSrc.connect(analyzer);
    analyzer.connect(audioCtx.destination);
    //analyzer.fftSize = timeBufferSize;
    //analyzer.smoothingTimeConstant = 0; // TODO - change this?
});