// commands/levels/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the top ranking members'),
    async execute(interaction) {
        await interaction.deferReply();

        const topUsers = await db.getLeaderboard(interaction.guild.id, 10);

        if (topUsers.length === 0) {
            return interaction.editReply('❌ No data found yet.');
        }

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
            .setDescription('Top 10 most active members')
            .setTimestamp();

        let description = '';
        for (let i = 0; i < topUsers.length; i++) {
            const data = topUsers[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            description += `**${medal}** <@${data.userId}> • **Lvl ${data.level || 0}** (${data.xp.toLocaleString()} XP)\n`;
        }

        embed.setDescription(description);
        await interaction.editReply({ embeds: [embed] });
    },
};