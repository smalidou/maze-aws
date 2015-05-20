var challenge;
var popup;
var userstream = new EventSource("/userstream");
var requeststream = new EventSource("/requeststream");


requeststream.addEventListener("request", function(response) {
    var xhr = new XMLHttpRequest();
    var select = document.getElementById("mazename");
    var result = JSON.parse(response.data);

    if(confirm("You received a request from "+result.from+"\nDo you want to play ?")){
        xhr.open("GET", "/response?opponent="+result.from+"&map="+select.value+"&status=accept", true);
        setTimeout(function() {
            var params = {"player1": result.from, "player2": result.to, "map": select.value};
            postTo("/multiplayer", params);
        }, 3000);
    }
    else {
        xhr.open("GET", "/response?opponent="+JSON.parse(response.data).from+"&map="+select.value+"&status=decline", true);
    }
    xhr.send();
});

userstream.addEventListener("userschanged", function(response) {
    getUsersList();
});

getUsersList();

getMazesList("allMazes", "/solo", "Solo", "allUsers");
getMazesList("myMazes", "/edit-maze", "Edit", "");

function getMazesList(containerID, formAction, submitValue, allUsers) {
    var xhr = new XMLHttpRequest();
    //xhr.responseType = "json";
    xhr.onload = function() {
        updateMazesList(JSON.parse(xhr.responseText), containerID, formAction, submitValue);
    };
    xhr.open("POST", "/mazes", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(allUsers);
}

function updateMazesList(mazes, containerID, formAction, submitValue) {
    var container = document.getElementById(containerID);
    container.innerHTML = "";

    if(mazes.length > 0) {
        var form = document.createElement("FORM");
        form.action = formAction;
        form.method = "POST";

        var select = document.createElement("SELECT");
        select.name = "mazename";
        select.id = "mazename";

        for(var i = 0; i < mazes.length; i++) {
            var option = document.createElement("OPTION");
            option.value = mazes[i].mazename;
            var text = document.createTextNode(mazes[i].mazename);
            option.appendChild(text);
            select.appendChild(option);
        }

        var submit = document.createElement("INPUT");
        submit.type = "submit";
        submit.value = submitValue;

        form.appendChild(select);
        form.appendChild(submit);
        container.appendChild(form);
        
        if(containerID == "myMazes") {
            
            var remove = document.createElement("INPUT");
            remove.type = "button";
            remove.value = "Remove";
            
            remove.addEventListener("click", function() {
                if(confirm("Do you really want to remove the maze '"+select.value+"'")) {
                    var removeform = document.createElement("FORM");
                    removeform.method = "POST";
                    removeform.action = "remove-maze";

                    var mazename = document.createElement("INPUT");
                    mazename.type = "hidden";
                    mazename.value = select.value;
                    mazename.name = "mazename";
    
                    removeform.appendChild(mazename);
                    document.body.appendChild(removeform);
                    removeform.submit();
                }
            });
            form.appendChild(remove);
        }
    }
    else {
        var text = document.createTextNode("There is no available maze.");
        container.appendChild(text);
    }
}

function getUsersList() {
    var xhr = new XMLHttpRequest();
    //xhr.responseType = "json";
    xhr.onload = function(e) {
        updateUsersList(JSON.parse(xhr.responseText));
    };
    xhr.open("GET", "/available-users");
    xhr.send();
}

function updateUsersList(users) {
    var availableUsers = document.getElementById("availableUsers");
    availableUsers.innerHTML = "";

    if(users.length > 0) {
        var select = document.createElement("SELECT");
        select.name = "opponent";
        select.id = "listUsers";

        for(var i = 0; i < users.length; i++) {
            var option = document.createElement("OPTION");
            option.value = users[i];
            var text = document.createTextNode(users[i]);
            option.appendChild(text);
            select.appendChild(option);
        }

        var submit = document.createElement("INPUT");
        submit.type = "button";
        submit.id = "challenge";
        submit.value = "Multi";
        submit.addEventListener("click", onChallenge, true);

        availableUsers.appendChild(select);
        availableUsers.appendChild(submit);
    }
}

function onChallenge(e) {
    var listUsers = document.getElementById("listUsers");
    if(popup) {
        document.body.removeChild(popup);
    }
    popup = document.createElement("DIV");
    popup.style.padding = "20px 50px";
    popup.style.background = "rgba(100, 100, 100, 0.8)";
    popup.style.color = "white";
    popup.style.borderRadius = "5px";
    popup.style.boxSizing = "border-box";
    popup.style.position = "fixed";
    popup.style.left = ((window.innerWidth / 2) - (300 / 2)) + "px";
    popup.style.top = ((window.innerHeight / 2) - (200 / 2)) + "px";

    var p = document.createElement("P");

    popup.appendChild(p);
    
    requeststream.addEventListener("response", function(response) {
        var result = JSON.parse(response.data);
        if(result.status == "accept") {
            p.innerHTML = "Request accepted. Redirection...";
            setTimeout(function(){
                var params = { "player1": result.to, "player2": result.from, "map": result.map };
                postTo("/multiplayer", params);
            }, 3000);
        }
        else if(result.status == "decline") {
            p.innerHTML = "Request declined";
            setTimeout(function(){
                document.body.removeChild(popup);
            }, 3000);
        }
    });

    var select = document.getElementById("mazename");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/challenge?opponent="+listUsers.value+"&map="+select.value, true);
    xhr.send();

    popup.style.display = "inline-block";

    var wait = document.createElement("IMG");
    wait.display = "block";
    wait.src = "/images/wait.gif";
    wait.height = "40";
    wait.margin = "auto";

    setTimeout(function(){
        p.innerHTML = "Time out";
        setTimeout(function(){
            document.body.removeChild(popup);
        }, 3000);
    }, 20000);

    popup.appendChild(wait);
    document.body.appendChild(popup);
}

function postTo(link, data) {
    var form = document.createElement("FORM");
    form.method = "POST";
    form.action = link;

    for(var param in data) {
        var input = document.createElement("INPUT");
        input.type = "hidden";
        input.name = param;
        input.value = data[param];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}