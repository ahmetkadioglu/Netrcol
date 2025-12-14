// dashboard/helpers.js - BASİT VERSİYON
function createDashboardPage(data = {}) {
    const { user, guilds = [], botInviteUrl, supportServerUrl, isAdmin } = data;
    
    let guildsHtml = '';
    if (guilds.length > 0) {
        guildsHtml = guilds.map(guild => {
            const icon = guild.iconUrl ? 
                `<img src="${guild.iconUrl}" class="guild-icon">` : 
                `<div class="guild-icon" style="background: #5865F2; display: flex; align-items: center; justify-content: center; font-size: 24px;">${guild.name.charAt(0)}</div>`;
            
            const button = guild.botInGuild ? 
                `<a href="/dashboard/guild/${guild.id}" class="btn">Yönet</a>` : 
                `<a href="${botInviteUrl}" target="_blank" class="btn">Botu Davet Et</a>`;
            
            return `
                <div class="guild-card">
                    ${icon}
                    <h3>${guild.name}</h3>
                    <p>ID: ${guild.id}</p>
                    ${button}
                </div>
            `;
        }).join('');
    } else {
        guildsHtml = `
            <p>Henüz yönetebileceğin bir sunucu yok.</p>
            <p>Botu bir sunucuya davet edip yönetici yetkisine sahip olmalısın.</p>
            <a href="${botInviteUrl}" class="btn" target="_blank">Botu Davet Et</a>
        `;
    }
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Netrcol Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0a0a0f; color: white; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
            .user-info { display: flex; align-items: center; gap: 15px; }
            .avatar { width: 50px; height: 50px; border-radius: 50%; }
            .guilds-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
            .guild-card { background: #1a1a2e; padding: 20px; border-radius: 10px; border: 1px solid #2a2a3e; }
            .guild-icon { width: 64px; height: 64px; border-radius: 50%; margin-bottom: 15px; }
            .btn { display: inline-block; padding: 10px 20px; background: #5865F2; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Netrcol Dashboard</h1>
                <div class="user-info">
                    <img src="${user?.avatar ? 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png' : 'https://cdn.discordapp.com/embed/avatars/0.png'}" 
                         class="avatar" alt="${user?.username || 'User'}">
                    <div>
                        <h3>${user?.username || 'Kullanıcı'}</h3>
                        ${isAdmin ? '<span style="color: gold;">👑 Admin</span>' : ''}
                    </div>
                    <a href="/auth/logout" class="btn">Çıkış Yap</a>
                </div>
            </div>
            
            <h2>Yönetebileceğin Sunucular</h2>
            <div class="guilds-grid">
                ${guildsHtml}
            </div>
            
            ${isAdmin ? `
                <div style="margin-top: 40px; padding: 20px; background: rgba(88, 101, 242, 0.1); border-radius: 10px;">
                    <h3>👑 Admin Panel</h3>
                    <p>Yönetici erişiminiz var.</p>
                    <a href="/admin/content" class="btn">İçerik Yönetimi</a>
                </div>
            ` : ''}
        </div>
    </body>
    </html>
    `;
}

function createGuildPage(data = {}) {
    const { user, guild, settings = {} } = data;
    
    let channelsHtml = '';
    let rolesHtml = '';
    
    if (guild?.channels) {
        channelsHtml = guild.channels
            .filter(ch => ch.type === 0)
            .map(ch => `<option value="${ch.id}" ${settings.modLogChannel === ch.id ? 'selected' : ''}>${ch.name}</option>`)
            .join('');
    }
    
    if (guild?.roles) {
        rolesHtml = guild.roles
            .map(role => `<option value="${role.id}" ${settings.registrationRole === role.id ? 'selected' : ''}>${role.name}</option>`)
            .join('');
    }
    
    const guildIcon = guild?.icon ? 
        `<img src="${guild.icon}" class="guild-icon">` : 
        `<div class="guild-icon" style="background: #5865F2; display: flex; align-items: center; justify-content: center; font-size: 48px;">${guild?.name?.charAt(0) || 'S'}</div>`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${guild?.name || 'Sunucu'} - Netrcol</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0a0a0f; color: white; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .guild-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
            .guild-icon { width: 100px; height: 100px; border-radius: 50%; }
            .settings-form { background: #1a1a2e; padding: 20px; border-radius: 10px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; color: #a0a0c0; }
            input, select, textarea { width: 100%; padding: 10px; background: #0a0a0f; border: 1px solid #2a2a3e; color: white; border-radius: 5px; }
            .btn { display: inline-block; padding: 10px 20px; background: #5865F2; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="guild-header">
                ${guildIcon}
                <div>
                    <h1>${guild?.name || 'Sunucu'}</h1>
                    <p>Üye Sayısı: ${guild?.memberCount || '0'}</p>
                    <a href="/dashboard" class="btn">← Geri</a>
                </div>
            </div>
            
            <div class="settings-form">
                <h2>Sunucu Ayarları</h2>
                <form id="guildSettingsForm">
                    <div class="form-group">
                        <label>Moderasyon Log Kanalı</label>
                        <select name="modLogChannel">
                            <option value="">Seçilmedi</option>
                            ${channelsHtml}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Kayıt Sistemi</label>
                        <select name="registrationEnabled">
                            <option value="true" ${settings.registrationEnabled === true ? 'selected' : ''}>Aktif</option>
                            <option value="false" ${settings.registrationEnabled === false ? 'selected' : ''}>Pasif</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Kayıt Rolü</label>
                        <select name="registrationRole">
                            <option value="">Seçilmedi</option>
                            ${rolesHtml}
                        </select>
                    </div>
                    
                    <button type="submit" class="btn">Ayarları Kaydet</button>
                </form>
            </div>
            
            <script>
                document.getElementById('guildSettingsForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData);
                    
                    try {
                        const response = await fetch('/api/guild/${guild?.id}/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        
                        if (response.ok) {
                            alert('Ayarlar kaydedildi!');
                        } else {
                            alert('Hata oluştu');
                        }
                    } catch (error) {
                        alert('Bağlantı hatası');
                    }
                });
            </script>
        </div>
    </body>
    </html>
    `;
}

function createAdminPanelPage(data = {}) {
    const { user, faqItems = [], featureCards = [], commandCategories = [] } = data;
    
    let faqHtml = faqItems.map((item, index) => `
        <div class="item" data-id="${item._id}">
            <h4>${index + 1}. ${item.question || 'Soru'}</h4>
            <p>${item.answer || 'Cevap'}</p>
            <button class="btn" onclick="editItem('faq', '${item._id}')">Düzenle</button>
            <button class="btn btn-danger" onclick="deleteItem('faq', '${item._id}')">Sil</button>
        </div>
    `).join('');
    
    let featuresHtml = featureCards.map((item, index) => `
        <div class="item" data-id="${item._id}">
            <h4>${index + 1}. ${item.title || 'Başlık'}</h4>
            <p>${item.description || 'Açıklama'}</p>
            <p>İkon: ${item.icon || '⚡'} | Renk: ${item.color || '#6366f1'}</p>
            <button class="btn" onclick="editItem('features', '${item._id}')">Düzenle</button>
            <button class="btn btn-danger" onclick="deleteItem('features', '${item._id}')">Sil</button>
        </div>
    `).join('');
    
    let commandsHtml = commandCategories.map((item, index) => `
        <div class="item" data-id="${item._id}">
            <h4>${index + 1}. ${item.name || 'Kategori'}</h4>
            <p>${item.description || 'Açıklama'}</p>
            <p>İkon: ${item.icon || '📁'} | Komut Sayısı: ${item.commands?.length || 0}</p>
            <button class="btn" onclick="editItem('commands', '${item._id}')">Düzenle</button>
            <button class="btn btn-danger" onclick="deleteItem('commands', '${item._id}')">Sil</button>
        </div>
    `).join('');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Panel - Netrcol</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0a0a0f; color: white; }
            .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
            .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
            .tab { padding: 10px 20px; background: #1a1a2e; border: none; color: white; cursor: pointer; border-radius: 5px; }
            .tab.active { background: #5865F2; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .item-list { background: #1a1a2e; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
            .item { background: #0a0a0f; padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid #5865F2; }
            .btn { display: inline-block; padding: 8px 16px; background: #5865F2; color: white; text-decoration: none; border-radius: 5px; margin: 5px; border: none; cursor: pointer; }
            .btn-danger { background: #ED4245; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="admin-header">
                <h1>👑 Admin Panel</h1>
                <div>
                    <a href="/dashboard" class="btn">← Dashboard'a Dön</a>
                    <a href="/" class="btn">Ana Sayfa</a>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab active" onclick="switchTab('faq')">SSS</button>
                <button class="tab" onclick="switchTab('features')">Özellikler</button>
                <button class="tab" onclick="switchTab('commands')">Komutlar</button>
            </div>
            
            <div id="faq-tab" class="tab-content active">
                <h2>SSS Yönetimi</h2>
                <button class="btn" onclick="addNewItem('faq')">+ Yeni SSS Ekle</button>
                <div class="item-list" id="faq-list">
                    ${faqHtml}
                </div>
            </div>
            
            <div id="features-tab" class="tab-content">
                <h2>Özellik Kartları Yönetimi</h2>
                <button class="btn" onclick="addNewItem('features')">+ Yeni Özellik Ekle</button>
                <div class="item-list" id="features-list">
                    ${featuresHtml}
                </div>
            </div>
            
            <div id="commands-tab" class="tab-content">
                <h2>Komut Kategorileri Yönetimi</h2>
                <button class="btn" onclick="addNewItem('commands')">+ Yeni Kategori Ekle</button>
                <div class="item-list" id="commands-list">
                    ${commandsHtml}
                </div>
            </div>
        </div>
        
        <script>
            function switchTab(tabName) {
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                document.getElementById(tabName + '-tab').classList.add('active');
                event.target.classList.add('active');
            }
            
            function addNewItem(type) {
                const item = prompt('Yeni öğe eklemek için JSON formatında veri girin:');
                if (item) {
                    try {
                        const data = JSON.parse(item);
                        fetch('/api/content/' + type, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        }).then(() => location.reload());
                    } catch (e) {
                        alert('Geçersiz JSON formatı');
                    }
                }
            }
            
            function editItem(type, id) {
                const newData = prompt('Yeni veriyi JSON formatında girin:');
                if (newData) {
                    try {
                        const data = JSON.parse(newData);
                        fetch('/api/content/' + type + '/' + id, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        }).then(() => location.reload());
                    } catch (e) {
                        alert('Geçersiz JSON formatı');
                    }
                }
            }
            
            function deleteItem(type, id) {
                if (confirm('Bu öğeyi silmek istediğinize emin misiniz?')) {
                    fetch('/api/content/' + type + '/' + id, {
                        method: 'DELETE'
                    }).then(() => location.reload());
                }
            }
        </script>
    </body>
    </html>
    `;
}

module.exports = {
    createDashboardPage,
    createGuildPage,
    createAdminPanelPage
};