const mongoose = require("mongoose");

let Schema = new mongoose.Schema({
	text: {
		type: String,
		required: true,
		default: ""
	},
	posts: [String]
});

let Model = mongoose.model("tag", Schema);
Model.Schema = Schema;
module.exports = Model;