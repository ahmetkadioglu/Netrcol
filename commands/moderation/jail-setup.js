const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jail-setup')
        .setDescription('Automatically setup Jail role and channel'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Admin only.', flags: 64 });
        }

        await interaction.reply('⚙️ Setting up Jail system...');

        try {
            // 1. Jail Rolü Oluştur
            let jailRole = interaction.guild.roles.cache.find(r => r.name === 'Jailed');
            if (!jailRole) {
                jailRole = await interaction.guild.roles.create({
                    name: 'Jailed',
                    color: '#000001', // Siyah
                    reason: 'Jail System Setup'
                });
            }

            // 2. Tüm kanallardan bu rolü engelle
            interaction.guild.channels.cache.forEach(async (channel) => {
                await channel.permissionOverwrites.create(jailRole, {
                    ViewChannel: false,
                    SendMessages: false,
                    Connect: false
                }).catch(() => {});
            });

            // 3. Jail Kanalı Oluştur
            let jailChannel = interaction.guild.channels.cache.find(c => c.name === 'jail-cell');
            if (!jailChannel) {
                jailChannel = await interaction.guild.channels.create({
                    name: 'jail-cell',
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: jailRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                            deny: [PermissionsBitField.Flags.SendMessages] // Yazamasın, sadece baksın
                        }
                    ]
                });
            }

            await interaction.editReply(`✅ **Jail Setup Complete!**\nRole: ${jailRole}\nChannel: ${jailChannel}`);

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Error during setup.');
        }
    },
};