const mongoose = require('mongoose');

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },

    // --- MANAGEMENT ---
    moderation: {
        status: { type: Boolean, default: false },
        bad_word: { type: Boolean, default: false },
        anti_link: { type: Boolean, default: false },
        mute_role: { type: String, default: null }
    },
    levels: {
        status: { type: Boolean, default: false },
        message: { type: String, default: 'Congratulations {user}, you reached level {level}!' },
        channel: { type: String, default: null },
        xp_rate: { type: String, default: '1x' }
    },
    giveaway: {
        manager_role: { type: String, default: null },
        emoji: { type: String, default: '🎉' }
    },
    suggestion: {
        channel: { type: String, default: null },
        auto_thread: { type: Boolean, default: false }
    },
    welcome: {
        status: { type: Boolean, default: false },
        channel: { type: String, default: null },
        message: { type: String, default: 'Welcome to the server, {user}!' }
    },

    // --- SYSTEM ---
    tickets: {
        status: { type: Boolean, default: false },
        log_channel: { type: String, default: null },
        support_role: { type: String, default: null },
        limit: { type: String, default: '3' }
    },
    registration: {
        status: { type: Boolean, default: false },
        channel: { type: String, default: null },
        unreg_role: { type: String, default: null },
        reg_role: { type: String, default: null }
    },
    logging: {
        status: { type: Boolean, default: false },
        msg_log: { type: String, default: null },
        voice_log: { type: String, default: null },
        member_log: { type: String, default: null }
    },
    invites: {
        status: { type: Boolean, default: false },
        log_channel: { type: String, default: null }
    },
    jtc: { // Join to Create
        status: { type: Boolean, default: false },
        hub_channel: { type: String, default: null }
    },
    social_notify: {
        status: { type: Boolean, default: false },
        platform: { type: String, default: 'YouTube' },
        username: { type: String, default: null },
        channel: { type: String, default: null },
        message: { type: String, default: 'Hey @everyone! {creator} just posted! {link}' }
    },

    // --- ENTERTAINMENT ---
    wordgame: {
        channel: { type: String, default: null },
        language: { type: String, default: 'English' }
    },
    counting: {
        channel: { type: String, default: null },
        fail_reset: { type: Boolean, default: true }
    },
    economy: {
        status: { type: Boolean, default: false },
        symbol: { type: String, default: '$' },
        start_balance: { type: Number, default: 500 },
        daily_reward: { type: Number, default: 100 }
    }
}, { timestamps: true });

module.exports = mongoose.model('GuildSettings', guildSettingsSchema);