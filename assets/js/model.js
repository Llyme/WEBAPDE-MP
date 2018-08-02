const mongoose = require("mongoose");

module.exports = {
	user: mongoose.model("user", {
		nickname: String,
		username: String,
		password: String,
		reputation: Number
	}),
	post: mongoose.model("post", {
		owner: String,
		reputation: Number
	}),
	comment: mongoose.model("comment", {
		parent: String,
		text: String,
		reputation: Number
	})
};
