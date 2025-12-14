const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpers = require('../../utils/helpers');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Removes timeout from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove timeout from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for removing timeout')
                .setRequired(false)),
    async execute(interaction) {
        const { options, guild, member } = interaction;

        if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                flags: 64
            });
        }

        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided';

        try {
            const targetMember = await guild.members.fetch(user.id);
            await targetMember.timeout(null, reason);

            // Log the action
            await helpers.sendLog(guild, {
                type: 'member_timeout',
                title: '✅ Timeout Removed',
                description: `**${user.tag}**'s timeout has been removed`,
                fields: [
                    { name: 'User', value: `${user}`, inline: true },
                    { name: 'Moderator', value: `${member}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ],
                color: '#00FF00'
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Timeout Removed')
                .addFields(
                    { name: 'User', value: `${user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: member.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Timeout removal failed: ${error.message}`, 
                flags: 64
            });
        }
    },
};