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
		img: Buffer,
		reputation: Number
	}),
};