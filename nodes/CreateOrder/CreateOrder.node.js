const { IExecuteFunctions } = require('n8n-core');
const { INodeExecutionData, INodeType, INodeTypeDescription } = require('n8n-workflow');

class CreateOrder {
    constructor() {
        this.description = {
            displayName: 'Create Cashfree Order',
            name: 'createOrder',
            icon: 'file:cashfree.svg',
            group: ['transform'],
            version: 1,
            description: 'Create an order using Cashfree Payment Gateway',
            defaults: {
                name: 'Create Order',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'createOrderApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Order Amount',
                    name: 'orderAmount',
                    type: 'number',
                    default: 0,
                    description: 'Amount of the order',
                    required: true,
                },
                {
                    displayName: 'Order Currency',
                    name: 'orderCurrency',
                    type: 'string',
                    default: 'INR',
                    description: 'Currency of the order',
                    required: true,
                },
                {
                    displayName: 'Customer ID',
                    name: 'customerId',
                    type: 'string',
                    default: '',
                    description: 'Unique identifier for the customer',
                    required: true,
                },
                {
                    displayName: 'Customer Phone',
                    name: 'customerPhone',
                    type: 'string',
                    default: '',
                    description: 'Phone number of the customer',
                    required: true,
                },
            ],
        };
    }

    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('createOrderApi');
        
        const baseUrl = credentials.environment === 'sandbox' 
            ? 'https://sandbox.cashfree.com/pg' 
            : 'https://api.cashfree.com/pg';

        for (let i = 0; i < items.length; i++) {
            try {
                const orderAmount = this.getNodeParameter('orderAmount', i);
                const orderCurrency = this.getNodeParameter('orderCurrency', i);
                const customerId = this.getNodeParameter('customerId', i);
                const customerPhone = this.getNodeParameter('customerPhone', i);

                const options = {
                    method: 'POST',
                    url: `${baseUrl}/orders`,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-version': credentials.apiVersion,
                        'x-client-id': credentials.clientId,
                        'x-client-secret': credentials.clientSecret,
                    },
                    body: {
                        order_currency: orderCurrency,
                        order_amount: orderAmount,
                        customer_details: {
                            customer_id: customerId,
                            customer_phone: customerPhone,
                        },
                    },
                    json: true,
                };

                const response = await this.helpers.request(options);
                returnData.push({ json: response });
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw error;
            }
        }
        
        return [returnData];
    }
}

module.exports = { CreateOrder };