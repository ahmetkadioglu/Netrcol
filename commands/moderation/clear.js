const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpers = require('../../utils/helpers');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Deletes specified number of messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)),
    async execute(interaction) {
        const { options, guild, member, channel } = interaction;

        if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                flags: 64
            });
        }

        const amount = options.getInteger('amount');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ 
                content: '❌ Please provide a number between 1 and 100!', 
                flags: 64
            });
        }

        try {
            const messages = await channel.bulkDelete(amount, true);
            
            // Log the action
            await helpers.sendLog(guild, {
                type: 'message_delete',
                title: '🧹 Messages Cleared',
                description: `${messages.size} messages were deleted`,
                fields: [
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Moderator', value: `${member}`, inline: true },
                    { name: 'Messages Deleted', value: `${messages.size}`, inline: true }
                ],
                color: '#800080'
            });

            const embed = new EmbedBuilder()
                .setColor('#800080')
                .setTitle('🧹 Messages Cleared')
                .setDescription(`${messages.size} messages have been successfully deleted.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Message clearing failed: ${error.message}`, 
                flags: 64
            });
        }
    },
};