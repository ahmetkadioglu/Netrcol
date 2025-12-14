// events/ticketSettingsEvents.js - ADDED RULES CUSTOMIZATION
const { 
    Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder, 
    StringSelectMenuBuilder, ChannelType
} = require('discord.js');
const db = require('../utils/database');
const ticketManager = require('../utils/ticketManager');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.customId || !interaction.customId.startsWith('tset_')) return;

        // --- MENÜLER ---
        if (interaction.isButton()) {
            // 1. Creation Panel Menüsü (GÜNCELLENDİ: Rules butonu eklendi)
            if (interaction.customId === 'tset_menu_creation') {
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🎨 Creation Panel').setDescription('Choose what to customize:');
                const row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('tset_edit_creation_msg').setLabel('Edit Panel Message').setStyle(ButtonStyle.Success).setEmoji('📝'),
                    new ButtonBuilder().setCustomId('tset_edit_rules_msg').setLabel('Edit Rules Message').setStyle(ButtonStyle.Success).setEmoji('📜'), // YENİ
                    new ButtonBuilder().setCustomId('tset_edit_creation_btn').setLabel('Edit Button Labels').setStyle(ButtonStyle.Secondary).setEmoji('🔤')
                );
                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('tset_color_creation').setLabel('Button Colors').setStyle(ButtonStyle.Primary).setEmoji('🎨'),
                    new ButtonBuilder().setCustomId('tset_back_main').setLabel('Back').setStyle(ButtonStyle.Danger).setEmoji('↩️')
                );
                await interaction.update({ embeds: [embed], components: [row1, row2] });
            }
            
            // 2. Ticket Channel Menüsü
            else if (interaction.customId === 'tset_menu_channel') {
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🎨 Ticket Channel').setDescription('Choose what to customize:');
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('tset_edit_ticket_msg').setLabel('Edit Welcome Message').setStyle(ButtonStyle.Success).setEmoji('📝'),
                    new ButtonBuilder().setCustomId('tset_edit_ticket_btn').setLabel('Edit Button Labels').setStyle(ButtonStyle.Secondary).setEmoji('🔤'),
                    new ButtonBuilder().setCustomId('tset_color_ticket').setLabel('Button Colors').setStyle(ButtonStyle.Primary).setEmoji('🎨'),
                    new ButtonBuilder().setCustomId('tset_back_main').setLabel('Back').setStyle(ButtonStyle.Danger).setEmoji('↩️')
                );
                await interaction.update({ embeds: [embed], components: [row] });
            }

            // 3. Log Channel
            else if (interaction.customId === 'tset_menu_logs') {
                const settings = await db.getTicketSettings(interaction.guild.id);
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('📜 Log Channel').setDescription(`Current: ${settings.logChannelId ? `<#${settings.logChannelId}>` : 'Not Set'}\n\nSelect new channel:`);
                const select = new ChannelSelectMenuBuilder().setCustomId('tset_select_log').setPlaceholder('Select log channel...').addChannelTypes(ChannelType.GuildText);
                const row = new ActionRowBuilder().addComponents(select);
                const backRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('tset_back_main').setLabel('Back').setStyle(ButtonStyle.Danger).setEmoji('↩️'));
                await interaction.update({ embeds: [embed], components: [row, backRow] });
            }

            // Geri Dönüş
            else if (interaction.customId === 'tset_back_main') {
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('⚙️ Ticket Customization').setDescription('Select component:').addFields({ name: '1️⃣ Creation Panel', value: 'Customize panel, rules & buttons.' }, { name: '2️⃣ Ticket Channel', value: 'Customize welcome message & buttons.' }, { name: '3️⃣ Log Channel', value: 'Update log channel.' });
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('tset_menu_creation').setLabel('Creation Panel').setStyle(ButtonStyle.Primary).setEmoji('1️⃣'),
                    new ButtonBuilder().setCustomId('tset_menu_channel').setLabel('Ticket Channel').setStyle(ButtonStyle.Primary).setEmoji('2️⃣'),
                    new ButtonBuilder().setCustomId('tset_menu_logs').setLabel('Log Channel').setStyle(ButtonStyle.Secondary).setEmoji('3️⃣')
                );
                await interaction.update({ embeds: [embed], components: [row] });
            }

            // --- MODALLAR ---
            else if (interaction.customId === 'tset_edit_creation_msg') {
                await showModal(interaction, 'tset_modal_creation_msg', 'Edit Creation Message', [
                    { id: 'title', label: 'Title', style: TextInputStyle.Short, required: true },
                    { id: 'desc', label: 'Description', style: TextInputStyle.Paragraph, required: true }
                ]);
            }
            else if (interaction.customId === 'tset_edit_rules_msg') { // YENİ MODAL
                await showModal(interaction, 'tset_modal_rules_msg', 'Edit Rules Message', [
                    { id: 'title', label: 'Rules Title', style: TextInputStyle.Short, required: true },
                    { id: 'desc', label: 'Rules Content', style: TextInputStyle.Paragraph, required: true }
                ]);
            }
            else if (interaction.customId === 'tset_edit_creation_btn') {
                await showModal(interaction, 'tset_modal_creation_btn', 'Edit Button Labels', [
                    { id: 'create_label', label: 'Create Button Label', style: TextInputStyle.Short, required: true },
                    { id: 'rules_label', label: 'Rules Button Label', style: TextInputStyle.Short, required: true }
                ]);
            }
            else if (interaction.customId === 'tset_edit_ticket_msg') {
                await showModal(interaction, 'tset_modal_ticket_msg', 'Edit Welcome Message', [
                    { id: 'desc', label: 'Message Content', style: TextInputStyle.Paragraph, required: true }
                ]);
            }
            else if (interaction.customId === 'tset_edit_ticket_btn') {
                await showModal(interaction, 'tset_modal_ticket_btn', 'Edit Ticket Buttons', [
                    { id: 'claim_label', label: 'Claim Label', style: TextInputStyle.Short, required: true },
                    { id: 'close_label', label: 'Close Label', style: TextInputStyle.Short, required: true },
                    { id: 'settings_label', label: 'Settings Label', style: TextInputStyle.Short, required: true }
                ]);
            }
            // Renk Menüleri
            else if (interaction.customId === 'tset_color_creation') await showColorMenu(interaction, 'tset_select_color_creation', 'Creation Panel Colors');
            else if (interaction.customId === 'tset_color_ticket') await showColorMenu(interaction, 'tset_select_color_ticket', 'Ticket Channel Colors');
        }

        // --- SELECT MENUS ---
        else if (interaction.isChannelSelectMenu()) {
            if (interaction.customId === 'tset_select_log') {
                await interaction.deferUpdate();
                const channelId = interaction.values[0];
                await db.saveTicketSettings(interaction.guild.id, { logChannelId: channelId });
                await db.saveGuildSettings(interaction.guild.id, { logChannelId: channelId });
                await interaction.editReply({ content: `✅ Log channel updated to <#${channelId}>`, components: [], embeds: [] });
            }
        }
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'tset_select_color_creation') {
                await interaction.deferUpdate();
                let styleCreate = ButtonStyle.Success, styleRules = ButtonStyle.Secondary;
                interaction.values.forEach(val => {
                    const [btn, style] = val.split('_');
                    if (btn === 'create') styleCreate = parseInt(style);
                    if (btn === 'rules') styleRules = parseInt(style);
                });
                await db.saveTicketSettings(interaction.guild.id, { styleCreate, styleRules });
                await ticketManager.refreshPanel(interaction.guild);
                await interaction.editReply({ content: '✅ Colors updated!', components: [], embeds: [] });
            }
            else if (interaction.customId === 'tset_select_color_ticket') {
                await interaction.deferUpdate();
                let styleClaim = ButtonStyle.Success, styleClose = ButtonStyle.Danger, styleSettings = ButtonStyle.Secondary;
                interaction.values.forEach(val => {
                    const [btn, style] = val.split('_');
                    if (btn === 'claim') styleClaim = parseInt(style);
                    if (btn === 'close') styleClose = parseInt(style);
                    if (btn === 'settings') styleSettings = parseInt(style);
                });
                await db.saveTicketSettings(interaction.guild.id, { styleClaim, styleClose, styleSettings });
                await interaction.editReply({ content: '✅ Colors saved!', components: [], embeds: [] });
            }
        }

        // --- MODAL SUBMITS ---
        else if (interaction.isModalSubmit()) {
            const settings = {};
            if (interaction.customId === 'tset_modal_creation_msg') {
                settings.panelTitle = interaction.fields.getTextInputValue('title');
                settings.panelDescription = interaction.fields.getTextInputValue('desc');
                await db.saveTicketSettings(interaction.guild.id, settings);
                await ticketManager.refreshPanel(interaction.guild);
                await interaction.reply({ content: '✅ Panel updated!', flags: 64 });
            }
            else if (interaction.customId === 'tset_modal_rules_msg') { // YENİ: Rules Kaydı
                settings.rulesTitle = interaction.fields.getTextInputValue('title');
                settings.rulesDescription = interaction.fields.getTextInputValue('desc');
                await db.saveTicketSettings(interaction.guild.id, settings);
                await interaction.reply({ content: '✅ Rules message updated!', flags: 64 });
            }
            else if (interaction.customId === 'tset_modal_creation_btn') {
                settings.panelBtnCreate = interaction.fields.getTextInputValue('create_label');
                settings.panelBtnRules = interaction.fields.getTextInputValue('rules_label');
                await db.saveTicketSettings(interaction.guild.id, settings);
                await ticketManager.refreshPanel(interaction.guild);
                await interaction.reply({ content: '✅ Buttons updated!', flags: 64 });
            }
            else if (interaction.customId === 'tset_modal_ticket_msg') {
                settings.ticketDescription = interaction.fields.getTextInputValue('desc');
                await db.saveTicketSettings(interaction.guild.id, settings);
                await interaction.reply({ content: '✅ Message saved!', flags: 64 });
            }
            else if (interaction.customId === 'tset_modal_ticket_btn') {
                settings.ticketBtnClaim = interaction.fields.getTextInputValue('claim_label');
                settings.ticketBtnClose = interaction.fields.getTextInputValue('close_label');
                settings.ticketBtnSettings = interaction.fields.getTextInputValue('settings_label');
                await db.saveTicketSettings(interaction.guild.id, settings);
                await interaction.reply({ content: '✅ Buttons saved!', flags: 64 });
            }
        }
    }
};

async function showModal(interaction, customId, title, fields) {
    const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
    const rows = fields.map(field => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(field.id).setLabel(field.label).setStyle(field.style).setRequired(field.required)));
    modal.addComponents(rows);
    await interaction.showModal(modal);
}

async function showColorMenu(interaction, customId, title) {
    const colors = [{ name: 'Blue', value: '1', emoji: '🔵' }, { name: 'Grey', value: '2', emoji: '⚫' }, { name: 'Green', value: '3', emoji: '🟢' }, { name: 'Red', value: '4', emoji: '🔴' }];
    let options = [];
    if (customId.includes('creation')) {
        colors.forEach(c => options.push({ label: `Create: ${c.name}`, value: `create_${c.value}`, emoji: c.emoji }));
        colors.forEach(c => options.push({ label: `Rules: ${c.name}`, value: `rules_${c.value}`, emoji: c.emoji }));
    } else {
        colors.forEach(c => options.push({ label: `Claim: ${c.name}`, value: `claim_${c.value}`, emoji: c.emoji }));
        colors.forEach(c => options.push({ label: `Settings: ${c.name}`, value: `settings_${c.value}`, emoji: c.emoji }));
        colors.forEach(c => options.push({ label: `Close: ${c.name}`, value: `close_${c.value}`, emoji: c.emoji }));
    }
    const select = new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder('Select colors...').setMinValues(1).setMaxValues(options.length).addOptions(options);
    await interaction.update({ content: `🎨 **${title}**`, embeds: [], components: [new ActionRowBuilder().addComponents(select), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('tset_back_main').setLabel('Back').setStyle(ButtonStyle.Danger).setEmoji('↩️'))] });
}