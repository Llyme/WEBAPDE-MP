const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bodyparser = require("body-parser");
const hbs = require("hbs");
const database = require("./assets/js/database.js");
const app = express();


//-- Load --//

let accounts = database("dat/accounts.json");
let posts = database("dat/posts.json");


//-- Server --//

let urlencoder = app.use(session({
	name: "Lulgag",
	secret: "OmegaLul PogChamp Kappa",
	resave: true,
	saveUninitialized: true,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 7 * 3 // 3 weeks.
	}
}));

app.set("view engine", "hbs");
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: false}));

/**
 * Main page.
**/
app.get("/", (req, res) => {
	if (req.session.username)
		res.render("login", {
			userid: req.session.userid,
			username: req.session.username
		});
	else
		res.sendFile(__dirname + "\\index.html");
});

/**
 * Register protocol.
**/
app.post("/register", (req, res) => {
	let data = req.body;

	if (!accounts.find(data[0], v => v.username, 1).length) {
		console.log("PASS", "/register", data[0], data[1]);

		let userid = accounts.add({
			username: data[0],
			password: data[1]
		});

		req.session.userid = userid;
		req.session.username = data[0];

		accounts.save();

		res.send();
	} else
		console.log("FAIL", "/register", data[0], data[1]);
});

/**
 * Login protocol.
**/
app.post("/login", (req, res) => {
	let data = req.body;
	let userid = accounts.find(
		data[0].toLowerCase() + " " + data[1],
		v => (v.username.toLowerCase() + " " + v.password),
		1
	)[0];

	if (userid != null) {
		console.log("PASS", "/login", data);

		let username = accounts.get(userid).username;

		req.session.userid = userid;
		req.session.username = username;

		res.send();
	} else
		console.log("FAIL", "/login", data);
});

app.post("/logout", (req, res) => {
	req.session.destroy();
	res.send();
})

app.use(express.static(__dirname));

app.listen(3000, _ =>
	console.log("Listening @ localhost:3000")
);