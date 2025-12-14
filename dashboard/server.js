// dashboard/server.js (TEMİZ SÜRÜM)

// expressLayouts'u artık burada require etmiyoruz
const app = require('./app'); // app.js'i çağır

module.exports = (client) => {
    const port = 3000;

    // Bot istemcisini Express içine göm
    app.set('client', client);

    // expressLayouts kullanımı buradan kaldırıldı!

    // Sunucuyu Başlat
    app.listen(port, "0.0.0.0", () => {
  console.log(`Web Panel Ready: http://0.0.0.0:${port}`);
});

};