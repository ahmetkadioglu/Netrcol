const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpers = require('../../utils/helpers');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)),
    async execute(interaction) {
        const { options, guild, member } = interaction;

        if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                flags: 64
            });
        }

        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided';

        if (user.id === member.user.id) {
            return interaction.reply({ 
                content: '❌ You cannot ban yourself!', 
                flags: 64
            });
        }

        try {
            const targetMember = await guild.members.fetch(user.id);
            if (!helpers.canModerate(member, targetMember)) {
                return interaction.reply({ 
                    content: '❌ You cannot ban this user!', 
                    flags: 64
                });
            }

            await guild.members.ban(user, { reason });

            // Log the action
            await helpers.sendLog(guild, {
                type: 'member_ban',
                title: '🔨 Member Banned',
                description: `**${user.tag}** has been banned from the server`,
                fields: [
                    { name: 'User', value: `${user}`, inline: true },
                    { name: 'Moderator', value: `${member}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ],
                color: '#FF0000'
            });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 User Banned')
                .addFields(
                    { name: 'User', value: `${user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: member.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Ban failed: ${error.message}`, 
                flags: 64
            });
        }
    },
};