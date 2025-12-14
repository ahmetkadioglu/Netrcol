require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, '..', 'commands');

// Tüm komutları topla
function loadCommands(folderPath) {
    const items = fs.readdirSync(folderPath);
    
    for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            // Alt klasörleri recursive olarak gez
            loadCommands(itemPath);
        } else if (item.endsWith('.js')) {
            // Komut dosyasını yükle
            try {
                const command = require(itemPath);
                if (command.data && typeof command.data.toJSON === 'function') {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Komut eklendi: ${command.data.name}`);
                }
            } catch (error) {
                console.log(`❌ Hata yükleme komutu ${item}:`, error.message);
            }
        }
    }
}

// Komutları yükle
loadCommands(commandsPath);

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🔄 ${commands.length} adet komut kaydediliyor...`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ ${data.length} adet komut başarıyla kaydedildi!`);
    } catch (error) {
        console.error('❌ Komut kaydetme hatası:', error);
    }
})();