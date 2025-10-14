const { CashfreePayments } = require('./CashfreePayments/CashfreePayments.node.js');
const { CashfreeApi } = require('../credentials/CashfreeApi.credentials.js');

module.exports = {
    nodes: [CashfreePayments],
    credentials: [CashfreeApi]
};
