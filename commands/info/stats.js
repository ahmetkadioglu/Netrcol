// commands/info/stats.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
// Database dosyası utils klasöründe olduğu varsayılmıştır
const db = require('../../utils/database'); 

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Displays detailed bot statistics')
        .addBooleanOption(option =>
            option.setName('detailed')
                .setDescription('Show advanced technical statistics')
                .setRequired(false)),
    
    async execute(interaction) {
        // İşlem uzun sürebileceği için defer yapıyoruz
        await interaction.deferReply();
        
        const showDetailed = interaction.options.getBoolean('detailed') || false;
        const client = interaction.client;
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(showDetailed ? '📊 Advanced Bot Statistics' : '🤖 Bot Statistics')
            .setTimestamp();

        if (showDetailed) {
            embed.addFields(
                {
                    name: '🌐 General Info',
                    value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}\n**Channels:** ${client.channels.cache.size}`,
                    inline: true
                },
                {
                    name: '⚡ Performance',
                    value: `**Memory:** ${memoryUsage.toFixed(2)} MB\n**Ping:** ${Math.round(client.ws.ping)}ms\n**Uptime:** ${formatUptime(uptime)}`,
                    inline: true
                },
                {
                    name: '💻 System',
                    value: `**Platform:** ${os.platform()} (${os.arch()})\n**Node.js:** ${process.version}\n**Discord.js:** v${require('discord.js').version}`,
                    inline: true
                }
            );

            // Veritabanı durumu kontrolü
            try {
                const dbHealth = await db.healthCheck();
                embed.addFields({
                    name: '🗃️ Database',
                    value: `**Status:** ${dbHealth.status}\n**Engine:** MongoDB`,
                    inline: true
                });
            } catch (e) {
                embed.addFields({ name: '🗃️ Database', value: '**Status:** Error/Disconnected', inline: true });
            }

        } else {
            // Basit Görünüm
            embed.setDescription('Here are the current statistics for Netrcol Bot:')
                .addFields(
                    { name: '🌐 Servers', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '👥 Users', value: `${client.users.cache.size}`, inline: true },
                    { name: '🏓 Ping', value: `${Math.round(client.ws.ping)}ms`, inline: true },
                    { name: '📅 Uptime', value: formatUptime(uptime), inline: true },
                    { name: '💾 Memory', value: `${memoryUsage.toFixed(2)} MB`, inline: true },
                    { name: '📚 Version', value: `v0.2.8`, inline: true }
                );
        }

        embed.setFooter({ text: `Requested by ${interaction.user.tag}` });

        await interaction.editReply({ embeds: [embed] });
    },
};