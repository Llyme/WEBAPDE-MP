const mongoose = require('mongoose');

const dbz = require("../assets/js/db-zeal.js");
const hubby = require("../assets/js/hubby.js");

// load comment schema
require('../models/comment');
require('../models/user');

const Comment = mongoose.model('comment');
const User = mongoose.model('user');

//-- Comment retriever. --//
const model = {};

["comment", "post", "user", "tag"].map(v => {
	model[v] = require("../models/" + v + ".js");
});

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

module.exports = hubby;