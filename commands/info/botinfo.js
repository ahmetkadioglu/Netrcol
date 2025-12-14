const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Bot istatistiklerini gösterir'),
    async execute(interaction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle("🤖 Bot Information")
            .addFields(
                { name: '🌐 Servers', value: `${interaction.client.guilds.cache.size}`, inline: true },
                { name: '👥 Users', value: `${interaction.client.users.cache.size}`, inline: true },
                { name: '📅 Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
                { name: '🏓 Ping', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true },
                { name: '💾 Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: '📚 Discord.js', value: `v${require('discord.js').version}`, inline: true },
                { name: '⚙️ Node.js', value: process.version, inline: true }
            )
            .setFooter({ text: 'Netrcol Bot v0.2.8' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};