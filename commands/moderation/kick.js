const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpers = require('../../utils/helpers');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)),
    async execute(interaction) {
        const { options, guild, member } = interaction;

        if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                flags: 64
            });
        }

        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided';

        if (user.id === member.user.id) {
            return interaction.reply({ 
                content: '❌ You cannot kick yourself!', 
                flags: 64
            });
        }

        try {
            const targetMember = await guild.members.fetch(user.id);
            if (!helpers.canModerate(member, targetMember)) {
                return interaction.reply({ 
                    content: '❌ You cannot kick this user!', 
                    flags: 64
                });
            }

            await targetMember.kick(reason);

            // Log the action
            await helpers.sendLog(guild, {
                type: 'member_kick',
                title: '👢 Member Kicked',
                description: `**${user.tag}** has been kicked from the server`,
                fields: [
                    { name: 'User', value: `${user}`, inline: true },
                    { name: 'Moderator', value: `${member}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ],
                color: '#FFFF00'
            });

            const embed = new EmbedBuilder()
                .setColor('#FFFF00')
                .setTitle('👢 User Kicked')
                .addFields(
                    { name: 'User', value: `${user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: member.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Kick failed: ${error.message}`, 
                flags: 64
            });
        }
    },
};