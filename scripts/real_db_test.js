// Netrcol Bot - Gerçek MongoDB Bağlantı Testi
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function realMongoTest() {
    console.log('🧪 Gerçek MongoDB Bağlantı Testi Başlatılıyor...\n');
    
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
        console.log('❌ MONGO_URI bulunamadı!');
        return;
    }
    
    console.log('🔗 MongoDB Atlas\'a bağlanılıyor...');
    
    const client = new MongoClient(mongoUri);
    
    try {
        await client.connect();
        console.log('✅ MongoDB Atlas bağlantısı başarılı!');
        
        const db = client.db('netrcol_bot');
        console.log('📊 Database:', db.databaseName);
        
        // Collections listele
        const collections = await db.listCollections().toArray();
        console.log('📁 Mevcut Collections:', collections.length);
        collections.forEach(col => console.log(`   - ${col.name}`));
        
        // Test verisi ekle
        console.log('\n📝 Test verisi ekleniyor...');
        const testData = {
            guildId: '123456789',
            test: true,
            timestamp: new Date(),
            message: 'Netrcol Bot test verisi'
        };
        
        await db.collection('test_collection').insertOne(testData);
        console.log('✅ Test verisi eklendi');
        
        // Veriyi oku
        const readData = await db.collection('test_collection').findOne({ test: true });
        console.log('✅ Test verisi okundu:', readData.message);
        
        // Test verisini sil
        await db.collection('test_collection').deleteOne({ test: true });
        console.log('✅ Test verisi silindi');
        
        console.log('\n🎉 MongoDB Test Tamamlandı!');
        console.log('✅ Bağlantı başarılı');
        console.log('✅ CRUD operasyonları çalışıyor');
        console.log('✅ Veritabanı entegrasyonu hazır');
        
    } catch (error) {
        console.error('❌ MongoDB Test Hatası:', error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log('\n🔧 Çözüm: MongoDB Atlas > Database Access > User Password');
        }
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 Çözüm: Network Access > IP Whitelist');
        }
        if (error.message.includes('Server selection')) {
            console.log('\n🔧 Çözüm: Connection string kontrol edin');
        }
        
    } finally {
        await client.close();
        console.log('🔌 MongoDB bağlantısı kapatıldı');
    }
}

// Test çalıştır
realMongoTest();