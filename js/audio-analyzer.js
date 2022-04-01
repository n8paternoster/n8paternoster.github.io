var audioEle = document.getElementById('audio-source');
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyzer = new AnalyserNode(audioCtx);
analyzer.fftSize = 2048;
const bufferSize = analyzer.frequencyBinCount;    // 1024
var samples = new Float32Array(bufferSize);
var canvasContainer = document.getElementById('canvas-container');

function setup() {
    // connect audio element
    var source = audioCtx.createMediaElementSource(audioEle);
    source.connect(analyzer);
    analyzer.connect(audioCtx.destination);

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
    var width = canvasContainer.clientWidth;
    var height = canvasContainer.clientHeight;

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

var drawHandle;
var waveformCanvas = document.getElementById('waveform-layer');
var waveformCtx = waveformCanvas.getContext('2d');
function drawWaveform() {
    var width = canvasContainer.clientWidth;
    var height = canvasContainer.clientHeight;

    // reset the canvas
    waveformCtx.clearRect(0, 0, width, height);

    analyzer.getFloatTimeDomainData(samples);

    waveformCtx.lineWidth = 2;
    waveformCtx.strokeStyle = "blue";
    waveformCtx.beginPath();

    // move to the first sample
    var x = 0;
    var y = (height / 2) * (1 - samples[0]);
    waveformCtx.moveTo(x, y);

    // line to each subsequent sample
    var deltaX = width / bufferSize;
    for (let i = 1; i < bufferSize; i++) {
        x += deltaX;
        y = (height / 2) * (1 - samples[i]);
        waveformCtx.lineTo(x, y);
        if (samples[i] >= 1 || samples[i] <= -1) console.log(samples[i]);
    }

    // end on the midpoint
    waveformCtx.lineTo(width, height / 2);
    waveformCtx.stroke();

    drawHandle = requestAnimationFrame(drawWaveform);
}


audioEle.addEventListener('play', function () {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    drawHandle = drawWaveform();
});
audioEle.addEventListener('pause', function () {
    cancelAnimationFrame(drawHandle);
});
