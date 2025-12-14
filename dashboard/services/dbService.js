// services/dbService.js
const { ObjectId } = require('mongodb');

function createDbService(db) {
    // Tip -> collection adı
    function resolveContentCollection(type) {
        switch (type) {
            case 'faq':
                return 'dashboard_content_faq';
            case 'features':
                return 'dashboard_content_features';
            case 'commands':
                return 'dashboard_content_commands';
            default:
                return null;
        }
    }

    // ---------- CONTENT İŞLEMLERİ ----------

    async function getContent(type) {
        const collectionName = resolveContentCollection(type);
        if (!collectionName) throw new Error('Invalid content type');

        if (!db.db) throw new Error('Database not connected');
        
        return db.db
            .collection(collectionName)
            .find({})
            .sort({ order: 1 })
            .toArray();
    }

    async function createContent(type, data) {
        const collectionName = resolveContentCollection(type);
        if (!collectionName) throw new Error('Invalid content type');

        if (!db.db) throw new Error('Database not connected');

        const doc = {
            ...data,
            createdAt: new Date()
        };

        const result = await db.db.collection(collectionName).insertOne(doc);
        return result.insertedId;
    }

    async function updateContent(type, id, data) {
        const collectionName = resolveContentCollection(type);
        if (!collectionName) throw new Error('Invalid content type');

        if (!db.db) throw new Error('Database not connected');

        const update = {
            ...data,
            updatedAt: new Date()
        };
        delete update._id;

        const result = await db.db.collection(collectionName).updateOne(
            { _id: new ObjectId(id) },
            { $set: update }
        );

        return result.modifiedCount;
    }

    async function deleteContent(type, id) {
        const collectionName = resolveContentCollection(type);
        if (!collectionName) throw new Error('Invalid content type');

        if (!db.db) throw new Error('Database not connected');

        const result = await db.db.collection(collectionName).deleteOne({
            _id: new ObjectId(id)
        });

        return result.deletedCount;
    }

    async function updateContentOrder(type, items) {
        const collectionName = resolveContentCollection(type);
        if (!collectionName) throw new Error('Invalid content type');

        if (!db.db) throw new Error('Database not connected');

        const bulkOps = items.map((item, index) => ({
            updateOne: {
                filter: { _id: new ObjectId(item._id) },
                update: { $set: { order: index + 1 } }
            }
        }));

        await db.db.collection(collectionName).bulkWrite(bulkOps);
        return true;
    }

    // ---------- GUILD SETTINGS İŞLEMLERİ ----------

    async function getGuildSettings(guildId) {
        if (!db.db) return {};
        
        const doc = await db.db
            .collection('dashboard_guild_settings')
            .findOne({ guildId });

        if (!doc || !doc.settings) return {};
        return doc.settings;
    }

    async function saveGuildSettings(guildId, settings, guildName = null) {
        if (!db.db) throw new Error('Database not connected');

        await db.db.collection('dashboard_guild_settings').updateOne(
            { guildId },
            {
                $set: {
                    settings,
                    updatedAt: new Date(),
                    guildName: guildName || undefined
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        return true;
    }

    return {
        getContent,
        createContent,
        updateContent,
        deleteContent,
        updateContentOrder,
        getGuildSettings,
        saveGuildSettings
    };
}

module.exports = {
    createDbService
};