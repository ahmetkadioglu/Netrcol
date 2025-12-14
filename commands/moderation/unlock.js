const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpers = require('../../utils/helpers');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlocks the current channel'),
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
                SendMessages: null
            });

            // Log the action
            await helpers.sendLog(guild, {
                type: 'channel_update',
                title: '🔓 Channel Unlocked',
                description: `**${channel.name}** has been unlocked`,
                fields: [
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Moderator', value: `${member}`, inline: true }
                ],
                color: '#00FF00'
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔓 Channel Unlocked')
                .setDescription('This channel has been unlocked.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Channel unlocking failed: ${error.message}`, 
                flags: 64
            });
        }
    },
};