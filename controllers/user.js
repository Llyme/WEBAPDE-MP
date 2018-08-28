const mongoose = require('mongoose');
const crypt = require("crypto");

const dbz = require("../assets/js/db-zeal.js");
const hubby = require("../assets/js/hubby.js");

//-- Setup models. --//

const model = {};

["comment", "post", "user", "tag"].map(v => {
	model[v] = require("../models/" + v + ".js");
});

//-- User entry. --//

// Register protocol.
hubby.post("register", (req, res) => {
	let username = req.body.uname.toLowerCase();

	model.user.findOne({
		username
	}).then(doc => (!doc && new model.user({
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

	model.user.findOne({
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

// Logout protocol.
hubby.get("logout", (req, res) => {
	req.session.destroy();
	res.redirect("/");
})

hubby.post("user_view", (req, res) => {
	let skip = Number(req.body.skip);

	dbz.abstract({
		a: model.user.findOne({
			_id: req.session._id
		}),
		b: model.user.findOne({
			_id: req.body.view
		})
	}, user => {
		if (!user.b || skip >= user.b.posts.length)
			return res.send("-1");

		let fn = docs => {
			let ret = {
				posts: docs,
				users: {}
			}
			let n = 1;
			let fn = _ => !n && res.send(ret);

			docs.map((doc, i) => {
				if (ret.users[doc.owner])
					return;

				n++;

				model.user.findOne({_id: doc.owner}).then(user => {
					ret.users[doc.owner] = {
						_id: doc.owner,
						nickname: user.nickname,
						username: user.nickname
					};

					n--;
					fn();
				})
			});

			n--;
			fn();
		};

		if (user.a) {
			if (req.session._id != req.body.view) {
				user.b.posts = user.b.posts
					.filter(x =>
						x.privacy == 0 ||
						user.a.shared.find(y => x._id == y) != null
					);

				if (skip >= user.b.posts.length)
					return res.send("-1");
			}

			user.b.posts.sort(
				(a, b) => a.reputation - b.reputation
			);

			fn(user.b.posts.splice(
				user.b.posts.length - skip - 10,
				10
			));
		} else {
			user.b.posts = user.b.posts
				.filter(v => v.privacy == 0);

			if (skip >= user.b.posts.length)
				return res.send("-1");

			user.b.posts.sort((a, b) => a.reputation - b.reputation);

			fn(user.b.posts.splice(
				user.b.posts.length - skip - 10,
				10
			));
		}
	});
});

module.exports = hubby;