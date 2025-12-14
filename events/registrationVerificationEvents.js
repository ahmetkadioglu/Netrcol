// events/registrationVerificationEvents.js - ANTI-CRASH & CAPTCHA
const { 
    Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder 
} = require('discord.js');
const db = require('../utils/database');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Sadece bu dosyanın ilgilendiği interaction'lar
        if (!interaction.customId) return;
        const isVerifyStart = interaction.customId === 'reg_verify_start';
        const isVerifySubmit = interaction.customId.startsWith('reg_modal_verify_');

        if (!isVerifyStart && !isVerifySubmit) return;

        // 1. BUTONA BASINCA: MODAL AÇ
        if (isVerifyStart) {
            // Modal açmak için deferReply KULLANILMAZ (Hata verir), direkt showModal yapılır.
            
            const settings = await db.getRegistrationSettings(interaction.guild.id);
            const config = settings.verification;

            if (!config || !config.roleId) {
                return interaction.reply({ content: '❌ System not configured correctly.', flags: 64 });
            }

            if (interaction.member.roles.cache.has(config.roleId)) {
                return interaction.reply({ content: '✅ You are already verified!', flags: 64 });
            }

            const num1 = Math.floor(Math.random() * 20) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const answer = num1 + num2;

            const modalId = `reg_modal_verify_${answer}`;

            const modal = new ModalBuilder().setCustomId(modalId).setTitle('🛡️ Security Check');
            const input = new TextInputBuilder()
                .setCustomId('captcha_input')
                .setLabel(`Calculate: ${num1} + ${num2} = ?`)
                .setPlaceholder('Write the number here...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(3);

            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }

        // 2. MODAL CEVABI (Burada DeferReply ŞART)
        else if (isVerifySubmit) {
            await interaction.deferReply({ flags: 64 }); // 10062 Hatasını önler

            const correctAnswer = interaction.customId.split('_')[3];
            const userAnswer = interaction.fields.getTextInputValue('captcha_input').trim();

            if (userAnswer === correctAnswer) {
                const settings = await db.getRegistrationSettings(interaction.guild.id);
                const roleId = settings.verification?.roleId;

                if (roleId) {
                    try {
                        await interaction.member.roles.add(roleId);
                        const successEmbed = new EmbedBuilder().setColor('#57F287').setTitle('✅ Verification Successful').setDescription('Access granted. Welcome!').setTimestamp();
                        await interaction.editReply({ embeds: [successEmbed] });
                    } catch (error) {
                        console.error('Verify role error:', error);
                        await interaction.editReply({ content: '❌ Failed to give role. Please contact staff.' });
                    }
                } else {
                    await interaction.editReply({ content: '❌ Configuration error.' });
                }
            } else {
                const failEmbed = new EmbedBuilder().setColor('#ED4245').setTitle('❌ Verification Failed').setDescription(`Incorrect answer. Please try again.`).setFooter({ text: 'Math Captcha' });
                await interaction.editReply({ embeds: [failEmbed] });
            }
        }
    },
};