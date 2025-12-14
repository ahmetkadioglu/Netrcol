// events/ready.js - FINAL FIX
const { Events, ActivityType } = require('discord.js');
const db = require('../utils/database');
const giveawayManager = require('../utils/giveawayManager'); // Zaten new olarak geliyor

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log('============================================================');
        console.log(`✅ BOT HAZIR: ${client.user.tag}`);
        console.log(`   ID: ${client.user.id}`);
        console.log(`   Sunucular: ${client.guilds.cache.size}`);
        console.log('============================================================');

        // Database Health Check
        const dbHealth = await db.healthCheck();
        if (dbHealth.status === 'connected') {
            console.log('✅ Database connection verified.');
        } else {
            console.error('❌ Database connection issue:', dbHealth.error);
        }

        // Bot Durumunu Ayarla
        try {
            client.user.setActivity(process.env.ACTIVITY_NAME || 'Discord Server!', {
                type: parseInt(process.env.ACTIVITY_TYPE) || ActivityType.Playing
            });
            console.log('🎮 Bot durumu ayarlandı');
        } catch (e) {
            console.log('⚠️ Bot durumu ayarlanamadı');
        }

        // Giveaway Sistemini Başlat
        // HATA BURADAYDI: 'new' kullanmadan direkt init diyoruz.
        try {
            giveawayManager.init(client);
            console.log('🎉 Giveaway Manager başlatıldı');
        } catch (error) {
            console.error('❌ Giveaway başlatma hatası:', error);
        }

        console.log('🚀 Sistem tamamen hazır!');
    },
};