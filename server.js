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
const bbq = require("./assets/js/bbQueue.js");
const dbz = require("./assets/js/db-zeal.js");
const sheepstick = require("./assets/js/sheep-stick.js");
const hubby = require("./assets/js/hubby.js");

const sorts = ["now", "hot", "new", "sad", "old"];


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


//-- Setup filters. --//

function post(req, res, id) {
	res.render("post.hbs", {
		_id: id
	});
}


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

		let key = {
			_id: url[1],
			username: req.session.username
		};
		let render = _ => {
			res.render("post.hbs", key);
		};

		model.post.findOne({
			_id: url[1]
		}).then(doc => {
			if (doc) {
				if (doc.tag.length)
					key.tag = doc.tag = doc.tag.split(" ").map(
						v => "#" + v
					).join(" ");

				if (doc.owner == req.session._id ||
					doc.privacy != 2)
					render();
				else model.invite.findOne({
					post: url[1],
					user: req.session._id
				}).then(doc => {
					if (doc)
						render();
					else
						res.redirect("/");
				})
			} else
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

hubby.post("upload", (req, res) => {
	let username = req.session.username;

	if (username) model.user.findOne({username}).then(doc => {
		if (doc)
			bbq(req, [
				"caption",
				"tag",
				"privacy",
				"image"
			], data => new model.post({
				owner: doc._id,
				caption: data.caption,
				tag: data.tag,
				reputation: 0,
				privacy: Number(data.privacy)
			}).save().then(doc => {
				let fstream = fs.createWriteStream(
					__dirname + "/public/dat/img/" + doc._id
				);

				data.image.pipe(fstream);
				res.redirect("/");
			}));
		else
			res.redirect("/");
	});
});

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

	if (req.session._id == req.body.view)
		model.post.find({
			owner: req.session._id
		}).sort({
			_id: -1,
			reputation: -1
		}).skip(skip).limit(10).then(docs =>
			res.send(docs.length ? JSON.stringify(docs) : "-1")
		);
	else
		model.post.find({
			owner: req.body.view,
			privacy: {$ne: 1}
		}).sort({
			_id: -1,
			reputation: -1
		}).skip(skip).limit(10).then(docs => {
			if (docs.length)
				dbz(docs, doc => model.invite.findOne({
					post: doc._id,
					user: req.body._id
				}), (i, doc) => {
					if (doc || docs[i].privacy == 0)
						return docs[i];
				}, docs =>
					res.send(JSON.stringify(docs))
				);
			else
				res.send("-1");
		});
});

hubby.post("comment", (req, res) => {
	let skip = Number(req.body.skip);

	model.comment
	.find({parent: req.body.parent})
	.sort({reputation: -1, _id: -1})
	.skip(skip)
	.limit(10) // 10 should be enough.
	.then(docs => {
		if (!docs.length)
			return res.send("-1");

		let data = {
			// Users involved in the comment section.
			users: {},
			// There's definitely nothing left if it returned less.
			has_more: docs.length == 10
		};

		// Collect all comments and check if it has children.
		dbz(docs, doc => model.comment.findOne({
			parent: doc._id
		}), (i, doc) => {return {
			_id: docs[i]._id,
			parent: docs[i].parent,
			owner: docs[i].owner,
			text: docs[i].text,
			reputation: docs[i].reputation,
			has_children: doc ? true : false
		}}, docs => {
			data.comments = docs;

			// Collect all users involved with the collected comments.
			dbz(docs, doc => {
				if (!data.users[doc.owner])
					return model.user.findOne({
						_id: doc.owner
					});
			}, (i, doc) => {
				data.users[doc._id] = {
					nickname: doc.nickname,
					username: doc.username
				};
			}, _ => {
				/* There's exactly 10 documents returned. See if
				   there's more.
				*/
				if (data.has_more)
					model.comment
					.find({parent: req.body.parent})
					.skip(skip + 10)
					.limit(1)
					.then(doc => {
						if (!doc)
							data.has_more = false;

						res.send(JSON.stringify(data));
					})
				else
					res.send(JSON.stringify(data));
			})
		});
	});
});

// Used to make a 'comment' object. Not to be confused with '/comment'.
hubby.post("reply", (req, res) => {
	if (req.session._id) {
		new model.comment({
			parent: req.body.parent,
			owner: req.session._id,
			text: req.body.text
		}).save().then(doc =>
			doc &&
			res.send(JSON.stringify({
				comment: doc,
				user: {
					_id: req.session._id,
					nickname: req.session.nickname,
					username: req.session.username
				}
			}))
		);
	}
});

app.listen(3000, _ =>
	console.log("Listening @ localhost:3000")
);