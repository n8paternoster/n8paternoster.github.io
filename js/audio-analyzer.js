var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var source = audioCtx.createMediaElementSource(document.getElementById('audio-source'));
var analyzer = new AnalyserNode(audioCtx);
source.connect(analyzer);
analyzer.connect(audioCtx.destination);


var canvas = document.getElementById('audio-visualizer');
var canvasCtx = canvas.getContext('2d');
/* set the board canvas element size */
if (canvas) {
    let canvasRect = document.getElementById('canvas-container').getBoundingClientRect();
    canvas.style.width = canvasRect.width + "px";
    canvas.style.height = canvasRect.height + "px";
    var scale = window.devicePixelRatio;
    canvas.width = Math.floor(canvasRect.width * scale);
    canvas.height = Math.floor(canvasRect.height * scale);
    canvasCtx.scale(scale, scale);
    console.log("Canvas style height: ");
    console.log(canvas.style.height);
    console.log("Canvas height: ");
    console.log(canvas.height);
}

analyzer.fftSize = 2048;
var bufferSize = analyzer.frequencyBinCount;
var data = new Float32Array(bufferSize);


var drawHandle;
function draw() {
    var rect = document.getElementById('canvas-container').getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;

    canvasCtx.fillStyle = "rgb(230, 230, 230)";
    canvasCtx.fillRect(0, 0, width, height);

    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    var rect = document.getElementById('canvas-container').getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;

    analyzer.getFloatTimeDomainData(data);

    canvasCtx.beginPath();

    // move to the first sample
    var x = 0;
    var y = (height / 2) * (1 - data[0]);
    canvasCtx.moveTo(x, y);

    // line to each subsequent sample
    var deltaX = width / bufferSize;
    for (let i = 1; i < bufferSize; i++) {
        x += deltaX;
        y = (height / 2) * (1 - data[i]);
        canvasCtx.lineTo(x, y);
        if (data[i] >= 1 || data[i] <= -1) console.log(data[i]);
    }

    // end on the midpoint
    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();

    drawHandle = requestAnimationFrame(draw);
}

var audioEle = document.getElementById('audio-source');

audioEle.addEventListener('play', function () {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    drawHandle = draw();
});
audioEle.addEventListener('pause', function () {
    cancelAnimationFrame(drawHandle);
});
