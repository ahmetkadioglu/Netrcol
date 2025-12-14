// commands/admin/maintenance.js - SCOPE SUPPORT ADDED
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

// Bakım durumu (Bellekte tutulur)
let maintenanceState = {
    active: false,
    scope: 'none', // 'discord', 'panel', 'both'
    reason: 'No reason provided',
    startTime: null,
    allowedUsers: ['760210546980028419'] // Kendi ID'ni buraya yaz
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('Toggle maintenance mode')
        .addStringOption(opt => 
            opt.setName('action')
                .setDescription('Enable or Disable')
                .setRequired(true)
                .addChoices({ name: 'Enable', value: 'on' }, { name: 'Disable', value: 'off' }, { name: 'Status', value: 'status' }))
        .addStringOption(opt => 
            opt.setName('scope')
                .setDescription('Where to apply maintenance?')
                .setRequired(false) // Disable yaparken gerekmez
                .addChoices(
                    { name: '🤖 Discord Bot Only', value: 'discord' },
                    { name: '🌐 Web Panel Only', value: 'panel' },
                    { name: '🔥 Both (Bot & Web)', value: 'both' }
                ))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for maintenance').setRequired(false)),
    
    async execute(interaction) {
        // Sadece Adminler
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !maintenanceState.allowedUsers.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ You are not authorized.', flags: 64 });
        }

        const action = interaction.options.getString('action');
        const scope = interaction.options.getString('scope') || 'discord'; // Varsayılan Discord
        const reason = interaction.options.getString('reason') || 'Maintenance in progress';

        if (action === 'on') {
            maintenanceState = {
                active: true,
                scope: scope,
                reason: reason,
                startTime: Date.now(),
                allowedUsers: maintenanceState.allowedUsers
            };

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🚧 Maintenance Mode Enabled')
                .setDescription(`**Scope:** ${scope.toUpperCase()}\n**Reason:** ${reason}`)
                .setFooter({ text: 'Systems are now restricted.' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } 
        else if (action === 'off') {
            maintenanceState.active = false;
            maintenanceState.scope = 'none';
            
            await interaction.reply({ content: '✅ Maintenance mode disabled. All systems operational.' });
        }
        else if (action === 'status') {
            const status = maintenanceState.active ? '🔴 Active' : '🟢 Inactive';
            await interaction.reply({ content: `**Status:** ${status}\n**Scope:** ${maintenanceState.scope}\n**Reason:** ${maintenanceState.reason}`, flags: 64 });
        }
    },

    // --- DIŞA AKTARILAN KONTROLLER ---

    // Bot komutlarını engeller mi? (Discord veya Both seçiliyse)
    isBotMaintenance() {
        return maintenanceState.active && (maintenanceState.scope === 'discord' || maintenanceState.scope === 'both');
    },

    // Web panelini engeller mi? (Panel veya Both seçiliyse)
    isWebMaintenance() {
        return maintenanceState.active && (maintenanceState.scope === 'panel' || maintenanceState.scope === 'both');
    },

    // Bakım nedenini döndür
    getReason() {
        return maintenanceState.reason;
    },

    // İzinli kullanıcı kontrolü
    isAllowed(userId) {
        return maintenanceState.allowedUsers.includes(userId);
    }
};