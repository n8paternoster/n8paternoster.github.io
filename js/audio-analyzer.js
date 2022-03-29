var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var source = audioCtx.createMediaElementSource(document.getElementById('audio-source'));
var analyzer = new AnalyserNode(audioCtx);
source.connect(analyzer);
analyzer.connect(audioCtx.destination);


var canvas = document.getElementById('audio-visualizer');
var canvasCtx = canvas.getContext('2d');

analyzer.fftSize = 2048;
var bufferSize = analyzer.frequencyBinCount;
var data = new Float32Array(bufferSize);

function draw() {
    requestAnimationFrame(draw);
    analyzer.getFloatTimeDomainData(data);

    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasCtx.beginPath();

    var sliceWidth = canvas.width * 1.0 / bufferSize;
    var x = 0;

    for (var i = 0; i < bufferSize; i++) {

        var v = data[i];
        var y = v * canvas.height / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

}

document.getElementById('audio-source').addEventListener('play', function () {
    console.log("clicked");
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    draw();
});
