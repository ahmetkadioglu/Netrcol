// data/defaultTopics.js
module.exports = [
    { 
        id: 'server', 
        name: 'Server', 
        emoji: '🖥️', 
        description: 'Server related questions and issues',
        staffRoleId: null // Varsayılan staff rolünü kullanır
    },
    { 
        id: 'help', 
        name: 'Help', 
        emoji: '❓', 
        description: 'Get general help and support',
        staffRoleId: null
    },
    { 
        id: 'request', 
        name: 'Request', 
        emoji: '💡', 
        description: 'Submit feature requests or suggestions',
        staffRoleId: null
    },
    { 
        id: 'complaint', 
        name: 'Complaint', 
        emoji: '😡', 
        description: 'File a complaint about a user or situation',
        staffRoleId: null
    }
];