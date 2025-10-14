const { IExecuteFunctions } = require('n8n-core');
const { INodeExecutionData, INodeType, INodeTypeDescription, NodeApiError } = require('n8n-workflow');

class CashfreePayments {
    description = {
        displayName: 'Cashfree Payments',
        name: 'cashfreePayments',
        icon: 'file:Cashfree-Logo.png',
        group: ['transform'],
        version: 1,
        description: 'Interact with Cashfree Payments API',
        defaults: {
            name: 'Cashfree Payments',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'cashfreeApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                    {
                        name: 'Create Order',
                        value: 'createOrder',
                        description: 'Create a new order',
                        action: 'Create a new order',
                    },
                    {
                        name: 'Create Payment Link',
                        value: 'createPaymentLink',
                        description: 'Create a payment link',
                        action: 'Create a payment link',
                    },
                    {
                        name: 'Cancel Payment Link',
                        value: 'cancelPaymentLink',
                        description: 'Cancel an existing payment link',
                        action: 'Cancel a payment link',
                    },
                    {   name: 'Fetch Payment Link Details',
                        value: 'fetchPaymentLinkDetails',
                        description: 'Fetch Payment Link Details',
                        action: 'Fetch Payment Link Details',
                    },
                    {
                        name: 'Create Refund',
                        value: 'createRefund',
                        description: 'Create a refund for an order',
                        action: 'Create a refund',
                    },
                    {
                        name: 'Create Cashgram',
                        value: 'createCashgram',
                        description: 'Create a Cashgram payout link',
                        action: 'Create a Cashgram',
                    }
                ],
                default: 'createOrder',
                noDataExpression: true,
            },

            {
                displayName: 'Order Amount',
                name: 'orderAmount',
                type: 'number',
                displayOptions: {
                    show: {
                        operation: ['createOrder'],
                    },
                },
                default: 0,
                required: true,
            },
            {
                displayName: 'Order Currency',
                name: 'orderCurrency',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createOrder'],
                    },
                },
                default: 'INR',
                required: true,
            },
            {
                displayName: 'Customer ID',
                name: 'customerId',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createOrder'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Customer Phone',
                name: 'customerPhone',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createOrder'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Customer Email',
                name: 'customer_email',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Customer Name',
                name: 'customer_name',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '',
            },
            {
                displayName: 'Customer Phone',
                name: 'customer_phone',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Link ID',
                name: 'link_id',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Link Amount',
                name: 'link_amount',
                type: 'number',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: 100,
                required: true,
            },
            {
                displayName: 'Link Currency',
                name: 'link_currency',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: 'INR',
            },
            {
                displayName: 'Link Purpose',
                name: 'link_purpose',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Link Expiry Time',
                name: 'link_expiry_time',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '',
                placeholder: 'YYYY-MM-DDTHH:MM:SS+05:30',
            },
            {
                displayName: 'Link Notes (JSON Format)',
                name: 'linkNotes',
                type: 'json',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '{}',
                description: 'Enter a JSON object for notes, e.g., {"key_1": "value_1"}',
            },
            {
                displayName: 'Notify URL',
                name: 'notify_url',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '',
            },
            {
                displayName: 'Return URL',
                name: 'return_url',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: '',
            },
            {
                displayName: 'Allow UPI Intent',
                name: 'upi_intent',
                type: 'boolean',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: false,
            },
            {
                displayName: 'Send Email Notification',
                name: 'send_email',
                type: 'boolean',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: true,
            },
            {
                displayName: 'Send SMS Notification',
                name: 'send_sms',
                type: 'boolean',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: false,
            },
            {
                displayName: 'Enable Partial Payments',
                name: 'link_partial_payments',
                type: 'boolean',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: false,
            },
            {
                displayName: 'Minimum Partial Amount',
                name: 'link_minimum_partial_amount',
                type: 'number',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: 1,
            },
            {
                displayName: 'Enable Auto Reminders',
                name: 'link_auto_reminders',
                type: 'boolean',
                displayOptions: {
                    show: {
                        operation: ['createPaymentLink'],
                    },
                },
                default: true,
            },
            {
                displayName: 'Link ID',
                name: 'cancel_link_id',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['cancelPaymentLink'],
                    },
                },
                default: '',
                required: true,
                description: 'The ID of the payment link to cancel',
            },
            {
                displayName: 'Link ID',
                name: 'fetch_details_link_id',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['fetchPaymentLinkDetails'],
                    },
                },
                default: '',
                required: true,
                description: 'The ID of the payment link to fetch details for',
            },
            {
                displayName: 'Order ID',
                name: 'refund_order_id',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createRefund'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Refund Amount',
                name: 'refund_amount',
                type: 'number',
                displayOptions: {
                    show: {
                        operation: ['createRefund'],
                    },
                },
                default: 1,
                required: true,
            },
            {
                displayName: 'Refund ID',
                name: 'refund_id',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createRefund'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Refund Note',
                name: 'refund_note',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createRefund'],
                    },
                },
                default: '',
            },
            {
                displayName: 'Refund Speed',
                name: 'refund_speed',
                type: 'options',
                options: [
                    { name: 'STANDARD', value: 'STANDARD' },
                    { name: 'INSTANT', value: 'INSTANT' },
                ],
                displayOptions: {
                    show: {
                        operation: ['createRefund'],
                    },
                },
                default: 'STANDARD',
            },
            {
                displayName: 'Cashgram ID',
                name: 'cashgram_id',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createCashgram'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Amount',
                name: 'cashgram_amount',
                type: 'number',
                displayOptions: {
                    show: {
                        operation: ['createCashgram'],
                    },
                },
                default: 0,
                required: true,
            },
            {
                displayName: 'Name',
                name: 'cashgram_name',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createCashgram'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Email',
                name: 'cashgram_email',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createCashgram'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Phone',
                name: 'cashgram_phone',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createCashgram'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Link Expiry',
                name: 'cashgram_link_expiry',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createCashgram'],
                    },
                },
                default: '',
                required: true,
            },
            {
                displayName: 'Remarks',
                name: 'cashgram_remarks',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createCashgram'],
                    },
                },
                default: '',
            },
            {
                displayName: 'Notify Customer',
                name: 'cashgram_notify_customer',
                type: 'boolean',
                displayOptions: {
                    show: {
                        operation: ['createCashgram'],
                    },
                },
                default: true,
            },
        ],
    };

    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('cashfreeApi');

        const baseUrl =
            credentials.environment === 'sandbox'
                ? 'https://sandbox.cashfree.com/pg'
                : 'https://api.cashfree.com/pg';

        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i);

                // Validate credentials based on operation type
                if (operation === 'createCashgram') {
                    if (!credentials.payoutAuthToken) {
                        throw new Error('Payout Authorization Token is required for Cashgram operations. Please configure it in the credentials.');
                    }
                } else {
                    // For all other operations (Payment Gateway), require Client ID and Secret
                    if (!credentials.clientId || !credentials.clientSecret) {
                        throw new Error('Client ID and Client Secret are required for Payment Gateway operations (orders, payment links, refunds). Please configure them in the credentials.');
                    }
                }

                if (operation === 'createOrder') {
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
                }
                else if (operation === 'createPaymentLink') {
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

                    const response = await this.helpers.request({
                        method: 'POST',
                        url: `${baseUrl}/links`,
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-version': credentials.apiVersion,
                            'x-client-id': credentials.clientId,
                            'x-client-secret': credentials.clientSecret,
                        },
                        body,
                        json: true,
                    });

                    returnData.push({ json: response });
                }
                else if (operation === 'cancelPaymentLink') {
                    const linkId = this.getNodeParameter('cancel_link_id', i);

                    const response = await this.helpers.request({
                        method: 'POST',
                        url: `${baseUrl}/links/${linkId}/cancel`,
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-version': credentials.apiVersion,
                            'x-client-id': credentials.clientId,
                            'x-client-secret': credentials.clientSecret,
                        },
                        json: true,
                    });

                    returnData.push({ json: response });
                }
                else if (operation === 'fetchPaymentLinkDetails') {
                    const linkId = this.getNodeParameter('fetch_details_link_id', i);

                    const response = await this.helpers.request({
                        method: 'GET',
                        url: `${baseUrl}/links/${linkId}`,
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-version': credentials.apiVersion,
                            'x-client-id': credentials.clientId,
                            'x-client-secret': credentials.clientSecret,
                        },
                        json: true,
                    });

                    returnData.push({ json: response });
                }
                else if (operation === 'createRefund') {
                    const orderId = this.getNodeParameter('refund_order_id', i);
                    const refundAmount = this.getNodeParameter('refund_amount', i);
                    const refundId = this.getNodeParameter('refund_id', i);
                    const refundNote = this.getNodeParameter('refund_note', i);
                    const refundSpeed = this.getNodeParameter('refund_speed', i);

                    const body = {
                        refund_amount: refundAmount,
                        refund_id: refundId,
                        refund_note: refundNote,
                        refund_speed: refundSpeed,
                    };

                    const response = await this.helpers.request({
                        method: 'POST',
                        url: `${baseUrl}/orders/${orderId}/refunds`,
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-version': credentials.apiVersion,
                            'x-client-id': credentials.clientId,
                            'x-client-secret': credentials.clientSecret,
                        },
                        body,
                        json: true,
                    });

                    returnData.push({ json: response });
                }
                else if (operation === 'createCashgram') {
                    // Check if payout authorization token is configured
                    if (!credentials.payoutAuthToken) {
                        throw new Error('Payout Authorization Token is required for Cashgram operations. Please configure it in the credentials.');
                    }

                    const body = {
                        cashgramId: this.getNodeParameter('cashgram_id', i),
                        amount: this.getNodeParameter('cashgram_amount', i),
                        name: this.getNodeParameter('cashgram_name', i),
                        email: this.getNodeParameter('cashgram_email', i),
                        phone: this.getNodeParameter('cashgram_phone', i),
                        linkExpiry: this.getNodeParameter('cashgram_link_expiry', i),
                        remarks: this.getNodeParameter('cashgram_remarks', i),
                        notifyCustomer: this.getNodeParameter('cashgram_notify_customer', i),
                    };

                    const response = await this.helpers.request({
                        method: 'POST',
                        url: 'https://payout-api.cashfree.com/payout/v1/createCashgram',
                        headers: {
                            'Authorization': credentials.payoutAuthToken,
                            'Content-Type': 'application/json',
                        },
                        body,
                        json: true,
                    });

                    returnData.push({ json: response });
                }

            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw error;
            }
        }

        return [this.helpers.returnJsonArray(returnData)];
    }
}

module.exports = { CashfreePayments };
