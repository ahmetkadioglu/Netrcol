const Parser = require('rss-parser');
const parser = new Parser();

const SocialNotify = require('../models/SocialNotify');

// Kontrol Sıklığı (Milisaniye)
const CHECK_INTERVAL = 5 * 60 * 1000;

class SocialManager {
  constructor(client) {
    this.client = client;
    this._timer = null;
  }

  init() {
    console.log('📡 Social Media Notifier Başlatıldı...');
    this.checkUpdates(); // ilk çalıştır
    this._timer = setInterval(() => this.checkUpdates(), CHECK_INTERVAL);
  }

  async checkUpdates() {
    let notifies = [];
    try {
      // ✅ sadece aktif olanlar
      notifies = await SocialNotify.find({ status: true }).lean(false);
    } catch (err) {
      console.error('❌ SocialNotify DB read error:', err?.message || err);
      return;
    }

    for (const data of notifies) {
      try {
        if (data.platform === 'YouTube') {
          await this.checkYouTube(data);
        }
        // Twitch, Kick, TikTok: buraya ekleyeceğiz
      } catch (error) {
        console.error(`❌ Sosyal Medya Hatası (${data.platform} - ${data.channelName || data.channelId}):`, error.message);
      }
    }
  }

  // YouTube (RSS)
  async checkYouTube(data) {
    const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${data.channelId}`;

    const feed = await parser.parseURL(YOUTUBE_RSS_URL);
    if (!feed?.items?.length) return;

    const latestVideo = feed.items[0];
    if (!latestVideo?.id) return;

    // ✅ İlk kurulum: lastContentId yoksa sadece set et, bildirim atma
    if (!data.lastContentId) {
      data.lastContentId = latestVideo.id;
      data.channelName = feed.title;
      await data.save();
      console.log(`ℹ️ SocialNotify init: lastContentId set (${feed.title})`);
      return;
    }

    // Aynıysa çık
    if (data.lastContentId === latestVideo.id) return;

    // Yeni içerik
    data.lastContentId = latestVideo.id;
    data.channelName = feed.title;
    await data.save();

    // Kanalı bul (cache’de yoksa fetch dene)
    let channel = this.client.channels.cache.get(data.discordChannelId);
    if (!channel) {
      try {
        channel = await this.client.channels.fetch(data.discordChannelId);
      } catch {
        return;
      }
    }
    if (!channel) return;

    const messageContent = (data.customMessage || '')
      .replaceAll('{author}', feed.title || 'Unknown')
      .replaceAll('{title}', latestVideo.title || 'New Content')
      .replaceAll('{link}', latestVideo.link || '');

    await channel.send({ content: messageContent });

    console.log(`🔔 Bildirim Gönderildi: ${feed.title} -> #${channel.name}`);
  }
}

module.exports = SocialManager;
