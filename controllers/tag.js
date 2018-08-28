const mongoose = require('mongoose');

const hubby = require("../assets/js/hubby.js");

// load tag schema
require('../models/tag');
const model = mongoose.model('tag');

module.exports = hubby;