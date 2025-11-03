import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import * as crypto from 'crypto';

export class CashfreePayments implements INodeType {
	// Helper method to generate encrypted signature
	private static generateEncryptedSignature(clientIdWithTimestamp: string, publicKeyContent: string): string {
		try {
			// Clean the public key content exactly like Java - remove headers, footers, and ALL whitespace
			const cleanedPublicKey = publicKeyContent
				.replace(/-----BEGIN PUBLIC KEY-----/g, '')
				.replace(/-----END PUBLIC KEY-----/g, '')
				.replace(/\s+/g, '');

			// Create public key from base64 decoded bytes (matches Java's X509EncodedKeySpec)
			const publicKey = crypto.createPublicKey({
				key: Buffer.from(cleanedPublicKey, 'base64'),
				format: 'der',
				type: 'spki',
			});

			// Use OAEP with SHA-1 padding (matches Java's "RSA/ECB/OAEPWithSHA-1AndMGF1Padding")
			const encryptedData = crypto.publicEncrypt(
				{
					key: publicKey,
					padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
					oaepHash: 'sha1',
				},
				Buffer.from(clientIdWithTimestamp, 'utf8')
			);

			return encryptedData.toString('base64');
		} catch (error) {
			throw new Error(`Failed to generate signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// Helper method to create client ID with timestamp
	private static createClientIdWithTimestamp(clientId: string): string {
		const epochTimestamp = Math.floor(Date.now() / 1000);
		return `${clientId}.${epochTimestamp}`;
	}

	// Helper method to get payout base URL
	private static getPayoutBaseUrl(environment: string): string {
		return environment === 'sandbox'
			? 'https://payout-gamma.cashfree.com'
			: 'https://payout-api.cashfree.com';
	}

	// Helper method to get authorization token for payout operations
	private static async getPayoutAuthToken(clientId: string, clientSecret: string, publicKey: string, environment: string): Promise<string> {
		try {
			// Validate inputs
			if (!clientId || clientId.trim() === '') {
				throw new Error('Payout Client ID is empty or missing');
			}
			if (!clientSecret || clientSecret.trim() === '') {
				throw new Error('Payout Client Secret is empty or missing');
			}
			if (!publicKey || publicKey.trim() === '') {
				throw new Error('Payout Public Key is empty or missing');
			}

			const clientIdWithTimestamp = CashfreePayments.createClientIdWithTimestamp(clientId);
			const signature = CashfreePayments.generateEncryptedSignature(clientIdWithTimestamp, publicKey);

			const baseUrl = CashfreePayments.getPayoutBaseUrl(environment);

			const response = await fetch(`${baseUrl}/payout/v1/authorize`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Client-Id': clientId.trim(),
					'X-Client-Secret': clientSecret.trim(),
					'X-Cf-Signature': signature,
				},
			});

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(`Authorization failed: ${response.status} - ${errorData}`);
			}

			const authData: any = await response.json();

			// Extract token from SUCCESS response
			if (authData.status === 'SUCCESS' && authData.data && authData.data.token) {
				return authData.data.token;
			}

			// Handle error responses
			if (authData.status === 'ERROR') {
				throw new Error(`Cashfree API Error: ${authData.message} (${authData.subCode})`);
			}

			throw new Error(`No valid token found in authorization response: ${JSON.stringify(authData)}`);
		} catch (error) {
			throw new Error(`Failed to get authorization token: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

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
			{
				displayName: 'Link Expiry',
				name: 'cashgram_link_expiry',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				required: false,
				description: 'Expiry date for the Cashgram link (YYYY-MM-DD format). Maximum 30 days from date of creation.',
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
				default: 'Cashgram payout',
				required: false,
				description: 'Additional remarks for the Cashgram',
			},
			{
				displayName: 'Notify Customer',
				name: 'cashgram_notify_customer',
				type: 'options',
				options: [
					{
						name: 'Yes',
						value: 1,
					},
					{
						name: 'No',
						value: 0,
					},
				],
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: 1,
				required: false,
				description: 'Whether to notify the customer about the Cashgram (1 = Yes, 0 = No)',
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

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				// Validate credentials based on operation type
				if (operation === 'createCashgram' || operation === 'deactivateCashgram') {
					if (!credentials.payoutClientId || !credentials.payoutClientSecret || !credentials.payoutPublicKey) {
						throw new Error('Payout Client ID, Client Secret, and Public Key are required for Cashgram operations. Please configure them in the credentials.');
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
					// Get payout authorization token
					const authToken = await CashfreePayments.getPayoutAuthToken(
						String(credentials.payoutClientId).trim(),
						String(credentials.payoutClientSecret).trim(),
						credentials.payoutPublicKey as string,
						credentials.environment as string
					);

					const cashgramData = {
						cashgramId: this.getNodeParameter('cashgram_id', i) as string,
						amount: this.getNodeParameter('cashgram_amount', i) as number,
						name: this.getNodeParameter('cashgram_name', i) as string,
						email: this.getNodeParameter('cashgram_email', i) as string,
						phone: this.getNodeParameter('cashgram_phone', i) as string,
						linkExpiry: this.getNodeParameter('cashgram_link_expiry', i) as string,
						remarks: this.getNodeParameter('cashgram_remarks', i) as string,
						notifyCustomer: this.getNodeParameter('cashgram_notify_customer', i) as number,
					};

					const payoutBaseUrl = CashfreePayments.getPayoutBaseUrl(credentials.environment as string);

					const response = await fetch(`${payoutBaseUrl}/payout/v1/createCashgram`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${authToken}`,
						},
						body: JSON.stringify({
							cashgramId: cashgramData.cashgramId,
							amount: cashgramData.amount,
							name: cashgramData.name,
							email: cashgramData.email,
							phone: cashgramData.phone,
							linkExpiry: cashgramData.linkExpiry,
							remarks: cashgramData.remarks,
							notifyCustomer: cashgramData.notifyCustomer
						}),
					});

					if (!response.ok) {
						const errorData = await response.text();
						throw new NodeApiError(this.getNode(), {
							message: `Cashgram creation failed: ${response.status} - ${errorData}`,
						});
					}

					responseData = await response.json();
				} else if (operation === 'deactivateCashgram') {
					// Get payout authorization token
					const authToken = await CashfreePayments.getPayoutAuthToken(
						credentials.payoutClientId as string,
						credentials.payoutClientSecret as string,
						credentials.payoutPublicKey as string,
						credentials.environment as string
					);

					const cashgramId = this.getNodeParameter('deactivate_cashgram_id', i) as string;

					const payoutBaseUrl = CashfreePayments.getPayoutBaseUrl(credentials.environment as string);

					const response = await fetch(`${payoutBaseUrl}/payout/v1/deactivateCashgram`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${authToken}`,
						},
						body: JSON.stringify({
							cashgramId: cashgramId,
						}),
					});

					if (!response.ok) {
						const errorData = await response.text();
						throw new NodeApiError(this.getNode(), {
							message: `Cashgram deactivation failed: ${response.status} - ${errorData}`,
						});
					}

					responseData = await response.json();
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
