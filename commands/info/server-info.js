const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Sunucu bilgilerini gösterir'),
    async execute(interaction) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle("📊 Server Information")
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },
                { name: '📁 Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: '🌐 Server ID', value: guild.id, inline: true },
                { name: '🔐 Verification', value: guild.verificationLevel.toString(), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};