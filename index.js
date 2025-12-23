// index.js - MASTER FILE (BOT + DASHBOARD + EVENTS + SOCIAL MANAGER)
require('dotenv').config();

const mongoose = require('mongoose'); // ✅ [YENİ] Mongoose bağlantısı için

// EmbedBuilder'ı ekledik (Log mesajı için lazım)
const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./utils/database');
const config = require('./config/config');
const { AutoPoster } = require('topgg-autoposter');

// [YENİ] Sosyal Medya Yöneticisi
const SocialManager = require('./utils/SocialManager');

console.log('='.repeat(60));
console.log('🚀 NETRCOL BOT BAŞLATILIYOR');
console.log('='.repeat(60));

// 1. Token Kontrolü
if (!process.env.TOKEN) {
    console.error('❌ KRİTİK HATA: .env dosyasında TOKEN bulunamadı!');
    process.exit(1);
}

// ✅ [YENİ] Mongoose bağlantısı (Dashboard modelleri: SocialNotify / GuildSettings vb.)
async function connectMongoose() {
    const mongoUri = process.env.MONGO_URI_LOCAL || process.env.MONGO_URI;

    if (!mongoUri) {
        console.error('❌ KRİTİK HATA: MONGO_URI_LOCAL veya MONGO_URI bulunamadı!');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Mongoose connected');
    } catch (err) {
        console.error('❌ Mongoose connection error:', err);
    }
}

// 2. Bot İstemcisi (Client) Oluşturma
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction
    ]
});

// Event Listener Sınırını Artır
client.setMaxListeners(50);

// Global Değişkenler
global.client = client;
client.commands = new Collection();

// ====================================================
// 📈 TOP.GG AUTO POSTER (AUTO STATS & LOG)
// ====================================================
// Paste your Top.gg token here.
const TOPGG_TOKEN = process.env.TOPGG_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfdCI6Ijc5MDkzMjE1MjU4NTcxOTgwOCIsImlkIjoiNzg4Nzg0Nzg0NTYyMTE4NjU2IiwiaWF0IjoxNzY2NDA5NzE5fQ.MT2_EvDeILTJi-APYckokNM6_khuzy5_YFl6LddViuU';

// FIX: Just check if the token exists.
if (TOPGG_TOKEN) {
    const ap = AutoPoster(TOPGG_TOKEN, client);

    ap.on('posted', () => {
        console.log('✅ Stats successfully posted to Top.gg!');
        
        // DEV LOG CHANNEL
        const devLogChannelId = '1448451762729128048';
        const channel = client.channels.cache.get(devLogChannelId);
        
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('📈 Top.gg Stats Posted')
                .setDescription(`**Server Count:** \`${client.guilds.cache.size}\`\n**Shard Count:** \`${client.options.shardCount || 1}\`\n\nData successfully transmitted to Top.gg API.`)
                .setColor('#FF3366') // Top.gg color
                .setTimestamp()
                .setFooter({ text: 'Netrcol AutoPoster', iconURL: 'https://top.gg/images/dblnew.png' });
            
            channel.send({ embeds: [embed] }).catch(e => console.error('Failed to send dev log:', e));
        }
    });

    ap.on('error', (err) => {
        console.error('❌ Top.gg AutoPoster Error:', err.message || err);
    });
} else {
    console.warn('⚠️ WARNING: Top.gg Token missing, AutoPoster not started.');
}

// ====================================================
// ⚠️ KRİTİK GLOBAL HATA YAKALAMA
// ====================================================
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection/Promise Error:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error('❌ Uncaught Exception:', err);
});

client.on('error', (err) => {
    console.error('❌ Discord Client Error:', err);
});

// ====================================================
// 3. KOMUTLARI YÜKLE (COMMAND LOADER)
// ====================================================
console.log('📂 Komutlar yükleniyor...');
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    // A) Ana klasördeki komutlar
    const rootFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of rootFiles) {
        try {
            const command = require(path.join(commandsPath, file));
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
                console.log(`   ✅ ${command.data.name}`);
            }
        } catch (e) { console.error(`   ❌ Hata (${file}): ${e.message}`); }
    }

    // B) Alt klasörlerdeki komutlar
    const folders = fs.readdirSync(commandsPath).filter(f => fs.statSync(path.join(commandsPath, f)).isDirectory());
    for (const folder of folders) {
        const files = fs.readdirSync(path.join(commandsPath, folder)).filter(f => f.endsWith('.js'));
        for (const file of files) {
            try {
                const command = require(path.join(commandsPath, folder, file));
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                    console.log(`   ✅ ${command.data.name} (${folder})`);
                }
            } catch (e) { console.error(`   ❌ Hata (${folder}/${file}): ${e.message}`); }
        }
    }
} else {
    console.warn('⚠️ UYARI: "commands" klasörü bulunamadı!');
}

// ====================================================
// 4. EVENTLERİ YÜKLE (UNIVERSAL EVENT LOADER)
// ====================================================
console.log('📂 Eventler yükleniyor...');
const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            const eventModule = require(path.join(eventsPath, file));

            // Özel Başlatıcılar
            if (eventModule.name === 'inviteTracker') {
                eventModule.execute(client);
                console.log(`   ✅ Invite Tracker Başlatıldı`);
                continue;
            }

            if (file === 'serverLogs.js') {
                if (eventModule.onMessageDelete) client.on('messageDelete', (...args) => eventModule.onMessageDelete(...args));
                if (eventModule.onMessageUpdate) client.on('messageUpdate', (...args) => eventModule.onMessageUpdate(...args));
                if (eventModule.onMemberUpdate) client.on('guildMemberUpdate', (...args) => eventModule.onMemberUpdate(...args));
                console.log(`   ✅ Server Logs Loaded (Legacy Mode)`);
                continue;
            }

            // Standart Eventler
            if (eventModule.name && typeof eventModule.name === 'string') {
                if (eventModule.name === 'interactionCreate' && file !== 'interactionCreate.js') {
                    console.log(`   ⚠ interactionCreate atlandı (${file}) - merkez handler devrede.`);
                    continue;
                }

                if (eventModule.once) {
                    client.once(eventModule.name, (...args) => eventModule.execute(...args, client));
                } else {
                    client.on(eventModule.name, (...args) => eventModule.execute(...args, client));
                }
                console.log(`   ✅ ${eventModule.name} (${file})`);
            }
            // Çoklu Obje Eventler
            else {
                let count = 0;
                for (const key in eventModule) {
                    const evt = eventModule[key];
                    if (evt && evt.name && typeof evt.execute === 'function') {
                        client.on(evt.name, (...args) => evt.execute(...args, client));
                        count++;
                    }
                }
                if (count > 0) console.log(`   ✅ ${count} Event Yüklendi (${file} - Grup)`);
            }
        } catch (e) {
            console.error(`   ❌ Hata (${file}): ${e.message}`);
        }
    }
} else {
    console.warn('⚠️ UYARI: "events" klasörü bulunamadı!');
}

// ====================================================
// 5. BAŞLATMA FONKSİYONU (DB -> BOT -> SOCIAL -> DASHBOARD)
// ====================================================
async function start() {
    try {
        // ✅ [YENİ] Önce Mongoose bağlan (dashboard modelleri hata vermesin)
        await connectMongoose();

        // 1. Veritabanı Bağlantısı (MongoClient / Native driver)
        console.log(`🔗 Database bağlanıyor (${config.mongoUri.includes('localhost') || config.mongoUri.includes('127.0.0.1') ? 'LOCAL' : 'ATLAS'})...`);
        await db.connect();

        // 2. Botu Başlat
        console.log('🤖 Bot Discord\'a giriş yapıyor...');
        await client.login(config.token);

        // 3. [YENİ] Sosyal Medya Bildirimcisini Başlat
        // Bot hazır olduktan sonra (login sonrası) başlatıyoruz.
        try {
            const socialManager = new SocialManager(client);
            socialManager.init();
            console.log('📡 Social Media Manager aktif ve dinleniyor...');
        } catch (socialError) {
            console.error('❌ Social Media Manager başlatılamadı:', socialError);
        }

        // 4. Web Panelini (Dashboard) Başlat
        const dashboardPath = path.join(__dirname, 'dashboard', 'server.js');

        if (fs.existsSync(dashboardPath)) {
            console.log('🌐 Dashboard başlatılıyor...');
            try {
                require(dashboardPath)(client);
            } catch (e) {
                console.error('❌ Dashboard Başlatma Hatası:', e);
            }
        } else {
            console.error('⚠️ UYARI: dashboard/server.js dosyası bulunamadı, web paneli kapalı.');
        }

    } catch (error) {
        console.error('❌ Başlatma hatası:', error);
    }
}

// ====================================================
// 📊 12 HOUR RAM HEALTH CHECK (ENGLISH)
// ====================================================
setInterval(() => {
    // Calculate RAM usage (in MB)
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    
    // 🚨 PASTE YOUR LOG CHANNEL ID HERE
    const logChannelId = '1452714656627167313'; 
    const channel = client.channels.cache.get(logChannelId);

    if (channel) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🧠 Periodic System Check')
            .setDescription(`System is running smoothly.\n\n**RAM Usage:** \`${ramUsage} MB\``)
            .setColor('#00FF00') // Green Color
            .setTimestamp()
            .setFooter({ text: 'Netrcol Health Check' });

        channel.send({ embeds: [embed] });
        console.log(`[RAM CHECK] Current Usage: ${ramUsage} MB`);
    }
}, 12 * 60 * 60 * 1000); // 12 Hours (in milliseconds)
// Motoru Çalıştır
start();