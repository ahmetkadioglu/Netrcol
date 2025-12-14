const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');
const helpers = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: '❌ You need **Moderate Members** permission.', flags: 64 });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        if (user.id === interaction.user.id || user.bot) {
            return interaction.reply({ content: '❌ You cannot warn yourself or a bot.', flags: 64 });
        }

        await db.addWarning(interaction.guild.id, user.id, interaction.user.id, reason);

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('⚠️ User Warned')
            .addFields(
                { name: 'User', value: `${user.tag}`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Kullanıcıya DM at
        user.send(`⚠️ You were warned in **${interaction.guild.name}** | Reason: ${reason}`).catch(() => {});

        // Logla
        await helpers.sendLog(interaction.guild, {
            type: 'member_warn',
            title: '⚠️ Member Warned',
            description: `**${user.tag}** received a warning.`,
            fields: [
                { name: 'User', value: `${user}`, inline: true },
                { name: 'Moderator', value: `${interaction.user}`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            ],
            color: '#FEE75C'
        });
    },
};