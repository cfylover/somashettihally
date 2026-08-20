// Member model removed per request. Stub model to avoid runtime requires.
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dummy = new Schema({}, { strict: false });
module.exports = mongoose.model("Member", dummy);
