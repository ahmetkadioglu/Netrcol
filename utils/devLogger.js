// utils/devLogger.js
const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

class DevLogger {
    async sendLog(client, type, data) {
        try {
            const channelId = config.logChannels[type];
            if (!channelId) return console.log(`❌ Log Channel ID not found for type: ${type}`);

            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) return console.log(`❌ Log Channel not found: ${channelId}`);

            const embed = new EmbedBuilder().setTimestamp();

            switch (type) {
                case 'blacklist':
                    embed.setTitle('⛔ Blacklist Action')
                        .setColor('#ED4245')
                        .addFields(
                            { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                            { name: 'Action', value: data.action, inline: true }, // Added/Removed
                            { name: 'Moderator', value: `<@${data.moderatorId}>`, inline: true },
                            { name: 'Reason', value: data.reason || 'No reason' }
                        );
                    break;

                case 'premium':
                    embed.setTitle('💎 Premium Action')
                        .setColor('#F47FFF')
                        .addFields(
                            { name: 'Guild ID', value: data.guildId, inline: true },
                            { name: 'Duration', value: `${data.days} Days`, inline: true },
                            { name: 'Moderator', value: `<@${data.moderatorId}>`, inline: true },
                            { name: 'Expires', value: `<t:${Math.floor(data.expiresAt / 1000)}:R>` }
                        );
                    break;

                case 'rateLimit':
                    embed.setTitle('⏳ Rate Limit Hit')
                        .setColor('#FEE75C')
                        .addFields(
                            { name: 'User', value: `${data.user.tag} (${data.user.id})`, inline: true },
                            { name: 'Command', value: data.command, inline: true },
                            { name: 'Wait Time', value: `${data.time}s`, inline: true }
                        );
                    break;

                case 'guild':
                    embed.setTitle(data.action === 'join' ? '🟢 Bot Added to Guild' : '🔴 Bot Removed from Guild')
                        .setColor(data.action === 'join' ? '#57F287' : '#ED4245')
                        .setThumbnail(data.guild.iconURL())
                        .addFields(
                            { name: 'Guild', value: `${data.guild.name} (${data.guild.id})`, inline: true },
                            { name: 'Owner', value: `${data.ownerTag} (${data.ownerId})`, inline: true },
                            { name: 'Members', value: `${data.memberCount}`, inline: true },
                            { name: 'Added By', value: `<@${data.adderId}>`, inline: true } // Sadece join'de
                        );
                    if (data.invite) embed.addFields({ name: 'Invite', value: data.invite });
                    break;

                case 'dm':
                    embed.setTitle('📩 DM Received')
                        .setColor('#5865F2')
                        .setAuthor({ name: data.user.tag, iconURL: data.user.displayAvatarURL() })
                        .setDescription(data.content || '(Attachment)')
                        .setFooter({ text: `User ID: ${data.user.id}` });
                    if (data.image) embed.setImage(data.image);
                    break;

                case 'error':
                    embed.setTitle('❌ System Error')
                        .setColor('#000000')
                        .setDescription(`\`\`\`js\n${data.error.stack?.slice(0, 1000) || data.error}\n\`\`\``)
                        .addFields(
                            { name: 'Command', value: data.command || 'Unknown', inline: true },
                            { name: 'User', value: data.user ? `${data.user.tag} (${data.user.id})` : 'Unknown', inline: true }
                        );
                    break;
            }

            await channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('DevLogger Error:', error);
        }
    }
}

module.exports = new DevLogger();