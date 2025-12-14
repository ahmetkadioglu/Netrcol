const { ChannelType, PermissionsBitField } = require("discord.js");

module.exports = [
    { 
        name: 'ping', 
        description: 'Shows bot ping and latency',
        default_permissions: null
    },
    { 
        name: 'ban', 
        description: 'Bans a user from the server',
        default_permissions: PermissionsBitField.Flags.BanMembers.toString(),
        options: [
            {
                name: 'user',
                type: 6,
                description: 'The user to ban',
                required: true
            },
            {
                name: 'delete_messages',
                type: 3,
                description: 'Delete message history',
                required: true,
                choices: [
                    { name: "Don't delete any", value: "0" },
                    { name: "Last 1 hour", value: "1" },
                    { name: "Last 6 hours", value: "6" },
                    { name: "Last 12 hours", value: "12" },
                    { name: "Last 1 day", value: "24" },
                    { name: "Last 3 days", value: "72" },
                    { name: "Last 7 days", value: "168" }
                ]
            },
            {
                name: 'reason',
                type: 3,
                description: 'Reason for the ban (visible in audit log)',
                required: false
            }
        ]
    },
    { 
        name: 'unban', 
        description: 'Unbans a user from the server',
        default_permissions: PermissionsBitField.Flags.BanMembers.toString(),
        options: [
            {
                name: 'userid',
                type: 3,
                description: 'The user ID to unban',
                required: true
            },
            {
                name: 'reason',
                type: 3,
                description: 'Reason for the unban (visible in audit log)',
                required: false
            }
        ]
    },
    { 
        name: 'kick', 
        description: 'Kicks a user from the server',
        default_permissions: PermissionsBitField.Flags.KickMembers.toString(),
        options: [
            {
                name: 'user',
                type: 6,
                description: 'The user to kick',
                required: true
            },
            {
                name: 'reason',
                type: 3,
                description: 'Reason for the kick (visible in audit log)',
                required: false
            }
        ]
    },
    { 
        name: 'timeout', 
        description: 'Applies timeout to a user',
        default_permissions: PermissionsBitField.Flags.ModerateMembers.toString(),
        options: [
            {
                name: 'user',
                type: 6,
                description: 'The user to timeout',
                required: true
            },
            {
                name: 'duration',
                type: 3,
                description: 'Timeout duration',
                required: true,
                choices: [
                    { name: "60 Seconds", value: "60000" },
                    { name: "5 Minutes", value: "300000" },
                    { name: "10 Minutes", value: "600000" },
                    { name: "1 Hour", value: "3600000" },
                    { name: "1 Day", value: "86400000" },
                    { name: "1 Week", value: "604800000" }
                ]
            },
            {
                name: 'reason',
                type: 3,
                description: 'Reason for the timeout (visible in audit log)',
                required: false
            }
        ]
    },
    { 
        name: 'untimeout', 
        description: 'Removes timeout from a user',
        default_permissions: PermissionsBitField.Flags.ModerateMembers.toString(),
        options: [
            {
                name: 'user',
                type: 6,
                description: 'The user to remove timeout from',
                required: true
            },
            {
                name: 'reason',
                type: 3,
                description: 'Reason for removing timeout',
                required: false
            }
        ]
    },
    { 
        name: 'lock', 
        description: 'Locks the current channel',
        default_permissions: PermissionsBitField.Flags.ManageChannels.toString()
    },
    { 
        name: 'unlock', 
        description: 'Unlocks the current channel',
        default_permissions: PermissionsBitField.Flags.ManageChannels.toString()
    },
    { 
        name: 'clear', 
        description: 'Deletes specified number of messages',
        default_permissions: PermissionsBitField.Flags.ManageMessages.toString(),
        options: [
            {
                name: 'amount',
                type: 4,
                description: 'Number of messages to delete (1-100)',
                required: true
            }
        ]
    },
    { 
        name: 'serverinfo', 
        description: 'Shows server information',
        default_permissions: null
    },
    { 
        name: 'botinfo', 
        description: 'Shows bot statistics and information',
        default_permissions: null
    },
    { 
        name: 'logs-setup', 
        description: 'Setup the logging system for the server',
        default_permissions: PermissionsBitField.Flags.Administrator.toString(),
        options: [
            {
                name: 'channel',
                type: 7,
                description: 'The channel where logs will be sent',
                required: true,
                channel_types: [ChannelType.GuildText]
            }
        ]
    },
    { 
        name: 'logs-disable', 
        description: 'Disable the logging system for the server',
        default_permissions: PermissionsBitField.Flags.Administrator.toString()
    },
    { 
        name: 'ticket-setup', 
        description: 'Setup the ticket system for the server',
        default_permissions: PermissionsBitField.Flags.Administrator.toString(),
        options: [
            {
                name: 'channel',
                type: 7,
                description: 'Channel for ticket creation',
                required: false,
                channel_types: [ChannelType.GuildText]
            },
            {
                name: 'category',
                type: 7,
                description: 'Category for ticket channels',
                required: false,
                channel_types: [ChannelType.GuildCategory]
            },
            {
                name: 'staff_role',
                type: 8,
                description: 'Role that can manage tickets',
                required: false
            }
        ]
    },
    {
        name: 'ticket-close',
        description: 'Close a ticket (Admin only)',
        default_permissions: PermissionsBitField.Flags.ManageChannels.toString()
    },
    {
        name: 'category-settings',
        description: 'Manage ticket categories',
        default_permissions: PermissionsBitField.Flags.Administrator.toString()
    },
    {
        name: 'category-add',
        description: 'Add a new ticket category',
        default_permissions: PermissionsBitField.Flags.Administrator.toString(),
        options: [
            {
                name: 'id',
                type: 3,
                description: 'Unique ID for the category',
                required: true
            },
            {
                name: 'name',
                type: 3,
                description: 'Category name',
                required: true
            },
            {
                name: 'description',
                type: 3,
                description: 'Category description',
                required: false
            },
            {
                name: 'staff_role',
                type: 8,
                description: 'Staff role for this category (optional)',
                required: false
            },
            {
                name: 'emoji',
                type: 3,
                description: 'Emoji for this category (optional)',
                required: false
            }
        ]
    },
    {
        name: 'ticket-disable',
        description: 'Completely disable the ticket system',
        default_permissions: PermissionsBitField.Flags.Administrator.toString()
    },
    {
        name: 'yardım',
        description: 'Bot komutları ve yardım sistemi',
        default_permissions: null
    },
    {
        name: 'istatistik',
        description: 'Bot istatistiklerini gösterir',
        default_permissions: null
    },
    {
        name: 'backup',
        description: 'Sunucu ayarlarını yedekle',
        default_permissions: PermissionsBitField.Flags.Administrator.toString(),
        options: [
            {
                name: 'action',
                type: 3,
                description: 'Backup işlemi',
                required: true,
                choices: [
                    { name: 'Oluştur', value: 'create' },
                    { name: 'Listele', value: 'list' },
                    { name: 'Geri Yükle', value: 'restore' }
                ]
            },
            {
                name: 'backup_id',
                type: 3,
                description: 'Geri yüklenecek backup ID',
                required: false
            }
        ]
    }
];