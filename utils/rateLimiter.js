// utils/rateLimiter.js
const { Collection } = require('discord.js');

class RateLimiter {
    constructor() {
        this.limits = new Collection();
        
        // KOMUT LİMİT AYARLARI (Milisaniye cinsinden)
        this.settings = {
            // Eğlence & Ekonomi
            'coinflip': { windowMs: 5000, max: 1, message: '🪙 Whoa! The coin is still spinning. Wait 5s.' }, // 5 saniyede 1 kere
            'slots': { windowMs: 10000, max: 1, message: '🎰 The machine is cooling down! Wait 10s.' }, // 10 saniyede 1 kere
            'daily': { windowMs: 5000, max: 1, message: '📅 Do not spam daily!' }, // DB zaten 24 saati tutuyor, bu sadece butona abanmayı önler
            'balance': { windowMs: 10000, max: 2, message: '💰 Your wallet isn\'t running away. Wait 10s.' }, // 10 saniyede 2 kere
            
            // Moderasyon (Güvenlik için)
            'ban': { windowMs: 10000, max: 3, message: '🔨 Slow down with the hammer!' },
            'kick': { windowMs: 10000, max: 3, message: '👢 Slow down with the kicking!' },
            'clear': { windowMs: 10000, max: 1, message: '🧹 Cleaning takes time. Wait 10s.' },
            
            // Genel
            'default': { windowMs: 3000, max: 3, message: '🛑 You are typing too fast! Slow down.' }
        };
    }

    /**
     * Limiti kontrol et
     * @param {string} userId - Kullanıcı ID
     * @param {string} commandName - Komut ismi
     * @returns {object} { limited: boolean, message: string, timeLeft: number }
     */
    checkLimit(userId, commandName) {
        const config = this.settings[commandName] || this.settings['default'];
        const key = `${userId}-${commandName}`;
        const now = Date.now();

        if (!this.limits.has(key)) {
            this.limits.set(key, []);
        }

        const userHistory = this.limits.get(key);
        
        // Süresi dolmuş kayıtları temizle
        const validTimestamps = userHistory.filter(timestamp => now - timestamp < config.windowMs);
        this.limits.set(key, validTimestamps);

        if (validTimestamps.length >= config.max) {
            const oldestAction = validTimestamps[0];
            const timeLeft = (oldestAction + config.windowMs - now) / 1000;
            return { limited: true, message: config.message, timeLeft: timeLeft.toFixed(1) };
        }

        // Yeni işlemi kaydet
        validTimestamps.push(now);
        this.limits.set(key, validTimestamps);

        return { limited: false };
    }

    getSystemStats() {
        return {
            totalActiveLimits: this.limits.size,
            memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
        };
    }
}

// Singleton olarak dışa aktar (Tek bir yönetici olsun)
module.exports = new RateLimiter();