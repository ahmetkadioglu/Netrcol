const express = require('express');
const router = express.Router();
const { PermissionsBitField, ChannelType } = require('discord.js');
const bodyParser = require('body-parser');

// Veritabanı Modelleri
const GuildSettings = require('../../models/GuildSettings');
const SocialNotify = require('../../models/SocialNotify');

// Middleware: Giriş Kontrolü
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/login');
}

// POST İstekleri için Body Parser
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// ====================================================
// 1. ANASAYFA (Index)
// ====================================================
router.get('/', (req, res) => {
    const client = req.client;
    if (!client || !client.user) return res.send("Bot is starting...");

    const stats = {
        servers: client.guilds.cache.size,
        members: client.guilds.cache.reduce((a, b) => a + b.memberCount, 0),
        channels: client.channels.cache.size
    };
    
    const invite = client.generateInvite({ scopes: ['bot', 'applications.commands'], permissions: [PermissionsBitField.Flags.Administrator] });

    res.render('index', { layout: false, user: client.user, discordUser: req.user, stats: stats, invite: invite });
});

// ====================================================
// 2. SUNUCU SEÇİM EKRANI
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
            const inviteUrl = client.generateInvite({ scopes: ['bot', 'applications.commands'], permissions: [ADMIN_PERM], guildId: userGuild.id });

            manageableGuilds.push({
                id: userGuild.id,
                name: userGuild.name,
                icon: userGuild.icon,
                isBotIn: !!botGuild, 
                dashboardUrl: botGuild ? `/dashboard/${userGuild.id}` : inviteUrl,
                inviteUrl: inviteUrl 
            });
        }
    }
    manageableGuilds.sort((a, b) => (a.isBotIn === b.isBotIn) ? 0 : a.isBotIn ? -1 : 1);
    
    res.render('settings', { layout: false, discordUser: discordUser, manageableGuilds: manageableGuilds, client: req.client });
});

// ====================================================
// 3. DASHBOARD GENEL BAKIŞ (Overview)
// ====================================================
router.get('/dashboard/:guildId', isAuthenticated, (req, res) => {
    const guildId = req.params.guildId;
    const client = req.client;
    const discordUser = req.user;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) return res.redirect('/settings');
    
    const member = guild.members.cache.get(discordUser.id);
    const canManage = member && (member.permissions.has(PermissionsBitField.Flags.Administrator) || member.permissions.has(PermissionsBitField.Flags.ManageGuild));

    if (!canManage) return res.status(403).send("Access Denied.");

    res.render('server_dashboard', { layout: false, discordUser: discordUser, guild: guild, client: client });
});

// ====================================================
// 4. MODÜL AYAR SAYFASI (Veri Okuma)
// ====================================================
router.get('/dashboard/:guildId/:module', isAuthenticated, async (req, res) => {
    const { guildId, module } = req.params;
    const client = req.client;
    const discordUser = req.user;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) return res.redirect('/settings');
    const member = guild.members.cache.get(discordUser.id);
    const canManage = member && (member.permissions.has(PermissionsBitField.Flags.Administrator) || member.permissions.has(PermissionsBitField.Flags.ManageGuild));
    if (!canManage) return res.redirect('/settings');

    // Rolleri ve Kanalları Sırala
    const sortedRoles = guild.roles.cache.sort((a, b) => b.position - a.position).map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
    const sortedChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice).sort((a, b) => a.rawPosition - b.rawPosition).map(c => ({ id: c.id, name: c.name, type: c.type === ChannelType.GuildVoice ? 'voice' : 'text' }));
    const serverEmojis = guild.emojis.cache.map(e => ({ id: e.id, name: e.name, url: e.imageURL(), string: e.toString() }));

    // --- MODÜL AYAR ŞABLONLARI ---
    const moduleConfigs = {
        'moderation': {
            title: 'Moderation System', icon: 'fa-shield-halved', desc: 'Manage commands and jail system.',
            settings: [
                { id: 'mod_status', label: 'System Active', type: 'toggle', value: true },
                { id: 'ban_cmd', label: 'Ban Command', type: 'toggle', value: true },
                { id: 'unban_cmd', label: 'Unban Command', type: 'toggle', value: true },
                { id: 'kick_cmd', label: 'Kick Command', type: 'toggle', value: true },
                { id: 'timeout_cmd', label: 'Timeout Command', type: 'toggle', value: true },
                { id: 'untimeout_cmd', label: 'Untimeout Command', type: 'toggle', value: true },
                { id: 'lock_cmd', label: 'Lock Command', type: 'toggle', value: true },
                { id: 'unlock_cmd', label: 'Unlock Command', type: 'toggle', value: true },
                { id: 'clear_cmd', label: 'Clear Command', type: 'toggle', value: true },
                // Jail ayarları frontend'de özel kartlarda (jail-grid) gösteriliyor, buraya eklemiyoruz.
            ]
        },
        'levels': {
            title: 'Leveling System', icon: 'fa-chart-line', desc: 'Manage XP, rewards and rank cards.',
            settings: [
                // 1. Durum Kartı
                { id: 'level_status', label: 'System Status', type: 'toggle', value: true },
                
                // 2. Mesaj Kartı
                { id: 'level_msg', label: 'Level Up Message', type: 'textarea', placeholder: 'Congratulations {user}, you reached level {level}!', value: 'Congratulations {user}, you reached level {level}!', withEmoji: true },
                
                // 3. Kanal Kartı
                { id: 'level_channel', label: 'Level Up Log Channel', type: 'channel_select' },
                
                // 4. XP Oranı Kartı
                { id: 'xp_rate', label: 'XP Rate Multiplier', type: 'select', options: ['1x (Normal)', '1.5x (Boosted)', '2x (Double)', '3x (Fast)', '5x (Extreme)'] },
                
                // 5. Arka Plan Kartı (Ekstra Özellik)
                { id: 'rank_bg', label: 'Rank Card Background (URL)', type: 'text', placeholder: 'https://imgur.com/example.png', withEmoji: false },
                
                // 6. Muaf Rol (Ekstra Özellik)
                { id: 'no_xp_role', label: 'No-XP Role (Ignored)', type: 'role_select' }
            ]
        },
        'giveaway': {
            title: 'Giveaway System', icon: 'fa-gift', desc: 'Create and manage giveaways easily.',
            settings: [
                { id: 'giveaway_manager', label: 'Giveaway Manager Role', type: 'role_select' },
                { id: 'default_emoji', label: 'Default Reaction Emoji', type: 'text', value: '🎉', withEmoji: true }
            ]
        },
        'suggestion': {
            title: 'Suggestion System', icon: 'fa-lightbulb', desc: 'Let users submit feedback for your server.',
            settings: [
                { id: 'sug_channel', label: 'Suggestion Channel', type: 'channel_select' },
                { id: 'auto_thread', label: 'Create Thread Automatically', type: 'toggle', value: false }
            ]
        },
        'welcome': {
            title: 'Welcome & Goodbye', icon: 'fa-door-open', desc: 'Greet new members with style.',
            settings: [
                { id: 'welcome_status', label: 'Welcome Messages', type: 'toggle', value: false },
                { id: 'welcome_channel', label: 'Welcome Channel', type: 'channel_select' },
                { id: 'welcome_text', label: 'Welcome Message', type: 'textarea', value: 'Welcome to the server, {user}!', withEmoji: true }
            ]
        },
        'tickets': {
            title: 'Ticket System', icon: 'fa-ticket', desc: 'Advanced support ticket panel configuration.',
            settings: [
                { id: 'ticket_status', label: 'Ticket System Active', type: 'toggle', value: false },
                { id: 'transcript_channel', label: 'Transcript Log Channel', type: 'channel_select' },
                { id: 'support_role', label: 'Support Team Role', type: 'role_select' },
                { id: 'max_tickets', label: 'Max Tickets per User', type: 'select', options: ['1', '3', '5', 'Unlimited'] }
            ]
        },
        'registration': {
            title: 'Registration System', icon: 'fa-id-card', desc: 'Secure entry with captcha or button verification.',
            settings: [
                { id: 'reg_status', label: 'Registration Active', type: 'toggle', value: false },
                { id: 'reg_channel', label: 'Registration Channel', type: 'channel_select' },
                { id: 'unreg_role', label: 'Unregistered Role', type: 'role_select' },
                { id: 'reg_role', label: 'Registered Member Role', type: 'role_select' }
            ]
        },
        'logging': {
            title: 'Audit Logging', icon: 'fa-file-lines', desc: 'Keep track of everything happening in your server.',
            settings: [
                { id: 'log_all', label: 'Log Everything', type: 'toggle', value: false },
                { id: 'msg_log', label: 'Message Log Channel', type: 'channel_select' },
                { id: 'voice_log', label: 'Voice Log Channel', type: 'channel_select' },
                { id: 'member_log', label: 'Member Log Channel', type: 'channel_select' }
            ]
        },
        'invites': {
            title: 'Invite Tracker', icon: 'fa-user-plus', desc: 'Track who invited whom and catch fake invites.',
            settings: [
                { id: 'inv_status', label: 'Tracker Status', type: 'toggle', value: false },
                { id: 'inv_log', label: 'Invite Log Channel', type: 'channel_select' }
            ]
        },
        'jtc': {
            title: 'Join to Create (JTC)', icon: 'fa-microphone', desc: 'Temporary voice channels management.',
            settings: [
                { id: 'jtc_status', label: 'JTC System Status', type: 'toggle', value: false },
                { id: 'hub_channel', label: 'Hub Voice Channel', type: 'channel_select' }
            ]
        },
        'social_notify': {
            title: 'Social Notification', icon: 'fa-share-nodes', desc: 'Get notified when your favorite creator posts.',
            settings: [
                { id: 'notify_status', label: 'System Status', type: 'toggle', value: false },
                { id: 'platform', label: 'Platform', type: 'select', options: ['YouTube', 'Twitch', 'Kick', 'TikTok'] },
                { id: 'target_username', label: 'Channel ID / Username', type: 'text', placeholder: 'Example: UC123... (YouTube ID)' },
                { id: 'notify_channel', label: 'Notification Channel', type: 'channel_select' },
                { id: 'notify_msg', label: 'Notification Message', type: 'textarea', value: 'Hey @everyone! {creator} just posted a new content! {link}', withEmoji: true }
            ]
        },
        'wordgame': {
            title: 'Word Game', icon: 'fa-font', desc: 'Fun word chain game for your community.',
            settings: [
                { id: 'wg_channel', label: 'Game Channel', type: 'channel_select' },
                { id: 'wg_lang', label: 'Language', type: 'select', options: ['English', 'Turkish'] }
            ]
        },
        'counting': {
            title: 'Counting Game', icon: 'fa-list-ol', desc: 'Count to infinity with your members.',
            settings: [
                { id: 'count_channel', label: 'Counting Channel', type: 'channel_select' },
                { id: 'fail_reset', label: 'Reset count on fail?', type: 'toggle', value: true }
            ]
        },
        'economy': {
            title: 'Economy System', icon: 'fa-coins', desc: 'Global currency, shop, and gambling settings.',
            settings: [
                { id: 'eco_status', label: 'Economy Active', type: 'toggle', value: false },
                { id: 'currency_sym', label: 'Currency Symbol', type: 'text', value: '$' },
                { id: 'start_bal', label: 'Starting Balance', type: 'text', value: '500' },
                { id: 'daily_rew', label: 'Daily Reward Amount', type: 'text', value: '100' }
            ]
        }
    };

    const currentConfig = moduleConfigs[module];
    // Modül yoksa (yanlış URL)
    if (!currentConfig && module !== 'moderation') return res.redirect(`/dashboard/${guildId}`);

    // Jail için özel veri objesi
    let jailData = {
        setup: false,
        channel: null,
        role: null,
        jail_status: true,
        unjail_status: true
    };

    // --- VERİTABANINDAN ÇEKME ---
    try {
        const updateVal = (id, val) => {
            if (!currentConfig || !currentConfig.settings) return;
            const setting = currentConfig.settings.find(s => s.id === id);
            if (setting && val !== undefined && val !== null) setting.value = val;
        };

        if (module === 'social_notify') {
            const socialData = await SocialNotify.findOne({ guildId: guildId });
            if (socialData) {
                updateVal('notify_status', socialData.status);
                updateVal('platform', socialData.platform);
                updateVal('target_username', socialData.channelId);
                updateVal('notify_channel', socialData.discordChannelId);
                updateVal('notify_msg', socialData.customMessage);
            }
        } 
        else {
            const settings = await GuildSettings.findOne({ guildId: guildId });
            if (settings) {
                // MODERASYON & JAIL VERİLERİ
                if (module === 'moderation' && settings.moderation) {
                    // Komut Toggle'ları
                    updateVal('mod_status', settings.moderation.status);
                    updateVal('ban_cmd', settings.moderation.ban_cmd);
                    updateVal('unban_cmd', settings.moderation.unban_cmd);
                    updateVal('kick_cmd', settings.moderation.kick_cmd);
                    updateVal('timeout_cmd', settings.moderation.timeout_cmd);
                    updateVal('untimeout_cmd', settings.moderation.untimeout_cmd);
                    updateVal('lock_cmd', settings.moderation.lock_cmd);
                    updateVal('unlock_cmd', settings.moderation.unlock_cmd);
                    updateVal('clear_cmd', settings.moderation.clear_cmd);

                    // Jail Özel Verisi
                    if (settings.moderation.jail) {
                        jailData.setup = settings.moderation.jail.isSetup || false;
                        jailData.channel = settings.moderation.jail.channel || null;
                        jailData.role = settings.moderation.jail.role || null;
                        jailData.jail_status = settings.moderation.jail.jail_active ?? true;
                        jailData.unjail_status = settings.moderation.jail.unjail_active ?? true;
                    }
                }
                
                // DİĞER MODÜLLER
                else if (module === 'levels' && settings.levels) {
                    updateVal('level_status', settings.levels.status);
                    updateVal('level_msg', settings.levels.message);
                    updateVal('level_channel', settings.levels.channel);
                    updateVal('xp_rate', settings.levels.xp_rate);
                }
                else if (module === 'giveaway' && settings.giveaway) {
                    updateVal('giveaway_manager', settings.giveaway.manager_role);
                    updateVal('default_emoji', settings.giveaway.emoji);
                }
                else if (module === 'suggestion' && settings.suggestion) {
                    updateVal('sug_channel', settings.suggestion.channel);
                    updateVal('auto_thread', settings.suggestion.auto_thread);
                }
                else if (module === 'welcome' && settings.welcome) {
                    updateVal('welcome_status', settings.welcome.status);
                    updateVal('welcome_channel', settings.welcome.channel);
                    updateVal('welcome_text', settings.welcome.message);
                }
                else if (module === 'tickets' && settings.tickets) {
                    updateVal('ticket_status', settings.tickets.status);
                    updateVal('transcript_channel', settings.tickets.log_channel);
                    updateVal('support_role', settings.tickets.support_role);
                    updateVal('max_tickets', settings.tickets.limit);
                }
                else if (module === 'registration' && settings.registration) {
                    updateVal('reg_status', settings.registration.status);
                    updateVal('reg_channel', settings.registration.channel);
                    updateVal('unreg_role', settings.registration.unreg_role);
                    updateVal('reg_role', settings.registration.reg_role);
                }
                else if (module === 'logging' && settings.logging) {
                    updateVal('log_all', settings.logging.status);
                    updateVal('msg_log', settings.logging.msg_log);
                    updateVal('voice_log', settings.logging.voice_log);
                    updateVal('member_log', settings.logging.member_log);
                }
                else if (module === 'invites' && settings.invites) {
                    updateVal('inv_status', settings.invites.status);
                    updateVal('inv_log', settings.invites.log_channel);
                }
                else if (module === 'jtc' && settings.jtc) {
                    updateVal('jtc_status', settings.jtc.status);
                    updateVal('hub_channel', settings.jtc.hub_channel);
                }
                else if (module === 'wordgame' && settings.wordgame) {
                    updateVal('wg_channel', settings.wordgame.channel);
                    updateVal('wg_lang', settings.wordgame.language);
                }
                else if (module === 'counting' && settings.counting) {
                    updateVal('count_channel', settings.counting.channel);
                    updateVal('fail_reset', settings.counting.fail_reset);
                }
                else if (module === 'economy' && settings.economy) {
                    updateVal('eco_status', settings.economy.status);
                    updateVal('currency_sym', settings.economy.symbol);
                    updateVal('start_bal', settings.economy.start_balance);
                    updateVal('daily_rew', settings.economy.daily_reward);
                }
            }
        }
    } catch (err) {
        console.error("Data fetch error:", err);
    }

    res.render('server_module', {
        layout: false,
        discordUser: discordUser,
        guild: guild,
        client: client,
        module: module,
        config: currentConfig || { title: 'Settings', settings: [] }, // Hata önleyici
        roleList: sortedRoles,
        channelList: sortedChannels,
        emojiList: serverEmojis,
        jailData: jailData // Jail verisi EJS'ye gönderiliyor
    });
});

// ====================================================
// 5. AYARLARI KAYDETME ROTASI (API)
// ====================================================
router.post('/dashboard/:guildId/:module/save', isAuthenticated, async (req, res) => {
    const { guildId, module } = req.params;
    const data = req.body;
    
    const guild = req.client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Server not found' });
    const member = guild.members.cache.get(req.user.id);
    if (!member || !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        if (module === 'social_notify') {
            let socialSettings = await SocialNotify.findOne({ guildId: guildId });
            if (!socialSettings) socialSettings = new SocialNotify({ guildId: guildId });

            socialSettings.status = data.notify_status === true || data.notify_status === 'on';
            socialSettings.platform = data.platform;
            socialSettings.channelId = data.target_username;
            socialSettings.discordChannelId = data.notify_channel;
            socialSettings.customMessage = data.notify_msg;

            await socialSettings.save();
        } 
        else {
            let settings = await GuildSettings.findOne({ guildId: guildId });
            if (!settings) settings = new GuildSettings({ guildId: guildId });

            const isTrue = (val) => val === true || val === 'on' || val === 'true';

            if (module === 'moderation') {
                // Moderasyon objesi yoksa oluştur
                if (!settings.moderation) settings.moderation = {};
                if (!settings.moderation.jail) settings.moderation.jail = {};

                // Standart Komutlar
                settings.moderation.status = isTrue(data.mod_status);
                settings.moderation.ban_cmd = isTrue(data.ban_cmd);
                settings.moderation.unban_cmd = isTrue(data.unban_cmd);
                settings.moderation.kick_cmd = isTrue(data.kick_cmd);
                settings.moderation.timeout_cmd = isTrue(data.timeout_cmd);
                settings.moderation.untimeout_cmd = isTrue(data.untimeout_cmd);
                settings.moderation.lock_cmd = isTrue(data.lock_cmd);
                settings.moderation.unlock_cmd = isTrue(data.unlock_cmd);
                settings.moderation.clear_cmd = isTrue(data.clear_cmd);

                // JAIL SETUP SÜRECİ
                // Eğer frontend'den "setup yapıldı" sinyali gelirse
                if (data.jail_setup_process === true || data.jail_setup_process === 'true') {
                    settings.moderation.jail = {
                        isSetup: true,
                        channel: data.jail_channel,
                        role: data.jail_role,
                        jail_active: isTrue(data.jail_status),
                        unjail_active: isTrue(data.unjail_status)
                    };
                }
                // Setup zaten varsa sadece açma/kapama durumlarını güncelle
                else if (settings.moderation.jail.isSetup) {
                    if (data.jail_status !== undefined) settings.moderation.jail.jail_active = isTrue(data.jail_status);
                    if (data.unjail_status !== undefined) settings.moderation.jail.unjail_active = isTrue(data.unjail_status);
                }

            } else if (module === 'levels') {
                settings.levels = { status: isTrue(data.level_status), message: data.level_msg, channel: data.level_channel, xp_rate: data.xp_rate };
            } else if (module === 'giveaway') {
                settings.giveaway = { manager_role: data.giveaway_manager, emoji: data.default_emoji };
            } else if (module === 'welcome') {
                settings.welcome = { status: isTrue(data.welcome_status), channel: data.welcome_channel, message: data.welcome_text };
            } else if (module === 'suggestion') {
                settings.suggestion = { channel: data.sug_channel, auto_thread: isTrue(data.auto_thread) };
            } else if (module === 'tickets') {
                settings.tickets = { status: isTrue(data.ticket_status), log_channel: data.transcript_channel, support_role: data.support_role, limit: data.max_tickets };
            } else if (module === 'registration') {
                settings.registration = { status: isTrue(data.reg_status), channel: data.reg_channel, unreg_role: data.unreg_role, reg_role: data.reg_role };
            } else if (module === 'logging') {
                settings.logging = { status: isTrue(data.log_all), msg_log: data.msg_log, voice_log: data.voice_log, member_log: data.member_log };
            } else if (module === 'invites') {
                settings.invites = { status: isTrue(data.inv_status), log_channel: data.inv_log };
            } else if (module === 'jtc') {
                settings.jtc = { status: isTrue(data.jtc_status), hub_channel: data.hub_channel };
            } else if (module === 'wordgame') {
                settings.wordgame = { channel: data.wg_channel, language: data.wg_lang };
            } else if (module === 'counting') {
                settings.counting = { channel: data.count_channel, fail_reset: isTrue(data.fail_reset) };
            } else if (module === 'economy') {
                settings.economy = { status: isTrue(data.eco_status), symbol: data.currency_sym, start_balance: Number(data.start_bal), daily_reward: Number(data.daily_rew) };
            }

            await settings.save();
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Settings Save Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// YASAL SAYFALAR
router.get('/terms', (req, res) => res.render('terms', { layout: false, user: req.client.user }));
router.get('/privacy', (req, res) => res.render('privacy', { layout: false, user: req.client.user }));

module.exports = router;