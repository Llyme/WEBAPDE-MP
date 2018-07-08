const fs = require("fs");
const express = require("express");
const bodyparser = require("body-parser");
const database = require("./assets/js/database.js");


//-- Load --//

let accounts = database("dat/accounts.json");
let posts = database("dat/posts.json");


//-- Server --//

const app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

app.use(express.static(__dirname));

/**
 * Main page.
**/
app.get("/", (req, res) => {
	res.sendFile(__dirname + "\\index.html");
});

/**
 * Register protocol.
**/
app.post("/register", (req, res) => {
	let data = req.body;
	console.log(data)

	if (!accounts.find(data[0], v => v.username, 1).length) {
		console.log("PASS", "/register", data[0], data[1]);

		res.send(accounts.add({
			username: data[0],
			password: data[1]
		}).toString());
		accounts.save();

	} else {
		console.log("FAIL", "/register", data[0], data[1]);

		res.send("-1");
	}
});

/**
 * Login protocol.
**/
app.post("/login", (req, res) => {
	let data = req.body;
	let id = accounts.find(
		data[0].toLowerCase() + " " + data[1],
		v => (v.username.toLowerCase() + " " + v.password),
		1
	)[0];

	if (id != null) {
		console.log("PASS", "/login", data);

		res.send([id.toString(), accounts.get(id).username]);
	} else {
		console.log("FAIL", "/login", data);

		res.send("-1");
	}
});

app.listen(3000);