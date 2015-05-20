var renderer, scene, camera;
var opponent, exit, start, ground, walls = [];
var right, up, at;
var rotation = 0;
var width, height;
var content;
var numberOfWalls = 0;
var checkCollision = false;
var id;
var secs;
var timer;
var timerInterval;


var directions = {};
directions.forward = false;
directions.backward = false;
directions.left = false;
directions.right = false;

var requeststream = new EventSource("/requeststream");


requeststream.addEventListener("leave", function(response) {
    loser();
});

wait();

var WALL = {
    size: 200
};


function getMaze() {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var response = JSON.parse(xhr.responseText)[0];

        if(response) {
            height = response.height;
            width = response.width;
            content = response.content;
            init();
            animate();
            }
        else {
            confirm("An error occurred while loading the maze.\nClic OK to go back.");
            window.location = "/";
        }
    };
    xhr.open("POST", "/mazes", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("mazename="+mazename+"&allUsers");
}

function init() {
    secs = 0;
    timerInterval = setInterval(chrono, 1000);

    timer = document.createElement("DIV");
    document.body.appendChild(timer);
    timer.id = "timer";

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.getElementById('container').appendChild(renderer.domElement);

    right = new THREE.Vector3();
    up = new THREE.Vector3();
    at = new THREE.Vector3();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);

    scene = new THREE.Scene();
    scene.add(camera);

    var wallGeometry = new THREE.BoxGeometry(WALL.size, WALL.size, WALL.size);
    var wallTexture = new THREE.ImageUtils.loadTexture("/textures/wall.jpg");
    var wallMaterial = new THREE.MeshBasicMaterial({
        map: wallTexture,
        overdraw: 0.5
    });
    
    var opponentGeometry = new THREE.SphereGeometry(25, 25, 25);
    var opponentTexture = new THREE.MeshBasicMaterial({
       color: 0x0000ff,
       opacity: 0.5
    });
    opponent = new THREE.Mesh(opponentGeometry, opponentTexture);

    var startGeometry = new THREE.BoxGeometry(WALL.size, 10, WALL.size);
    var startMaterial = new THREE.MeshBasicMaterial({
        color: 0x00FF00,
        overdraw: 0.5
    });
    start = new THREE.Mesh(startGeometry, startMaterial);

    var exitGeometry = new THREE.BoxGeometry(WALL.size, WALL.size, WALL.size);
    var exitTexture = new THREE.ImageUtils.loadTexture("/textures/exit.jpg");
    var exitMaterial = new THREE.MeshBasicMaterial({
        map: exitTexture,
        overdraw: 0.5
    });
    exit = new THREE.Mesh(exitGeometry, exitMaterial);

    var groundGeometry = new THREE.BoxGeometry((width * WALL.size) + (2 * WALL.size), 10, (height * WALL.size) + (2 * WALL.size));
    var groundTexture = new THREE.ImageUtils.loadTexture("/textures/ground.jpg");
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    var groundMaterial = new THREE.MeshBasicMaterial({
        map: groundTexture,
        overdraw: 0.5
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);

    var x = (WALL.size * width / 2) + (WALL.size / 2);
    var y = -WALL.size / 2;
    var z = WALL.size * height / 2 + (WALL.size / 2);

    ground.position.set(x, y, z);
    
    for(var i = 0; i < width + 2; i++) {
        for(var j = 0; j < height + 2; j++) {
            if(i == 0 || j == 0 || i == width + 1 || j == height + 1) {
                var px = i * WALL.size;
                var pz = j * WALL.size;
                walls[numberOfWalls] = new THREE.Mesh(wallGeometry, wallMaterial);
                walls[numberOfWalls].position.set(px, 0, pz);
                numberOfWalls++;
            }
        }
    }

    for(var i = 0; i < width * height; i++) {
        var px = WALL.size * (i % width) + WALL.size;
        var pz = WALL.size * Math.floor(i / width) + WALL.size;
        switch (content[i]) {
            case 'w':
                walls[numberOfWalls] = new THREE.Mesh(wallGeometry, wallMaterial);
                walls[numberOfWalls].position.set(px, 0, pz);
                numberOfWalls++;
            break;
            case 's':
                start.position.set(px, (-WALL.size / 2)+5, pz);
                camera.position.set(px, 0, pz);
            break;
            case 'x':
                exit.position.set(px, 0, pz);
            break;
        }
    }

    scene.add(ground);
    scene.add(start);
    scene.add(exit);
    scene.add(opponent);

    for(var i = 0; i < numberOfWalls; i++) {
        scene.add(walls[i]);
    }

    window.addEventListener("keydown", onKeyDown, false);
    window.addEventListener("keyup", onKeyUp, false);
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("resize", onWindowResize, false);

    requeststream.addEventListener("move", function(response) {
        var result = JSON.parse(response.data);
        var x = parseInt(result.x, 10);
        var y = parseInt(result.y, 10);
        opponent.position.set(x, -50, y);
        if(opponent.position.distanceTo(exit.position) < 141) {
            lose();
        }
        console.log("Yay! got it");
        
    });

    //setInterval("getCoordinates()", 2000);

    setInterval("postMove()", 1000);
    
    setInterval("isAvailable()", 5000);
}

function animate() {
    id = requestAnimationFrame(animate);
    camera.rotation.y += rotation;
    camera.matrix.extractBasis(right,up,at);
    
    var canForward = true;
    var canBackward = true;
    var canLeft = true;
    var canRight = true;

    var tmpCamera = new THREE.Vector3();
    var tmpAt = new THREE.Vector3();
    var tmpRight = new THREE.Vector3();


    if(checkCollision) {
        for(var i = 0; i < numberOfWalls; i++) {
            tmpCamera.copy(camera.position);
            tmpAt.copy(at);
            if(tmpCamera.add(tmpAt.multiplyScalar(-5)).distanceTo(walls[i].position) < 141) {
                canForward = false;
            }
            tmpCamera.copy(camera.position);
            tmpAt.copy(at);
            if(tmpCamera.add(tmpAt.multiplyScalar(5)).distanceTo(walls[i].position) < 141) {
                canBackward = false;
            }
            tmpCamera.copy(camera.position);
            tmpRight.copy(right);
            if(tmpCamera.add(tmpRight.multiplyScalar(-5)).distanceTo(walls[i].position) < 141) {
                canLeft = false;
            }
            tmpCamera.copy(camera.position);
            tmpRight.copy(right);
            if(tmpCamera.add(tmpRight.multiplyScalar(5)).distanceTo(walls[i].position) < 141) {
                canRight = false;
            }
        }
    }

    if(directions.forward && canForward) {
        camera.position.add(at.multiplyScalar(-5));
        camera.matrix.extractBasis(right,up,at);
    }
    if(directions.backward && canBackward) {
	    camera.position.add(at.multiplyScalar(5));
        camera.matrix.extractBasis(right,up,at);
    }
    if(directions.left && canLeft) {
	    camera.position.add(right.multiplyScalar(-5));
        camera.matrix.extractBasis(right,up,at);
    }
    if(directions.right && canRight) {
        camera.position.add(right.multiplyScalar(5));
        camera.matrix.extractBasis(right,up,at);
    }
    if(camera.position.distanceTo(exit.position) < 141) {
        stopAnimation();
        win();
    }
    renderer.render(scene, camera);
}

function onKeyDown(e) {
    switch(e.keyCode) {
		case 37: // Left
		case 81: // Q
            directions.left = true;
            checkCollision = true;
        break;

        case 38: // Up
		case 90: // Z
            directions.forward = true;
            checkCollision = true;
		break;

		case 39: // Right
		case 68: // D
            directions.right = true;
            checkCollision = true;
        break;

		case 40: // Down
		case 83: // S
            directions.backward = true;
            checkCollision = true;
		break;
    }
}

function onKeyUp(e) {
    switch(e.keyCode) {
		case 37: // Left
		case 81: // Q
            directions.left = false;
        break;

        case 38: // Up
		case 90: // Z
            directions.forward = false;
		break;

		case 39: // Right
		case 68: // D
            directions.right = false;
        break;

		case 40: // Down
		case 83: // S
            directions.backward = false;
		break;

		case 27: // Escape
            if(confirm("Do you really want to quit ?")) {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "/leave");
                xhr.send();
                stopAnimation();
                window.location = "/";
            }
		break;
    }
    checkCollision = false;
    for(var direction in directions) {
        if(direction) {
            checkCollision = true;
        }
    }
}

function onMouseMove(event) {
    var box = {};
    box.minX = Math.abs(window.innerWidth - 200) / 2;
    box.maxX = box.minX + 200;
    
    if(event.clientX < box.minX) {
        rotation = Math.min(0.1, 0.0001 * (box.minX - event.clientX));
    }
    else if(event.clientX > box.maxX) {
        rotation = Math.max(-0.1, -0.0001 * (event.clientX - box.maxX));
    }
    else {
        rotation = 0;
    }
}

function onWindowResize(e){
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}

function stopAnimation() {
    cancelAnimationFrame(id);
    clearInterval(timerInterval);
}

function win() {
    var bravo = document.createElement("H1");
    bravo.id = "highscore";
    var text = document.createTextNode("Bravo ! You won the challenge :D");
    bravo.appendChild(text);

    var overlay = document.createElement("DIV");
    overlay.id = "overlay";
    overlay.style.width = window.innerWidth+"px";
    overlay.style.height = window.innerHeight+"px";
    
    overlay.appendChild(document.createElement("DIV"));

    document.body.appendChild(overlay);

    var div = document.createElement("DIV");
    div.id = "popup";

    div.style.left = ((window.innerWidth / 2) - (600 / 2)) + "px";
    div.style.top = ((window.innerHeight / 2) - (400 / 2)) + "px";

    div.appendChild(bravo);

    var quit = document.createElement("INPUT");
    quit.type = "button";
    quit.value = "Quit";
    
    quit.addEventListener("click", function() {
        window.location = "/";
    });

    div.appendChild(quit);

    document.body.appendChild(div);

    
}

function lose() {
    var lost = document.createElement("H1");
    lost.id = "highscore";
    var text = document.createTextNode("You lost the challenge :(");
    lost.appendChild(text);

    var overlay = document.createElement("DIV");
    overlay.id = "overlay";
    overlay.style.width = window.innerWidth+"px";
    overlay.style.height = window.innerHeight+"px";
    
    overlay.appendChild(document.createElement("DIV"));

    document.body.appendChild(overlay);

    var div = document.createElement("DIV");
    div.id = "popup";

    div.style.left = ((window.innerWidth / 2) - (600 / 2)) + "px";
    div.style.top = ((window.innerHeight / 2) - (400 / 2)) + "px";

    div.appendChild(lost);

    var quit = document.createElement("INPUT");
    quit.type = "button";
    quit.value = "Quit";
    
    quit.addEventListener("click", function() {
        window.location = "/";
    });

    div.appendChild(quit);

    document.body.appendChild(div);
}

function chrono(){
    secs++;
    var seconds = secs % 60;
    var minutes = Math.floor(secs / 60 ) % 60;
    var hours = Math.floor(Math.floor(secs / 60 ) / 60);

    seconds = (seconds < 10) ? "0"+seconds : seconds;
    minutes = (minutes < 10) ? "0"+minutes : minutes;
    hours = (hours < 10) ? "0"+hours : hours;

    var text = document.createTextNode(hours+":"+minutes+":"+seconds);
    timer.innerHTML = "";
    timer.appendChild(text);
}

function wait() {
    var popup = document.createElement("DIV");
    popup.style.padding = "20px 50px";
    popup.style.background = "rgba(100, 100, 200, 0.3)";
    popup.style.borderRadius = "5px";
    popup.style.boxSizing = "border-box";
    popup.style.position = "fixed";
    popup.style.left = ((window.innerWidth / 2) - (300 / 2)) + "px";
    popup.style.top = ((window.innerHeight / 2) - (200 / 2)) + "px";
    popup.style.color = "white";
    
    var p = document.createElement("P");
    p.innerHTML = "Waiting your opponent...";

    popup.appendChild(p);

    document.body.appendChild(popup);

    var timeoutTimer = setTimeout(function(){
        p.innerHTML = "Time out. Redirection...";
        setTimeout(function() {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/leave");
            xhr.send();
            stopAnimation();
            window.location = "/";
        }, 3000);
    }, 20000);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/ready");
    xhr.send();

    requeststream.addEventListener("ready", function(response) {
        if(popup) {
            document.body.removeChild(popup);
        }
        clearTimeout(timeoutTimer);
        clearInterval(readyTimer);
        getMaze();
        return;
    });

    var readyTimer = setInterval(function(){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/is-ready");
        xhr.onload = function() {
            if(JSON.parse(xhr.responseText)) {
                if(popup) {
                    document.body.removeChild(popup);
                }
                clearTimeout(timeoutTimer);
                clearInterval(readyTimer);
                getMaze();
                return;
            }
        };
        xhr.send();
    }, 1000);

    return;
}

function loser() {
    stopAnimation();

    var popup = document.createElement("DIV");
    popup.style.padding = "20px 50px";
    popup.style.background = "rgba(100, 100, 100, 0.8)";
    popup.style.borderRadius = "5px";
    popup.style.boxSizing = "border-box";
    popup.style.position = "fixed";
    popup.style.left = ((window.innerWidth / 2) - (300 / 2)) + "px";
    popup.style.top = ((window.innerHeight / 2) - (200 / 2)) + "px";
    popup.style.color = "white";
    
    var p = document.createElement("P");
    p.innerHTML = "Your opponent is a looser :p Redirection...";

    popup.appendChild(p);

    setTimeout(function(){
        window.location = "/";
    }, 3000);

    document.body.appendChild(popup);
}

function isAvailable() {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        console.log(xhr.responseText);
        if(JSON.parse(xhr.responseText)) {
            loser();
        }
    }
    xhr.open("POST", "/is-available");
    xhr.send();
}

function postMove() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/move");
    xhr.onload = function() {
        console.log("postMove");
    };
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("x="+camera.position.x+"&y="+camera.position.z);
}

function getCoordinates() {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        console.log(JSON.parse(xhr.responseText));
        var result = JSON.parse(xhr.responseText);
        var x = parseInt(result.x, 10);
        var y = parseInt(result.y, 10);
        opponent.position.set(x, -50, y);
        if(opponent.position.distanceTo(exit.position) < 141) {
            lose();
        }
    };
    xhr.open("POST", "/get-coordinates");
    xhr.send();
}