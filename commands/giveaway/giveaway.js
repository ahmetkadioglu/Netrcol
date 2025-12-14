// commands/giveaway/giveaway.js - ADDED ROLE OPTION
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const giveawayManager = require('../../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .addSubcommand(sub => 
            sub.setName('start')
                .setDescription('Start a new giveaway')
                .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 1m, 1h, 1d)').setRequired(true))
                .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(true))
                .addStringOption(opt => opt.setName('prize').setDescription('Prize name').setRequired(true))
                .addRoleOption(opt => opt.setName('required_role').setDescription('Role required to join (Optional)').setRequired(false)) // YENİ
        )
        .addSubcommand(sub => 
            sub.setName('end')
                .setDescription('End a giveaway manually')
                .addStringOption(opt => opt.setName('message_id').setDescription('Message ID').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('reroll')
                .setDescription('Reroll a giveaway winner')
                .addStringOption(opt => opt.setName('message_id').setDescription('Message ID').setRequired(true))
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: '❌ You need **Manage Server** permission.', flags: 64 });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const durationStr = interaction.options.getString('duration');
            const winners = interaction.options.getInteger('winners');
            const prize = interaction.options.getString('prize');
            const requiredRole = interaction.options.getRole('required_role'); // Rolü al

            let durationMs = 0;
            const unit = durationStr.slice(-1);
            const time = parseInt(durationStr.slice(0, -1));
            
            if (unit === 's') durationMs = time * 1000;
            else if (unit === 'm') durationMs = time * 60 * 1000;
            else if (unit === 'h') durationMs = time * 60 * 60 * 1000;
            else if (unit === 'd') durationMs = time * 24 * 60 * 60 * 1000;
            else return interaction.reply({ content: '❌ Invalid format! Use: 10s, 5m, 1h, 1d', flags: 64 });

            await interaction.reply({ content: '🎉 Starting giveaway...', flags: 64 });
            // Rol ID'sini manager'a gönderiyoruz
            await giveawayManager.start(interaction, durationMs, winners, prize, requiredRole?.id);
        } 
        else if (subcommand === 'end') {
            // Manuel bitirme (Basitçe süreyi beklemeden bitir fonksiyonunu çağırabiliriz ama db update gerekir)
            // Şimdilik sadece uyarı veriyoruz, tam entegrasyon için db update lazım.
            await interaction.reply({ content: '⚠️ Manual end not fully implemented yet (Waiting for auto-end).', flags: 64 });
        }
        else if (subcommand === 'reroll') {
            const msgId = interaction.options.getString('message_id');
            const result = await giveawayManager.reroll(interaction, msgId);
            await interaction.reply({ content: result, flags: 64 });
        }
    },
};