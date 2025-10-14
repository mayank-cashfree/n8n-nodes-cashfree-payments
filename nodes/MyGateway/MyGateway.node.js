class MyGateway {
    description = {
        displayName: 'MyGateway',
        name: 'myGateway',
        icon: 'file:icon.svg',
        group: ['transform'],
        version: 1,
        description: 'Create a payment link using Cashfree Payments API',
        defaults: {
            name: 'MyGateway',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'MyGatewayApi',
                required: true,
            },
        ],
        properties: [
            // Customer Details
            {
                displayName: 'Customer Email',
                name: 'customer_email',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Customer Name',
                name: 'customer_name',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Customer Phone',
                name: 'customer_phone',
                type: 'string',
                default: '',
                required: true,
            },

            // Link Details
            {
                displayName: 'Link ID',
                name: 'link_id',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Link Amount',
                name: 'link_amount',
                type: 'number',
                default: 100,
                required: true,
            },
            {
                displayName: 'Link Currency',
                name: 'link_currency',
                type: 'string',
                default: 'INR',
            },
            {
                displayName: 'Link Purpose',
                name: 'link_purpose',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Link Expiry Time',
                name: 'link_expiry_time',
                type: 'string',
                default: '',
                placeholder: 'YYYY-MM-DDTHH:MM:SS+05:30',
            },

            // Link Notes (JSON Format)
            {
                displayName: 'Link Notes (JSON Format)',
                name: 'linkNotes',
                type: 'json',
                default: '{}',
                description: 'Enter a JSON object for notes, e.g., {"key_1": "value_1"}',
            },

            // Other properties...
            {
                displayName: 'Notify URL',
                name: 'notify_url',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Return URL',
                name: 'return_url',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Allow UPI Intent',
                name: 'upi_intent',
                type: 'boolean',
                default: false,
            },
            {
                displayName: 'Send Email Notification',
                name: 'send_email',
                type: 'boolean',
                default: true,
            },
            {
                displayName: 'Send SMS Notification',
                name: 'send_sms',
                type: 'boolean',
                default: false,
            },
            {
                displayName: 'Enable Partial Payments',
                name: 'link_partial_payments',
                type: 'boolean',
                default: false,
            },
            {
                displayName: 'Minimum Partial Amount',
                name: 'link_minimum_partial_amount',
                type: 'number',
                default: 1,
            },
            {
                displayName: 'Enable Auto Reminders',
                name: 'link_auto_reminders',
                type: 'boolean',
                default: true,
            },
        ],
    };

    async execute() {
        const items = this.getInputData();
        const returnData = [];

        for (let i = 0; i < items.length; i++) {
            const credentials = await this.getCredentials('MyGatewayApi', i);
            let linkNotes;
            try {
                const linkNotesJson = this.getNodeParameter('linkNotes', i, '{}');
                linkNotes = JSON.parse(linkNotesJson);
            } catch (error) {
                throw new NodeApiError(this.getNode(), { message: `Invalid JSON in Link Notes: ${error.message}` });
            }

            const body = {
                customer_details: {
                    customer_email: this.getNodeParameter('customer_email', i, ''),
                    customer_name: this.getNodeParameter('customer_name', i, ''),
                    customer_phone: this.getNodeParameter('customer_phone', i, ''),
                },
                link_amount: this.getNodeParameter('link_amount', i),
                link_currency: this.getNodeParameter('link_currency', i, 'INR'),
                link_id: this.getNodeParameter('link_id', i),
                link_purpose: this.getNodeParameter('link_purpose', i),
                link_expiry_time: this.getNodeParameter('link_expiry_time', i),
                link_auto_reminders: this.getNodeParameter('link_auto_reminders', i),
                link_partial_payments: this.getNodeParameter('link_partial_payments', i),
                link_minimum_partial_amount: this.getNodeParameter('link_minimum_partial_amount', i),
                link_meta: {
                    notify_url: this.getNodeParameter('notify_url', i),
                    return_url: this.getNodeParameter('return_url', i),
                    upi_intent: this.getNodeParameter('upi_intent', i),
                },
                link_notes: linkNotes,
                link_notify: {
                    send_email: this.getNodeParameter('send_email', i),
                    send_sms: this.getNodeParameter('send_sms', i),
                },
            };

            if (!body.link_expiry_time) delete body.link_expiry_time;

            const response = await this.helpers.httpRequest({
                method: 'POST',
                url: 'https://sandbox.cashfree.com/pg/links',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-version': '2025-01-01',
                    'x-client-id': credentials.apiKey,
                    'x-client-secret': credentials.apiSecret,
                },
                body,
                json: true,
            });

            returnData.push(response);
        }

        return [this.helpers.returnJsonArray(returnData)];
    }
}

module.exports = { MyGateway };