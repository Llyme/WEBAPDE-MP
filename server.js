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
				if (!(docs.post && docs.post.privacy != 2 ||
					docs.user && (
						req.session._id == docs.post.owner ||
						docs.user.shared.indexOf(url[0]) != -1
					)))
					return res.redirect("/");

				let tag = docs.post.tag
					.split(" ")
					.filter(v => v)
					.map(v => "#" + v)
					.join(" ") || null;
				let has_comments = docs.post.comments.length > 0;
				let _id = req.session._id;

				model.user.findOne({
					_id: docs.post.owner
				}).then(owner =>
					res.render("post.hbs", {
						post: url[0],
						is_owner: _id == owner._id,
						owner_nickname: owner.nickname,
						owner_username: owner.username,
						caption: docs.post.caption,
						tag,
						// Used if the script needs to post request.
						has_comments,
						// If we should show the comment section.
						show: !!(tag || has_comments || _id),
						_id,
						username: req.session.username
					})
				);
			});

			/* Return 1 to tell 'hubby' that we can handle it from
			   here.
			*/
			return 1;
		}
	}
});


//-- User entry. --//
app.use(require("./controllers/user.js"));

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
		let fn = _ => {
			if (!n) {
				posts = posts.splice(skip, 10);

				if (!posts.length)
					return res.send("-1");

				let ret = {
					posts,
					users: {}
				}
				let n = 1;
				let fn = _ => !n && res.send(ret);

				posts.map((doc, i) => {
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
				fn();
			});
		}

		n--;
		fn();
	} else {
		let fn = docs => {
			if (docs && docs.length) {
				let ret = {
					posts: docs,
					users: {}
				};
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
			} else
				res.send("-1");
		};

		if (url[0] == "old") {
			// Sort by creation date (_id; ascending).
			model.post.find(query).sort({
				_id: 1
			}).skip(skip).limit(10).then(fn);
		} else if (url[0] == "new") {
			// Sort by creation date (_id).
			model.post.find(query).sort({
				_id: -1
			}).skip(skip).limit(10).then(fn);
		} else if (url[0] == "sad") {
			// Sort by reputation (ascending).
			model.post.find(query).sort({
				reputation: 1,
				_id: -1
			}).skip(skip).limit(10).then(fn);
		} else if (url[0] == "hot") {
			// Sort by reputation.
			model.post.find(query).sort({
				reputation: -1,
				_id: -1
			}).skip(skip).limit(10).then(fn);
		} else {
			// Sort by date (except time), then sort by reputation.
			model.post.find(query).sort({
				_id: -1
			}).skip(skip).then(docs => {
				if (!docs.length)
					return;

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
				}).limit(10).then(fn);
			});
		}
	}
});




//-- Comment retriever. --//
app.use(require("./controllers/comment.js"));


//-- Data transfer protocols. --//
app.use(require("./controllers/post.js"));



//-- Melee initialization. --//

const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`Server start on port ${port}`)
})