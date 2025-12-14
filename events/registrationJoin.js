// events/registrationJoin.js - DETAILED WELCOME
const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const settings = await db.getRegistrationSettings(member.guild.id);
        const config = settings?.interactive;

        if (!config || !config.registrationChannelId) return;
        const channel = member.guild.channels.cache.get(config.registrationChannelId);
        if (!channel) return;

        if (config.autoRole && config.unregisteredRoleId) {
            const role = member.guild.roles.cache.get(config.unregisteredRoleId);
            if (role) await member.roles.add(role).catch(() => {});
        }
        if (config.autoName) {
            await member.setNickname('Unregistered').catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('👋 Welcome to the Server!')
            .setDescription(`Hello ${member}, welcome to **${member.guild.name}**! 🎉\n\nPlease follow the instructions below to get registered.`)
            .addFields(
                { name: '🆔 User ID', value: `\`${member.id}\``, inline: true },
                { name: '📅 Created At', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📝 Instructions', value: 'Please provide your **Name** and **Age** when requested.', inline: false }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: 'Waiting for registration...' })
            .setTimestamp();

        const btn = new ButtonBuilder().setCustomId(`reg_btn_${member.id}`).setLabel('Register User').setStyle(ButtonStyle.Success).setEmoji('📝');
        const row = new ActionRowBuilder().addComponents(btn);

        await channel.send({ content: `${member}`, embeds: [embed], components: [row] });
    }
};