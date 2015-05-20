var seconds = 3;
var timerText = document.getElementById('timerText');

var text = document.createTextNode(seconds + ' seconds');
timerText.appendChild(text);

window.onload = function() {
    setTimeout(function() {
        window.location = "/";
    }, seconds * 1000);
    var timer = setInterval(function() {
        if(seconds < 0) clearTimeout(timer);
        var s = (seconds > 1 ) ? 's' : '';
        var text = document.createTextNode(seconds + ' second' + s);
        timerText.innerHTML = "";
        timerText.appendChild(text);
        seconds--;
    }, 1000);
}