const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpers = require('../../utils/helpers');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Applies timeout to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration in minutes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
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
        const duration = parseInt(options.getString('duration'));
        const reason = options.getString('reason') || 'No reason provided';

        if (user.id === member.user.id) {
            return interaction.reply({ 
                content: '❌ You cannot timeout yourself!', 
                flags: 64
            });
        }

        if (isNaN(duration) || duration < 1) {
            return interaction.reply({ 
                content: '❌ Please provide a valid duration!', 
                flags: 64
            });
        }

        try {
            const targetMember = await guild.members.fetch(user.id);
            if (!helpers.canModerate(member, targetMember)) {
                return interaction.reply({ 
                    content: '❌ You cannot timeout this user!', 
                    flags: 64
                });
            }

            const durationMs = duration * 60 * 1000;
            await targetMember.timeout(durationMs, reason);

            // Log the action
            await helpers.sendLog(guild, {
                type: 'member_timeout',
                title: '⏰ Timeout Applied',
                description: `**${user.tag}** has been timed out`,
                fields: [
                    { name: 'User', value: `${user}`, inline: true },
                    { name: 'Duration', value: `${duration} minutes`, inline: true },
                    { name: 'Moderator', value: `${member}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ],
                color: '#FFA500'
            });

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⏰ Timeout Applied')
                .addFields(
                    { name: 'User', value: `${user.tag}`, inline: true },
                    { name: 'Duration', value: `${duration} minutes`, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: member.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Timeout failed: ${error.message}`, 
                flags: 64 
            });
        }
    },
};