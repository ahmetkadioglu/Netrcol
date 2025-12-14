// commands/utility/afk.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your status to AFK (Away From Keyboard)')
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Why are you going AFK?')
                .setRequired(false)
        ),
    async execute(interaction) {
        const reason = interaction.options.getString('reason') || 'Just AFK';
        
        // Veritabanına kaydet
        await db.setAfk(interaction.user.id, interaction.guild.id, reason);

        // Kullanıcının ismini değiştir (Opsiyonel - Yetki varsa)
        // if (interaction.member.manageable) {
        //     await interaction.member.setNickname(`[AFK] ${interaction.user.username}`).catch(() => {});
        // }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setDescription(`💤 **${interaction.user.username}** is now AFK: ${reason}`);

        await interaction.reply({ embeds: [embed] });
    },
};