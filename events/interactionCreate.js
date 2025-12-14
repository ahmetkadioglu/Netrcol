// events/interactionCreate.js - CENTRAL HANDLER

const { Events } = require("discord.js");
const ticketManager = require("../utils/ticketManager");
const jtcManager = require("../utils/jtcManager");
const db = require("../utils/database");

// Extra interaction modules (called manually, not as events)
const logSettingsInteraction = require("./logSettingsInteraction");
const registrationButtonEvents = require("./registrationButtonEvents");
const registrationSettingsEvents = require("./registrationSettingsEvents");
const registrationSetupEvents = require("./registrationSetupEvents");
const registrationVerificationEvents = require("./registrationVerificationEvents");
const ticketSettingsEvents = require("./ticketSettingsEvents");

// Simple duplicate protection
const processedInteractions = new Set();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const interactionKey = `${interaction.id}`;
    if (processedInteractions.has(interactionKey)) return;
    processedInteractions.add(interactionKey);
    setTimeout(() => processedInteractions.delete(interactionKey), 2000);

    // ====================================================
    // 1. SLASH COMMANDS
    // ====================================================
    if (interaction.isChatInputCommand()) {
      const isBlacklisted = await db.isBlacklisted(interaction.user.id);
      if (isBlacklisted) {
        return interaction
          .reply({ content: "⛔ You are blacklisted.", flags: 64 })
          .catch(() => {});
      }

      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error("Command Error:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction
            .reply({ content: "❌ An error occurred.", flags: 64 })
            .catch(() => {});
        }
      }
      return;
    }

    // ====================================================
    // 2. TICKET SETUP WIZARD
    // ====================================================
    const isTicketSetup =
      interaction.customId?.startsWith("setup_") ||
      interaction.customId?.startsWith("ticket_setup_") ||
      interaction.customId === "ticket_use_current_channel";

    if (
      isTicketSetup &&
      (interaction.isButton() ||
        interaction.isChannelSelectMenu?.() ||
        interaction.isRoleSelectMenu?.())
    ) {
      try {
        await interaction.deferUpdate().catch(() => {});
      } catch {
        return;
      }

      try {
        if (interaction.customId === "setup_type_standard") {
          await ticketManager.startSetup(interaction, "standard");
        } else if (interaction.customId === "setup_type_anonymous") {
          await ticketManager.showAnonOptions(interaction);
        } else if (interaction.customId.startsWith("setup_anon_")) {
          const mode = interaction.customId.replace("setup_anon_", "");
          await ticketManager.startSetup(interaction, "anonymous", mode);
        } else if (interaction.customId === "ticket_use_current_channel") {
          await ticketManager.saveChannelAndContinue(interaction, interaction.channel.id);
        } else if (interaction.customId === "ticket_setup_channel") {
          await ticketManager.saveChannelAndContinue(interaction, interaction.values[0]);
        } else if (interaction.customId === "ticket_setup_category") {
          await ticketManager.saveCategoryAndContinue(interaction, interaction.values[0]);
        } else if (interaction.customId === "ticket_setup_role") {
          await ticketManager.saveRoleAndContinue(interaction, interaction.values[0]);
        } else if (interaction.customId === "ticket_setup_log") {
          await ticketManager.finalizeSetup(interaction, interaction.values[0]);
        }
      } catch (error) {
        console.error("Ticket Setup Logic Error:", error);
      }
      return;
    }

    // ====================================================
    // 3. TICKET ACTIONS
    // ====================================================
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id === "create_ticket") return ticketManager.createTicket(interaction);
      if (id === "close_ticket") return ticketManager.closeTicket(interaction);
      if (id === "ticket_reopen") return ticketManager.reopenTicket(interaction);
      if (id === "ticket_delete") return ticketManager.deleteTicket(interaction);

      if (id === "ticket_claim") return ticketManager.claimTicket(interaction);
      if (id === "ticket_transfer") return ticketManager.promptTransfer(interaction);

      if (id === "ticket_settings") return ticketManager.sendSettingsPanel(interaction);
      if (id === "ticket_voice_toggle") return ticketManager.toggleVoiceChannel(interaction);
      if (id === "ticket_add_user") return ticketManager.promptAddUser(interaction);
      if (id === "ticket_remove_user") return ticketManager.promptRemoveUser(interaction);
      if (id === "ticket_slowmode") return ticketManager.showSlowmodeMenu(interaction);
    }

    if (interaction.isUserSelectMenu()) {
      const id = interaction.customId;

      if (id === "ticket_add_user_select") return ticketManager.handleAddUserSelect(interaction);
      if (id === "ticket_remove_user_select") return ticketManager.handleRemoveUserSelect(interaction);
      if (id === "ticket_transfer_select") return ticketManager.handleTransferSelect(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "ticket_slowmode_select") {
        return ticketManager.handleSlowmodeSelect(interaction);
      }
    }

    // ====================================================
    // 4. JTC SYSTEM
    // ====================================================
    if (interaction.customId?.startsWith("jtc_")) {
      try {
        if (interaction.isButton()) {
          await jtcManager.handleInteraction(interaction);
        } else {
          await jtcManager.handleInput(interaction);
        }
      } catch (e) {
        console.error("JTC Error:", e);
      }
      return;
    }

    // ====================================================
    // 5. OTHER MODULES (LOG / REGISTRATION / TICKET SETTINGS)
    // ====================================================
    try {
      await logSettingsInteraction.execute(interaction);
    } catch (e) {
      console.error("Log Settings Interaction Error:", e);
    }

    try {
      await registrationButtonEvents.execute(interaction);
    } catch (e) {
      console.error("Registration Button Events Error:", e);
    }

    try {
      await registrationSettingsEvents.execute(interaction);
    } catch (e) {
      console.error("Registration Settings Events Error:", e);
    }

    try {
      await registrationSetupEvents.execute(interaction);
    } catch (e) {
      console.error("Registration Setup Events Error:", e);
    }

    try {
      await registrationVerificationEvents.execute(interaction);
    } catch (e) {
      console.error("Registration Verification Events Error:", e);
    }

    try {
      await ticketSettingsEvents.execute(interaction);
    } catch (e) {
      console.error("Ticket Settings Events Error:", e);
    }
  },
};
