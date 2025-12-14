// events/registrationSetupEvents.js - COMPLETE SETUP FLOW (INTERACTIVE, VERIFICATION, BUTTON)
const { 
    Events, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, 
    RoleSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const registrationManager = require('../utils/registrationManager');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.customId) return;

        // Sadece setup butonları, menüleri ve modalları
        const isSetupStart = interaction.customId.startsWith('reg_setup_');
        const isSetupModal = interaction.customId === 'reg_setup_btn_modal';
        
        // Bu dosyanın sorumluluğunda olmayan interactionları yoksay
        if (!isSetupStart && !isSetupModal && !interaction.isChannelSelectMenu() && !interaction.isRoleSelectMenu()) return;

        const { guild, user, customId } = interaction;

        // ==========================================
        //           BAŞLANGIÇ BUTONLARI
        // ==========================================

        // 1. INTERACTIVE START
        if (customId === 'reg_setup_interactive') {
            await interaction.deferReply({ flags: 64 });
            registrationManager.startSetup(user.id, guild.id, 'interactive');

            const embed = new EmbedBuilder().setColor('#5865F2').setTitle('📢 Step 1/7: Registration Channel').setDescription('Select the channel where registration commands/buttons will appear.');
            const select = new ChannelSelectMenuBuilder().setCustomId('reg_setup_channel').setPlaceholder('Select channel...').addChannelTypes(ChannelType.GuildText);
            await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            return;
        }

        // 2. VERIFICATION START
        if (customId === 'reg_setup_verification') {
            await interaction.deferReply({ flags: 64 });
            registrationManager.startSetup(user.id, guild.id, 'verification');

            const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🛡️ Step 1/2: Channel').setDescription('Select the channel for the Verification Panel.');
            const select = new ChannelSelectMenuBuilder().setCustomId('reg_setup_ver_channel').setPlaceholder('Select channel...').addChannelTypes(ChannelType.GuildText);
            await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            return;
        }

        // 3. BUTTON START
        if (customId === 'reg_setup_button') {
            await interaction.deferReply({ flags: 64 });
            registrationManager.startSetup(user.id, guild.id, 'button');

            const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🔘 Step 1/3: Channel').setDescription('Select the channel where the "Get Role" button will be sent.');
            const select = new ChannelSelectMenuBuilder().setCustomId('reg_setup_btn_channel').setPlaceholder('Select channel...').addChannelTypes(ChannelType.GuildText);
            await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            return;
        }

        // --- SESSION KONTROL ---
        const session = registrationManager.getSession(user.id, guild.id);
        if (!session && !['reg_setup_interactive', 'reg_setup_button', 'reg_setup_verification'].includes(customId)) {
             if (interaction.isRepliable() && !interaction.replied) return interaction.reply({ content: '❌ Session expired.', flags: 64 });
             return;
        }

        // ==========================================
        //        INTERACTIVE SETUP FLOW
        // ==========================================
        
        if (session.type === 'interactive') {
            // 1 -> 2 (Unregistered Role)
            if (customId === 'reg_setup_channel') {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { registrationChannelId: interaction.values[0] });
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🎭 Step 2/7: Unregistered Role').setDescription('Select the role required to see the registration channel.');
                const select = new RoleSelectMenuBuilder().setCustomId('reg_setup_unreg_role').setPlaceholder('Select Unregistered role...');
                await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            }
            // 2 -> 3 (Registered Role)
            else if (customId === 'reg_setup_unreg_role') {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { unregisteredRoleId: interaction.values[0] });
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('✅ Step 3/7: Registered Role').setDescription('Select the role to GIVE to the user after registration.');
                const select = new RoleSelectMenuBuilder().setCustomId('reg_setup_reg_role').setPlaceholder('Select Registered role...');
                await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            }
            // 3 -> 4 (Log Channel)
            else if (customId === 'reg_setup_reg_role') {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { registeredRoleId: interaction.values[0] });
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('📜 Step 4/7: Log Channel').setDescription('Select the channel for registration logs.');
                const select = new ChannelSelectMenuBuilder().setCustomId('reg_setup_log').setPlaceholder('Select log channel...').addChannelTypes(ChannelType.GuildText);
                await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            }
            // 4 -> 5 (Auto Name)
            else if (customId === 'reg_setup_log') {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { logChannelId: interaction.values[0] });
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('✏️ Step 5/7: Auto Name').setDescription('Should the bot automatically change new users\' nicknames?');
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('reg_setup_autoname_true').setLabel('Enable').setStyle(ButtonStyle.Success).setEmoji('✅'),
                    new ButtonBuilder().setCustomId('reg_setup_autoname_false').setLabel('Disable').setStyle(ButtonStyle.Danger).setEmoji('❌')
                );
                await interaction.editReply({ embeds: [embed], components: [row] });
            }
            // 5 -> 6 (Auto Role)
            else if (customId.startsWith('reg_setup_autoname_')) {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { autoName: customId.includes('true') });
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🤖 Step 6/7: Auto Role').setDescription('Should the bot automatically give the "Unregistered" role on join?');
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('reg_setup_autorole_true').setLabel('Enable').setStyle(ButtonStyle.Success).setEmoji('✅'),
                    new ButtonBuilder().setCustomId('reg_setup_autorole_false').setLabel('Disable').setStyle(ButtonStyle.Danger).setEmoji('❌')
                );
                await interaction.editReply({ embeds: [embed], components: [row] });
            }
            // 6 -> 7 (Chat Channel)
            else if (customId.startsWith('reg_setup_autorole_')) {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { autoRole: customId.includes('true') });
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('💬 Step 7/7: Chat Channel').setDescription('Select the main chat channel for welcome messages.');
                const select = new ChannelSelectMenuBuilder().setCustomId('reg_setup_chat').setPlaceholder('Select chat channel...').addChannelTypes(ChannelType.GuildText);
                await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            }
            // 7 -> FINISH
            else if (customId === 'reg_setup_chat') {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { chatChannelId: interaction.values[0] });
                const finalData = await registrationManager.endSetup(user.id, guild.id);
                const embed = new EmbedBuilder().setColor('#57F287').setTitle('✅ Setup Complete!').setDescription('Interactive Registration System is ready.').addFields(
                    { name: 'Register Channel', value: `<#${finalData.registrationChannelId}>`, inline: true },
                    { name: 'Chat Channel', value: `<#${finalData.chatChannelId}>`, inline: true },
                    { name: 'Roles', value: `Unreg: <@&${finalData.unregisteredRoleId}>\nReg: <@&${finalData.registeredRoleId}>`, inline: true }
                );
                await interaction.editReply({ embeds: [embed], components: [] });
            }
        }

        // ==========================================
        //        VERIFICATION SETUP FLOW
        // ==========================================
        
        else if (session.type === 'verification') {
            // 1 -> 2 (Verified Role)
            if (customId === 'reg_setup_ver_channel') {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { channelId: interaction.values[0] });
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🎭 Step 2/2: Verified Role').setDescription('Select the role to give after captcha.');
                const select = new RoleSelectMenuBuilder().setCustomId('reg_setup_ver_role').setPlaceholder('Select Verified Role...').setMaxValues(1);
                await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            }
            // 2 -> FINISH
            else if (customId === 'reg_setup_ver_role') {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { roleId: interaction.values[0] });
                const finalData = await registrationManager.endSetup(user.id, guild.id);

                // Paneli Gönder
                const targetChannel = guild.channels.cache.get(finalData.channelId);
                if (targetChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#2B2D31')
                        .setTitle('🛡️ Server Verification')
                        .setDescription('To access the server, you must verify you are human.\nClick the button below and solve the captcha.')
                        .setFooter({ text: 'Anti-Bot System' })
                        .setTimestamp();
                    const btn = new ButtonBuilder().setCustomId('reg_verify_start').setLabel('Verify').setStyle(ButtonStyle.Success).setEmoji('🛡️');
                    await targetChannel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)] });
                }
                const successEmbed = new EmbedBuilder().setColor('#57F287').setTitle('✅ Setup Complete!').setDescription('Verification system is live.');
                await interaction.editReply({ embeds: [successEmbed], components: [] });
            }
        }

        // ==========================================
        //        BUTTON SETUP FLOW
        // ==========================================

        else if (session.type === 'button') {
            // 1 -> 2 (Roles)
            if (customId === 'reg_setup_btn_channel') {
                await interaction.deferUpdate();
                registrationManager.updateSession(user.id, guild.id, { channelId: interaction.values[0] });
                const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🎭 Step 2/3: Roles').setDescription('Select the role(s) to give.\n**(Max 3 Roles)**');
                const select = new RoleSelectMenuBuilder().setCustomId('reg_setup_btn_roles').setPlaceholder('Select roles...').setMinValues(1).setMaxValues(3);
                await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
            }
            // 2 -> 3 (Customize Modal)
            else if (customId === 'reg_setup_btn_roles') {
                // Burada deferUpdate yapmıyoruz çünkü modal açacağız
                registrationManager.updateSession(user.id, guild.id, { roleIds: interaction.values });

                const modal = new ModalBuilder().setCustomId('reg_setup_btn_modal').setTitle('Customize Button Panel');
                const msgInput = new TextInputBuilder().setCustomId('msg_content').setLabel('Message Content').setStyle(TextInputStyle.Paragraph).setValue('Click below to get access!').setRequired(true);
                const btnLabelInput = new TextInputBuilder().setCustomId('btn_label').setLabel('Button Label').setStyle(TextInputStyle.Short).setValue('Register').setRequired(true);
                const btnEmojiInput = new TextInputBuilder().setCustomId('btn_emoji').setLabel('Button Emoji').setStyle(TextInputStyle.Short).setValue('✅').setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(msgInput), new ActionRowBuilder().addComponents(btnLabelInput), new ActionRowBuilder().addComponents(btnEmojiInput));
                await interaction.showModal(modal);
            }
            // 3 -> FINISH
            else if (customId === 'reg_setup_btn_modal') {
                await interaction.deferUpdate();
                const messageContent = interaction.fields.getTextInputValue('msg_content');
                const buttonLabel = interaction.fields.getTextInputValue('btn_label');
                let buttonEmoji = interaction.fields.getTextInputValue('btn_emoji');

                // Emoji ID ayrıştırma
                const emojiMatch = buttonEmoji.match(/:(\d+)>/);
                if (emojiMatch) buttonEmoji = emojiMatch[1];

                registrationManager.updateSession(user.id, guild.id, { messageContent, buttonLabel, buttonEmoji });
                const finalData = await registrationManager.endSetup(user.id, guild.id);

                const targetChannel = guild.channels.cache.get(finalData.channelId);
                if (targetChannel) {
                    const embed = new EmbedBuilder().setColor('#5865F2').setTitle('✅ Registration').setDescription(finalData.messageContent).setFooter({ text: guild.name }).setTimestamp();
                    const btn = new ButtonBuilder().setCustomId('reg_simple_btn_click').setLabel(finalData.buttonLabel).setStyle(ButtonStyle.Success).setEmoji(finalData.buttonEmoji);
                    await targetChannel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)] });
                }

                const successEmbed = new EmbedBuilder().setColor('#57F287').setTitle('✅ Setup Complete!').setDescription('Button Registration System is live.').addFields({ name: 'Channel', value: `<#${finalData.channelId}>`, inline: true });
                await interaction.editReply({ embeds: [successEmbed], components: [] });
            }
        }
    },
};