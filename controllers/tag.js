const mongoose = require('mongoose');

const hubby = require("../assets/js/hubby.js");

const model = {};

["comment", "post", "user", "tag"].map(v => {
	model[v] = require("../models/" + v + ".js");
});

module.exports = hubby;