const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyparser = require("body-parser");
const hbs = require("hbs");
const cookieparser = require("cookie-parser");
const mongoose = require("mongoose");
const busboy = require("connect-busboy");
const model = require("./assets/js/model.js");

// Setup mongoose.

mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost:27017/ForTheMemes", {
	useNewUrlParser: true
});


// Setup interface.

const app = express();
const urlencoder = bodyparser.urlencoded({
	extended: false
});

app.use(express.static(__dirname + "/public"));
app.use(cookieparser());
app.use(busboy());
app.set("view engine", "hbs");

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

app.post("/upload", urlencoder, (req, res) => {
	console.log("POST /upload")

	let username = req.session.username

	console.log({username})
	if (username) model.user.findOne({username}).then(doc => {
		console.log(doc)
		if (doc) {
			req.pipe(req.busboy);

			req.busboy.on("file", (fieldname, file, filename) => {
				console.log("Uploading: " + filename, file.path);

				new model.post({
					owner: doc._id,
					reputation: 0
				}).save().then(doc => {
					let fstream = fs.createWriteStream(
						__dirname + "/public/dat/img/" + doc._id
					);

					file.pipe(fstream);
					res.render("index.hbs", req.session);
				})
			});
		} else
			res.render("index.hbs", req.session);
	});
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