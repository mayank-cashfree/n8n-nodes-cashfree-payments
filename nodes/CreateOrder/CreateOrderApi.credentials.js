const { ICredentialType, INodeProperties } = require('n8n-workflow');

class CreateOrderApi {
    constructor() {
        this.name = 'createOrderApi';
        this.displayName = 'Cashfree API';
        this.documentationUrl = 'https://docs.cashfree.com/reference/orders';
        this.properties = [
            {
                displayName: 'Client ID',
                name: 'clientId',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Client Secret',
                name: 'clientSecret',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
            },
            {
                displayName: 'API Version',
                name: 'apiVersion',
                type: 'string',
                default: '2022-09-01',
                required: true,
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
            },
        ];
    }
}

module.exports = { CreateOrderApi };