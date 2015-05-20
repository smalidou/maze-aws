var inputs = document.getElementsByTagName("INPUT");
for(var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("focus", function(e) {this.className = "";});
}

var error = document.getElementById("error");
var username = document.getElementById("username");
var password = document.getElementById("password");
var passwordConfirmation = document.getElementById("password_confirmation");
var form = document.getElementById("form");

form.addEventListener("submit", onSubmit);
passwordConfirmation.addEventListener("change", verify, false);
username.addEventListener("keyup", onValueChange, false);

function onValueChange(e) {
    if(e.target.value !== "") {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if(JSON.parse(xhr.responseText)[0].content) {
                error.innerHTML = "This name already exists";
            }
            else {
                error.innerHTML = "";
            }
        };
        xhr.open("POST", "/users");
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send("username="+e.target.value);
    }
    else {
        error.innerHTML = "";
    }
}

function verify(e) {
    if(password.value !== passwordConfirmation.value) {
        error.innerHTML = "Please verify your password confirmation";
    }
    else {
        error.innerHTML = "";
    }
}

function onSubmit(e) {
    if(error.innerHTML !== "" || username.value === "" || password.value === "" || passwordConfirmation === "") {
        e.preventDefault();
        alert("There is an error in your form\nPlease check all the fields");
        return false;
    }
}