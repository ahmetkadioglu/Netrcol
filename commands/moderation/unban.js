const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpers = require('../../utils/helpers');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unbans a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The user ID to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false)),
    async execute(interaction) {
        const { options, guild, member } = interaction;

        if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                flags: 64
            });
        }

        const userId = options.getString('userid');
        const reason = options.getString('reason') || 'No reason provided';

        try {
            await guild.members.unban(userId, reason);

            // Log the action
            await helpers.sendLog(guild, {
                type: 'member_unban',
                title: '🔓 Member Unbanned',
                description: `User with ID **${userId}** has been unbanned from the server`,
                fields: [
                    { name: 'User ID', value: userId, inline: true },
                    { name: 'Moderator', value: `${member}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ],
                color: '#00FF00'
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔓 User Unbanned')
                .addFields(
                    { name: 'User ID', value: userId, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: member.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Unban failed: ${error.message}`, 
                flags: 64
            });
        }
    },
};