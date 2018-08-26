const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyparser = require("body-parser");
const hbs = require("hbs");
const cookieparser = require("cookie-parser");
const mongoose = require("mongoose");
const busboy = require("connect-busboy");
const crypt = require("crypto");

const bbq = require("./assets/js/bbQueue.js");
const dbz = require("./assets/js/db-zeal.js");
const sheepstick = require("./assets/js/sheep-stick.js");
const hubby = require("./assets/js/hubby.js");
const sap = require("./assets/js/sort-a-potty.js");
const db = require("./assets/js/db.js"); // DB Config


//-- Constant indices. --//

const sorts = ["now", "hot", "new", "sad", "old"];

//-- Setup models. --//

const model = {};

["comment", "post", "user", "tag"].map(v => {
	model[v] = require("./models/" + v + ".js");
});


//-- Setup mongoose. --//

mongoose.Promise = global.Promise;

mongoose.connect(db.mongoURI, {
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

/**
 * Pages.
**/
hubby.get("*", (req, res, url) => {
	if (!url[0] || sorts.indexOf(url[0]) != -1) {
		//-- Home page. --//

		req.session.sort = url[0] || "now";

		res.render("index.hbs", req.session);

		// Return 1 to tell 'hubby' that we can handle it from here.
		return 1;
	} else {
		let prefix = url[0].substr(0, 5);

		if (prefix == "user-") {
			//-- User profile page. --//

			model.user.findOne({
				username: url[0].substr(5)
			}).then(doc => {
				if (doc) res.render("user.hbs", {
					view: doc._id,
					_id: req.session._id,
					nickname: req.session.nickname,
					username: req.session.username
				}); else
					// Nothing found. Go back to home page.
					res.redirect("/");
			});

			/* Return 1 to tell 'hubby' that we can handle it from
			   here.
			*/
			return 1;
		} else if (prefix == "post-") {
			//-- Post page. --//

			url[0] = url[0].substr(5);

			dbz.abstract({
				user: model.user.findOne({
					_id: req.session._id
				}),
				post: model.post.findOne({
					_id: url[0]
				})
			}, docs => {
				if (docs.post && docs.post.privacy != 2 ||
					docs.user && (
						req.session._id == docs.post.owner ||
						docs.user.shared.indexOf(url[0]) != -1
					)) {
					let tag = docs.post.tag
						.split(" ")
						.filter(v => v)
						.map(v => "#" + v)
						.join(" ") || null;
					let has_comments = docs.post.comments.length > 0;
					let _id = req.session._id;

					res.render("post.hbs", {
						post: url[0],
						owner: req.session._id == docs.post.owner,
						tag,
						// Used if the script needs to post request.
						has_comments,
						// If we should show the comment section.
						show: !!(tag || has_comments || _id),
						_id,
						username: req.session.username
					});
				} else
					res.redirect("/");
			});

			/* Return 1 to tell 'hubby' that we can handle it from
			   here.
			*/
			return 1;
		}
	}
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

hubby.get("logout", (req, res) => {
	req.session.destroy();
	res.redirect("/");
})


//-- Sorting Section. --//

hubby.post(["old", "new", "sad", "hot", "now"], (req, res, url) => {
	let query = {$or: [
		{privacy: 0},
		{owner: req.session._id}
	]};
	let skip = Number(req.body.skip);

	if (req.body.tag &&
		/\S/.test(req.body.tag)) {
		let posts = [];
		let debounce = {};
		let l = req.body.tag.toLowerCase().split(" ");
		let n = 1;
		let f = _ => {
			if (!n) {
				posts = posts.splice(skip, 10);

				res.send(posts.length ? posts : "-1");
			}
		};

		for (let x in l) if (l[x]) {
			n++;

			model.tag.findOne({
				text: l[x]
			}).then(doc => {
				if (doc) {
					for (let i = 0; i < doc.posts.length; i++) {
						let v = doc.posts[i];
						let pass = 1;

						if (!debounce[v._id]) {
							debounce[v._id] = 1;

							for (let y in l)
								if (v.tag.indexOf(l[y]) == -1) {
									pass = 0;

									break;
								}

							if (pass) sap.insert.binary(
								posts,
								doc.posts[i],
								v => v.reputation,
								true
							);
						}
					}
				}

				n--;
				f();
			});
		}

		n--;
		f();
	} else switch(url[0]) {
		case "old":
			// Sort by creation date (_id; ascending).
			model.post.find(query).sort({
				_id: 1
			}).skip(skip).limit(10).then(docs => res.send(
				docs.length ? docs : "-1"
			));

			break;

		case "new":
			// Sort by creation date (_id).
			model.post.find(query).sort({
				_id: -1
			}).skip(skip).limit(10).then(docs => res.send(
				docs.length ? docs : "-1"
			));

			break;

		case "sad":
			// Sort by reputation (ascending).
			model.post.find(query).sort({
				reputation: 1,
				_id: -1
			}).skip(skip).limit(10).then(docs => res.send(
				docs.length ? docs : "-1"
			));

			break;

		case "hot":
			// Sort by reputation.
			model.post.find(query).sort({
				reputation: -1,
				_id: -1
			}).skip(skip).limit(10).then(docs => res.send(
				docs.length ? docs : "-1"
			));

			break;

		default:
			// Sort by date (without time), then sort by reputation.
			model.post.find(query).sort({
				_id: -1
			}).skip(skip).then(docs => {
				if (docs.length) {
					let d = 1000*60*60*24;
					let now = Math.floor(
						docs[0]._id.getTimestamp().getTime()/d
					)*d;
					let then = sheepstick(now+d);
					now = sheepstick(now);

					query._id = {$gte: now, $lt: then};

					model.post.find(query).sort({
						reputation: -1,
						_id: -1
					}).limit(10).then(docs => res.send(
						docs.length ? docs : "-1"
					));
				} else
					res.send("-1");
			});
	}
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
			// Only sort the first layer.
			if (parent == "post")
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
			let l = data.tag.toLowerCase().split(" ");

			for (let i in l)
				if (l[i].length) {
					model.tag.findOne({
						text: l[i]
					}).then(doc => {
						if (!doc)
							doc = new model.tag({
								text: l[i]
							});

						doc.posts.push(post);
						doc.save();
					});
				}

			user.posts.push(post);
			user.save();

			let fstream = fs.createWriteStream(
				__dirname + "/public/dat/img/" + post._id
			);

			fstream.on("finish", _ => res.redirect("/"));

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

			// Update the parent's subdocuments.
			docs.parent.comments.push(comment);
			docs.parent.save();

			// Update the tags' subdocuments.
			// if (parent == "post") {
			// 	let l = docs.parent.tag.toLowerCase().split(" ");

			// 	for (let x in l) if (l[x]) {
			// 		model.tag.findOne({
			// 			text: l[x]
			// 		}).then(tag => {
			// 			for (let y in tag.posts)
			// 				if (tag.posts[y]._id == req.body[parent]) {
			// 					tag.posts[y].comments.push(comment);
			// 					tag.posts[y].comments.save();

			// 					break;
			// 				}
			// 		});
			// 	}
			// }

			res.send({
				comment,
				user: {
					_id: req.session._id,
					nickname: req.session.nickname,
					username: req.session.username
				}
			});
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

const port = process.env.PORT || 3000;
app.listen(port, _ =>
	console.log("Listening @ localhost:3000")
);