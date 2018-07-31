const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bodyparser = require("body-parser");
const hbs = require("hbs");
const cookieparser = require("cookie-parser");
const mongoose = require("mongoose");
const model = require("./assets/js/model.js");

console.log(model)

// Setup mongoose.

mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost:27017/ForTheMemes", {
	useNewUrlParser: true
});


// Setup interface.

const app = express();
app.set("view engine", "hbs");

const urlencoder = bodyparser.urlencoded({
	extended: false
});

app.use(express.static(__dirname));
app.use(cookieparser());

app.use(session({
	saveUninitialized: true,
	resave: true,
	secret: "The big brown fox jumps over the lazy dog.",
	name: "WEBAPDE 070518",
	cookie: {
		maxAge: 1000*60*60*24*7*3
	}
}));

// Main page.
app.get("/", (req, res) => {
	console.log("GET /");

	res.render("index.hbs", req.session);
});

// Register protocol.
app.post("/register", urlencoder, (req, res) => {
	console.log("POST /register");
	let username = req.body.uname.toLowerCase();

	model.user.findOne({
		username
	}).then(doc => (!doc && new model.user({
		nickname: req.body.uname,
		username,
		password: req.body.pword,
		reputation: 0
	}).save().then(_ => {
		req.session.nickname = req.body.uname;
		req.session.username = username;

		res.render("index.hbs", req.session);
	})) || res.render("index.hbs"));
});

// Login protocol.
app.post("/login", urlencoder, (req, res) => {
	console.log("POST /login");

	req.body.uname = req.body.uname.toLowerCase();

	model.user.findOne({
		username: req.body.uname,
		password: req.body.pword
	}).then(doc => {
		if (doc) {
			console.log("B", doc)
			console.log("A", doc.nickname)
			req.session.nickname = doc.nickname;
			req.session.username = req.body.uname;
		}

		res.render("index.hbs", req.session);
	});
});

app.get("/logout", (req, res) => {
	req.session.destroy();
	res.render("index.hbs");
})

app.listen(3000, _ =>
	console.log("Listening @ localhost:3000")
);