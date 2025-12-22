const mongoose = require('mongoose');

const socialNotifySchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },

    status: { type: Boolean, default: true }, // ✅ toggle için

    platform: {
      type: String,
      required: true,
      enum: ['YouTube', 'Twitch', 'TikTok', 'Kick'],
      index: true
    },

    channelId: { type: String, required: true }, // YouTube channel_id veya Twitch username
    channelName: { type: String }, // panelde göstermek için

    discordChannelId: { type: String, required: true },

    customMessage: {
      type: String,
      default: "Hey! {author} yeni içerik paylaştı! {title} {link}"
    },

    lastContentId: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialNotify', socialNotifySchema);
