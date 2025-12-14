// events/registrationButtonEvents.js - HANDLES SIMPLE BUTTON CLICK
const { Events } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'reg_simple_btn_click') return;

        await interaction.deferReply({ flags: 64 }); // Ephemeral (Gizli)

        try {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            const config = settings.button;

            if (!config || !config.roleIds || config.roleIds.length === 0) {
                return interaction.editReply({ content: '❌ Button system is not configured correctly.' });
            }

            const member = interaction.member;
            const rolesToAdd = config.roleIds;
            const addedRoles = [];

            // Rolleri ver
            for (const roleId of rolesToAdd) {
                // Eğer kullanıcıda zaten varsa atla
                if (!member.roles.cache.has(roleId)) {
                    await member.roles.add(roleId).catch(err => console.error(`Failed to add role ${roleId}:`, err.message));
                    addedRoles.push(roleId);
                }
            }

            if (addedRoles.length > 0) {
                await interaction.editReply({ 
                    content: `✅ Successfully registered! You have been given the following roles:\n${addedRoles.map(r => `<@&${r}>`).join(', ')}` 
                });
            } else {
                await interaction.editReply({ 
                    content: 'ℹ️ You are already registered and have the necessary roles.' 
                });
            }

        } catch (error) {
            console.error('Button registration error:', error);
            await interaction.editReply({ content: '❌ An error occurred while giving roles.' });
        }
    },
};