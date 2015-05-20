/*

Labyrinthe 3D avec WebGL

Auteurs:
MALTI Mehdi
ZEMALI Medjahed Khalid El Walid

*/

var express = require("express");
var bodyP = require("body-parser");
var session = require("express-session");
var mysql = require("mysql");
var twig = require("twig");
var evt = require('events');
var availableUsers = [];
var games =  [];

var app = express();

app.use(bodyP.urlencoded({ extended: false }));
app.use("/", express.static(__dirname + "/client/static"));
app.use(session({
    secret: 'maze',
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

app.set("views", "client/templates");
app.set("view engine", "html");
app.engine("html", twig.__express);

var db = mysql.createConnection({
    host:       process.env.IP,
    user:       process.env.C9_USER.substr(0, 16),
    password:   "",
    database:   "project"
});

var emitter = new evt.EventEmitter();
emitter.setMaxListeners(100);

app.all("/userstream", function(req, res) {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });

    res.writeHead(200);

    emitter.on("userschanged",function(event){
        res.write("event: userschanged\n");
        res.write("data: ajax\n\n");
    });
});

app.all("/requeststream", function(req, res) {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });

    res.writeHead(200);

    emitter.on("request", function(from, to, map){
        if(req.session.username != from && req.session.username == to) {
            var json = {"from": from, "to": to, "map": map};
            res.write("event: request\n");
            res.write("data: "+JSON.stringify(json)+"\n\n");
        }
    });

    emitter.on("response", function(from, to, map, status){
        if(req.session.username != from && req.session.username == to) {
            var json = {"from": from, "to": to, "map": map, "status": status};
            res.write("event: response\n");
            res.write("data: "+JSON.stringify(json)+"\n\n");
        }
    });

    emitter.on("leave", function(player) {
        if(req.session.username === player) {
            res.write("event: leave\n");
            res.write("data: \n\n");
        }
    });

    emitter.on("ready", function(player) {
        if(req.session.username === player) {
            res.write("event: ready\n");
            res.write("data: \n\n");
        }
    });

    emitter.on("move", function(x, y, player) {
        if(req.session.username === player) {
            var json = {"x": x, "y": y};
            res.write("event: move\n");
            res.write("data: "+JSON.stringify(json)+"\n\n");
        }
    });
});


app.all("/", function(req, res) {
    if(req.session.username) {
        res.redirect("/profile");
    }
    else {
        res.redirect("/signin");
    }
});

app.all("/signup", function(req, res) {
    if(req.session.username) {
        res.render("renderer.html", {"error": "CONNECTED"});
        return;
    }

    var params = {};

    if(req.method != "POST") {
        params.error = null;
        return renderError(params);
    }

    params.username = req.body.username;
    params.name = req.body.name;

    if(!req.body.username || req.body.username == "" ||
    !req.body.password || req.body.password == "" ||
    !req.body.password_confirmation || req.body.password_confirmation == "" ||
    req.body.password != req.body.password_confirmation) {
        if(req.body.password != req.body.password_confirmation) {
            params.error = "The password confirmation and password must match.";
            params.empty_password = true;
            params.empty_password_confirmation = true;
            return renderError(params);
        }
        params.error = "There are empty fields that are required.<br>Please verify your informations to sign up";

        if(!req.body.username) {
            params.empty_username = true;
        }
        if(!req.body.password) {
            params.empty_password = true;
        }
        if(!req.body.password_confirmation) {
            params.empty_password_confirmation = true;
        }
        return renderError(params);
    }
    if(req.body.name == "") req.body.name = null;
    db.query("INSERT INTO users VALUES (?, MD5(?), ?)", [req.body.username, req.body.password, req.body.name],
        function(error, result) {
            if(error) {
                if(error.code == "ER_DUP_ENTRY") {
                    params.error = "The login already exists";
                    params.username = "";
                    params.empty_username = true;
                }
                else {
                    params.error = "An error occurred while executing the query<br>"+JSON.stringify(error, null, "<br>");
                }
                return renderError(params);
            }
            res.redirect("/signin");
            return;
        }
    );

    function renderError(params) {
        res.render("signup.html", params);
        return;
    }
});

app.all("/signin", function(req, res) {
    if(req.session.username) {
        res.redirect("/");
        return;
    }
    if(req.method != "POST") {
        return renderError(null);
    }

    if(!req.body.username || !req.body.password) {
        return renderError("All fields are required for the connection");
    }

    db.query("SELECT username, name FROM users WHERE username = ? AND password = MD5(?)", [req.body.username, req.body.password],
        function(error, result) {
            if(error) {
                return renderError("An error occurred while executing the query<br>"+JSON.stringify(error, null, "<br>"));
            }
            else if (result.length > 0) {
                req.session.username = result[0].username;
                if(result[0].name && result[0].name != "") {
                    req.session.name = result[0].name;
                }
                
                res.redirect("/");
                return;
            }
            else {
                return renderError("Invalid username/password combination");
            }
        }
    );

    function renderError(error) {
        res.render("signin.html", {"error": error});
        return;
    }
});

app.all("/signout", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    var index = availableUsers.indexOf(req.session.username);
    availableUsers.splice(index, 1);
    emitter.emit("userschanged");
    
    delete req.session.username;
    if(req.session.name) { 
        delete req.session.name;
    }
    res.redirect("/");
    return;
});

app.all("/profile", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    var index = availableUsers.indexOf(req.session.username);
    if(index == -1) {
        availableUsers.push(req.session.username);
    }
    emitter.emit("userschanged");

    res.render("profile.html", {user: req.session.username, name: req.session.name});
    return;
});

app.all("/create-maze", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    var index = availableUsers.indexOf(req.session.username);
    availableUsers.splice(index, 1);
    emitter.emit("userschanged");

    res.render("creator.html");
    return;
});

app.all("/save-maze", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    if(req.method != "POST") {
        res.redirect("/profile");
        return;
    }

    var index = availableUsers.indexOf(req.session.username);
    availableUsers.splice(index, 1);
    emitter.emit("userschanged");

    if(!req.body.mazename || !req.body.width || !req.body.height || !req.body.content) {
        res.render("renderer.html", {"error": "EMPTY_FIELDS"});
        return;
    }
    
    if(req.body.content.indexOf("s") == -1 || req.body.content.indexOf("x") == -1) {
        res.render("renderer.html", {"error": "EMPTY_CASE"});
        return;
    }

    db.query("INSERT INTO mazes VALUES(?, ?, ?, ?, ?)",
        [req.body.mazename, req.session.username, req.body.width, req.body.height, req.body.content],
        function(error, result) {
            if(error == "ER_DUP_ENTRY") {
                    res.render("renderer.html", {"error": "QUERY_ERROR", "which": "MAZE_NAME_ALREADY_EXISTS"});
                    return;
            }
            else if (error){
                res.render("renderer.html", {"error": "QUERY_ERROR"});
                return;
            }

            res.render("renderer.html", {"success": "MAZE_CREATED"});
            return;
        }
    );
});

app.all("/edit-maze", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    if(req.method != "POST") {
        res.redirect("/profile");
        return;
    }

    if(!req.body.mazename) {
        res.render("renderer.html", {"error": "EMPTY_FIELDS"});
        return;
    }


    if(req.body.content) {
        if(req.body.content.indexOf("s") == -1 || req.body.content.indexOf("x") == -1) {
            res.render("renderer.html", {"error": "EMPTY_CASE"});
            return;
        }

        db.query("UPDATE mazes SET content = ?, mazename = ? WHERE mazename = ? AND username = ?", [req.body.content, req.body.mazename, req.body.oldmazename, req.session.username],
            function(error, result) {
                if(error) {
                    res.render("renderer.html", {"error": "QUERY_ERROR"});
                    return;
                }
                res.render("renderer.html", {"success": "MAZE_UPDATED"});
                return;
            }
        );
    }
    else {
        var index = availableUsers.indexOf(req.session.username);
        availableUsers.splice(index, 1);
        emitter.emit("userschanged");

        db.query("SELECT mazename FROM mazes WHERE username = ? AND mazename = ?", [req.session.username, req.body.mazename],
            function(error, result) {
                if(error) {
                    res.render("renderer.html", {"error": "QUERY_ERROR"});
                    return;
                }
                else {
                    res.render("editor.html", {"mazename" : result[0].mazename});
                    return;
                }
            }
        );
    }
});

app.all("/remove-maze", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    if(req.method != "POST") {
        res.redirect("/profile");
        return;
    }
    var index = availableUsers.indexOf(req.session.username);
    availableUsers.splice(index, 1);
    emitter.emit("userschanged");

    if(!req.body.mazename) {
        res.render("renderer.html", {"error": "QUERY_ERROR"});
        return;
    }
    db.query("DELETE FROM mazes WHERE mazename = ? AND username = ?", [req.body.mazename, req.session.username],
        function(error, result) {
            if(error) {
                res.render("renderer.html", {"error": "QUERY_ERROR"});
                return;
            }
            res.render("renderer.html", {"success": "MAZE_REMOVED"});
            return;
        }
    );
});

app.all("/mazes", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    if(req.method != "POST") {
        res.redirect("/profile");
        return;
    }
    var query = "";
    var params = [];
    if(typeof(req.body.allUsers) === 'undefined') {
        query = " WHERE username = ?";
        params = [req.session.username];
    }
    if(req.body.mazename) {
        if(params.length != 0) {
            query += " AND ";
        }
        else {
            query = " WHERE ";
        }
        query += "mazename = ?";
        params.push(req.body.mazename);
    }
    db.query("SELECT mazename, width, height, content FROM mazes"+query, params,
        function(error, result) {
            if(error) {
                res.render("renderer.html", {"error": "QUERY_ERROR"});
                return;
            }
            res.json(result);
            return;
        }
    );
});

app.all("/users", function(req, res) {
    if(req.method != "POST") {
        res.redirect("/");
        return;
    }

    if(!req.body.username) {
        res.redirect("/");
        return;
    }

    db.query("SELECT COUNT(username) content FROM users where username = ?", [req.body.username],
        function(error, result) {
            if(error) {
                res.render("renderer.html", {"error": "QUERY_ERROR"});
                return;
            }
            res.json(result);
            return;
        }
    );
});

app.all("/solo", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    var index = availableUsers.indexOf(req.session.username);
    availableUsers.splice(index, 1);
    emitter.emit("userschanged");

    if(req.method != "POST") {
        res.redirect("/");
        return;
    }
    if(!req.body.mazename) {
        res.render("renderer.html", {"error" : "EMPTY_FIELDS"});
        return;
    }
    res.render("solo.html", {"mazename" : req.body.mazename});
    return;
});

app.all("/highscores", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    if(req.method != "POST") {
        res.redirect("/");
        return;
    }
    if(!req.body.mazename) {
        res.render("renderer.html", {"error" : "EMPTY_FIELDS"});
        return;
    }
    if(!req.body.time) {
        db.query("SELECT username, time FROM highscores WHERE mazename = ? ORDER BY time", [req.body.mazename], 
            function(error, result) {
                if(error) {
                    res.render("renderer.html", {"error": "QUERY_ERROR"});
                    return;
                }
                res.json(result);
                return;
            }
        );
    }
    else {
        db.query("INSERT INTO highscores VALUES (?, ?, ?)", [req.session.username, req.body.mazename, req.body.time], 
            function(error, result) {
                if(error) {
                    res.render("renderer.html", {"error": "QUERY_ERROR"});
                    return;
                }
                res.redirect("/");
                return;
            }
        );
    }
    return;
});

app.all("/challenge", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    if(req.method != "GET") {
        res.redirect("/");
        return;
    }
    if(!req.query.opponent && !req.query.map) {
        res.redirect("/");
        return;
    }
    if(!availableUsers.contains(req.query.opponent)) {
        res.render("renderer.html", {"error": "CONNECTION_FAILURE"});
        return;
    }
    emitter.emit("request", req.session.username, req.query.opponent, req.query.map);
    return;
});

app.all("/response", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    if(req.method != "GET") {
        res.redirect("/");
        return;
    }
    if(!availableUsers.contains(req.query.opponent)) {
        res.render("renderer.html", {"error": "CONNECTION_FAILURE"});
        return;
    }
    emitter.emit("response", req.session.username, req.query.opponent, req.query.map, req.query.status);
    games.push({"nameplayer1": req.query.opponent, "nameplayer2": req.session.username, "map": req.query.map});
    return;
});

app.all("/available-users", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    if(req.method != "GET") {
        res.redirect("/");
        return;
    }
    var tmp = [];

    for(var i = 0; i < availableUsers.length; i++) {
        if(availableUsers[i] != req.session.username) {
            tmp.push(availableUsers[i]);
        }
    }

    res.json(tmp);
    return;
});

app.all("/multiplayer", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    if(req.method != "POST") {
        res.redirect("/");
        return;
    }
    var index = availableUsers.indexOf(req.session.username);
    availableUsers.splice(index, 1);
    emitter.emit("userschanged");

    if(!req.body.player1 || !req.body.player2 || !req.body.map) {
        return;
    }

    res.render("multiplayer.html", {"mazename" : req.body.map});
    return;
});

app.all("/leave", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    
    if(req.method != "POST") {
        res.redirect("/");
        return;
    }
    for(var i = 0; i < games.length; i++) {
        var n1 = games[i].nameplayer1;
        var n2 = games[i].nameplayer2;

        if(req.session.username === n1) {
            games.splice(i, 1);
            emitter.emit("leave", n2);
            break;
        }
        if(req.session.username === n2) {
            games.splice(i, 1);
            emitter.emit("leave", n1);
            break;
        }
    }

    return;
});

app.all("/ready", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }
    
    if(req.method != "POST") {
        res.redirect("/");
        return;
    }

    for(var i = 0; i < games.length; i++) {
        var n1 = games[i].nameplayer1;
        var n2 = games[i].nameplayer2;

        if(req.session.username === n1) {
            games[i].player1IsReady = true;
            emitter.emit("ready", games[i].nameplayer2);
            break;
        }
        if(req.session.username === n2) {
            games[i].player2IsReady = true;
            emitter.emit("ready", games[i].nameplayer1);
            break;
        }
    }
    return;
});

app.all("/games", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    if(req.method !== "GET") {
        res.redirect("/");
        return;
    }

    var tmp = [];
    for(var i = 0; i < games.length; i++) {
        var obj = {};
        obj.nameplayer1 = games[i].nameplayer1; 
        obj.nameplayer2 = games[i].nameplayer2;
        obj.map = games[i].map;
        tmp.push(obj);
    }
    res.json(games);
    return;
});

app.all("/is-ready", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    if(req.method !== "POST") {
        res.redirect("/");
        return;
    }

    for(var i = 0; i < games.length; i++) {
        var n1 = games[i].nameplayer1;
        var n2 = games[i].nameplayer2;
        
        if(req.session.username === n1) {
            res.json(JSON.parse(games[i].player2IsReady));
            break;
        }
        if(req.session.username === n2) {
            res.json(JSON.parse(games[i].player1IsReady));
            break;
        }
    }
    return;
});

app.all("/move", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    if(req.method !== "POST") {
        res.redirect("/");
        return;
    }

    if(!req.body.x || !req.body.y) {
        return;
    }

    for(var i = 0; i < games.length; i++) {
        var n1 = games[i].nameplayer1;
        var n2 = games[i].nameplayer2;

        if(req.session.username === n1) {
            emitter.emit("move", req.body.x, req.body.y, n2);
            break;
        }
        if(req.session.username === n2) {
            emitter.emit("move", req.body.x, req.body.y, n1);
            break;
        }
    }
    return;
});

/*
app.all("/get-coordinates", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    if(req.method !== "POST") {
        res.redirect("/");
        return;
    }

    for(var i = 0; i < games.length; i++) {
        var n1 = games[i].nameplayer1;
        var n2 = games[i].nameplayer2;

        if(req.session.username === n1) {
            var coord = games[i].coordPlayer2;
            res.json(coord);
            break;
        }
        if(req.session.username === n2) {
            var coord = games[i].coordPlayer1;
            res.json(coord);
            break;
        }
    }
    return;
});
//*/

app.all("/is-available", function(req, res) {
    if(!req.session.username) {
        res.render("renderer.html", {"error": "NOT_CONNECTED"});
        return;
    }

    if(req.method !== "POST") {
        res.redirect("/");
        return;
    }

    for(var i = 0; i < games.length; i++) {
        var n1 = games[i].nameplayer1;
        var n2 = games[i].nameplayer2;

        if(req.session.username === n1) {
            var index = availableUsers.indexOf(n2);
            if(index != -1) {
                res.json(JSON.parse(true));
            }
            else {
                res.json(JSON.parse(false));
            }
            break;
        }
        if(req.session.username === n2) {
            var index = availableUsers.indexOf(n1);
            if(index != -1) {
                res.json(JSON.parse(true));
            }
            else {
                res.json(JSON.parse(false));
            }
            break;
        }
    }

    return;
});

app.all("/*", function(req, res) {
    res.render("renderer.html", {"error": "NOT_FOUND"});
    return;
});

app.listen(process.env.PORT, process.env.IP);

Array.prototype.contains = function(obj) {
    for(var i = 0; i < this.length; i++) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
};