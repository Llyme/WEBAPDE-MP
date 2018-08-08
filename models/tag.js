const mongoose = require("mongoose");
const post = require("./post.js");

let Schema = new mongoose.Schema({
	text: {
		type: String,
		required: true,
		default: ""
	},
	posts: [post.Schema]
});

let Model = mongoose.model("tag", Schema);
Model.Schema = Schema;
module.exports = Model;