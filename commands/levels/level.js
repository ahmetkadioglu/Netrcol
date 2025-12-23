const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const Canvacord = require('canvacord');
const db = require('../../utils/database');
const LevelConfig = require('../../models/levelConfig'); // 🟢 Model eklendi

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your or another user\'s level and XP.')
        .addUserOption(option => 
            option.setName('user').setDescription('The user to check')),
    async execute(interaction) {
        // 🛑 1. SİSTEM KONTROLÜ
        const config = await LevelConfig.findOne({ guildId: interaction.guild.id });
        // Ayar varsa VE kapalıysa komutu durdur
        if (config && config.isActive === false) {
            return interaction.reply({ 
                content: '⛔ **The Level System is currently disabled on this server.**', 
                ephemeral: true 
            });
        }

        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const user = await db.getUser(targetUser.id, interaction.guild.id);

        if (!user || !user.xp) {
            return interaction.editReply('❌ This user has no XP yet.');
        }

        // Rank hesaplama (Basit formül: Level * 100)^2 benzeri bir mantıkla progress
        const currentLevel = user.level || 0;
        const currentXP = user.xp;
        const requiredXP = (currentLevel + 1) * 10 * (currentLevel + 1) * 10; // Örnek formül
        
        // Bu kısım senin mevcut veritabanı mantığına göre değişebilir, 
        // önceki çalışan kodundaki rank kartı oluşturma kısmını buraya aynen koru.
        // Ben örnek bir kart yapısı koyuyorum:

        const rank = new Canvacord.Rank()
            .setAvatar(targetUser.displayAvatarURL({ extension: 'png', forceStatic: true }))
            .setCurrentXP(currentXP)
            .setRequiredXP(requiredXP) // Gerekirse veritabanından hedefi çek
            .setLevel(currentLevel)
            .setStatus(interaction.guild.members.cache.get(targetUser.id)?.presence?.status || 'offline')
            .setProgressBar('#FFFFFF', 'COLOR')
            .setUsername(targetUser.username)
            .setDiscriminator(targetUser.discriminator || '0000');

        const data = await rank.build();
        const attachment = new AttachmentBuilder(data, { name: 'rank.png' });

        await interaction.editReply({ files: [attachment] });
    },
};