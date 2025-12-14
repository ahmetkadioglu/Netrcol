const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View user warnings')
        .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: '❌ Permission denied.', flags: 64 });
        }

        const user = interaction.options.getUser('user');
        const warnings = await db.getWarnings(interaction.guild.id, user.id);

        if (warnings.length === 0) {
            return interaction.reply({ content: `✅ **${user.tag}** has no warnings.`, flags: 64 });
        }

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle(`⚠️ Warnings for ${user.tag}`)
            .setFooter({ text: `Total: ${warnings.length}` });

        // Son 10 uyarıyı göster
        warnings.slice(-10).forEach((w, i) => {
            embed.addFields({
                name: `Case #${w.caseId} • <t:${Math.floor(new Date(w.timestamp).getTime()/1000)}:d>`,
                value: `**Mod:** <@${w.moderatorId}>\n**Reason:** ${w.reason}`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    },
};