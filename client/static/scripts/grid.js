var saveButton = document.getElementById("save");
var grid = document.getElementById("grid");
var types = document.getElementById("types");
var table;
var exitIsSet, startIsSet;
var rows, columns;
var mouseIsDown = false;
var layerIsActivated = false;
var currentType = "wall";
var previousType = "";

window.addEventListener("keyup", onKeyDown, false);

var cursor = document.createElement("DIV");
cursor.style.display = "none";
cursor.style.position = "fixed";
cursor.id = "layer";
document.body.appendChild(cursor);

function loadGrid(_rows, _columns, content) {
    rows = _rows;
    columns = _columns;

    document.getElementById("grid").innerHTML = "";
    if(content != "") {
        exitIsSet = true;
        startIsSet = true;
    }
    else {
        exitIsSet = false;
        startIsSet = false;
    }
    table = document.createElement("TABLE");
    var tableGrid = document.createElement("DIV");
    tableGrid.id = "tableGrid";
    tableGrid.appendChild(table);

    table.addEventListener("mousemove", onMouseMove, false);
    table.addEventListener("mousedown", onMouseDown, false);
    table.addEventListener("mouseup", onMouseUp, false);

    grid.appendChild(tableGrid);
    for(var i = 0; i < rows; i++) {
        var tr = document.createElement("TR");
        table.appendChild(tr);
        for(var j = 0; j < columns; j++) {
            var td = document.createElement("TD");
            td.className = "cell ";
            if(content != "") {
                var char = content[i * columns + j];
                switch (char) {
                    case 'e':
                        td.className += "empty";
                    break;
    
                    case 's':
                        td.className += "start";
                    break;
    
                    case 'w':
                        td.className += "wall";
                    break;
    
                    case 'x':
                        td.className += "exit";
                    break;

                    default:
                        td.className += "empty";
                    break;
                }
            }
            else {
                td.className += "empty";
            }
            td.addEventListener("click", onCellClick, false);
            tr.appendChild(td);
        }
    }


    types.style.display = "inline-block";
    saveButton.style.display = "inline-block";
}

function onCellClick(e) {
    if(document.getElementById("wall").checked) {
        if(e.target.classList.contains("start")) {
            startIsSet = false;
        }
        if(e.target.classList.contains("exit")) {
            exitIsSet = false;
        }
        e.target.className = "cell wall";
    }
    else if(document.getElementById("empty").checked) {
        if(e.target.classList.contains("start")) {
            startIsSet = false;
        }
        if(e.target.classList.contains("exit")) {
            exitIsSet = false;
        }
        e.target.className = "cell empty";
    }
    else if(document.getElementById("start").checked) {
        if(e.target.classList.contains("exit")) {
            exitIsSet = false;
        }
        if(startIsSet) {
            document.getElementsByClassName("start")[0].className = "cell empty";
        }
        startIsSet = true;
        e.target.className = "cell start";
    }
    else if(document.getElementById("exit").checked) {
        if(e.target.classList.contains("start")) {
            startIsSet = false;
        }
        if(exitIsSet) {
            document.getElementsByClassName("exit")[0].className = "cell empty";
        }
        exitIsSet = true;
        e.target.className = "cell exit";
    }
}

function onKeyDown(e) {
    if(e.target.tagName != "INPUT") {
        switch (e.keyCode) {
            case 88: // X
                layerIsActivated = true;
                cursor.className = "cross";
                currentType = "empty";
                cursor.style.display = "inline-block";
                document.getElementById("empty").checked = true;
            break;
            case 87: // W
                layerIsActivated = true;
                cursor.className = "wall";
                currentType = "wall";
                cursor.style.display = "inline-block";
                document.getElementById("wall").checked = true;
            break;
            case 83: // S
                layerIsActivated = true;
                cursor.className = "start";
                currentType = "start";
                cursor.style.display = "inline-block";
                document.getElementById("start").checked = true;
            break;
            case 81: // Q
                layerIsActivated = true;
                cursor.className = "exit";
                currentType = "exit";
                cursor.style.display = "inline-block";
                document.getElementById("exit").checked = true;
            break;
            case 27: // Escape
                layerIsActivated = false;
                cursor.className = "";
                cursor.style.display = "none";
            break;
        }
    }
}

function onMouseDown(e) {
    if(!mouseIsDown) {
        mouseIsDown = true;
    }
    if(e.which == 3 && !document.getElementById("empty").checked) { // Right button
        document.getElementById("empty").checked = true;

        previousType = currentType;
        cursor.className = "cross";
        currentType = "empty";

        if(!layerIsActivated) {
            cursor.style.display = "inline-block";
        }
        if(e.target.classList.contains("start")) {
            startIsSet = false;
        }
        if(e.target.classList.contains("exit")) {
            exitIsSet = false;
        }
        e.target.className = "cell empty";
    }
}

function onMouseUp(e) {
        var tmp = "";
    if(mouseIsDown) {
        mouseIsDown = false;
    }
    if(e.which == 3) { // Right button
        if(previousType != "cross" && previousType != "") {
            tmp = previousType;
        }
        else{
            tmp = "empty";
        }
        if (!layerIsActivated) {
            cursor.style.display = "none";
        }
        currentType = tmp;
        cursor.className = previousType;
        document.getElementById(tmp).checked = true;
    }
}

function onMouseMove(e) {
    cursor.style.left = e.clientX+"px";
    cursor.style.top = e.clientY+"px";
    if(mouseIsDown && e.target.tagName == "TD" && currentType != "exit" && currentType != "start") {
        if(document.getElementById("wall").checked) {
            if(e.target.classList.contains("start")) {
                startIsSet = false;
            }
            if(e.target.classList.contains("exit")) {
                exitIsSet = false;
            }
            e.target.className = "cell wall";
        }
        else if(document.getElementById("empty").checked) {
            if(e.target.classList.contains("start")) {
                startIsSet = false;
            }
            if(e.target.classList.contains("exit")) {
                exitIsSet = false;
            }
            e.target.className = "cell empty";
        }
        else if(document.getElementById("start").checked) {
            if(e.target.classList.contains("exit")) {
                exitIsSet = false;
            }
            if(startIsSet) {
                document.getElementsByClassName("start")[0].className = "cell empty";
            }
            startIsSet = true;
            e.target.className = "cell start";
        }
        else if(document.getElementById("exit").checked) {
            if(e.target.classList.contains("start")) {
                startIsSet = false;
            }
            if(exitIsSet) {
                document.getElementsByClassName("exit")[0].className = "cell empty";
            }
            exitIsSet = true;
            e.target.className = "cell exit";
        }
    }
}

function onRadioChange(radio) {
    if(layerIsActivated) {
        cursor.style.display = "inline-block";
        currentType = radio.value;

        if(radio.value != "empty") {
            cursor.className = radio.value;
        }
        else {
            cursor.className = "cross";
        }
    }
}

function checkMaze() {
	var openList = [];
	var closedList = [];
	var matrix = [];
	var start = {};
	var end = {};

	var current = {};

	for(var i = 0; i < rows; i++) {
	    matrix[i] = [];
        var trs = document.querySelectorAll("TR");
        for(var j = 0; j < columns; j++) {
            var tds = trs[i].querySelectorAll("TD");
            matrix[i][j] = tds[j].classList[1];
            if(tds[j].classList.contains("start")) {
                start = {"x": i, "y": j};
            }
            else if(tds[j].classList.contains("exit")) {
                end = {"x": i, "y": j};
            }
        }
	}

//*
    start.cout_g = 0;
    start.cout_h = 0;
    start.cout_f = 0;

    end.cout_g = 0;
    end.cout_h = 0;
    end.cout_f = 0;

	openList.push(start);
	
	do {
	    current = getMinFNodeInOpenList();

	    if(have(getNeighbors(end), current)){
	        return true;
	    }
        else {
            remove(openList, current);

            var neighbors = getNeighbors(current);

            for (var i = 0; i < neighbors.length; i++) {
    			var neighbor = neighbors[i];
    
    			if(have(closedList, neighbor)) {
    				continue;
    			}

    			if(have(openList, neighbor)) {
    				openList.push(neighbor);
    				neighbor.parent = current;
    				neighbor.cout_g = current.cout_g + 1;
    				neighbor.cout_h = getDistance(neighbor, end);
    				neighbor.cout_f = neighbor.cout_g + neighbor.cout_h;
    
    			} else {
    				var tmp_cout_g = current.cout_g + 1;
    				if (tmp_cout_g < current.cout_g) {
    					neighbor.parent = current;
    					neighbor.cout_g = tmp_cout_g;
    					neighbor.cout_h = getDistance(neighbor, end);
    					neighbor.cout_f = neighbor.cout_g + neighbor.cout_h;
    				}
    			}
    		}
        }
	    
	} while(openList.length);


    function getMinFNodeInOpenList() {
        if (openList.length) {
    		var min = openList[0];
    		for(var i = 1; i < openList.length; i++) {
    			var tmp = openList[i];
    
    			if(tmp.cout_f < min.cout_f) {
    				min = tmp;
    			}
    		}
    		return min;
    	}
    	else
    	    return null;
    }
	
	function getNeighbors(node) {
	    var tmp = [];

	    var minX = (node.x - 1 ) > 0 ? (node.x - 1) : 0;
	    var minY = (node.y - 1 ) > 0 ? (node.y - 1) : 0;

	    var maxX = (node.x + 1 ) < columns ? node.x + 1 : columns;
	    var maxY = (node.y + 1 ) < rows ? node.y + 1 : rows;

	    for(var i = minX; i <= maxX && i < columns; i++) {
	        for(var j = minY; j <= maxY && j < rows; j++) {
	            console.log(i+"-"+j);
	            if(i != node.x || j != node.y) {
	                console.log(matrix[i][j]);
	                if(matrix[i][j] != "wall") {
	                    var tmpNode = {};
                        tmpNode.cout_g = 0;
                        tmpNode.cout_h = 0;
                        tmpNode.cout_f = 0;
                        tmpNode.x = i;
                        tmpNode.y = j;
	                    tmp.push(tmpNode);
	                }
	            }
	        }
	    }
	    console.log(node);
	    console.log(tmp.length);
	    return tmp;
	}

	function have(list, node) {
	    for(var i = 0; i < list.length; i++) {
			if (list[i].x == node.x && list[i].y == node.y){
				return true;
			}
		}
		return false;
	}

	function getDistance(node1, node2) {
	    return parseInt(Math.sqrt(Math.pow((node1.x - node2.x), 2) + Math.pow((node1.y - node2.y), 2)), 10);
	}

	function remove(list, node) {
	    for(var i = 0; i < list.length; i++) {
	        if(list[i].x == node.x && list[i].y == node.y) {
	            list.splice(i, 1);
	        }
	    }
	}
//*/
    return false;
}