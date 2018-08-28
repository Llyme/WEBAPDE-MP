const mongoose = require('mongoose');
const fs = require("fs");
const hubby = require("../assets/js/hubby.js");

// load post schema
require('../models/post');
require('../models/user');
require('../models/tag');

const Post = mongoose.model('post');
const User = mongoose.model('user');
const Tag = mongoose.model('tag');

const bbq = require("../assets/js/bbQueue.js");

hubby.post("upload", (req, res) => {
	let username = req.session.username;

	if (username) User.findOne({
		username
	}).then(user => {
		if (!user)
			return res.redirect("/");

		bbq(req, [
			"caption",
			"tag",
			"privacy",
			"image"
		], data => new Post({
			owner: user._id,
			caption: data.caption,
			tag: data.tag,
			reputation: 0,
			privacy: Number(data.privacy)
		}).save().then(post => {
			let l = data.tag.toLowerCase().split(" ");

			for (let i in l)
				if (l[i].length) {
					Tag.findOne({
						text: l[i]
					}).then(doc => {
						if (!doc)
							doc = new Tag({
								text: l[i]
							});

						doc.posts.push(post);
						doc.save();
					});
				}

			user.posts.push(post);
			user.save();

			let fstream = fs.createWriteStream(
				__dirname + "/../public/dat/img/" + post._id
			);

			fstream.on("finish", _ => res.redirect("/"));

			data.image.pipe(fstream);
		}));
	});
});

module.exports = hubby;