const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Bot ping ve gecikme bilgisi'),
    async execute(interaction) {
        const wsPing = Math.round(interaction.client.ws.ping);
        const msgLatency = Math.abs(Date.now() - interaction.createdTimestamp);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle("🏓 System Latency")
            .setDescription(`**WebSocket Ping:** \`${wsPing}ms\`\n**Message Latency:** \`${msgLatency}ms\``)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};