const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpers = require('../../utils/helpers');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Locks the current channel'),
    async execute(interaction) {
        const { guild, member, channel } = interaction;

        if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                flags: 64 
            });
        }

        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: false
            });

            // Log the action
            await helpers.sendLog(guild, {
                type: 'channel_update',
                title: '🔒 Channel Locked',
                description: `**${channel.name}** has been locked`,
                fields: [
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Moderator', value: `${member}`, inline: true }
                ],
                color: '#FFA500'
            });

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🔒 Channel Locked')
                .setDescription('This channel has been locked.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Channel locking failed: ${error.message}`, 
                flags: 64 
            });
        }
    },
};