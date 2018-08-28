const mongoose = require('mongoose');
const fs = require("fs");

const bbq = require("../assets/js/bbQueue.js");
const hubby = require("../assets/js/hubby.js");

const model = {};

["comment", "post", "user", "tag"].map(v => {
	model[v] = require("../models/" + v + ".js");
});

//-- Data transfer protocols. --//

hubby.post("upload", (req, res) => {
	let username = req.session.username;

	if (username) model.user.findOne({
		username
	}).then(user => {
		if (!user)
			return res.redirect("/");

		bbq(req, [
			"caption",
			"tag",
			"privacy",
			"image"
		], data => new model.post({
			owner: user._id,
			caption: data.caption,
			tag: data.tag
				.toLowerCase()
				.split(" ")
				.filter(v => v)
				.join(" "),
			reputation: 0,
			privacy: Number(data.privacy)
		}).save().then(post => {
			post.tag.split(" ").filter(v => v).map(text =>
				model.tag.findOne({text}).then(tag => {
					if (!tag)
						tag = new model.tag({text});

					tag.posts.push(post);
					tag.save();
				})
			);

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



//-- Edit post. --//

hubby.post("edit", (req, res) => {
	if (!req.session._id || req.session._id != req.body._id)
		return res.send("-1");

	model.user.findOne({_id: req.body._id}).then(user => {
		if (!user)
			return res.send("-1");

		let user_post = user.posts.find(v => v._id == req.body.post);

		if (!user_post)
			return res.send("-1");


		//-- Format tags. --//

			// Old
		let a = user_post.tag.split(" ").filter(v => v),
			// New
			b = req.body.tag.toLowerCase().split(" ").filter(v => v);

		req.body.tag = b.join(" ");


		//-- Setup user.post. --//

		user_post.caption = req.body.caption;
		user_post.tag = req.body.tag;

		user.save();


		//-- Setup post. --//

		model.post.findOne({_id: req.body.post}).then(post => {
			if (!post)
				return;

			post.caption = req.body.caption;
			post.tag = req.body.tag;

			post.save();
		});


		//-- Setup tag. --//

		a.map(v => {
			model.tag.findOne({text: v}).then(tag => {
				if (b.indexOf(v) != -1) {
					let tag_post = tag.posts.find(v =>
						v._id == req.body.post
					);

					if (!tag_post)
						return;

					tag_post.caption = req.body.caption;
					tag_post.tag = req.body.tag;
				} else
					tag.posts.find((v, i) => {
						if (v._id == req.body.post) {
							tag.posts.splice(i, 1);

							return 1;
						}
					});

				tag.save();
			});
		});

		b.map(v => {
			if (a.indexOf(v) == -1)
				model.tag.findOne({text: v}).then(tag => {
					if (!tag) new model.tag({
						text: v
					}).save().then(tag => {
						tag.posts.push(user_post);
						tag.save();
					}); else {
						tag.posts.push(user_post);
						tag.save();
					}
				});
		});


		//-- Send confirmation. --//

		res.send("1");
	});
});


//-- Delete post. --//

hubby.post("delete", (req, res) => {
	if (!req.session._id || req.session._id != req.body._id)
		return res.send("-1");

	model.user.findOne({_id: req.body._id}).then(user => {
		if (!user)
			return res.send("-1");

		let user_post = user.posts.find((v, i) => {
			if (v._id == req.body.post) {
				user.posts.splice(i, 1);
				user.save();

				return 1;
			}
		});

		if (!user_post)
			return res.send("-1");


		//-- Delete tags. --//

		user_post.tag.split(" ").filter(v => v).map(v => {
			model.tag.findOne({text: v}).then(tag => {
				if (!tag)
					return;

				tag.posts.find((v, i) => {
					if (v._id == req.body.post) {
						tag.posts.splice(i, 1);
						tag.save();

						return 1;
					}
				});
			});
		});


		//-- Delete post. --//

		try {
			model.post.deleteOne({_id: req.body.post}).then(_ => {});
		} catch(err) {
            console.log(err)
        }

		res.send("1");
	});
});

//-- Share post. --//

hubby.post("share", (req, res) => {
	dbz.abstract({
		user0: model.user.findOne({
			_id: req.session._id
		}),
		user1: model.user.findOne({
			username: req.body.username
		})
	}, docs => {
		if (!docs.user0 ||
			!docs.user1 ||
			docs.user1.shared.indexOf(req.body.post) != -1)
			return;

		let post = docs.user0.posts.find(v => v._id == req.body.post);

		if (post) {
			docs.user1.shared.push(req.body.post);
			docs.user1.save();
		}
	});
});


module.exports = hubby;