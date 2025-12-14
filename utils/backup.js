// utils/backup.js
const fs = require('fs');
const path = require('path');
const db = require('./database');

/**
 * Tüm database'i JSON olarak yedekler.
 * backups/ klasörüne backup-YYYY-MM-DDTHH-mm-ss.json şeklinde kaydeder.
 */
async function createBackup() {
    try {
        if (!db.isConnected || !db.db) {
            console.log('⚠️ Backup atlandı: Database bağlı değil.');
            return;
        }

        const backupDir = path.join(__dirname, '..', 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

        const collections = await db.db.listCollections().toArray();
        const data = {};

        for (const coll of collections) {
            const name = coll.name;
            const docs = await db.db.collection(name).find({}).toArray();
            data[name] = docs;
        }

        await fs.promises.writeFile(
            backupFile,
            JSON.stringify(data, null, 2),
            'utf8'
        );

        console.log(`💾 Backup oluşturuldu: backups/${path.basename(backupFile)}`);
    } catch (err) {
        console.log('⚠️ Backup hatası:', err.message);
    }
}

module.exports = { createBackup };
