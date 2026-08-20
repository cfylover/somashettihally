// Video model removed per request. Stub module to avoid runtime require errors.
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dummySchema = new Schema({}, { strict: false });
module.exports = mongoose.model("Video", dummySchema);

