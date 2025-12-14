// events/developerGuildLogs.js - BOT JOIN/LEAVE LOGS
const { Events, ChannelType, PermissionsBitField } = require('discord.js');
const devLogger = require('../utils/devLogger');

module.exports = {
    // 🟢 BOT SUNUCUYA EKLENDİ
    botJoin: {
        name: Events.GuildCreate,
        async execute(guild) {
            // Davet Linki Oluşturma Denemesi (Logda görünmesi için)
            let inviteLink = 'No Permission';
            try {
                // Önce var olan davetleri kontrol et
                const invites = await guild.invites.fetch().catch(() => new Map());
                const infiniteInvite = invites.find(inv => inv.maxAge === 0);
                
                if (infiniteInvite) {
                    inviteLink = infiniteInvite.url;
                } else if (guild.members.me.permissions.has(PermissionsBitField.Flags.CreateInstantInvite)) {
                    // Yoksa ve yetki varsa yeni oluştur
                    const channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText);
                    if (channel) {
                        const newInv = await channel.createInvite({ maxAge: 0, maxUses: 0 });
                        inviteLink = newInv.url;
                    }
                }
            } catch (e) {
                // Yetki yoksa veya hata varsa boşver
            }

            // Ekleyen kişiyi bulmaya çalış (Audit Log)
            let adderId = 'Unknown';
            try {
                if (guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
                    const logs = await guild.fetchAuditLogs({ limit: 1, type: 28 }); // 28 = BOT_ADD
                    const entry = logs.entries.first();
                    if (entry) adderId = entry.executor.id;
                }
            } catch (e) {}

            // Sahibin bilgisini al
            let ownerTag = 'Unknown';
            try {
                const owner = await guild.fetchOwner();
                ownerTag = owner.user.tag;
            } catch (e) {}

            // Logu Gönder
            await devLogger.sendLog(guild.client, 'guild', {
                action: 'join',
                guild,
                ownerTag,
                ownerId: guild.ownerId,
                memberCount: guild.memberCount,
                adderId,
                invite: inviteLink
            });
        }
    },

    // 🔴 BOT SUNUCUDAN ATILDI
    botLeave: {
        name: Events.GuildDelete,
        async execute(guild) {
            // Sunucudan atıldığımız için fetchOwner çalışmayabilir, cache'den deneriz
            let ownerTag = 'Unknown';
            try {
                if (guild.ownerId) {
                    const owner = await guild.client.users.fetch(guild.ownerId).catch(() => null);
                    if (owner) ownerTag = owner.tag;
                }
            } catch(e) {}

            await devLogger.sendLog(guild.client, 'guild', {
                action: 'leave',
                guild,
                ownerTag,
                ownerId: guild.ownerId,
                memberCount: guild.memberCount || 0,
                adderId: 'N/A'
            });
        }
    }
};