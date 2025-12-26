// dashboard/routes/main.js
const express = require('express');
const router = express.Router();
const { PermissionsBitField } = require('discord.js');
const { ObjectId } = require('mongodb');

// Giriş yapmış kullanıcıyı kontrol eden basit middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/login');
}

// YARDIMCI: Admin Kontrolü
async function checkGeneralAdmin(req, client) {
    if (!req.isAuthenticated() || !req.user) return false;
    try {
        const SUPPORT_GUILD_ID = '1447297146234732716'; 
        const ADMIN_ROLE_ID = '1447336527653900411';
        const guild = client.guilds.cache.get(SUPPORT_GUILD_ID);
        if (!guild) return false;
        const member = await guild.members.fetch(req.user.id).catch(() => null);
        return member && member.roles.cache.has(ADMIN_ROLE_ID);
    } catch (e) { return false; }
}

// YARDIMCI: FAQ İçeriği Çek
async function getFaqContent(req) {
    try {
        const db = req.app.get('db');
        if (!db || typeof db.collection !== 'function') return [];
        return await db.collection('dashboard_content_faq').find({}).sort({ order: 1 }).toArray();
    } catch (e) { return []; }
}

// 1. ANASAYFA
router.get('/', async (req, res) => {
    const client = req.client;
    if (!client || !client.user) return res.send("Bot is starting, please wait...");

    const stats = {
        servers: client.guilds.cache.size,
        members: client.guilds.cache.reduce((a, b) => a + b.memberCount, 0),
        channels: client.channels.cache.size
    };
    const invite = client.generateInvite({ scopes: ['bot', 'applications.commands'], permissions: [PermissionsBitField.Flags.Administrator] });
    const isGeneralAdmin = await checkGeneralAdmin(req, client);
    
    // Veritabanından FAQ Çek
    let faqItems = await getFaqContent(req);
    
    // Eğer DB boşsa varsayılanları göster
    if (faqItems.length === 0) {
        faqItems = [
            { _id: 'def1', question: `Is ${client.user.username} free?`, answer: "Yes, all core features including moderation, economy, and tickets are 100% free.", icon: "fa-solid fa-circle-check" },
            { _id: 'def2', question: "How do I setup logs?", answer: "Use the <code>/logs-setup</code> command to open the interactive panel and select a channel.", icon: "fa-solid fa-circle-check" },
            { _id: 'def3', question: "Can I customize it?", answer: "Absolutely. Welcome messages, log categories, and ticket roles are all customizable.", icon: "fa-solid fa-circle-check" },
            { _id: 'def4', question: "Is there a Premium version?", answer: "Currently, all features are free. We may introduce a premium tier for advanced cosmetics later.", icon: "fa-solid fa-circle-check" },
            { _id: 'def5', question: "What languages are supported?", answer: "The bot currently supports English and Turkish (selectable via config or dashboard in future).", icon: "fa-solid fa-circle-check" },
            { _id: 'def6', question: "How do I report a bug?", answer: "You can report bugs by joining our Support Server and opening a ticket.", icon: "fa-solid fa-circle-check" }
        ];
    }

    res.render('index', { layout: false, user: client.user, stats: stats, invite: invite, faqItems: faqItems, isGeneralAdmin: isGeneralAdmin });
});

// 2. SUNUCU SEÇİMİ
router.get('/settings', isAuthenticated, async (req, res) => {
    const client = req.client;
    const discordUser = req.user;
    const userGuilds = discordUser.guilds;
    const manageableGuilds = [];
    const ADMIN_PERM = PermissionsBitField.Flags.Administrator;
    
    for (const userGuild of userGuilds) {
        const permissions = new PermissionsBitField(BigInt(userGuild.permissions));
        const canManage = permissions.has(ADMIN_PERM) || permissions.has(PermissionsBitField.Flags.ManageGuild);
        if (canManage) {
            const botGuild = client.guilds.cache.get(userGuild.id);
            const inviteUrl = client.generateInvite({ scopes: ['bot', 'applications.commands'], permissions: [ADMIN_PERM], guildId: userGuild.id });
            manageableGuilds.push({ id: userGuild.id, name: userGuild.name, icon: userGuild.icon, isBotIn: !!botGuild, dashboardUrl: botGuild ? `/dashboard/${userGuild.id}` : inviteUrl });
        }
    }
    res.render('settings', { layout: false, discordUser: discordUser, manageableGuilds: manageableGuilds, client: req.client });
});

// 3. DASHBOARD
router.get('/dashboard/:guildId', isAuthenticated, (req, res) => {
    const guildId = req.params.guildId;
    const client = req.client;
    const discordUser = req.user;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.redirect('/settings');
    
    const member = guild.members.cache.get(discordUser.id);
    const canManage = member && (member.permissions.has(PermissionsBitField.Flags.Administrator) || member.permissions.has(PermissionsBitField.Flags.ManageGuild));
    if (!canManage) return res.status(403).send("Access Denied.");

    res.render('server_dashboard', { discordUser: discordUser, guild: guild, client: client });
});

// ====================================================
// 🟢 4. FAQ GÜNCELLEME ROTASI (EKSİK OLAN KISIM BURASI)
// ====================================================
router.post('/update-faq', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const client = req.client;
    const isAdmin = await checkGeneralAdmin(req, client);
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Access Denied: You need General Admin role.' });

    const { id, icon, question, answer, order } = req.body;
    
    // Veritabanı Bağlantısını Al
    const db = req.app.get('db');

    // DB Kontrolü
    if (!db || typeof db.collection !== 'function') {
        console.error("❌ DB HATASI: Veritabanı bağlantısı yok!");
        return res.status(500).json({ success: false, error: 'Database connection missing' });
    }

    try {
        const collection = db.collection('dashboard_content_faq');
        const updateData = { icon, question, answer, order: parseInt(order) || 0, updatedAt: new Date() };

        if (id && id !== 'null' && !id.startsWith('def')) {
            // Var olanı güncelle
            await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
            res.json({ success: true, id: id });
        } else {
            // Yeni oluştur
            updateData.createdAt = new Date();
            const result = await collection.insertOne(updateData);
            res.json({ success: true, id: result.insertedId });
        }
    } catch (error) {
        console.error("FAQ Update Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;