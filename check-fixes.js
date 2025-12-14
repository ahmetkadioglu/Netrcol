// check-fixes.js - BOTUN ANA KLASÖRÜNE OLUŞTUR
const fs = require('fs');
const path = require('path');

console.log('🔍 Import kontrolü yapılıyor...');

const filesToCheck = [
    'commands/logs/logs-disable.js',
    'commands/logs/logs-setup.js',
    'commands/moderation/ban.js',
    'commands/moderation/clear.js',
    'commands/moderation/kick.js',
    'commands/moderation/lock.js',
    'commands/moderation/timeout.js',
    'commands/moderation/unban.js',
    'commands/moderation/unlock.js',
    'commands/moderation/untimeout.js',
    'commands/tickets/category-add.js',
    'commands/tickets/category-settings.js',
    'commands/tickets/ticket-close.js',
    'commands/tickets/ticket-disable.js',
    'commands/tickets/ticket-setup.js'
];

filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes("require('../utils/") && !content.includes("require('../../utils/")) {
            console.log(`❌ ${file} - Hatalı import!`);
        } else {
            console.log(`✅ ${file} - Doğru`);
        }
    } else {
        console.log(`❌ ${file} - Dosya bulunamadı!`);
    }
});

console.log('✅ Kontrol tamamlandı!');