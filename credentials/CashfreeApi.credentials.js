const { ICredentialType, INodeProperties } = require('n8n-workflow');

class CashfreeApi {
    constructor() {
        this.name = 'cashfreeApi';
        this.displayName = 'Cashfree API';
        this.documentationUrl = 'https://docs.cashfree.com/reference';
        this.properties = [
            {
                displayName: 'Client ID',
                name: 'clientId',
                type: 'string',
                default: '',
                required: false,
                description: 'Cashfree Payment Gateway Client ID',
            },
            {
                displayName: 'Client Secret',
                name: 'clientSecret',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: false,
                description: 'Cashfree Payment Gateway Client Secret',
            },
            {
                displayName: 'Payout Authorization Token',
                name: 'payoutAuthToken',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: false,
                description: 'Authorization token for Cashfree Payout API',
            },
            {
                displayName: 'API Version',
                name: 'apiVersion',
                type: 'string',
                default: '2025-01-01',
                required: false,
                description: 'API Version for Payment Gateway operations',
            },
            {
                displayName: 'Environment',
                name: 'environment',
                type: 'options',
                options: [
                    {
                        name: 'Sandbox',
                        value: 'sandbox',
                    },
                    {
                        name: 'Production',
                        value: 'production',
                    },
                ],
                default: 'sandbox',
                required: true,
                description: 'Environment',
            },
        ];
    }
}

module.exports = { CashfreeApi };
