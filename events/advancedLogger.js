// events/advancedLogger.js - THE MASTER LOGGER (ULTRA VERSION)
const { Events, AuditLogEvent, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

// Yardımcı: Log Gönderici
async function sendLog(guild, logKey, embedData) {
    const settings = await db.getGuildSettings(guild.id);
    const logs = settings.logs || {};

    // 1. Ayar Açık mı? (Eğer veritabanında ayar yoksa varsayılan olarak loglama yapmaz)
    // "Enable ALL" tuşuna bastığında hepsi true oluyor.
    if (!logs[logKey]) return;

    // 2. Kanal Var mı?
    const channelId = logs.channelId;
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    // 3. Embed Oluştur ve Gönder
    const embed = new EmbedBuilder(embedData).setTimestamp();
    await channel.send({ embeds: [embed] }).catch(() => {});
}

// Yardımcı: Audit Log Çekici (Yapan kişiyi bulmak için)
async function getExecutor(guild, type, targetId) {
    try {
        if (!guild.members.me.permissions.has('ViewAuditLog')) return null;
        const logs = await guild.fetchAuditLogs({ limit: 1, type });
        const entry = logs.entries.first();
        // Log yeni mi (5 sn) ve hedef doğru mu?
        if (entry && (Date.now() - entry.createdTimestamp) < 10000) {
            // Target kontrolü her zaman ID ile eşleşmeyebilir (örn: kanal silme), bu yüzden esnek tutuyoruz
            return entry.executor;
        }
    } catch (e) { return null; }
    return null;
}

module.exports = {
    name: "advancedLogger", // index.js için referans

    // ====================================================
    // 🛡️ 1. MODERATION & MEMBER STATUS
    // ====================================================
    
    // BAN
    async guildBanAdd(ban) {
        const executor = await getExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
        await sendLog(ban.guild, 'guildBanAdd', {
            title: '🔨 Member Banned',
            color: 0xFF0000,
            thumbnail: { url: ban.user.displayAvatarURL() },
            fields: [
                { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
                { name: 'Moderator', value: executor ? `${executor.tag}` : 'Unknown', inline: true }
            ]
        });
    },
    // UNBAN
    async guildBanRemove(ban) {
        const executor = await getExecutor(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
        await sendLog(ban.guild, 'guildBanRemove', {
            title: '🔓 Member Unbanned',
            color: 0x57F287,
            fields: [
                { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
                { name: 'Moderator', value: executor ? `${executor.tag}` : 'Unknown', inline: true }
            ]
        });
    },
    // JOIN
    async guildMemberAdd(member) {
        await sendLog(member.guild, 'guildMemberAdd', {
            title: '📥 Member Joined',
            color: 0x57F287,
            thumbnail: { url: member.user.displayAvatarURL() },
            fields: [
                { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                { name: 'Created At', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Count', value: `${member.guild.memberCount}`, inline: true }
            ]
        });
    },
    // LEAVE & KICK
    async guildMemberRemove(member) {
        const kickLog = await getExecutor(member.guild, AuditLogEvent.MemberKick, member.id);
        if (kickLog) {
            await sendLog(member.guild, 'memberKick', {
                title: '👢 Member Kicked',
                color: 0xED4245,
                thumbnail: { url: member.user.displayAvatarURL() },
                fields: [
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Moderator', value: `${kickLog.tag}`, inline: true }
                ]
            });
        } else {
            await sendLog(member.guild, 'guildMemberRemove', {
                title: '📤 Member Left',
                color: 0xED4245,
                thumbnail: { url: member.user.displayAvatarURL() },
                fields: [
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Joined', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
                    { name: 'Count', value: `${member.guild.memberCount}`, inline: true }
                ]
            });
        }
    },

    // MEMBER UPDATES (Role, Nickname, Timeout)
    async guildMemberUpdate(oldMember, newMember) {
        const guild = newMember.guild;

        // Nickname
        if (oldMember.nickname !== newMember.nickname) {
            await sendLog(guild, 'memberNickname', {
                title: '📝 Nickname Changed',
                color: 0xFEE75C,
                author: { name: newMember.user.tag, icon_url: newMember.user.displayAvatarURL() },
                fields: [
                    { name: 'Before', value: oldMember.nickname || oldMember.user.username, inline: true },
                    { name: 'After', value: newMember.nickname || newMember.user.username, inline: true }
                ]
            });
        }

        // Roles
        const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
        const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
        if (addedRoles.size > 0 || removedRoles.size > 0) {
            const executor = await getExecutor(guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
            if (addedRoles.size > 0) {
                await sendLog(guild, 'memberRoleUpdate', {
                    title: '📈 Roles Given',
                    color: 0x57F287,
                    fields: [
                        { name: 'User', value: `${newMember.user.tag}`, inline: true },
                        { name: 'Roles', value: addedRoles.map(r => r.toString()).join(', '), inline: true },
                        { name: 'By', value: executor ? executor.tag : 'Unknown', inline: true }
                    ]
                });
            }
            if (removedRoles.size > 0) {
                await sendLog(guild, 'memberRoleUpdate', {
                    title: '📉 Roles Removed',
                    color: 0xED4245,
                    fields: [
                        { name: 'User', value: `${newMember.user.tag}`, inline: true },
                        { name: 'Roles', value: removedRoles.map(r => r.toString()).join(', '), inline: true },
                        { name: 'By', value: executor ? executor.tag : 'Unknown', inline: true }
                    ]
                });
            }
        }

        // Timeout
        if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
            const executor = await getExecutor(guild, AuditLogEvent.MemberUpdate, newMember.id);
            await sendLog(guild, 'memberTimeout', {
                title: '🔇 Member Timed Out',
                color: 0x000000,
                fields: [
                    { name: 'User', value: `${newMember.user.tag}`, inline: true },
                    { name: 'Until', value: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:R>`, inline: true },
                    { name: 'By', value: executor ? executor.tag : 'Unknown', inline: true }
                ]
            });
        }
        if (oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()) {
            const executor = await getExecutor(guild, AuditLogEvent.MemberUpdate, newMember.id);
            await sendLog(guild, 'memberTimeout', {
                title: '🔊 Timeout Removed',
                color: 0x57F287,
                fields: [
                    { name: 'User', value: `${newMember.user.tag}`, inline: true },
                    { name: 'By', value: executor ? executor.tag : 'Unknown', inline: true }
                ]
            });
        }
    },

    // ====================================================
    // 💬 2. MESSAGE LOGS
    // ====================================================
    async messageDelete(message) {
        if (!message.guild || message.author?.bot) return;
        const executor = await getExecutor(message.guild, AuditLogEvent.MessageDelete, message.id);
        await sendLog(message.guild, 'messageDelete', {
            title: '🗑️ Message Deleted',
            color: 0xED4245,
            description: message.content ? message.content.substring(0, 1000) : '[Image/Embed]',
            fields: [
                { name: 'Author', value: `${message.author.tag}`, inline: true },
                { name: 'Channel', value: `${message.channel}`, inline: true },
                { name: 'Deleted By', value: executor ? executor.tag : 'Self/Unknown', inline: true }
            ]
        });
    },
    async messageUpdate(oldMessage, newMessage) {
        if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
        await sendLog(newMessage.guild, 'messageUpdate', {
            title: '✏️ Message Edited',
            color: 0xFEE75C,
            description: `**Before:**\n${oldMessage.content?.substring(0, 500)}\n\n**After:**\n${newMessage.content?.substring(0, 500)}`,
            fields: [
                { name: 'Author', value: `${newMessage.author.tag}`, inline: true },
                { name: 'Channel', value: `${newMessage.channel}`, inline: true },
                { name: 'Link', value: `[Jump](${newMessage.url})`, inline: true }
            ]
        });
    },

    // ====================================================
    // 📂 3. CHANNEL & THREAD LOGS
    // ====================================================
    async channelCreate(channel) {
        if (!channel.guild) return;
        await sendLog(channel.guild, 'channelCreate', {
            title: '🆕 Channel Created',
            color: 0x57F287,
            fields: [{ name: 'Name', value: `#${channel.name}`, inline: true }, { name: 'Type', value: `${channel.type}`, inline: true }]
        });
    },
    async channelDelete(channel) {
        if (!channel.guild) return;
        await sendLog(channel.guild, 'channelDelete', {
            title: '🗑️ Channel Deleted',
            color: 0xED4245,
            fields: [{ name: 'Name', value: `#${channel.name}`, inline: true }]
        });
    },
    async channelUpdate(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        if (oldChannel.name !== newChannel.name) {
            await sendLog(newChannel.guild, 'channelUpdate', {
                title: '📝 Channel Renamed',
                color: 0xFEE75C,
                fields: [{ name: 'Old', value: oldChannel.name, inline: true }, { name: 'New', value: newChannel.name, inline: true }]
            });
        }
        // İzin değişikliklerini algılamak karmaşıktır ama basitçe:
        if (oldChannel.permissionOverwrites.cache.size !== newChannel.permissionOverwrites.cache.size) {
            await sendLog(newChannel.guild, 'channelUpdate', {
                title: '🔒 Channel Permissions Updated',
                color: 0xFEE75C,
                fields: [{ name: 'Channel', value: `#${newChannel.name}`, inline: true }]
            });
        }
    },
    async threadCreate(thread) {
        if (!thread.guild) return;
        await sendLog(thread.guild, 'threadCreate', {
            title: '🧵 Thread Created',
            color: 0x57F287,
            fields: [{ name: 'Name', value: thread.name, inline: true }, { name: 'Parent', value: `<#${thread.parentId}>`, inline: true }]
        });
    },
    async threadDelete(thread) {
        if (!thread.guild) return;
        await sendLog(thread.guild, 'threadDelete', {
            title: '🗑️ Thread Deleted',
            color: 0xED4245,
            fields: [{ name: 'Name', value: thread.name, inline: true }]
        });
    },

    // ====================================================
    // 🎭 4. ROLE LOGS
    // ====================================================
    async roleCreate(role) {
        await sendLog(role.guild, 'roleCreate', { title: '🛡️ Role Created', color: 0x57F287, fields: [{ name: 'Name', value: role.name, inline: true }] });
    },
    async roleDelete(role) {
        await sendLog(role.guild, 'roleDelete', { title: '🗑️ Role Deleted', color: 0xED4245, fields: [{ name: 'Name', value: role.name, inline: true }] });
    },
    async roleUpdate(oldRole, newRole) {
        if (oldRole.name !== newRole.name) {
            await sendLog(newRole.guild, 'roleUpdate', {
                title: '📝 Role Renamed',
                color: 0xFEE75C,
                fields: [{ name: 'Old', value: oldRole.name, inline: true }, { name: 'New', value: newRole.name, inline: true }]
            });
        }
        // İzin değişiklikleri
        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            await sendLog(newRole.guild, 'roleUpdate', {
                title: '🔒 Role Permissions Updated',
                color: 0xFEE75C,
                fields: [{ name: 'Role', value: newRole.name, inline: true }]
            });
        }
    },

    // ====================================================
    // 🌍 5. SERVER & INVITE LOGS
    // ====================================================
    async guildUpdate(oldGuild, newGuild) {
        if (oldGuild.name !== newGuild.name) {
            await sendLog(newGuild, 'guildUpdate', {
                title: '🌍 Server Name Changed',
                color: 0xFEE75C,
                fields: [{ name: 'Old', value: oldGuild.name, inline: true }, { name: 'New', value: newGuild.name, inline: true }]
            });
        }
        if (oldGuild.icon !== newGuild.icon) {
            await sendLog(newGuild, 'guildUpdate', {
                title: '🖼️ Server Icon Changed',
                color: 0xFEE75C,
                thumbnail: { url: newGuild.iconURL() }
            });
        }
    },
    async inviteCreate(invite) {
        if (!invite.guild) return;
        await sendLog(invite.guild, 'inviteUpdate', {
            title: '📨 Invite Created',
            color: 0x57F287,
            fields: [
                { name: 'Code', value: invite.code, inline: true },
                { name: 'Creator', value: invite.inviter ? invite.inviter.tag : 'Unknown', inline: true },
                { name: 'Max Uses', value: `${invite.maxUses || 'Infinite'}`, inline: true }
            ]
        });
    },
    async inviteDelete(invite) {
        if (!invite.guild) return;
        await sendLog(invite.guild, 'inviteUpdate', {
            title: '🗑️ Invite Deleted',
            color: 0xED4245,
            fields: [{ name: 'Code', value: invite.code, inline: true }]
        });
    },

    // ====================================================
    // 🔊 6. VOICE LOGS
    // ====================================================
    async voiceStateUpdate(oldState, newState) {
        const member = newState.member;
        const guild = newState.guild;

        // Join
        if (!oldState.channelId && newState.channelId) {
            await sendLog(guild, 'voiceJoin', {
                title: '🔊 Joined Voice',
                color: 0x57F287,
                fields: [{ name: 'User', value: member.user.tag, inline: true }, { name: 'Channel', value: `<#${newState.channelId}>`, inline: true }]
            });
        }
        // Leave
        else if (oldState.channelId && !newState.channelId) {
            await sendLog(guild, 'voiceLeave', {
                title: '🔇 Left Voice',
                color: 0xED4245,
                fields: [{ name: 'User', value: member.user.tag, inline: true }, { name: 'Channel', value: `<#${oldState.channelId}>`, inline: true }]
            });
        }
        // Move
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            await sendLog(guild, 'voiceMove', {
                title: '↔️ Moved Voice',
                color: 0x5865F2,
                fields: [
                    { name: 'User', value: member.user.tag, inline: true },
                    { name: 'From', value: `<#${oldState.channelId}>`, inline: true },
                    { name: 'To', value: `<#${newState.channelId}>`, inline: true }
                ]
            });
        }
        // Mute/Deaf
        else if (oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) {
            let action = [];
            if (oldState.serverMute !== newState.serverMute) action.push(newState.serverMute ? 'Server Muted' : 'Server Unmuted');
            if (oldState.serverDeaf !== newState.serverDeaf) action.push(newState.serverDeaf ? 'Server Deafened' : 'Server Undeafened');
            
            if (action.length > 0) {
                await sendLog(guild, 'voiceState', {
                    title: '🎙️ Voice State Update',
                    color: 0xFEE75C,
                    fields: [{ name: 'User', value: member.user.tag, inline: true }, { name: 'Action', value: action.join(', '), inline: true }]
                });
            }
        }
    }
};