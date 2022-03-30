var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var source = audioCtx.createMediaElementSource(document.getElementById('audio-source'));
var analyzer = new AnalyserNode(audioCtx);
source.connect(analyzer);
analyzer.connect(audioCtx.destination);


var canvas = document.getElementById('audio-visualizer');
var canvasCtx = canvas.getContext('2d');
/* set the board canvas element size */
if (canvas) {
    let canvasRect = canvas.getBoundingClientRect();
    canvas.style.width = canvasRect.width + "px";
    canvas.style.height = canvasRect.height + "px";
    var scale = window.devicePixelRatio;
    canvas.width = Math.floor(canvasRect.width * scale);
    canvas.height = Math.floor(canvasRect.height * scale);
    canvasCtx.scale(scale, scale);
}

analyzer.fftSize = 2048;
var bufferSize = analyzer.frequencyBinCount;
var data = new Float32Array(bufferSize);


var drawHandle;
function draw() {
    analyzer.getFloatTimeDomainData(data);

    canvasCtx.fillStyle = "rgb(230, 230, 230)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasCtx.beginPath();

    // move to the first sample
    var x = 0;
    var y = (canvas.height / 2) * (1 - data[0]);
    canvasCtx.moveTo(x, y);

    // line to each subsequent sample
    var deltaX = canvas.width / bufferSize;
    for (let i = 1; i < bufferSize; i++) {
        x += deltaX;
        y = (canvas.height / 2) * (1 - data[i]);
        canvasCtx.lineTo(x, y);
        if (data[i] >= 1 || data[i] <= -1) console.log(data[i]);
    }

    // end on the midpoint
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
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
