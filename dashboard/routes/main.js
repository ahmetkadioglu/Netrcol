// dashboard/routes/main.js
const express = require('express');
const router = express.Router();
const { PermissionsBitField } = require('discord.js'); // Yetki kontrolü için

// Giriş yapmış kullanıcıyı kontrol eden basit middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}

// ====================================================
// 1. ANASAYFA ROTASI (/) - LAYOUT KAPALI
// ====================================================
router.get('/', (req, res) => {
    const client = req.client;

    if (!client || !client.user) return res.send("Bot is starting, please wait...");

    const stats = {
        servers: client.guilds.cache.size,
        members: client.guilds.cache.reduce((a, b) => a + b.memberCount, 0),
        channels: client.channels.cache.size
    };

    const invite = client.generateInvite({ scopes: ['bot', 'applications.commands'], permissions: [PermissionsBitField.Flags.Administrator] });

    // KRİTİK DÜZELTME: Layout'u bu rota için DEVRE DIŞI BIRAK
    res.render('index', { 
        layout: false, 
        user: client.user, 
        stats: stats, 
        invite: invite 
    });
});

// ====================================================
// 2. SUNUCU SEÇİM ROTASI (/settings)
// ====================================================
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
            
            const inviteUrl = client.generateInvite({ 
                scopes: ['bot', 'applications.commands'], 
                permissions: [ADMIN_PERM], 
                guildId: userGuild.id
            });

            manageableGuilds.push({
                id: userGuild.id,
                name: userGuild.name,
                icon: userGuild.icon,
                isBotIn: !!botGuild, 
                dashboardUrl: botGuild ? `/dashboard/${userGuild.id}` : inviteUrl
            });
        }
    }

    res.render('settings', { 
  layout: false,
  discordUser: discordUser,
  manageableGuilds: manageableGuilds,
  client: req.client 
});

});

// ====================================================
// 3. DASHBOARD YÖNETİM ROTASI (/dashboard/:guildId)
// ====================================================
router.get('/dashboard/:guildId', isAuthenticated, (req, res) => {
    const guildId = req.params.guildId;
    const client = req.client;
    const discordUser = req.user;

    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
        // Eğer bot sunucuda değilse veya ID yanlışsa, sunucu seçim ekranına geri yolla
        return res.redirect('/settings');
    }
    
    const member = guild.members.cache.get(discordUser.id);
    const canManage = member && (member.permissions.has(PermissionsBitField.Flags.Administrator) || member.permissions.has(PermissionsBitField.Flags.ManageGuild));

    if (!canManage) {
        return res.status(403).send("Access Denied: You do not have permission to manage this server.");
    }

    // Gerçek dashboard sayfasını render et. (server_dashboard.ejs, layout.ejs'i kullanır)
    res.render('server_dashboard', {
        discordUser: discordUser,
        guild: guild,
        client: client,
    });
});


module.exports = router;