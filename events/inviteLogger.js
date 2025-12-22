// events/inviteLogger.js
const { Events, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        try {
            // 1. Veritabanı Kontrolü
            const database = db.db;
            if (!database) return; // Bağlantı yoksa sessizce çık

            // 2. Ayarları Çek
            const settings = await database.collection('guildSettings').findOne({ guildId: member.guild.id });
            
            // Log kanalı ayarlı değilse dur
            if (!settings || !settings.inviteLogChannel) return;

            // 3. Kanalı Bul
            const logChannel = member.guild.channels.cache.get(settings.inviteLogChannel);
            if (!logChannel) return; // Kanal silinmişse dur

            // 4. Davet Hesaplamaları
            const cachedInvites = client.invites.get(member.guild.id);
            const newInvites = await member.guild.invites.fetch().catch(() => null);
            
            if (!newInvites) return;

            let usedInvite = null;
            // Sayısı artan daveti bul
            usedInvite = newInvites.find(inv => {
                const prevUses = cachedInvites ? cachedInvites.get(inv.code) : 0;
                return inv.uses > prevUses;
            });

            // Cache güncelle
            if (cachedInvites) {
                newInvites.each(inv => cachedInvites.set(inv.code, inv.uses));
                client.invites.set(member.guild.id, cachedInvites);
            }

            // 5. Mesajı Gönder
            const inviter = usedInvite ? usedInvite.inviter : null;
            const code = usedInvite ? usedInvite.code : "Unknown";
            const uses = usedInvite ? usedInvite.uses : 0;

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setAuthor({ name: `${member.guild.name} - New Member`, iconURL: member.guild.iconURL() })
                .setDescription(`${member} (**${member.user.tag}**) has joined.`)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: '👤 Inviter', value: inviter ? `${inviter.tag}` : 'Unknown 🤷‍♂️', inline: true },
                    { name: '🎫 Code', value: `\`${code}\``, inline: true },
                    { name: '🔢 Uses', value: `**${uses}**`, inline: true }
                )
                .setFooter({ text: `ID: ${member.id}` })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error(`Invite Log Error (${member.guild.name}):`, error);
        }
    }
};