// events/registrationSettingsEvents.js - UPDATED TAG MESSAGE
const { 
    Events, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, 
    TextInputStyle, RoleSelectMenuBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const db = require('../utils/database');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.customId || !interaction.customId.startsWith('regset_')) return;

        if (interaction.customId === 'regset_set_tag') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            const currentTag = settings.interactive?.tagSymbol || '';
            const modal = new ModalBuilder().setCustomId('regset_modal_tag').setTitle('Set Tag');
            const input = new TextInputBuilder().setCustomId('tag_input').setLabel('Tag Symbol').setStyle(TextInputStyle.Short).setRequired(false).setValue(currentTag);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
        else if (interaction.isModalSubmit() && interaction.customId === 'regset_modal_tag') {
            const tag = interaction.fields.getTextInputValue('tag_input');
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            await db.saveRegistrationSettings(interaction.guild.id, { interactive: { ...settings.interactive, tagSymbol: tag, enableTag: true } });
            
            // --- GÜNCELLENEN MESAJ ---
            await interaction.reply({ 
                content: `✅ Tag updated to: \`${tag}\`\n\nℹ️ **To remove or disable:**\nUse \`/regist-settings\` → Click **Options** → Toggle **Tag Mode** off.`, 
                flags: 64 
            });
        }

        // --- DİĞER KISIMLAR AYNEN KALIYOR ---
        else if (interaction.customId === 'regset_registered_role') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            const currentRole = settings.interactive?.registeredRoleId;
            const roleSelect = new RoleSelectMenuBuilder().setCustomId('regset_select_role').setPlaceholder('Select Role...');
            if (currentRole) roleSelect.setDefaultValues([currentRole]);
            const row = new ActionRowBuilder().addComponents(roleSelect);
            await interaction.reply({ content: 'Select Registered Role:', components: [row], flags: 64 });
        }
        else if (interaction.customId === 'regset_staff_role') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            const currentRoles = settings.interactive?.staffRoles || [];
            const roleSelect = new RoleSelectMenuBuilder().setCustomId('regset_select_staff').setPlaceholder('Select Staff Roles (Max 3)...').setMinValues(1).setMaxValues(3);
            if (currentRoles.length > 0) roleSelect.setDefaultValues(currentRoles);
            const row = new ActionRowBuilder().addComponents(roleSelect);
            await interaction.reply({ content: 'Select roles that can register users:', components: [row], flags: 64 });
        }
        else if (interaction.customId === 'regset_options') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            const config = settings.interactive || {};
            const selfReg = config.allowSelfRegister ? 'ON' : 'OFF';
            const ageReq = config.requireAge !== false ? 'ON' : 'OFF';
            const tagMode = config.enableTag ? 'ON' : 'OFF';
            const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🔧 Options').setDescription(`**Self Register:** ${selfReg}\n**Age Required:** ${ageReq}\n**Tag Mode:** ${tagMode}`);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('regset_toggle_selfreg').setLabel(`Self Reg`).setStyle(config.allowSelfRegister ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('regset_toggle_age').setLabel(`Age Req`).setStyle(config.requireAge !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('regset_toggle_tag').setLabel(`Tag Mode`).setStyle(config.enableTag ? ButtonStyle.Success : ButtonStyle.Secondary)
            );
            await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
        else if (interaction.customId === 'regset_toggle_tag') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            const current = settings.interactive?.enableTag || false;
            await db.saveRegistrationSettings(interaction.guild.id, { interactive: { ...settings.interactive, enableTag: !current } });
            await interaction.update({ content: `✅ Tag Mode is now **${!current ? 'ENABLED' : 'DISABLED'}**.`, embeds: [], components: [] });
        }
        else if (interaction.customId === 'regset_toggle_selfreg') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            await db.saveRegistrationSettings(interaction.guild.id, { interactive: { ...settings.interactive, allowSelfRegister: !settings.interactive?.allowSelfRegister } });
            await interaction.update({ content: '✅ Updated.', embeds: [], components: [] });
        }
        else if (interaction.customId === 'regset_toggle_age') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            const current = settings.interactive?.requireAge !== false;
            await db.saveRegistrationSettings(interaction.guild.id, { interactive: { ...settings.interactive, requireAge: !current } });
            await interaction.update({ content: '✅ Updated.', embeds: [], components: [] });
        }
        else if (interaction.customId === 'regset_name_format') {
            const modal = new ModalBuilder().setCustomId('regset_modal_format').setTitle('Name Format');
            const input = new TextInputBuilder().setCustomId('format_input').setLabel('Format').setStyle(TextInputStyle.Short).setValue('{user} | {age}').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
        else if (interaction.isRoleSelectMenu() && interaction.customId === 'regset_select_role') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            await db.saveRegistrationSettings(interaction.guild.id, { interactive: { ...settings.interactive, registeredRoleId: interaction.values[0] } });
            await interaction.update({ content: `✅ Role updated.`, components: [] });
        }
        else if (interaction.isRoleSelectMenu() && interaction.customId === 'regset_select_staff') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            await db.saveRegistrationSettings(interaction.guild.id, { interactive: { ...settings.interactive, staffRoles: interaction.values } });
            await interaction.update({ content: `✅ Staff roles updated.`, components: [] });
        }
        else if (interaction.isModalSubmit() && interaction.customId === 'regset_modal_format') {
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            await db.saveRegistrationSettings(interaction.guild.id, { interactive: { ...settings.interactive, nameFormat: interaction.fields.getTextInputValue('format_input') } });
            await interaction.reply({ content: `✅ Format updated.`, flags: 64 });
        }
    },
};