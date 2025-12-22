// config/config.js
require('dotenv').config();
const crypto = require('crypto');
const { PermissionsBitField } = require("discord.js");

// Küçük yardımcılar
const toBool = (v) => v === 'true';
const toInt = (v, def) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? def : n;
};

module.exports = {
    // ⚠️ KRİTİK AYARLAR - DISCORD OAUTH2 İÇİN GEREKLİ
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackUrl: process.env.CALLBACK_URL,

    // 👑 BOT SAHİBİ (Senin ID'n)
    ownerId: process.env.OWNER_ID || '760210546980028419',

    // 📝 LOG KANALLARI (Developer Control Log)
    logChannels: {
        blacklist: '1448451761470963920',
        premium: '1448451761470963921',
        rateLimit: '1448451761470963923',
        guild: '1448451761810706622', // Ekleme/Atılma
        dm: '1448451761810706623',
        error: '1448451761810706624'
    },

    // 🔐 Discord Token kontrolü
    token: (() => {
        const token = process.env.TOKEN;
        if (!token) {
            console.error('\n❌❌❌ KRİTİK HATA: Discord TOKEN bulunamadı!');
            process.exit(1);
        }
        return token;
    })(),

    // 🗄️ MongoDB URI
    mongoUri: (() => {
        const localUri = process.env.MONGO_URI_LOCAL; // Aktif!
        if (localUri && localUri.trim() !== "") {     // Aktif!
            console.log("🟢 Mongo URI: LOCAL MODE (localhost)"); // Aktif!
            return localUri;                          // Aktif!
        }
        const atlasUri = process.env.MONGO_URI;
        if (!atlasUri || atlasUri.trim() === "") {
            console.error('\n❌❌❌ KRİTİK HATA: MongoDB bağlantısı yok!');
            process.exit(1);
        }
        console.log("🔵 Mongo URI: ATLAS MODE (Cloud)");
        return atlasUri;
    })(),

    // 💎 Session Secret (Oturumları şifrelemek için)
    sessionSecret: (() => {
        const secret = process.env.SESSION_SECRET;

        // ✅ FIX: Artık development'ta da random üretme yok.
        // .env içinde SESSION_SECRET yoksa direkt hata ver (stabil oturum için).
        if (!secret || secret.length < 32) {
            console.error('\n❌❌❌ HATA: SESSION_SECRET .env içinde tanımlı olmalı ve en az 32 karakter olmalı!');
            process.exit(1);
        }

        return secret;
    })(),

    // Bot Configuration
    bot: {
        name: "Netrcol Bot",
        version: "3.2.0",
        status: process.env.STATUS || 'online',
        activity: {
            name: process.env.ACTIVITY_NAME || 'Discord Server!',
            type: toInt(process.env.ACTIVITY_TYPE || '0', 0)
        }
    },

    // Feature flags
    features: {
        moderation: toBool(process.env.ENABLE_MODERATION),
        tickets: toBool(process.env.ENABLE_TICKETS),
        logging: toBool(process.env.ENABLE_LOGGING),
        backup: toBool(process.env.ENABLE_BACKUP),
        cleanup: toBool(process.env.ENABLE_CLEANUP),
        rateLimiting: toBool(process.env.ENABLE_RATE_LIMITING),
    },

    // Database settings
    database: {
        name: process.env.DB_NAME || 'netrcol_bot',
        prefix: process.env.DB_COLLECTION_PREFIX || 'netrcol_',
    },

    // Performance settings
    performance: {
        rateLimitEnabled: toBool(process.env.RATE_LIMIT_ENABLED),
        maxCommandsPerMinute: toInt(process.env.MAX_COMMANDS_PER_MINUTE || '30', 30),
        backupIntervalHours: toInt(process.env.BACKUP_INTERVAL_HOURS || '24', 24),
        cleanupDays: toInt(process.env.CLEANUP_DAYS || '30', 30),
    },

    // Theme Configuration
    theme: {
        color: "#5865F2",
        colors: {
            primary: "#5865F2",
            success: "#57F287",
            error: "#ED4245",
            warning: "#FEE75C",
            info: "#5865F2",
        },
        footer: {
            text: "Netrcol Bot v0.2.8",
        },
    },

    // Emoji Configuration
    emojis: {
        ban: "🔨", clear: "🧹", lock: "🔒", unlock: "🔓", timeout: "⏰",
        info: "ℹ️", approved: "✅", canceled: "❌", users: "👥", settings: "⚙️",
        boost: "🚀", ticket: "🎫", ping: "🏓", kick: "👢", unban: "🔓",
    },

    // Permission Configuration
    permissions: {
        admin: [PermissionsBitField.Flags.Administrator],
        moderator: [PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers],
        support: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageMessages],
    },
};
