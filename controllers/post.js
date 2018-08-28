const mongoose = require('mongoose');
const crypt = require("crypto");

const bbq = require("../assets/js/bbQueue.js");
const dbz = require("../assets/js/db-zeal.js");
const sheepstick = require("../assets/js/sheep-stick.js");
const hubby = require("../assets/js/hubby.js");
const sap = require("../assets/js/sort-a-potty.js");
const db = require("../assets/js/db.js"); // DB Config

//-- Setup models. --//

const model = {};

["comment", "post", "user", "tag"].map(v => {
	model[v] = require("./models/" + v + ".js");
});

//-- Constant indices. --//

const sorts = ["now", "hot", "new", "sad", "old"];




module.exports = hubby;