// commands/registration/regist-disable.js - COMPLETE RESET
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('regist-disable')
        .setDescription('Disable registration system and reset settings'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Administrator permission required!', flags: 64 });
        }

        try {
            // Ayarları veritabanından tamamen kaldırma işlemi ($unset)
            // Eğer updateOne ile null yaparsak anahtar kalır, $unset ile anahtarı da siliyoruz.
            if (db.db) {
                await db.db.collection('registration_settings').updateOne(
                    { guildId: interaction.guild.id.toString() },
                    { 
                        $unset: { 
                            interactive: "", 
                            button: "", 
                            verification: "" 
                        } 
                    }
                );
            }

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🚫 Registration Disabled')
                .setDescription('The registration system has been completely disabled and reset.\nYou can now use `/regist-setup` to create a new system.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Disable error:', error);
            await interaction.reply({ content: `❌ Error: ${error.message}`, flags: 64 });
        }
    },
};