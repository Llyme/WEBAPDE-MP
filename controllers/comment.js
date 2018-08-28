const mongoose = require('mongoose');

const hubby = require("../assets/js/hubby.js");

// load comment schema
require('../models/comment');
const model = mongoose.model('comment');

module.exports = hubby;