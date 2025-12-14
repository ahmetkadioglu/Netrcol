// utils/ticketManager.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

const db = require("./database");

// Global cache for setup wizard
global.ticketSetupCache = global.ticketSetupCache || new Map();

class TicketManager {
  constructor() {
    // ticketTextChannelId -> voiceChannelId
    this.voiceChannels = new Map();
  }

  // --- Cache helpers ---
  getCache(guildId) {
    return global.ticketSetupCache.get(guildId) || {};
  }

  setCache(guildId, data) {
    const current = this.getCache(guildId);
    global.ticketSetupCache.set(guildId, { ...current, ...data });
  }

  // ====================================================
  // 🛠️ SETUP WIZARD
  // ====================================================

  async startSetup(interaction, type, anonMode = null) {
    this.setCache(interaction.guild.id, { type, anonMode });
    await this.showChannelSelection(interaction);
  }

  async showAnonOptions(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#2B2D31")
      .setTitle("🕵️ Anonymous Ticket Configuration")
      .setDescription(
        "Select the anonymity level for this ticket system:\n\n" +
          "• **Hide Staff** – Staff names are hidden from the user\n" +
          "• **Hide User** – User identity is hidden from staff\n" +
          "• **Full Anonymous** – Both sides see only anonymized identifiers"
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("setup_anon_staff")
        .setLabel("Hide Staff")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🛡️"),
      new ButtonBuilder()
        .setCustomId("setup_anon_user")
        .setLabel("Hide User")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("👤"),
      new ButtonBuilder()
        .setCustomId("setup_anon_full")
        .setLabel("Full Anonymous")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🕶️")
    );

    await interaction
      .editReply({ embeds: [embed], components: [row] })
      .catch(() => {});
  }

  async showChannelSelection(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📨 Step 2: Ticket Panel Channel")
      .setDescription("Select the channel where users will see the ticket panel.");

    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId("ticket_setup_channel")
      .setPlaceholder("Select a channel...")
      .addChannelTypes(ChannelType.GuildText);

    const row1 = new ActionRowBuilder().addComponents(selectMenu);

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_use_current_channel")
        .setLabel("📍 Use This Channel")
        .setStyle(ButtonStyle.Success)
    );

    await interaction
      .editReply({ embeds: [embed], components: [row1, row2] })
      .catch(() => {});
  }

  async showCategorySelection(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📂 Step 3: Ticket Category")
      .setDescription("Where should new ticket channels be created?");

    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId("ticket_setup_category")
      .setPlaceholder("Select a category...")
      .addChannelTypes(ChannelType.GuildCategory);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction
      .editReply({ embeds: [embed], components: [row] })
      .catch(() => {});
  }

  async showRoleSelection(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🛡️ Step 4: Staff Role")
      .setDescription("Which role will handle tickets?");

    const selectMenu = new RoleSelectMenuBuilder()
      .setCustomId("ticket_setup_role")
      .setPlaceholder("Select a staff role");

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction
      .editReply({ embeds: [embed], components: [row] })
      .catch(() => {});
  }

  async showLogChannelSelection(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🧾 Step 5: Ticket Log Channel")
      .setDescription(
        "Select the channel where ticket activity logs will be sent.\n" +
          "Ticket opened/closed, claimed/transferred, voice created/removed, users added/removed, and slowmode changes will be logged here."
      );

    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId("ticket_setup_log")
      .setPlaceholder("Select a log channel...")
      .addChannelTypes(ChannelType.GuildText);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction
      .editReply({ embeds: [embed], components: [row] })
      .catch(() => {});
  }

  async saveChannelAndContinue(interaction, channelId) {
    this.setCache(interaction.guild.id, { creationChannel: channelId });
    await this.showCategorySelection(interaction);
  }

  async saveCategoryAndContinue(interaction, categoryId) {
    this.setCache(interaction.guild.id, { category: categoryId });
    await this.showRoleSelection(interaction);
  }

  async saveRoleAndContinue(interaction, roleId) {
    this.setCache(interaction.guild.id, { staffRoleId: roleId });
    await this.showLogChannelSelection(interaction);
  }

  async finalizeSetup(interaction, logChannelId) {
    const data = this.getCache(interaction.guild.id);

    if (
      !data.type ||
      !data.creationChannel ||
      !data.category ||
      !data.staffRoleId ||
      !logChannelId
    ) {
      await interaction
        .editReply({
          content: "❌ Setup data is incomplete. Please run `/ticket-setup` again.",
          embeds: [],
          components: [],
        })
        .catch(() => {});
      return;
    }

    await interaction
      .editReply({
        content: "⏳ **Saving ticket configuration...**",
        embeds: [],
        components: [],
      })
      .catch(() => {});

    const settings = {
      enabled: true,
      type: data.type, // 'standard' | 'anonymous'
      anonMode: data.anonMode, // 'staff' | 'user' | 'full'
      creationChannelId: data.creationChannel,
      categoryId: data.category,
      staffRoleId: data.staffRoleId,
      logChannelId,
      panelTitle: "Support Tickets",
      panelDescription: "Click the button below to open a ticket.",
      ticketBtnCreate: "Create Ticket",
      ticketBtnClose: "Close Ticket",
    };

    try {
      await db.saveTicketSettings(interaction.guild.id, settings);
      global.ticketSetupCache.delete(interaction.guild.id);

      await this.refreshPanel(interaction.guild);

      await interaction
        .editReply({
          content:
            `✅ **Setup Complete!**\n` +
            `System: **${settings.type.toUpperCase()}**\n` +
            `Panel: <#${settings.creationChannelId}>\n` +
            `Category: <#${settings.categoryId}>\n` +
            `Log Channel: <#${settings.logChannelId}>`,
          embeds: [],
          components: [],
        })
        .catch(() => {});
    } catch (error) {
      console.error(error);
      await interaction
        .editReply({
          content: "❌ Setup failed (Database Error).",
          embeds: [],
          components: [],
        })
        .catch(() => {});
    }
  }

  // ====================================================
  // 🎛️ PANEL
  // ====================================================

  async refreshPanel(guild) {
    try {
      const settings = await db.getTicketSettings(guild.id);
      if (!settings || !settings.creationChannelId) return;

      const channel = guild.channels.cache.get(settings.creationChannelId);
      if (!channel) return;

      const messages = await channel.messages.fetch({ limit: 10 }).catch(() => null);
      let oldPanel = null;

      if (messages) {
        oldPanel = messages.find(
          (msg) =>
            msg.embeds &&
            msg.embeds[0] &&
            msg.embeds[0].title &&
            msg.embeds[0].title.includes("Support")
        );
      }

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(settings.panelTitle || "Support Tickets")
        .setDescription(settings.panelDescription || "Click the button below to open a ticket.");

      const btn = new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel(settings.ticketBtnCreate || "Create Ticket")
        .setStyle(ButtonStyle.Primary)
        .setEmoji(settings.type === "anonymous" ? "🕵️" : "🎫");

      const row = new ActionRowBuilder().addComponents(btn);

      if (oldPanel) {
        await oldPanel.edit({ embeds: [embed], components: [row] }).catch(() => {});
      } else {
        await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
      }
    } catch (error) {
      console.error("Panel refresh error:", error);
    }
  }

  // ====================================================
  // 📜 LOG
  // ====================================================

  async logActivity(guild, settings, description, ticketChannel = null) {
    try {
      if (!settings?.logChannelId) return;
      const logChannel = guild.channels.cache.get(settings.logChannelId);
      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setColor("#2B2D31")
        .setDescription(description)
        .setTimestamp();

      if (ticketChannel) {
        embed.addFields({ name: "Ticket", value: `${ticketChannel}`, inline: true });
      }

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (e) {
      console.error("Ticket log error:", e);
    }
  }

  // ====================================================
  // 🎫 COMPONENT BUILDER (NORMAL TICKETS)
  // ====================================================

  buildClaimComponents({ settings, claimed }) {
    const claimBtn = new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel(claimed ? "Claimed" : "Claim")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🧾")
      .setDisabled(!!claimed);

    const transferBtn = new ButtonBuilder()
      .setCustomId("ticket_transfer")
      .setLabel("Transfer")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔁")
      .setDisabled(!claimed);

    const closeBtn = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel(settings.ticketBtnClose || "Close")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒");

    const row1 = new ActionRowBuilder().addComponents(claimBtn, transferBtn, closeBtn);

    const settingsBtn = new ButtonBuilder()
      .setCustomId("ticket_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⚙️");

    const row2 = new ActionRowBuilder().addComponents(settingsBtn);

    return [row1, row2];
  }

  // ====================================================
  // 🎫 TICKET ACTIONS
  // ====================================================

  async createTicket(interaction) {
    // ACK immediately
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
    }

    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || !settings.enabled) {
      return interaction
        .editReply({ content: "❌ Ticket system is not configured or disabled." })
        .catch(() => {});
    }

    // stale record cleanup
    const hasTicket = await db.findActiveTicket(interaction.user.id, interaction.guild.id);
    if (hasTicket?.channelId) {
      const existing = interaction.guild.channels.cache.get(hasTicket.channelId);
      if (!existing) {
        await db.deleteTicket(hasTicket.channelId).catch(() => {});
      } else {
        return interaction
          .editReply({
            content: `❌ You already have an open ticket: <#${hasTicket.channelId}>`,
          })
          .catch(() => {});
      }
    }

    try {
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username.slice(0, 10)}`,
        type: ChannelType.GuildText,
        parent: settings.categoryId,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          {
            id: interaction.client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.ManageMessages,
            ],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
        ],
      });

      await channel.setTopic(`ticket-owner:${interaction.user.id}`).catch(() => {});

      if (settings.staffRoleId) {
        await channel.permissionOverwrites
          .create(settings.staffRoleId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          })
          .catch(() => {});
      }

      await db.createTicket({
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        channelId: channel.id,
        type: settings.type,
        anonMode: settings.anonMode,
        createdAt: new Date(),
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle("👋 Welcome")
        .setDescription(
          "Your request has been forwarded to the support team. They are eager to assist you!\n" +
            "Please be patient while waiting for their response."
        )
        .setColor("#5865F2");

      const components = [];
      if (settings.type === "anonymous") {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel(settings.ticketBtnClose || "Close")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔒")
        );
        components.push(row);
      } else {
        components.push(...this.buildClaimComponents({ settings, claimed: false }));
      }

      await channel
        .send({
          content: `${interaction.user}${settings.staffRoleId ? ` <@&${settings.staffRoleId}>` : ""}`,
          embeds: [welcomeEmbed],
          components,
          allowedMentions: settings.staffRoleId
            ? { roles: [String(settings.staffRoleId)], users: [interaction.user.id] }
            : { users: [interaction.user.id] },
        })
        .catch(() => {});

      if (settings.type === "anonymous") {
        const dmEmbed = new EmbedBuilder()
          .setColor("#2ecc71")
          .setTitle("✅ Ticket Created")
          .setDescription("Your anonymous ticket is now open.\nReply to this DM to chat with staff.");

        await interaction.user.send({ embeds: [dmEmbed] }).catch(() => {});
      }

      await interaction.editReply({ content: `✅ Ticket created: ${channel}` }).catch(() => {});

      await this.logActivity(
        interaction.guild,
        settings,
        `🟢 Ticket opened by ${interaction.user}.`,
        channel
      );
    } catch (error) {
      console.error("Create Ticket Error:", error);
      await interaction
        .editReply({ content: "❌ Failed to create ticket channel. Check bot permissions." })
        .catch(() => {});
    }
  }

  async closeTicket(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings) return;

    const channel = interaction.channel;

    if (!channel.name.startsWith("closed-")) {
      await channel.setName(`closed-${channel.name}`).catch(() => {});
    }

    // remove old components to prevent spam
    if (interaction.message?.edit) {
      await interaction.message.edit({ components: [] }).catch(() => {});
    }

    // mark inactive in DB
    await db.deleteTicket(channel.id).catch(() => {});

    // delete linked voice if any
    const voiceId = this.voiceChannels.get(channel.id);
    if (voiceId) {
      const voiceChannel = interaction.guild.channels.cache.get(voiceId);
      if (voiceChannel) await voiceChannel.delete().catch(() => {});
      this.voiceChannels.delete(channel.id);
    }

    const embed = new EmbedBuilder()
      .setColor("#ED4245")
      .setTitle("🔒 Ticket Closed")
      .setDescription(
        "This ticket has been closed.\n\n" +
          "You can **reopen** the ticket or **delete** it completely using the buttons below."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_reopen")
        .setLabel("Reopen Ticket")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔓"),
      new ButtonBuilder()
        .setCustomId("ticket_delete")
        .setLabel("Delete Ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🗑️")
    );

    // respond quickly (avoid failed interaction)
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
    }

    await interaction
      .editReply({
        embeds: [embed],
        components: [row],
      })
      .catch(async () => {
        await interaction.followUp({ embeds: [embed], components: [row] }).catch(() => {});
      });

    await this.logActivity(
      interaction.guild,
      settings,
      `🔒 Ticket closed by ${interaction.user}.`,
      channel
    );
  }

  async reopenTicket(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings) return;

    // MUST ACK FAST (fixes "interaction failed")
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
    }

    if (settings.staffRoleId && !interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction
        .editReply({ content: "❌ You are not allowed to reopen this ticket." })
        .catch(() => {});
    }

    const channel = interaction.channel;

    if (channel.name.startsWith("closed-")) {
      await channel.setName(channel.name.replace(/^closed-/, "")).catch(() => {});
    }

    // restore ticket record from topic owner
    let ownerId = null;
    const topic = channel.topic || "";
    const match = topic.match(/ticket-owner:(\d{17,})/);
    if (match) ownerId = match[1];

    await db
      .createTicket({
        userId: ownerId || interaction.user.id,
        guildId: interaction.guild.id,
        channelId: channel.id,
        type: settings.type,
        anonMode: settings.anonMode,
        createdAt: new Date(),
      })
      .catch(() => {});

    // remove buttons from clicked message
    if (interaction.message?.edit) {
      await interaction.message.edit({ components: [] }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setTitle("🔓 Ticket Reopened")
      .setDescription("This ticket has been reopened. Support will be with you shortly.")
      .setColor("#57F287");

    const components = [];
    if (settings.type === "anonymous") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel(settings.ticketBtnClose || "Close")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒")
      );
      components.push(row);
    } else {
      components.push(...this.buildClaimComponents({ settings, claimed: false }));
    }

    await channel.send({ embeds: [embed], components }).catch(() => {});

    await interaction.editReply({ content: "✅ Ticket reopened." }).catch(() => {});

    await this.logActivity(
      interaction.guild,
      settings,
      `🔓 Ticket reopened by ${interaction.user}.`,
      channel
    );
  }

  async deleteTicket(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings) return;

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
    }

    if (settings.staffRoleId && !interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction
        .editReply({ content: "❌ You are not allowed to delete this ticket." })
        .catch(() => {});
    }

    const channel = interaction.channel;

    await interaction.editReply({ content: "🗑️ Ticket will be deleted in 5 seconds..." }).catch(() => {});

    await this.logActivity(
      interaction.guild,
      settings,
      `🗑️ Ticket deleted by ${interaction.user}.`,
      channel
    );

    setTimeout(async () => {
      try {
        await db.deleteTicket(channel.id).catch(() => {});
        const voiceId = this.voiceChannels.get(channel.id);
        if (voiceId) {
          const voiceChannel = interaction.guild.channels.cache.get(voiceId);
          if (voiceChannel) await voiceChannel.delete().catch(() => {});
          this.voiceChannels.delete(channel.id);
        }
        await channel.delete().catch(() => {});
      } catch (e) {
        console.error("deleteTicket error:", e);
      }
    }, 5000);
  }

  // ====================================================
  // 🙋 CLAIM + TRANSFER (NORMAL ONLY)
  // ====================================================

  async claimTicket(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }

    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to claim this ticket.", flags: 64 }).catch(() => {});
    }

    const msg = interaction.message;
    const baseEmbed = msg.embeds[0];
    if (!baseEmbed) {
      return interaction.reply({ content: "❌ Cannot claim: ticket embed is missing.", flags: 64 }).catch(() => {});
    }

    const embed = EmbedBuilder.from(baseEmbed);
    const fields = embed.data.fields || [];
    const filtered = fields.filter((f) => f.name !== "Claimed By");
    filtered.push({ name: "Claimed By", value: `${interaction.user}`, inline: true });
    embed.setFields(filtered);

    const updatedComponents = this.buildClaimComponents({ settings, claimed: true });

    await msg.edit({ embeds: [embed], components: updatedComponents }).catch(() => {});

    await interaction.reply({ content: "✅ You claimed this ticket.", flags: 64 }).catch(() => {});

    await this.logActivity(interaction.guild, settings, `🧾 Ticket claimed by ${interaction.user}.`, interaction.channel);
  }

  async promptTransfer(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }

    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to transfer this ticket.", flags: 64 }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor("#2B2D31")
      .setTitle("🔁 Transfer Ticket")
      .setDescription("Select a staff member to transfer this ticket to.");

    const menu = new UserSelectMenuBuilder()
      .setCustomId("ticket_transfer_select")
      .setPlaceholder("Select a staff member...")
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row], flags: 64 }).catch(() => {});
  }

  async handleTransferSelect(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }

    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to transfer this ticket.", flags: 64 }).catch(() => {});
    }

    const targetUserId = interaction.values[0];

    const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);
    if (!targetMember || !targetMember.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You can only transfer to a staff member.", flags: 64 }).catch(() => {});
    }

    // Find ticket message to edit (message containing ticket_claim button)
    const msgs = await interaction.channel.messages.fetch({ limit: 25 }).catch(() => null);
    const ticketMsg = msgs?.find(
      (m) =>
        m.author?.id === interaction.client.user.id &&
        m.components?.some((r) => r.components?.some((c) => c.customId === "ticket_claim"))
    );

    if (!ticketMsg) {
      return interaction.reply({ content: "❌ Ticket message not found to update claim owner.", flags: 64 }).catch(() => {});
    }

    const baseEmbed = ticketMsg.embeds[0];
    const embed = baseEmbed ? EmbedBuilder.from(baseEmbed) : new EmbedBuilder().setColor("#5865F2");

    const fields = embed.data.fields || [];
    const filtered = fields.filter((f) => f.name !== "Claimed By");
    filtered.push({ name: "Claimed By", value: `<@${targetUserId}>`, inline: true });
    embed.setFields(filtered);

    const updatedComponents = this.buildClaimComponents({ settings, claimed: true });
    await ticketMsg.edit({ embeds: [embed], components: updatedComponents }).catch(() => {});

    await interaction.reply({ content: `✅ Ticket transferred to <@${targetUserId}>.`, flags: 64 }).catch(() => {});

    await this.logActivity(
      interaction.guild,
      settings,
      `🔁 Ticket transferred by ${interaction.user} to <@${targetUserId}>.`,
      interaction.channel
    );
  }

  // ====================================================
  // ⚙ SETTINGS PANEL (NORMAL ONLY)
  // ====================================================

  async sendSettingsPanel(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }

    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to use ticket settings.", flags: 64 }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor("#2B2D31")
      .setTitle("⚙ Ticket Settings")
      .setDescription(
        "Use the buttons below to configure this ticket:\n\n" +
          "• **Voice Channel** – Toggle a linked voice channel for this ticket.\n" +
          "• **Add User** – Grant a user access to this ticket.\n" +
          "• **Remove User** – Revoke access for a user.\n" +
          "• **Slowmode** – Apply rate limit to this channel."
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_voice_toggle").setLabel("Voice Channel").setStyle(ButtonStyle.Secondary).setEmoji("🎙️"),
      new ButtonBuilder().setCustomId("ticket_add_user").setLabel("Add User").setStyle(ButtonStyle.Secondary).setEmoji("➕"),
      new ButtonBuilder().setCustomId("ticket_remove_user").setLabel("Remove User").setStyle(ButtonStyle.Secondary).setEmoji("➖"),
      new ButtonBuilder().setCustomId("ticket_slowmode").setLabel("Slowmode").setStyle(ButtonStyle.Secondary).setEmoji("🐢")
    );

    await interaction.reply({ embeds: [embed], components: [row] }).catch(() => {
      interaction.followUp({ embeds: [embed], components: [row] }).catch(() => {});
    });
  }

  // ====================================================
  // 🔊 VOICE TOGGLE
  // ====================================================

  async toggleVoiceChannel(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }

    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to manage voice for this ticket.", flags: 64 }).catch(() => {});
    }

    const textChannel = interaction.channel;
    const existingId = this.voiceChannels.get(textChannel.id);

    if (existingId) {
      const voiceChannel = interaction.guild.channels.cache.get(existingId);
      if (voiceChannel) await voiceChannel.delete().catch(() => {});
      this.voiceChannels.delete(textChannel.id);

      await interaction.reply({ content: "🔇 Linked voice channel removed.", flags: 64 }).catch(() => {});

      await this.logActivity(
        interaction.guild,
        settings,
        `🔇 Linked voice channel removed for this ticket by ${interaction.user}.`,
        textChannel
      );
      return;
    }

    const overwrites = textChannel.permissionOverwrites.cache.map((o) => ({
      id: o.id,
      allow: o.allow.bitfield,
      deny: o.deny.bitfield,
    }));

    const parentId = textChannel.parentId || settings.categoryId || null;

    try {
      const voiceChannel = await interaction.guild.channels.create({
        name: `${textChannel.name}-voice`,
        type: ChannelType.GuildVoice,
        parent: parentId,
        permissionOverwrites: overwrites,
      });

      this.voiceChannels.set(textChannel.id, voiceChannel.id);

      await interaction.reply({ content: `🎙️ Linked voice channel created: ${voiceChannel}`, flags: 64 }).catch(() => {});

      await this.logActivity(
        interaction.guild,
        settings,
        `🎙️ Linked voice channel created for this ticket by ${interaction.user}.`,
        textChannel
      );
    } catch (error) {
      console.error("toggleVoiceChannel error:", error);
      return interaction.reply({ content: "❌ Failed to create voice channel. Check bot permissions.", flags: 64 }).catch(() => {});
    }
  }

  // ====================================================
  // 👥 ADD / REMOVE USER
  // ====================================================

  async promptAddUser(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to add users to this ticket.", flags: 64 }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor("#2B2D31")
      .setTitle("➕ Add User to Ticket")
      .setDescription("Select a user to grant access to this ticket.");

    const menu = new UserSelectMenuBuilder()
      .setCustomId("ticket_add_user_select")
      .setPlaceholder("Select a user...")
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row], flags: 64 }).catch(() => {});
  }

  async handleAddUserSelect(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to add users to this ticket.", flags: 64 }).catch(() => {});
    }

    const userId = interaction.values[0];

    await interaction.channel.permissionOverwrites
      .edit(userId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true })
      .catch(() => {});

    await interaction.reply({ content: `✅ <@${userId}> can now view and write in this ticket.`, flags: 64 }).catch(() => {});

    await this.logActivity(
      interaction.guild,
      settings,
      `➕ User <@${userId}> was added to this ticket by ${interaction.user}.`,
      interaction.channel
    );
  }

  async promptRemoveUser(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to remove users from this ticket.", flags: 64 }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor("#2B2D31")
      .setTitle("➖ Remove User from Ticket")
      .setDescription("Select a user to revoke access from this ticket.");

    const menu = new UserSelectMenuBuilder()
      .setCustomId("ticket_remove_user_select")
      .setPlaceholder("Select a user...")
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row], flags: 64 }).catch(() => {});
  }

  async handleRemoveUserSelect(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to remove users from this ticket.", flags: 64 }).catch(() => {});
    }

    const userId = interaction.values[0];

    await interaction.channel.permissionOverwrites.delete(userId).catch(() => {});

    await interaction.reply({ content: `✅ <@${userId}> no longer has access to this ticket.`, flags: 64 }).catch(() => {});

    await this.logActivity(
      interaction.guild,
      settings,
      `➖ User <@${userId}> was removed from this ticket by ${interaction.user}.`,
      interaction.channel
    );
  }

  // ====================================================
  // 🐢 SLOWMODE
  // ====================================================

  async showSlowmodeMenu(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to change slowmode for this ticket.", flags: 64 }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor("#2B2D31")
      .setTitle("🐢 Slowmode")
      .setDescription("Select a rate limit for this ticket channel.");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_slowmode_select")
      .setPlaceholder("Select slowmode duration...")
      .addOptions(
        { label: "Off", value: "0" },
        { label: "1s", value: "1" },
        { label: "2s", value: "2" },
        { label: "3s", value: "3" },
        { label: "5s", value: "5" },
        { label: "10s", value: "10" },
        { label: "15s", value: "15" },
        { label: "30s", value: "30" }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row], flags: 64 }).catch(() => {});
  }

  async handleSlowmodeSelect(interaction) {
    const settings = await db.getTicketSettings(interaction.guild.id);
    if (!settings || settings.type === "anonymous") return;

    if (!settings.staffRoleId) {
      return interaction.reply({ content: "❌ Staff role is not configured for the ticket system.", flags: 64 }).catch(() => {});
    }
    if (!interaction.member.roles.cache.has(settings.staffRoleId)) {
      return interaction.reply({ content: "❌ You are not allowed to change slowmode for this ticket.", flags: 64 }).catch(() => {});
    }

    const seconds = parseInt(interaction.values[0], 10) || 0;

    await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});

    await interaction.reply({
      content: seconds === 0 ? "✅ Slowmode disabled for this ticket." : `✅ Slowmode set to **${seconds}s** for this ticket.`,
      flags: 64,
    }).catch(() => {});

    await this.logActivity(
      interaction.guild,
      settings,
      seconds === 0
        ? `🐢 Slowmode disabled for this ticket by ${interaction.user}.`
        : `🐢 Slowmode set to **${seconds}s** for this ticket by ${interaction.user}.`,
      interaction.channel
    );
  }
}

module.exports = new TicketManager();
