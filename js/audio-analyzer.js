var audioEle = document.getElementById('audio-source');
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyzer = new AnalyserNode(audioCtx);
const bufferSize = 512; // lower = faster fps, smoother waveform scrolling
var visibleFrames = 1;
analyzer.fftSize = bufferSize;
var buffer = new Float32Array(bufferSize);
var canvasContainer = document.getElementById('canvas-container');

function setup() {
    // connect audio element
    var source = audioCtx.createMediaElementSource(audioEle);
    source.connect(analyzer);
    analyzer.connect(audioCtx.destination);

    // round the canvas width down to the nearest hundred; this ensures that scaling with any common device pixel ratio results in an even integer and the waveform animation is smooth
    var width = canvasContainer.getBoundingClientRect().width;
    canvasContainer.style.width = (100 * Math.floor(width / 100)) + 'px';

    // scale canvas to device resolution
    if (canvasContainer) {
        var canvases = canvasContainer.children;
        var scale = window.devicePixelRatio;
        for (let i = 0; i < canvases.length; i++) {
            canvases[i].style.width = canvasContainer.clientWidth + "px";
            canvases[i].style.height = canvasContainer.clientHeight + "px";
            canvases[i].width = Math.floor(canvasContainer.clientWidth * scale);
            canvases[i].height = Math.floor(canvasContainer.clientHeight * scale);
            var ctx = canvases[i].getContext('2d');
            ctx.scale(scale, scale);
        }
    }

    drawGrid();
}
setup();

function drawGrid(sampleRate = 44100) {
    var canvas = document.getElementById('grid-layer');
    var ctx = canvas.getContext('2d');
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    // set the background
    ctx.fillStyle = "rgb(230, 230, 230)";
    ctx.fillRect(0, 0, width, height);

    // draw the border
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.strokeRect(1, 1, width-2, height-2);

    // draw the x-axis
    const numNotches = 20;
    var tDelta = bufferSize / sampleRate / numNotches * 1000;   // in msecs
    ctx.fillStyle = 'black';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    for (let i = 1; i < numNotches; i++) {  // notches
        if (i === numNotches/2) continue;
        ctx.moveTo(i * (width / numNotches), (height / 2) - 7);
        ctx.lineTo(i * (width / numNotches), (height / 2) + 7);
        ctx.fillText((i < numNotches/2 ? '' : '+') + (tDelta*(i-numNotches/2)).toFixed(2), i * (width / numNotches), (height/2)+20);
    }
    ctx.stroke();
    

    // draw the y-axis
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    for (let i = 1; i < 10; i++) {
        if (i === 5) continue;
        ctx.moveTo((width / 2) - 7, i * (height / 10));
        ctx.lineTo((width / 2) + 7, i * (height / 10));
    }
    ctx.stroke();
}

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
        
        var width = waveformCanvas.clientWidth;
        var height = waveformCanvas.clientHeight;
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
document.getElementById('x-scale').addEventListener('input', function (e) {
    //// exponential scaling
    //const a = e.target.max;
    //const b = Math.pow(a, 1 / a);
    //visibleFrames = Math.floor(e.target.min * Math.pow(b, e.target.value));

    visibleFrames = e.target.value;
});

const observer = new ResizeObserver((entries) => {
    const entry = entries.find((entry) => entry.target === waveformCanvas);
    //waveformCanvas.width = entry.devicePixelContentBoxSize[0].inlineSize;
    //waveformCanvas.height = entry.devicePixelContentBoxSize[0].blockSize;
    console.log("observed width: ", entry.devicePixelContentBoxSize[0].inlineSize);
    console.log("observed height: ", entry.devicePixelContentBoxSize[0].blockSize);

    // TODO - resize canvas here?
});
observer.observe(waveformCanvas, { box: ['device-pixel-content-box'] });
