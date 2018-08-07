const mongoose = require("mongoose");
const comment = require("./comment.js");

let Schema = new mongoose.Schema({
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
	},
	/* List of comments this post has.
	*/
	comments: [comment.Schema]
});

let Model = mongoose.model("post", Schema);
Model.Schema = Schema;
module.exports = Model;