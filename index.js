// index.js - MASTER FILE (BOT + DASHBOARD + EVENTS + SOCIAL MANAGER + MUSIC)
require('dotenv').config();

const mongoose = require('mongoose');
const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const db = require('./utils/database');
const config = require('./config/config');
const { AutoPoster } = require('topgg-autoposter');

// Sosyal Medya Yöneticisi
const SocialManager = require('./utils/SocialManager');

// ✅ Müzik Sistemi (discord-player)
const { Player } = require('discord-player');

console.log('='.repeat(60));
console.log('🚀 NETRCOL BOT INITIALIZING');
console.log('='.repeat(60));

// ====================================================
// 1) ENV CHECKS
// ====================================================
if (!process.env.TOKEN && !config.token) {
  console.error('❌ CRITICAL ERROR: TOKEN not found in .env or config!');
  process.exit(1);
}

// ====================================================
// 2) MONGOOSE CONNECTION
// ====================================================
async function connectMongoose() {
  const mongoUri = process.env.MONGO_URI_LOCAL || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ CRITICAL ERROR: Mongo URI not found!');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Mongoose connected');
  } catch (err) {
    console.error('❌ Mongoose connection error:', err);
  }
}

// ====================================================
// 3) DISCORD CLIENT SETUP
// ====================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates, // 🎵 Critical for Music
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction,
  ],
});

// Event Listener Limit
client.setMaxListeners(50);

// Globals
global.client = client;
client.commands = new Collection();

// ====================================================
// 🎵 MUSIC SYSTEM - discord-player (Clean + Stable)
// ====================================================
const player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
  },
});

async function loadMusic() {
  try {
    await player.extractors.loadDefault();
    console.log('✅ Music extractors loaded:', player.extractors.cache.map(e => e.identifier).join(', '));
  } catch (err) {
    console.error('⚠️ Music extractor load failed:', err?.message || err);
    // Botu kilitleme: devam et
  }
}

player.events.on('error', (queue, error) => {
  console.log(`[Music Error] ${error?.message || error}`);
});

player.events.on('playerError', (queue, error) => {
  console.log(`[Player Error] ${error?.message || error}`);
});

client.player = player;

// ====================================================
// ⚠️ GLOBAL ERROR HANDLING
// ====================================================
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection/Promise Error:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

client.on('error', (err) => {
  console.error('❌ Discord Client Error:', err);
});

// ====================================================
// 4) COMMAND LOADER
// ====================================================
console.log('📂 Loading Commands...');
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  // A) Root files
  const rootFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of rootFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`   ✅ ${command.data.name}`);
      }
    } catch (e) {
      console.error(`   ❌ Error (${file}): ${e.message}`);
    }
  }

  // B) Subfolders
  const folders = fs.readdirSync(commandsPath).filter(f => fs.statSync(path.join(commandsPath, f)).isDirectory());
  for (const folder of folders) {
    const files = fs.readdirSync(path.join(commandsPath, folder)).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const command = require(path.join(commandsPath, folder, file));
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          console.log(`   ✅ ${command.data.name} (${folder})`);
        }
      } catch (e) {
        console.error(`   ❌ Error (${folder}/${file}): ${e.message}`);
      }
    }
  }
} else {
  console.warn('⚠️ WARNING: "commands" folder not found!');
}

// ====================================================
// 5) EVENT LOADER
// ====================================================
console.log('📂 Loading Events...');
const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    try {
      const eventModule = require(path.join(eventsPath, file));

      // Special: inviteTracker style module
      if (eventModule.name === 'inviteTracker') {
        eventModule.execute(client);
        console.log(`   ✅ Invite Tracker Started`);
        continue;
      }

      // Special: legacy serverLogs module
      if (file === 'serverLogs.js') {
        if (eventModule.onMessageDelete) client.on('messageDelete', (...args) => eventModule.onMessageDelete(...args));
        if (eventModule.onMessageUpdate) client.on('messageUpdate', (...args) => eventModule.onMessageUpdate(...args));
        if (eventModule.onMemberUpdate) client.on('guildMemberUpdate', (...args) => eventModule.onMemberUpdate(...args));
        console.log(`   ✅ Server Logs Loaded (Legacy Mode)`);
        continue;
      }

      // Standard event module
      if (eventModule.name && typeof eventModule.name === 'string') {
        // If you have a main interactionCreate handler elsewhere, skip duplicates
        if (eventModule.name === 'interactionCreate' && file !== 'interactionCreate.js') {
          console.log(`   ⚠ interactionCreate skipped (${file}) - main handler active.`);
          continue;
        }

        if (eventModule.once) {
          client.once(eventModule.name, (...args) => eventModule.execute(...args, client));
        } else {
          client.on(eventModule.name, (...args) => eventModule.execute(...args, client));
        }
        console.log(`   ✅ ${eventModule.name} (${file})`);
      } else {
        // Group export: multiple events in one file
        let count = 0;
        for (const key in eventModule) {
          const evt = eventModule[key];
          if (evt && evt.name && typeof evt.execute === 'function') {
            client.on(evt.name, (...args) => evt.execute(...args, client));
            count++;
          }
        }
        if (count > 0) console.log(`   ✅ ${count} Events Loaded (${file} - Group)`);
      }
    } catch (e) {
      console.error(`   ❌ Error (${file}): ${e.message}`);
    }
  }
} else {
  console.warn('⚠️ WARNING: "events" folder not found!');
}

// ====================================================
// 📈 TOP.GG AUTO POSTER (RUN AFTER READY)
// ====================================================
function setupTopggAutoPoster() {
  const TOPGG_TOKEN = process.env.TOPGG_TOKEN; // ✅ ONLY ENV

  if (!TOPGG_TOKEN) {
    console.warn('⚠️ WARNING: TOPGG_TOKEN missing, AutoPoster not started.');
    return;
  }

  const ap = AutoPoster(TOPGG_TOKEN, client);

  ap.on('posted', () => {
    console.log('✅ Stats successfully posted to Top.gg!');

    // DEV LOG CHANNEL
    const devLogChannelId = '1448451762729128048';
    const channel = client.channels.cache.get(devLogChannelId);

    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('📈 Top.gg Stats Posted')
        .setDescription(
          `**Server Count:** \`${client.guilds.cache.size}\`\n` +
          `**Shard Count:** \`${client.options.shardCount || 1}\`\n\n` +
          `Data successfully transmitted to Top.gg API.`
        )
        .setColor('#FF3366')
        .setTimestamp()
        .setFooter({ text: 'Netrcol AutoPoster', iconURL: 'https://top.gg/images/dblnew.png' });

      channel.send({ embeds: [embed] }).catch(e => console.error('Failed to send dev log:', e));
    }
  });

  ap.on('error', (err) => {
    console.error('❌ Top.gg AutoPoster Error:', err?.message || err);
  });
}

// ====================================================
// 📊 12 HOUR RAM HEALTH CHECK (RUN AFTER READY)
// ====================================================
function startRamHealthCheck() {
  setInterval(() => {
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const logChannelId = '1452714656627167313';
    const channel = client.channels.cache.get(logChannelId);

    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('🧠 Periodic System Check')
        .setDescription(`System is running.\n\n**RAM Usage:** \`${ramUsage} MB\``)
        .setColor('#00FF00')
        .setTimestamp()
        .setFooter({ text: 'Netrcol Health Check' });

      channel.send({ embeds: [embed] }).catch(() => {});
      console.log(`[RAM CHECK] Current Usage: ${ramUsage} MB`);
    } else {
      console.log(`[RAM CHECK] Current Usage: ${ramUsage} MB (log channel not cached)`);
    }
  }, 12 * 60 * 60 * 1000);
}

// ====================================================
// 🚀 START (SINGLE)
// ====================================================
async function start() {
  try {
    await connectMongoose();

    console.log('🔗 Database Connecting...');
    await db.connect();

    console.log('🎵 Loading Music Extractors...');
    await loadMusic(); // ✅ login’den önce

    console.log('🤖 Bot Logging in...');
    await client.login(config.token);

    // READY sonrası işler
    client.once('ready', async () => {
      console.log(`✅ Logged in as ${client.user?.tag}`);

      // Social Manager
      try {
        const socialManager = new SocialManager(client);
        socialManager.init();
        console.log('📡 Social Media Manager active...');
      } catch (e) {
        console.error('❌ Social Media Manager failed:', e);
      }

      // Dashboard
      const dashboardPath = path.join(__dirname, 'dashboard', 'server.js');
      if (fs.existsSync(dashboardPath)) {
        console.log('🌐 Dashboard Starting...');
        try {
          require(dashboardPath)(client, db);
        } catch (e) {
          console.error('❌ Dashboard Startup Error:', e);
        }
      } else {
        console.warn('⚠️ WARNING: dashboard/server.js not found.');
      }

      // Top.gg + RAM check
      setupTopggAutoPoster();
      startRamHealthCheck();
    });

  } catch (error) {
    console.error('❌ Startup Error:', error);
  }
}

start();
