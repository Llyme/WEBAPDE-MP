const mongoose = require("mongoose");

module.exports = {
	user: mongoose.model("user", new mongoose.Schema({
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
		}
	})),
	post: mongoose.model("post", new mongoose.Schema({
		owner: {
			type: String,
			required: true
		},
		caption: {
			type: String,
			default: "",
			required: true
		},
		tag: {
			type: String,
			default: ""
		},
		reputation: {
			type: Number,
			default: 0,
			required: true
		},
		/* Describes the post's visibility.
		   0 = public; 1 = unlisted; 2 = private
		*/
		privacy: {
			type: Number,
			default: 0,
			required: true
		}
	})),
	comment: mongoose.model("comment", new mongoose.Schema({
		// Must be an id of a 'post' or a 'comment'.
		parent: {
			type: String,
			required: true
		},
		owner: {
			type: String,
			required: true
		},
		text: {
			type: String,
			default: "",
			required: true
		},
		reputation: {
			type: Number,
			default: 0,
			required: true
		}
	})),
	/* Used for verification if a user is allowed to see a private
	   post.
	*/
	invite: mongoose.model("invite", new mongoose.Schema({
		post: {
			type: String,
			required: true
		},
		user: {
			type: String,
			required: true
		}
	})),
	reputation: mongoose.model("reputation", new mongoose.Schema({
		// The user judging the subject.
		owner: {
			type: String,
			required: true
		},
		// The subject being judged.
		subject: {
			type: String,
			required: true
		},
		// false = downvote; true = upvote.
		impression: {
			type: Boolean,
			default: false,
			required: true
		}
	}))
};
