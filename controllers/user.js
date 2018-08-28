const mongoose = require('mongoose');
const crypt = require("crypto");

const hubby = require("../assets/js/hubby.js");

// load user schema
require('../models/user');
const model = mongoose.model('user');

// Register protocol.
hubby.post("register", (req, res) => {
	let username = req.body.uname.toLowerCase();

	model.findOne({
		username
	}).then(doc => (!doc && new model({
		nickname: req.body.uname,
		username,
		password: crypt.createHash("md5").update(req.body.pword).digest("hex")
	}).save().then(doc => {
		req.session._id = doc._id;
		req.session.nickname = req.body.uname;
		req.session.username = username;

		res.redirect("/");
	})) || res.redirect("/"));
});

// Login protocol.
hubby.post("login", (req, res) => {
	req.body.uname = req.body.uname.toLowerCase();

	model.findOne({
		username: req.body.uname,
		password: crypt.createHash("md5").update(req.body.pword).digest("hex")
	}).then(doc => {
		if (doc) {
			req.session._id = doc._id;
			req.session.nickname = doc.nickname;
			req.session.username = req.body.uname;
		}

		res.redirect("/");
	});
});

// Logout protocol
hubby.get("logout", (req, res) => {
	req.session.destroy();
	res.redirect("/");
})

module.exports = hubby;