// utils/transcriptGenerator.js - MODERN & READABLE HTML
const { AttachmentBuilder } = require('discord.js');

async function generateTranscript(channel, guild) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Transcript - ${channel.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                
                body { 
                    background-color: #313338; 
                    color: #dbdee1; 
                    font-family: 'Roboto', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                }
                .container {
                    max-width: 100%;
                    padding: 20px;
                }
                .header { 
                    background-color: #2b2d31; 
                    padding: 20px; 
                    border-bottom: 1px solid #1e1f22; 
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .header h1 { margin: 0; font-size: 20px; color: #f2f3f5; }
                .header p { margin: 5px 0 0; font-size: 14px; color: #949ba4; }
                
                .message-group { 
                    margin-bottom: 16px; 
                    display: flex; 
                    align-items: flex-start;
                }
                .avatar { 
                    width: 40px; 
                    height: 40px; 
                    border-radius: 50%; 
                    margin-right: 16px; 
                    margin-top: 2px;
                    cursor: pointer;
                }
                .content { 
                    flex: 1; 
                    min-width: 0;
                }
                .meta { 
                    display: flex; 
                    align-items: center; 
                    margin-bottom: 2px; 
                }
                .username { 
                    font-weight: 500; 
                    font-size: 16px; 
                    color: #f2f3f5; 
                    margin-right: 8px; 
                }
                .timestamp { 
                    font-size: 12px; 
                    color: #949ba4; 
                }
                .text { 
                    font-size: 15px; 
                    line-height: 1.375rem; 
                    color: #dbdee1; 
                    white-space: pre-wrap; 
                    word-wrap: break-word;
                }
                .bot-tag { 
                    background-color: #5865F2; 
                    color: white; 
                    padding: 0 4px; 
                    border-radius: 3px; 
                    font-size: 10px; 
                    font-weight: bold; 
                    text-transform: uppercase; 
                    margin-left: 4px; 
                    vertical-align: middle;
                    height: 15px;
                    line-height: 15px;
                    display: inline-block;
                }
                .attachment {
                    display: inline-block;
                    margin-top: 5px;
                    padding: 5px 10px;
                    background-color: #2b2d31;
                    border-radius: 4px;
                    border: 1px solid #1e1f22;
                    color: #00a8fc;
                    text-decoration: none;
                    font-size: 14px;
                }
                .attachment:hover { text-decoration: underline; }
                .embed-msg { color: #949ba4; font-style: italic; font-size: 13px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1>📄 Ticket Transcript</h1>
                    <p>Channel: <strong>#${channel.name}</strong> • Server: <strong>${guild.name}</strong></p>
                </div>
                <div style="text-align: right;">
                    <p>Date: ${new Date().toLocaleString()}</p>
                    <p>Messages: ${sortedMessages.length}</p>
                </div>
            </div>
            
            <div class="container">
        `;

        let lastAuthorId = null;

        sortedMessages.forEach(msg => {
            const avatarUrl = msg.author.displayAvatarURL({ extension: 'png', size: 64 });
            const isBot = msg.author.bot ? '<span class="bot-tag">BOT</span>' : '';
            
            // HTML güvenliği için karakterleri değiştir
            let content = msg.content 
                ? msg.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') 
                : '<span class="embed-msg">[Embed or System Message]</span>';
            
            // Linkleri tıklanabilir yap
            content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #00a8fc;">$1</a>');

            let attachmentHtml = '';
            if (msg.attachments.size > 0) {
                msg.attachments.forEach(att => {
                    attachmentHtml += `<br><a href="${att.url}" target="_blank" class="attachment">📎 ${att.name}</a>`;
                });
            }

            // Ardışık mesajları gruplama mantığı (Görsellik için)
            htmlContent += `
                <div class="message-group">
                    <img src="${avatarUrl}" class="avatar" alt="Avatar">
                    <div class="content">
                        <div class="meta">
                            <span class="username" style="color: ${msg.member?.displayHexColor !== '#000000' ? msg.member?.displayHexColor : '#f2f3f5'}">${msg.author.username}</span>
                            ${isBot}
                            <span class="timestamp">${msg.createdAt.toLocaleString()}</span>
                        </div>
                        <div class="text">${content}${attachmentHtml}</div>
                    </div>
                </div>
            `;
        });

        htmlContent += `</div></body></html>`;

        const buffer = Buffer.from(htmlContent, 'utf-8');
        return new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });

    } catch (error) {
        console.error('Transcript gen error:', error);
        return null;
    }
}

module.exports = { generateTranscript };