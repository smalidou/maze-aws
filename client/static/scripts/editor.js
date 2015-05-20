var saveButton = document.getElementById("save");
var backButton = document.getElementById("back");
var error = document.getElementById("error");
var input = document.getElementById("mazename");
var rows, columns;
var form;
var width, height, content;

input.addEventListener("keyup", onValueChange, false);
saveButton.addEventListener("click", onSave, false);
backButton.addEventListener("click", function() {
        window.location.href = "/";
    }, false);

var xhr;
getMaze();

function getMaze() {
    xhr = new XMLHttpRequest();
    //xhr.responseType = "json";
    xhr.onload = function() {
        if(JSON.parse(xhr.responseText)) {
            var response = JSON.parse(xhr.responseText)[0];
            height = rows = response.height;
            width = columns = response.width;
            content = response.content;
            
            loadGrid(height, width, content);
        }
    };
    xhr.open("POST", "/mazes", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("mazename="+mazename);
}

function onSave() {
    var error = document.getElementById("error");
    
    if(error.style.display === "none") {
        var start = document.getElementsByClassName("start").length; 
        var exit = document.getElementsByClassName("exit").length;
        var mazenameDefined = document.getElementById("mazename").value.length;
    
        if(exit && start && mazenameDefined) {
            if(checkMaze()) {
                form = document.createElement("FORM");
                form.name = "form";
                form.method = "POST";
                form.action = "/edit-maze";
        
                var content = document.createElement("INPUT");
                content.type = "hidden";
                content.value = save();
                content.name = "content";
        
                var oldname = document.createElement("INPUT");
                oldname.type = "hidden";
                oldname.value = mazename;
                oldname.name = "oldmazename";
        
                var name = document.createElement("INPUT");
                name.type = "hidden";
                name.value = document.getElementById("mazename").value;
                name.name = "mazename";
        
                form.appendChild(oldname);
                form.appendChild(name);
                form.appendChild(content);
        
                document.body.appendChild(form);
                form.submit();
            }
            else {
                alert("Your maze is not valid.\nPlease verify that there is a path to the exit.");
            }
        }
        else if (!mazenameDefined) {
            alert("The name field is empty\nPlease give a name to your maze");
        }
        else {
            alert("The start or exit spot is missing\nPlease check your maze");
        }
    }
    else {
        alert("The name already exists\nPlease choose another one");
    }
}

function save() {
    var trs = document.getElementsByTagName("TR");
    var string = "";

    for (var i = 0; i < rows; i++) {
        for(var j = 0; j < columns; j++) {
            var td = trs[i].children[j];
            var char;
            if(td.className.replace("cell ", "") != "exit") {
                char = td.className.replace("cell ", "")[0];
            }
            else {
                char = "x";
            }
            string += char;
        }
    }

    return string;
}

function onValueChange(e) {
    if(e.target.value !== mazename && e.target.value !== "") {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            console.log(xhr.responseText);
            if(JSON.parse(xhr.responseText).length) {
                error.style.display = "inline-block";
            }
            else {
                if(error.style.display !== "none") {
                    error.style.display = "none";
                }
            }
        };
        xhr.open("POST", "/mazes");
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send("mazename="+e.target.value);
    }
    else {
        if(error.style.display !== "none") {
            error.style.display = "none";
        }
    }
}