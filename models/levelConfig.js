const mongoose = require('mongoose');

const levelConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true } // Varsayılan olarak TRUE (Açık)
});

module.exports = mongoose.model('LevelConfig', levelConfigSchema);