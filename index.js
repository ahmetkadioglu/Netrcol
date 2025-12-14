// index.js - MASTER FILE (BOT + DASHBOARD + EVENTS)
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./utils/database');
const config = require('./config/config');

console.log('='.repeat(60));
console.log('🚀 NETRCOL BOT BAŞLATILIYOR');
console.log('='.repeat(60));

// 1. Token Kontrolü
if (!process.env.TOKEN) {
    console.error('❌ KRİTİK HATA: .env dosyasında TOKEN bulunamadı!');
    process.exit(1);
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

// Event Listener Sınırını Artır (Çok fazla event olduğu için)
client.setMaxListeners(50);

// Global Değişkenler
global.client = client;
client.commands = new Collection();

// ====================================================
// ⚠️ KRİTİK GLOBAL HATA YAKALAMA (ÇÖKMEYİ ENGELLER)
// ====================================================
process.on('unhandledRejection', (reason, promise) => {
    // Söz verilen bir işlemin reddedilmesi (Discord API hataları buraya düşer)
    console.error('❌ Unhandled Rejection/Promise Error:', reason);
});

process.on('uncaughtException', (err, origin) => {
    // Senkron hataları (daha nadir)
    console.error('❌ Uncaught Exception:', err);
});

client.on('error', (err) => {
    console.error('❌ Discord Client Error:', err);
});
// ====================================================


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
                console.log(`   ✅ ${command.data.name}`);
            }
        } catch (e) { console.error(`   ❌ Hata (${file}): ${e.message}`); }
    }

    // B) Alt klasörlerdeki komutlar (economy, moderation vb.)
    const folders = fs.readdirSync(commandsPath).filter(f => fs.statSync(path.join(commandsPath, f)).isDirectory());
    for (const folder of folders) {
        const files = fs.readdirSync(path.join(commandsPath, folder)).filter(f => f.endsWith('.js'));
        for (const file of files) {
            try {
                const command = require(path.join(commandsPath, folder, file));
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                    console.log(`   ✅ ${command.data.name} (${folder})`);
                }
            } catch (e) { console.error(`   ❌ Hata (${folder}/${file}): ${e.message}`); }
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

            // TİP A: Özel İsimlendirilmiş Dosyalar (serverLogs.js vb.)
            if (file === 'serverLogs.js') {
                if (eventModule.onMessageDelete) client.on('messageDelete', (...args) => eventModule.onMessageDelete(...args));
                if (eventModule.onMessageUpdate) client.on('messageUpdate', (...args) => eventModule.onMessageUpdate(...args));
                if (eventModule.onMemberUpdate) client.on('guildMemberUpdate', (...args) => eventModule.onMemberUpdate(...args));
                console.log(`   ✅ Server Logs Loaded (Legacy Mode)`);
                continue;
            }

            // TİP B: Standart Tekil Event (module.exports = { name: '...', execute: ... })
            if (eventModule.name && typeof eventModule.name === 'string') {

            // interactionCreate event'i artık sadece *tek* dosyadan yönetiliyor: interactionCreate.js
            // Diğer interactionCreate dosyalarını client'a event olarak bağlamıyoruz.
                if (eventModule.name === 'interactionCreate' && file !== 'interactionCreate.js') {
                console.log(`   ⚠ interactionCreate atlandı (${file}) - merkez handler üzerinden yönetiliyor.`);
                continue;
    }

    if (eventModule.once) {
        client.once(eventModule.name, (...args) => eventModule.execute(...args, client));
    } else {
        client.on(eventModule.name, (...args) => eventModule.execute(...args, client));
    }
    console.log(`   ✅ ${eventModule.name} (${file})`);
}
            
            // TİP C: Çoklu Obje Event (advancedLogger.js gibi)
            else {
                let count = 0;
                for (const key in eventModule) {
                    const evt = eventModule[key];
                    // Sadece geçerli event objelerini al (name ve execute olanlar)
                    if (evt && evt.name && typeof evt.execute === 'function') {
                        client.on(evt.name, (...args) => evt.execute(...args, client));
                        count++;
                    }
                }
                if (count > 0) {
                    console.log(`   ✅ ${count} Event Yüklendi (${file} - Grup)`);
                }
            }
        } catch (e) {
            console.error(`   ❌ Hata (${file}): ${e.message}`);
        }
    }
} else {
    console.warn('⚠️ UYARI: "events" klasörü bulunamadı!');
}

// ====================================================
// 5. BAŞLATMA FONKSİYONU (DB -> BOT -> DASHBOARD)
// ====================================================
async function start() {
    try {
        // 1. Veritabanı Bağlantısı
        console.log(`🔗 Database bağlanıyor (${config.mongoUri.includes('localhost') ? 'LOCAL' : 'ATLAS'})...`);
        await db.connect();
        
        // 2. Botu Başlat
        console.log('🤖 Bot Discord\'a giriş yapıyor...');
        await client.login(config.token);

        // 3. Web Panelini (Dashboard) Başlat
        const dashboardPath = path.join(__dirname, 'dashboard', 'server.js');
        
        if (fs.existsSync(dashboardPath)) {
            console.log('🌐 Dashboard başlatılıyor...');
            try {
                // Dashboard'a bot istemcisini (client) gönderiyoruz
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

// Motoru Çalıştır
start();