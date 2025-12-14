const { EmbedBuilder } = require('discord.js');
const db = require('./database');

async function sendLog(guild, data) {
    try {
        const settings = await db.getGuildSettings(guild.id);
        
        // Log kanalı ayarlı değilse çık
        if (!settings.logChannelId) return;

        // Log kanalı sunucuda var mı kontrol et
        const logChannel = guild.channels.cache.get(settings.logChannelId);
        if (!logChannel) return;

        // İzin kontrolü için mapping (Eşleştirme)
        let requiredPermission = data.type;

        // Ticket ile ilgili her türlü işlemi 'ticket_events' iznine bağla
        if (data.type.startsWith('ticket_')) {
            requiredPermission = 'ticket_events';
        }

        // Eğer veritabanındaki ayarlar bu izni içermiyorsa loglama yapma
        // Adminler için opsiyonel: Eğer logEvents undefined ise (eski veri) varsayılan olarak logla veya loglama
        if (!settings.logEvents || !settings.logEvents.includes(requiredPermission)) {
            console.log(`❌ [LOG] ${requiredPermission} (actual: ${data.type}) not enabled for guild ${guild.id}`);
            return;
        }

        console.log(`🔍 [LOG] Attempting to send log: ${data.type} (perm: ${requiredPermission}) for guild: ${guild.id}`);

        const embed = new EmbedBuilder()
            .setColor(data.color || '#5865F2')
            .setTitle(data.title)
            .setDescription(data.description)
            .setTimestamp();

        if (data.fields && data.fields.length > 0) {
            embed.addFields(data.fields);
        }

        if (data.footer) {
            embed.setFooter(data.footer);
        }

        if (data.thumbnail) {
            embed.setThumbnail(data.thumbnail);
        }

        await logChannel.send({ embeds: [embed] });
        console.log(`✅ [LOG] Log sent successfully: ${data.type}`);

    } catch (error) {
        console.error(`❌ [LOG] Error sending log: ${error.message}`);
    }
}

// Hiyerarşi kontrolü (Yetkili kullanıcı işlem yapabilir mi?)
function canModerate(executor, target) {
    // Bot sahibi her zaman işlem yapabilir
    if (executor.id === process.env.OWNER_ID) return true;
    
    // Sunucu sahibi her zaman işlem yapabilir
    if (executor.id === executor.guild.ownerId) return true;

    // Kendine işlem yapamaz
    if (executor.id === target.id) return false;

    // Hedef sunucu sahibiyse işlem yapılamaz
    if (target.id === executor.guild.ownerId) return false;

    // Rol pozisyonu kontrolü
    return executor.roles.highest.position > target.roles.highest.position;
}

// Süre formatla (ms -> string)
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün`;
    if (hours > 0) return `${hours} saat`;
    if (minutes > 0) return `${minutes} dakika`;
    return `${seconds} saniye`;
}

module.exports = {
    sendLog,
    canModerate,
    formatDuration
};