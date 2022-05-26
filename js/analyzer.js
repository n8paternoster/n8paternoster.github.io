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
    ele.style.top = deviceRect.top % 1 / dpr + 'px';
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
function resizeCanvasToParentPixels(canvas) {
    const rect = snapToParentPixels(canvas);
    //if (canvas.id === 'waveform-layer') {
    //    canvas.width = Math.min(rect.width - 35, rect.width * 0.965);
    //    canvas.height = Math.min(rect.height - 20, rect.height * 0.95);
    //} else {
    //    canvas.width = rect.width;
    //    canvas.height = rect.height;
    //}
    canvas.width = rect.width;
    canvas.height = rect.height;
}
function resizeCanvasToDevicePixels(entry) {
    let width = entry.devicePixelContentBoxSize[0].inlineSize;
    let height = entry.devicePixelContentBoxSize[0].blockSize;
    for (const canvas of entry.target.canvases) {
        if (entry.devicePixelContentBoxSize) {
            //if (canvas.id === 'waveform-layer') {
            //    canvas.width = Math.min(width - 35, width * 0.965);
            //    canvas.height = Math.min(height - 20, height * 0.95);
            //} else {
            //    canvas.width = width;
            //    canvas.height = height;
            //}
            canvas.width = width;
            canvas.height = height;
        } else {
            resizeCanvasToParentPixels(canvas);
        }
        console.log("Resized ", canvas.id, " to w: ", canvas.width, " h: ", canvas.height);
    }
}
function onResize(entries) {
    var running = visualizer.drawHandle !== 0;
    visualizer.stopAnimation();
    for (const entry of entries) {
        resizeCanvasToDevicePixels(entry);
    }
    visualizer.clearCanvas();
    visualizer.drawOverlay();
    if (running) visualizer.startAnimation();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Visualizer {
    static timeBufferSize = 2048;
    static freqBufferSize = 16384;  // linearly spaced frequency bins from 0Hz - 1/2 sample rate
    static spectrumBufferSize = 4096;
    static minTimeLength = 1 / 200;
    static maxTimeLength = 5;
    static minSpectrumLength = 5;
    static maxSpectrumLength = 10;

    analyzer;
    mode = 'time';
    windowLength = Visualizer.minTimeLength;
    drawHandle = 0;
    backgroundCanvas = document.getElementById('background-layer');
    gridCanvas = document.getElementById('grid-layer');
    waveformCanvas = document.getElementById('waveform-layer');

    constructor(node) {
        this.analyzer = node;
        this.analyzer.fftSize = Visualizer.timeBufferSize;
        this.analyzer.minDecibels = -100;
        this.analyzer.maxDecibels = 0;
        this.analyzer.smoothingTimeConstant = 0; // TODO - change this?
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
        drawSpectrumFrame = drawSpectrumFrame.bind(this);

        var buffer;
        var prevSample = 0;
        var then = 0;

        if (this.mode === 'time') {
            buffer = new Float32Array(Visualizer.timeBufferSize);
            this.analyzer.fftSize = Visualizer.timeBufferSize;
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 2;
            this.drawHandle = requestAnimationFrame(drawWaveformFrame);
        } else if (this.mode === 'frequency') {
            buffer = new Float32Array(Visualizer.freqBufferSize);
            this.analyzer.fftSize = Visualizer.freqBufferSize * 2;
            this.drawHandle = requestAnimationFrame(drawFrequencyFrame);
        } else if (this.mode === 'spectrum') {
            buffer = new Float32Array(Visualizer.spectrumBufferSize);
            this.analyzer.fftSize = Visualizer.spectrumBufferSize * 2;
            this.drawHandle = requestAnimationFrame(drawSpectrumFrame);
        } else return;

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
                ctx.fillStyle = 'hsla(' + hue + ', 100%, 45%, 1)';
                ctx.fillRect(x, height - barHeight, barWidth, height);
                hue -= hueDelta;
                x += barWidth;
                prevI = i;
            }
        };
        function drawSpectrumFrame(now) {
            this.drawHandle = requestAnimationFrame(drawSpectrumFrame);

            var elapsed = now - then;
            then = now;

            var width = this.waveformCanvas.width;
            var height = this.waveformCanvas.height;
            var numSamples = Math.floor(0.001 * elapsed * this.analyzer.context.sampleRate);
            if (numSamples <= 0 || numSamples > this.analyzer.fftSize)
                numSamples = this.analyzer.fftSize;
            var frameWidth = width * (numSamples / (this.windowLength * this.analyzer.context.sampleRate));
            if (frameWidth > width) frameWidth = width;

            // move the previous waveform over
            ctx.globalCompositeOperation = 'copy';
            ctx.drawImage(this.waveformCanvas, -frameWidth, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';

            // get frequency data
            let linearStep = (this.analyzer.context.sampleRate / 2) / Visualizer.spectrumBufferSize;
            let startBin = Math.round(20 / linearStep);
            let endBin = Math.round(20000 / linearStep);
            let dynRange = this.analyzer.maxDecibels - this.analyzer.minDecibels;
            
            this.analyzer.getFloatFrequencyData(buffer);

            // create a gradient for this point in time
            var gradient = ctx.createLinearGradient(width, height, width, 0);
            const log20 = Math.log10(20);
            for (let b = startBin; b <= endBin; b++) {
                let offset = (Math.log10(b * linearStep) - log20) / 3;
                offset = Math.max(0, Math.min(offset, 1));
                let intensity = (buffer[b] - this.analyzer.minDecibels) / dynRange;
                intensity = Math.max(0, Math.min(intensity, 1));
                //let hue = 200;
                //let color = 'hsla(' + hue + ', 100%, ' + intensity + '%, 1)';
                let color = 'hsla(' + intensity*360 + ', 100%, ' + intensity*100 + '%, 1)';
                gradient.addColorStop(offset, color);
            }

            ctx.fillStyle = 'black';
            ctx.fillRect(width, height, -frameWidth, -height);
            ctx.fillStyle = gradient;
            ctx.fillRect(width, height, -frameWidth, -height);
        }
    }
    stopAnimation() {
        cancelAnimationFrame(this.drawHandle);
        this.drawHandle = 0;
        this.waveformCanvas.getContext('2d').clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);  
    }
    calculateFontSize(notchLength, numYNotches) {
        // measure the text of every label to find the largest font size that will fit everything on screen
        var xGap = Math.floor(this.gridCanvas.height - this.waveformCanvas.height);
        var yGap = Math.floor(this.gridCanvas.width - this.waveformCanvas.width);
        var fontSize = Math.floor(xGap - 0.75*notchLength); // max size to fit all x-axis labels
        
        let availWidth = yGap - notchLength;
        if (availWidth < 0 || fontSize < 0) return 0;

        let ctx = this.gridCanvas.getContext('2d');
        let originalFont = ctx.font;
        ctx.font = "bold " + fontSize + "px sans-serif";

        // test time mode y-axis labels
        let yDelta = 2 / numYNotches;   // values span [-1, 1]
        for (let i = 1; i < numYNotches; i++) {
            let label = Math.round(10 * (1 - i * yDelta)) / 10;
            let text = ctx.measureText(label);
            while (text.width > availWidth && fontSize > 0) {
                fontSize--;
                ctx.font = "bold " + fontSize + "px sans-serif";
                text = ctx.measureText(label);
            }
        }
        // test frequency mode y-axis labels
        availWidth = yGap - notchLength / 2;    // frequency/spectrum labels are closer to the y-axis
        for (let db = 10 * Math.ceil(this.analyzer.maxDecibels / 10); db > this.analyzer.minDecibels; db -= 10) {
            if (db === this.analyzer.maxDecibels) continue;
            let text = ctx.measureText(db);
            while (text.width > availWidth && fontSize > 0) {
                fontSize--;
                ctx.font = "bold " + fontSize + "px sans-serif";
                text = ctx.measureText(db);
            }
        }
        // test spectrum mode y-axis labels
        for (let f = 30, m = 10; f < 20000; f += m) {
            m = Math.pow(10, Math.floor(Math.log10(f))); // magnitude
            let d = Math.floor(f / m);  // first digit of f
            if (d <= 3 || d === 5 || d === 7) {
                let label = (f >= 1000) ? f / 1000 + 'k' : f.toString();
                let text = ctx.measureText(label);
                while (text.width > availWidth && fontSize > 0) {
                    fontSize--;
                    ctx.font = "bold " + fontSize + "px sans-serif";
                    text = ctx.measureText(label);
                }
            }
        }

        ctx.font = originalFont;
        return Math.max(fontSize, 0);
    }
    drawXAxis(notchLength) {
        let width = this.waveformCanvas.width;
        let height = this.waveformCanvas.height;
        let ctx = this.gridCanvas.getContext('2d');
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        let y = height + 0.5*notchLength; // text vertical position
        switch (this.mode) {
            case 'time':
                y = height + 0.75*notchLength;  // more space for notches
            case 'spectrum':
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
                ctx.strokeStyle = this.mode === 'time' ? 'black' : 'white';
                ctx.beginPath();
                for (let i = 1; i < numXNotches; i++) {  // notches
                    let w = Math.floor(i * (width / numXNotches));
                    let text = Number((xDelta * (i - numXNotches)).toFixed(2)) + unit;
                    if (this.mode === 'time') {
                        ctx.moveTo(w, height - (notchLength / 2));
                        ctx.lineTo(w, height + (notchLength / 2));
                        ctx.fillText(text, w, y);
                    } else {
                        ctx.moveTo(w, height);
                        ctx.lineTo(w, height - 1.5 * notchLength);
                        ctx.fillText(text, w, y);
                    }
                }
                ctx.stroke();
                break;
            case 'frequency':
                for (let f = 30, m = 10; f < 20000; f += m) {
                    m = Math.pow(10, Math.floor(Math.log10(f)));    // magnitude
                    let d = Math.floor(f / m);  // first digit of f
                    let x = Math.floor((Math.log10(f) - Math.log10(20)) / 3 * width);
                    ctx.lineWidth = (d === 1) ? 2 : 0.5;
                    ctx.beginPath();
                    ctx.moveTo(x, height);
                    ctx.lineTo(x, 0);
                    ctx.stroke();
                    let text = (f >= 1000) ? f / 1000 + 'k' : f.toString();
                    if (d <= 3 || d === 5 || d === 7)
                        ctx.fillText(text, x, y);
                }
                ctx.textAlign = "left";
                ctx.fillText("Hz", 0, y);
                break;
        }
    }
    drawYAxis(notchLength, numYNotches) {
        let width = this.waveformCanvas.width;
        let height = this.waveformCanvas.height;
        let ctx = this.gridCanvas.getContext('2d');
        ctx.textBaseline = "middle";
        ctx.textAlign = "start";
        let x = width + notchLength / 2;    // text horizontal position
        switch (this.mode) {
            case 'time':
                x = width + notchLength;    // more space for notches
                let yDelta = 2 / numYNotches;   // values from [-1, 1]
                ctx.beginPath();
                for (let i = 1; i < numYNotches; i++) {
                    let h = Math.floor(i * (height / numYNotches));
                    ctx.moveTo(width - (notchLength / 2), h);
                    ctx.lineTo(width + (notchLength / 2), h);
                    ctx.fillText(Math.round(10 * (1 - i * yDelta)) / 10, x, h);
                }
                ctx.stroke();
                break;
            case 'frequency':
                let dynRange = this.analyzer.minDecibels - this.analyzer.maxDecibels;
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let db = 10 * Math.ceil(this.analyzer.maxDecibels / 10); db > this.analyzer.minDecibels; db -= 10) {
                    if (db === this.analyzer.maxDecibels) continue;
                    let y = Math.floor((db - this.analyzer.maxDecibels) / dynRange * height);
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.fillText(db, x, y);
                }
                ctx.stroke();
                ctx.textBaseline = "top";
                ctx.fillText("dB", x, 0);
                break;
            case 'spectrum':
                ctx.strokeStyle = 'white';
                for (let f = 30, m = 10; f < 20000; f += m) {
                    m = Math.pow(10, Math.floor(Math.log10(f))); // magnitude
                    let d = Math.floor(f / m);  // first digit of f
                    if (d <= 3 || d === 5 || d === 7) {
                        let y = height - Math.floor((Math.log10(f) - Math.log10(20)) / 3 * height);
                        ctx.lineWidth = (d === 1) ? 2 : 1;
                        ctx.beginPath();
                        ctx.moveTo(width, y);
                        ctx.lineTo(width - ((d === 1 ? 2 : 1) * notchLength), y);
                        ctx.stroke();
                        let text = (f >= 1000) ? f / 1000 + 'k' : f.toString();
                        ctx.fillText(text, x, y);
                    }
                }
                ctx.textBaseline = "top";
                ctx.fillText("Hz", x, 0);
                break;
        }
    }
    drawOverlay() {
        var gridCtx = this.gridCanvas.getContext('2d');
        var backgroundCtx = this.backgroundCanvas.getContext('2d');
        var width = this.waveformCanvas.width;
        var height = this.waveformCanvas.height;

        // set the background
        backgroundCtx.clearRect(0, 0, width, height);
        backgroundCtx.fillStyle = this.mode === "spectrum" ? 'black' : "rgb(230, 230, 230)";
        backgroundCtx.fillRect(0, 0, width, height);

        // draw the border
        gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
        gridCtx.lineWidth = 2;
        gridCtx.strokeStyle = "black";
        gridCtx.strokeRect(1, 1, width - 2, height - 2);

        // find the font size that will fit all labels on screen
        let numYNotches = 4; // time mode only, must be even to include 0
        let notchLength = Math.floor(this.gridCanvas.height - height) / 2;
        let fontSize = this.calculateFontSize(notchLength, numYNotches);
        if (fontSize <= 0) return;
        gridCtx.font = "bold " + fontSize + "px sans-serif";

        // draw the axes
        this.drawXAxis(notchLength);
        this.drawYAxis(notchLength, numYNotches);
    }
    setWindowLength(percent) {
        let minLength = this.mode === 'spectrum' ? Visualizer.minSpectrumLength : Visualizer.minTimeLength;
        let maxLength = this.mode === 'spectrum' ? Visualizer.maxSpectrumLength : Visualizer.maxTimeLength;
        this.windowLength = minLength + percent * (maxLength - minLength);
        if (this.windowLength > maxLength) this.windowLength = maxLength;
        if (this.mode === 'time' || this.mode === 'spectrum')
            this.drawOverlay();
    }
    changeMode(mode, percent) {
        const validModes = ['time', 'frequency', 'spectrum'];
        if (validModes.includes(mode) && mode !== this.mode) {
            var running = this.drawHandle !== 0;
            this.stopAnimation();
            this.clearCanvas();
            this.mode = mode;
            let minLength = mode === 'spectrum' ? Visualizer.minSpectrumLength : Visualizer.minTimeLength;
            let maxLength = this.mode === 'spectrum' ? Visualizer.maxSpectrumLength : Visualizer.maxTimeLength;
            this.windowLength = minLength + percent * (maxLength - minLength);
            if (this.windowLength > maxLength) this.windowLength = maxLength;
            this.drawOverlay();
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
        const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
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
function handleModeButtonClick(e) {
    let scaleEle = document.getElementById('x-scale');
    let windowLength = scaleEle.value;
    switch (e.target.id) {
        case 'time-button':
            visualizer.changeMode('time', windowLength);
            break;
        case 'frequency-button':
            visualizer.changeMode('frequency', windowLength);
            break;
        case 'spectrum-button':
            visualizer.changeMode('spectrum', windowLength);
            break;
        default: return;
    }
    scaleEle.disabled = e.target.id === 'frequency-button';
    let buttons = e.target.parentNode.children;
    for (let i = 0; i < buttons.length; i++)
        buttons[i].classList.remove('active-domain');
    e.target.classList.add('active-domain');
}

audioEle.addEventListener('play', function (e) {
    e.preventDefault();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (mediaStream) {
        const tracks = mediaStream.getAudioTracks();
        tracks[0].enabled = true;
    }
    audioEle.play();
    visualizer.startAnimation();
});
audioEle.addEventListener('pause', function (e) {
    e.preventDefault();
    audioEle.pause();
    visualizer.stopAnimation();
    if (mediaStream) {
        const tracks = mediaStream.getAudioTracks();
        tracks[0].enabled = false;
    }
});
document.getElementById('x-scale').addEventListener('input', e => visualizer.setWindowLength(e.target.value));
document.getElementById('audio-input').addEventListener('change', async function (e) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    audioEle.pause();
    visualizer.stopAnimation();
    if (streamNode) {
        const tracks = mediaStream.getAudioTracks();
        tracks[0].enabled = false;
    }
    switch (e.target.value) {
        case 'microphone':
            try {
                if (!mediaStream) mediaStream = await getMediaStream();
                if (!streamNode) streamNode = audioCtx.createMediaStreamSource(mediaStream);
                if (sourceNode) sourceNode.disconnect();
                audioEle.src = null;
                audioEle.srcObject = mediaStream;
                streamNode.connect(analyzerNode);
                const tracks = mediaStream.getAudioTracks();
                tracks[0].enabled = true;
            } catch (e) {
                console.log(e.message);
            }
            break;
        case 'africa':
            if (!sourceNode) sourceNode = audioCtx.createMediaElementSource(audioEle);
            if (streamNode) streamNode.disconnect();
            audioEle.srcObject = null;
            audioEle.src = "../project-assets/audio-analyzer/africa-toto.wav";
            sourceNode.connect(analyzerNode);
            break;
    }
    audioEle.load();
});
document.getElementById('time-button').addEventListener('click', e => handleModeButtonClick(e));
document.getElementById('frequency-button').addEventListener('click', e => handleModeButtonClick(e));
document.getElementById('spectrum-button').addEventListener('click', e => handleModeButtonClick(e));

document.addEventListener('DOMContentLoaded', e => {
    setupGraph();

    // Observe the visualizer container AND a hidden inset element with slightly smaller dimensions. When either changes size, adjust canvas sizes for 'pixel-perfect' rendering on any device.
    let visualizerContainer = document.getElementById('visualizer');
    let insetEle = document.getElementById('inset-rect');

    // Associate canvases to the element whose size they follow:
    // Visualizer container -> grid layer
    // Inset element -> waveform layer, background layer
    visualizerContainer.canvases = [];
    insetEle.canvases = [];
    for (const child of visualizerContainer.children) {
        if (child.tagName === 'CANVAS') {
            if (child.classList.contains('inset-layer'))
                insetEle.canvases.push(child);
            else
                visualizerContainer.canvases.push(child);
        }
    }
    const resizeObserver = new ResizeObserver(onResize);
    try {
        resizeObserver.observe(visualizerContainer, {
            box: 'device-pixel-content-box'
        });
        resizeObserver.observe(insetEle, {
            box: 'device-pixel-content-box'
        });
    } catch (e) {
        resizeObserver.observe(visualizerContainer, {
            box: 'border-box'
        });
        resizeObserver.observe(insetEle, {
            box: 'border-box'
        });
        // if device-pixel-content-box is not supported, zooming the page will not notify the observer since the CSS size has not changed even though the number of native pixels has
        window.addEventListener('resize', () => {
            // TODO: update this
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
});
