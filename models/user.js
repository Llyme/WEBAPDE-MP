const mongoose = require("mongoose");
const post = require("./post.js");
const comment = require("./comment.js");

let Schema = new mongoose.Schema({
	/* Not to be confused for the 'username', this is meant to be
	   the user's display name.
	*/
	nickname: {
		type: String,
		required: true
	},
	username: {
		type: String,
		min: 4,
		unique: true,
		required: true
	},
	// Light restrictions to provide flexibility.
	password: {
		type: String,
		min: 6,
		required: true
	},
	/* This is different from the user's posts/comments. They act
	   like 'number of followers'. This helps dampen the effects
	   of having tons of comments/posts with bad reputation, or
	   vice-versa. For example, some people may act like a monster
	   but their works are highly reputable.
	*/
	reputation: {
		type: Number,
		default: 0,
		required: true
	},
	/* List of posts the user owns.
	*/
	posts: [post.Schema],
	/* List of posts that are not from this user,
	   allowing them to view them regardless of privacy.
	*/
	shared: [String],
	/* Upvoted posts and comments.
	*/
	upvotes: [String],
	/* Downvoted posts and comments.
	*/
	downvotes: [String]
});

let Model = mongoose.model("user", Schema);
Model.Schema = Schema;
module.exports = Model;