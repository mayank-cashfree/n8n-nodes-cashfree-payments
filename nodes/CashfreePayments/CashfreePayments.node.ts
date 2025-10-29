import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export class CashfreePayments implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cashfree Payments',
		name: 'cashfreePayments',
		icon: 'file:icon1.svg',
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
					{
						name: 'Fetch Payment Link Details',
						value: 'fetchPaymentLinkDetails',
						description: 'Fetch Payment Link Details',
						action: 'Fetch Payment Link Details',
					},
					{
						name: 'Get Orders for Payment Link',
						value: 'getOrdersForPaymentLink',
						description: 'Get orders associated with a payment link',
						action: 'Get orders for payment link',
					},
					{
						name: 'Create Refund',
						value: 'createRefund',
						description: 'Create a refund for an order',
						action: 'Create a refund',
					},
					{
						name: 'Get All Refunds for Order',
						value: 'getAllRefundsForOrder',
						description: 'Get all refunds associated with an order',
						action: 'Get all refunds for order',
					},
					{
						name: 'Create Cashgram',
						value: 'createCashgram',
						description: 'Create a Cashgram payout link',
						action: 'Create a Cashgram',
					},
					{
						name: 'Deactivate Cashgram',
						value: 'deactivateCashgram',
						description: 'Deactivate an existing Cashgram payout link',
						action: 'Deactivate a Cashgram',
					},
				],
				default: 'createOrder',
				noDataExpression: true,
			},

			// Order properties
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

			// Payment Link properties
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

			// Cancel Payment Link properties
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

			// Fetch Payment Link Details properties
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

			// Get Orders properties
			{
				displayName: 'Link ID',
				name: 'get_orders_link_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getOrdersForPaymentLink'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the payment link to get orders for',
			},

			// Refund properties
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

			// Get Refunds properties
			{
				displayName: 'Order ID',
				name: 'get_refunds_order_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getAllRefundsForOrder'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the order to get refunds for',
			},

			// Cashgram properties
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

			// Deactivate Cashgram properties
			{
				displayName: 'Cashgram ID',
				name: 'deactivate_cashgram_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['deactivateCashgram'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the Cashgram to deactivate',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('cashfreeApi');

		const baseUrl =
			credentials.environment === 'sandbox'
				? 'https://sandbox.cashfree.com/pg'
				: 'https://api.cashfree.com/pg';

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

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

				let responseData: any;

				if (operation === 'createOrder') {
					// Implementation will be added here
					responseData = { message: 'Create Order operation - TypeScript implementation needed' };
				} else if (operation === 'createPaymentLink') {
					// Implementation will be added here
					responseData = { message: 'Create Payment Link operation - TypeScript implementation needed' };
				} else if (operation === 'cancelPaymentLink') {
					// Implementation will be added here
					responseData = { message: 'Cancel Payment Link operation - TypeScript implementation needed' };
				} else if (operation === 'fetchPaymentLinkDetails') {
					// Implementation will be added here
					responseData = { message: 'Fetch Payment Link Details operation - TypeScript implementation needed' };
				} else if (operation === 'getOrdersForPaymentLink') {
					// Implementation will be added here
					responseData = { message: 'Get Orders for Payment Link operation - TypeScript implementation needed' };
				} else if (operation === 'createRefund') {
					// Implementation will be added here
					responseData = { message: 'Create Refund operation - TypeScript implementation needed' };
				} else if (operation === 'getAllRefundsForOrder') {
					// Implementation will be added here
					responseData = { message: 'Get All Refunds for Order operation - TypeScript implementation needed' };
				} else if (operation === 'createCashgram') {
					// Implementation will be added here
					responseData = { message: 'Create Cashgram operation - TypeScript implementation needed' };
				} else if (operation === 'deactivateCashgram') {
					// Implementation will be added here
					responseData = { message: 'Deactivate Cashgram operation - TypeScript implementation needed' };
				} else {
					throw new NodeApiError(this.getNode(), {
						message: `Unknown operation: ${operation}`,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: errorMessage }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
