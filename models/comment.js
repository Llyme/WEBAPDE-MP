const mongoose = require("mongoose");

let Schema = new mongoose.Schema({
	// Must be an id of a 'post' or a 'comment'.
	parent: {
		type: String,
		required: true
	},
	// Where this comment belongs to.
	post: {
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
	},
	comments: []
});

let Model = mongoose.model("comment", Schema);
Model.Schema = Schema;
module.exports = Model;