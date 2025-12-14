// deploy.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
// Komutlar klasörünün yolu (Ana dizinde olduğu varsayılıyor)
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

console.log('🔄 Komutlar hazırlanıyor...');

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    // Sadece klasörleri işle
    if (fs.statSync(commandsPath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    console.log(`   📥 Yüklendi: ${command.data.name}`);
                } else {
                    console.log(`   ⚠️  [UYARI] ${filePath} dosyasında "data" veya "execute" eksik.`);
                }
            } catch (error) {
                console.error(`   ❌ Hata (${file}):`, error.message);
            }
        }
    }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`\n⏳ ${commands.length} komut Discord API'sine gönderiliyor...`);

        // Global yükleme (Tüm sunucularda görünür - 1 saate kadar sürebilir)
        // Hızlı test için Guild ID kullanılabilir ama biz Global yapalım temiz olsun.
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ Başarılı! ${data.length} komut yüklendi.`);
        console.log('👉 Not: Komutların görünmesi birkaç dakika sürebilir. Discord uygulamasını tamamen kapatıp açmayı deneyin (CTRL+R).');

    } catch (error) {
        console.error('❌ Yükleme hatası:', error);
    }
})();