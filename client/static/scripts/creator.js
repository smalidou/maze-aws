var load = document.getElementById("load");
var backButton = document.getElementById("back");
var saveButton = document.getElementById("save");
var error = document.getElementById("error");
var input = document.getElementById("mazename");
var rows, columns;
var form;

input.addEventListener("keyup", onValueChange, false);
load.addEventListener("click", onLoad, false);
backButton.addEventListener("click", function() {
    if(document.getElementsByTagName("TABLE").length > 0) {
        if(confirm("You haven't save the maze yet\nDo you want to go back ?")) {
            window.location.href = "/";
        }
    }
    else {
        window.location.href = "/";
    }
}, false);

saveButton.addEventListener("click", onSave, false);

function onLoad(e) {
    rows = parseInt(document.getElementById("rows").value, 10);
    columns = parseInt(document.getElementById("columns").value, 10);
    loadGrid(rows, columns, "");
}

function onSave() {
    var error = document.getElementById("error");

    if(error.style.display === "none") {
        var start = document.getElementsByClassName("start").length; 
        var exit = document.getElementsByClassName("exit").length;
        var mazename = document.getElementById("mazename").value.length;

        if(exit && start && mazename) {
            if(checkMaze()) {
                form = document.createElement("FORM");
                form.name = "form";
                form.method = "POST";
                form.action = "/save-maze";

                var mazename = document.createElement("INPUT");
                mazename.type = "hidden";
                mazename.value = document.getElementById("mazename").value;
                mazename.name = "mazename";

                var height = document.createElement("INPUT"); // row
                height.type = "hidden";
                height.value = rows;
                height.name = "height";

                var width = document.createElement("INPUT"); // col
                width.type = "hidden";
                width.value = columns;
                width.name = "width";

                var content = document.createElement("INPUT");
                content.type = "hidden";
                content.value = save();
                content.name = "content";

                form.appendChild(mazename);
                form.appendChild(width);
                form.appendChild(height);
                form.appendChild(content);

                document.body.appendChild(form);
                form.submit();
            }
            else {
                alert("Your maze is not valid.\nPlease verify that there is a path to the exit.");
            }
        }
        else if(!mazename) {
            alert("The name field is empty\nPlease give a name to your maze");
        }
        else {
            alert("The start or exit spot is messing\nPlease check your maze");
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
            if(td.className.replace("cell ", "") != "exit") {
                string += td.className.replace("cell ", "")[0];
            }
            else {
                string += "x";
            }
        }
    }

    return string;
}

function onValueChange(e) {
    if(e.target.value !== "") {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
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