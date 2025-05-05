const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
    guildId: String,
    userId: String,
    warns: { type: Array, default: [] }
});

module.exports = mongoose.model('warns', warnSchema);
