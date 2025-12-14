// utils/permissions.js
const { PermissionsBitField } = require("discord.js");
const config = require('../config/config');

const rateLimitMap = new Map();

class PermissionManager {
    checkRateLimit(userId, commandName, cooldown = 3000) {
        const key = `${userId}-${commandName}`;
        const now = Date.now();
        const userLimit = rateLimitMap.get(key);

        if (userLimit && (now - userLimit) < cooldown) {
            return false;
        }

        rateLimitMap.set(key, now);
        return true;
    }

    checkPermissions(member, requiredPermission) {
        if (!member) return false;
        return member.permissions.has(requiredPermission);
    }
}

module.exports = new PermissionManager();