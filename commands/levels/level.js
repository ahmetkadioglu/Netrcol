// commands/levels/level.js
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your or someone else\'s current level and XP')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to check')
                .setRequired(false)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        
        // Botları kontrol etme
        if (target.bot) {
            return interaction.reply({ content: '🤖 Bots do not earn XP!', ephemeral: true });
        }

        const userData = await db.getUserRank(target.id, interaction.guild.id);

        if (!userData) {
            return interaction.reply({ content: `❌ **${target.username}** has not earned any XP yet.`, ephemeral: true });
        }

        const currentXp = userData.xp;
        const currentLevel = userData.level || 0;
        
        // Bir sonraki seviye için gereken toplam XP
        // Formül: XP = (Level / 0.1)^2  =>  Level = 0.1 * sqrt(XP)
        const nextLevel = currentLevel + 1;
        const nextLevelXp = Math.pow(nextLevel / 0.1, 2); // Örn: Lvl 1 için 100, Lvl 2 için 400
        
        // Mevcut seviyedeki ilerleme (önceki seviyenin XP'sini çıkararak hesapla)
        const prevLevelXp = Math.pow(currentLevel / 0.1, 2);
        const xpNeededForLevel = nextLevelXp - prevLevelXp;
        const xpProgressInLevel = currentXp - prevLevelXp;
        
        const percent = Math.min(100, Math.max(0, Math.floor((xpProgressInLevel / xpNeededForLevel) * 100)));

        // Progress Bar (Görsel Çubuk)
        const barLength = 15;
        const filledLength = Math.round((percent / 100) * barLength);
        const emptyLength = barLength - filledLength;
        const progressBar = '🟩'.repeat(filledLength) + '⬛'.repeat(emptyLength);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: `${target.username}'s Level Card`, iconURL: target.displayAvatarURL() })
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '⚡ Level', value: `\`${currentLevel}\``, inline: true },
                { name: '✨ Total XP', value: `\`${currentXp.toLocaleString()}\``, inline: true },
                { name: '🎯 Next Level', value: `\`${Math.floor(nextLevelXp - currentXp).toLocaleString()} XP left\``, inline: true },
                { name: `📈 Progress (${percent}%)`, value: `\`${progressBar}\``, inline: false }
            )
            .setFooter({ text: 'Keep chatting to earn more!' });

        await interaction.reply({ embeds: [embed] });
    },
};