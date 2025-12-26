// dashboard/server.js (GÜNCEL VE TAM)
const app = require('./app'); 

// index.js'ten gelen (client, db) parametrelerini alıyoruz
module.exports = (client, dbWrapper) => {
    const port = 3000;

    // 1. Botu Uygulamaya Tanıt (Global)
    app.set('client', client);

    // 2. Veritabanını Uygulamaya Tanıt (Global)
    // Veritabanı bağlantısını garantilemek için kontrol:
    let activeDb;

    // Native Mongo Driver veya Wrapper kontrolü
    if (dbWrapper && dbWrapper.collection) {
        activeDb = dbWrapper; 
    } else if (dbWrapper && dbWrapper.db && dbWrapper.db.collection) {
        activeDb = dbWrapper.db; 
    } else {
        // En kötü ihtimalle direkt gelen nesneyi dene
        activeDb = dbWrapper ? (dbWrapper.db || dbWrapper) : null;
    }
    
    // Veritabanını 'db' adıyla kaydet (main.js buradan çekecek)
    app.set('db', activeDb);

    // 3. Sunucuyu Başlat
    app.listen(port, "0.0.0.0", () => {
        console.log(`Web Panel Ready: http://0.0.0.0:${port}`);
    });
};