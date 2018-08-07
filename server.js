const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyparser = require("body-parser");
const hbs = require("hbs");
const cookieparser = require("cookie-parser");
const mongoose = require("mongoose");
const busboy = require("connect-busboy");

const bbq = require("./assets/js/bbQueue.js");
const dbz = require("./assets/js/db-zeal.js");
const sheepstick = require("./assets/js/sheep-stick.js");
const hubby = require("./assets/js/hubby.js");


//-- Constant indices. --//

const sorts = ["now", "hot", "new", "sad", "old"];


//-- Setup models. --//

const model = {};

["comment", "post", "user", "tag"].map(v => {
	model[v] = require("./models/" + v + ".js");
});


//-- Setup mongoose. --//

mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost:27017/ForTheMemes", {
	useNewUrlParser: true
});


//-- Setup interface. --//

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


//-- Pipelines. --//

app.use("*", urlencoder, hubby);

hubby.get(["", "now", "hot", "new", "sad", "old"], (req, res, url) => {
	req.session.sort = url[0] || "now";

	res.render("index.hbs", req.session);
})

/**
 * Capture everything in the `/post` route.
**/
hubby.get("post/!", (req, res, url) => {
	if (url[1].substr(0, 5) == "post-") {
		url[1] = url[1].substr(5);
		dbz.abstract({
			user: model.user.findOne({
				_id: req.session._id
			}),
			post: model.post.findOne({
				_id: url[1]
			})
		}, docs => {
			if (docs.post && docs.post.privacy != 2 ||
				docs.user && (
					req.session._id == docs.post.owner ||
					docs.user.shared.indexOf(url[1]) != -1
				)) {
				return res.render("post.hbs", {
					_id: req.session._id,
					post: url[1],
					username: req.session.username,
					owner: req.session._id == docs.post.owner
				});
			}

			res.redirect("/");
		});
	} else {
		url.shift();
		res.redirect("/" + url.join("/"));
	}
});

/**
 * Redirect all incoming post requests from `/post`.
**/
hubby.post("post/!", (req, res, url) => {
	url.shift();

	req.baseUrl = "/" + url.join("/");

	return hubby(req, res);
});

hubby.get("user/!", (req, res, url) => {
	if (url[1].substr(0, 5) == "user-")
		model.user.findOne({
			username: url[1].substr(5)
		}).then(doc => {
			if (doc) res.render("user.hbs", {
				view: doc._id,
				nickname: req.session.nickname,
				username: req.session.username
			}); else
				res.redirect("/");
		});
	else {
		url.shift();
		res.redirect("/" + url.join("/"));
	}
});

/**
 * Redirect all incoming post requests from `/user`.
**/
hubby.post("user/!", (req, res, url) => {
	url.shift();

	req.baseUrl = "/" + url.join("/");

	return hubby(req, res);
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
		password: req.body.pword
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
		password: req.body.pword
	}).then(doc => {
		if (doc) {
			req.session._id = doc._id;
			req.session.nickname = doc.nickname;
			req.session.username = req.body.uname;
		}

		res.redirect("/");
	});
});

hubby.get("logout", (req, res) => {
	req.session.destroy();
	res.redirect("/");
})


//-- Sorting Section. --//

function sort_key_gen(req) {
	let key = {
		$or: [
			{privacy: 0},
			{owner: req.session._id}
		]
	};

	if (req.body.tag && req.body.tag.length)
		key.$and = req.body.tag.split(" ").map(
			v => { return {tag: {$regex: v}}; }
		);

	return key;
}

// Sort by creation date (_id; ascending).
hubby.post("old", (req, res) => {
	let key = sort_key_gen(req);
	let skip = Number(req.body.skip);

	model.post.find(key).sort({
		_id: 1
	}).skip(skip).limit(10).then(docs => res.send(
		docs.length ? JSON.stringify(docs) : "-1"
	));
})

// Sort by creation date (_id).
hubby.post("new", (req, res) => {
	let key = sort_key_gen(req);
	let skip = Number(req.body.skip);

	model.post.find(key).sort({
		_id: -1
	}).skip(skip).limit(10).then(docs => res.send(
		docs.length ? JSON.stringify(docs) : "-1"
	));
})

// Sort by reputation (ascending).
hubby.post("sad", (req, res) => {
	let key = sort_key_gen(req);
	let skip = Number(req.body.skip);

	model.post.find(key).sort({
		reputation: 1,
		_id: -1
	}).skip(skip).limit(10).then(docs => res.send(
		docs.length ? JSON.stringify(docs) : "-1"
	));
})

// Sort by reputation.
hubby.post("hot", (req, res) => {
	let key = sort_key_gen(req);
	let skip = Number(req.body.skip);

	model.post.find(key).sort({
		reputation: -1,
		_id: -1
	}).skip(skip).limit(10).then(docs => res.send(
		docs.length ? JSON.stringify(docs) : "-1"
	));
})

// Sort by date (without time), then sort by reputation.
hubby.post("now", (req, res) => {
	let key = sort_key_gen(req);
	let skip = Number(req.body.skip);

	model.post.find(key).sort({
		_id: -1
	}).skip(skip).then(docs => {
		if (docs.length) {
			let d = 1000*60*60*24;
			let now = Math.floor(
				docs[0]._id.getTimestamp().getTime()/d
			)*d;
			let then = sheepstick(now+d);
			now = sheepstick(now);

			key._id = {$gte: now, $lt: then};

			model.post.find(key).sort({
				reputation: -1,
				_id: -1
			}).limit(10).then(docs => res.send(
				docs.length ? JSON.stringify(docs) : "-1"
			));
		} else
			res.send("-1");
	})
});

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

			res.send(user.b.posts.splice(
				user.b.posts.length - skip - 10,
				10
			));
		} else {
			user.b.posts = user.b.posts
				.filter(v => v.privacy == 0);

			if (skip >= user.b.posts.length)
				return res.send("-1");

			user.b.posts.sort((a, b) => a.reputation - b.reputation);

			res.send(user.b.posts.splice(
				user.b.posts.length - skip - 10,
				10
			));
		}
	});
});


//-- Comment retriever. --//

hubby.post("comment", (req, res) => {
	let skip = Number(req.body.skip);
	let parent = req.body.post ? "post" :
		req.body.comment ? "comment" :
		null;

	if (!parent)
		return;

	model[parent].findOne({
		_id: req.body[parent]
	}).then(parent => {
		if (parent && skip < parent.comments.length) {
			parent.comments.sort(
				(a, b) => a.reputation - b.reputation
			);

			let users = {};
			let comments = parent.comments.splice(
				parent.comments.length - skip - 10,
				10
			);
			let n = 1;
			let f = _ => (!n && res.send({
				users,
				comments,
				has_more: parent.comments.length >
					comments.length + skip
			}));

			comments.map(v => {
				// Obscure children.
				n++;

				model.comment.findOne({parent: v._id}).then(doc => {
					v.comments = doc != null;

					n--;
					f();
				});

				if (!users[v.owner]) {
					users[v.owner] = {};
					n++;

					model.user.findOne({_id: v.owner}).then(doc => {
						if (doc) {
							users[v.owner].nickname = doc.nickname;
							users[v.owner].username = doc.username;
						}

						n--;
						f();
					});
				}
			});

			n--;
			f();
		} else
			res.send("-1");
	});
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
			tag: data.tag,
			reputation: 0,
			privacy: Number(data.privacy)
		}).save().then(post => {
			/* Don't keep the user waiting. Redirect them
			   immediately while you save the file.
			*/
			res.redirect("/");

			let l = data.tag.split(" ");

			for (let i in l)
				if (l[i].length)
					model.tag.findOne({
						text: l[i]
					}).then(doc => {
						if (!doc)
							doc = new model.tag({
								text: l[i]
							});

						doc.posts.push(l[i]);
						doc.save();
					});

			user.posts.push(post);
			user.save();

			let fstream = fs.createWriteStream(
				__dirname + "/public/dat/img/" + post._id
			);

			data.image.pipe(fstream);
		}));
	});
});

// Used to make a 'comment' object. Not to be confused with '/comment'.
hubby.post("reply", (req, res) => {
	let parent = req.body.post ? "post" :
		req.body.comment ? "comment" :
		null;

	if (!parent)
		return;

	dbz.abstract({
		user: model.user.findOne({
			_id: req.session._id
		}),
		parent: model[parent].findOne({
			_id: req.body[parent]
		})
	}, docs => {
		if (!docs.user || !docs.parent)
			return;

		new model.comment({
			parent: req.body[parent],
			post: parent == "post" && req.body[parent] ||
				docs.parent.post,
			owner: req.session._id,
			text: req.body.text
		}).save().then(comment => {
			if (!comment)
				return;

			res.send({
				comment,
				user: {
					_id: req.session._id,
					nickname: req.session.nickname,
					username: req.session.username
				}
			});

			docs.parent.comments.push(comment);
			docs.parent.save();
		});
	});
});


//-- Miscellaneous. --//

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


//-- Melee initialization. --//

app.listen(3000, _ =>
	console.log("Listening @ localhost:3000")
);