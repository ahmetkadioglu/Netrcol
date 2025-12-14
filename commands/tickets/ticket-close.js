const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');  // ✅ DEĞİŞTİRİLDİ

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-close')
        .setDescription('Ticketı kapatır'),
    async execute(interaction) {
        const { guild, member, channel } = interaction;

        if (!channel.name.startsWith('ticket-')) {
            return interaction.reply({ 
                content: '❌ Bu komut sadece ticket kanallarında kullanılabilir!', 
                flags: 64
            });
        }

        const ticketSettings = await db.getTicketSettings(guild.id);
        const isStaff = ticketSettings.staffRoleId && member.roles.cache.has(ticketSettings.staffRoleId);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isStaff && !isAdmin) {
            return interaction.reply({ 
                content: '❌ Ticket kapatma yetkiniz yok!', 
                flags: 64
            });
        }

        try {
            await db.deleteTicketChannel(guild.id, channel.id);

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 Ticket Kapatılıyor')
                .setDescription('Bu ticket 5 saniye içinde kapatılacak...')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (error) {
                    console.error('Kanal silme hatası:', error);
                }
            }, 5000);
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Ticket kapatma başarısız: ${error.message}`, 
                flags: 64 
            });
        }
    },
};