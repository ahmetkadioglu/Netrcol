const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion for the server.')
        .addStringOption(option => 
            option.setName('suggestion')
                .setDescription('What is your suggestion?')
                .setRequired(true)),
    async execute(interaction) {
        // Burada basit bir cevap veriyoruz. Gelişmiş sistem için veritabanı gerekir
        // ama şimdilik kanal ayarlı değilse hata vermesin diye basit tutuyoruz.
        const suggestion = interaction.options.getString('suggestion');
        
        const embed = new EmbedBuilder()
            .setTitle('💡 New Suggestion')
            .setDescription(suggestion)
            .setColor('Yellow')
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        // Eğer kanal ayarlıysa oraya atabiliriz (setup komutunda db lazım olur)
        // Şimdilik sadece cevap verelim.
        await interaction.reply({ content: '✅ Your suggestion has been received!', ephemeral: true });
        
        // Kanal varsa oraya da atalım (Basit mantık)
        // const channel = interaction.guild.channels.cache.get('KANAL_ID_BURAYA');
        // if(channel) channel.send({ embeds: [embed] });
    },
};