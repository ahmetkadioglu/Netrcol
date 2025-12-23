const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const LevelConfig = require('../../models/levelConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level-system')
        .setDescription('Turn the level system on or off.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Select the status')
                .setRequired(true)
                .addChoices(
                    { name: 'Enable (ON)', value: 'true' },
                    { name: 'Disable (OFF)', value: 'false' }
                )),
    async execute(interaction) {
        const targetStatus = interaction.options.getString('status') === 'true'; // true (Aç) veya false (Kapat)

        // 1. Mevcut ayarı çek
        let config = await LevelConfig.findOne({ guildId: interaction.guild.id });

        // Eğer ayar hiç yoksa, varsayılan olarak AÇIK (true) kabul edip veritabanına işleyelim
        if (!config) {
            config = new LevelConfig({ guildId: interaction.guild.id, isActive: true });
            await config.save();
        }

        // 2. Kontrol: İstenen durum ile mevcut durum aynı mı?
        if (config.isActive === targetStatus) {
            const statusText = targetStatus ? 'ENABLED' : 'DISABLED';
            return interaction.reply({ 
                content: `⚠️ The level system is **ALREADY ${statusText}** on this server.`, 
                ephemeral: true 
            });
        }

        // 3. Durum farklıysa güncelle
        config.isActive = targetStatus;
        await config.save();

        const message = targetStatus 
            ? '✅ Level system has been successfully **ENABLED**.' 
            : '⛔ Level system has been successfully **DISABLED**. Commands like /level will no longer work.';
        
        await interaction.reply({ content: message, ephemeral: true });
    },
};